const http = require("http");
const fs = require("fs");
const Zip = require("adm-zip");
const db = require("./dbs");
const util = require("./util");
const latlongToUTM = require("./latlongToUTM");
const csv = require("csv");

const EPOCH_SEC = 1000;
const EPOCH_MIN = EPOCH_SEC * 60;
const EPOCH_HOUR = EPOCH_MIN * 60;
const EPOCH_DAY = EPOCH_HOUR * 24;
const EPOCH_WEEK = EPOCH_DAY * 7;

const COVconfig = {
  url: "http://" + "geodash.vpd.ca",
  path: "/opendata/crimedata_download/crimedata_csv_all_years.zip?disclaimer=on&x=163&y=41",
  host: "geodash.vpd.ca",
  headers: {
    "Accept-Encoding": "gzip,deflate",
    "connection": "keep-alive"
  }
}

const COCconfig = {
  url: "http://" + "data.cityofchicago.org",
  path: "/api/views/w98m-zvie/rows.csv?accessType=DOWNLOAD",
  host: "data.cityofchicago.org",
  headers: {
    "Accept-Encoding": "deflate",
    "connection": "keep-alive"
  }
}

const fileName = "crimedata_csv_all_years.csv";
// const zipFile = "crimedata.zip";

class CrimeDataService {
  constructor(){
    this.resolution = 100;
    this.vanBound = [-123.27, -123.02, 49.195, 49.315];
    this.latincr = (this.vanBound[1] - this.vanBound[0]) / this.resolution;
    this.lngincr = (this.vanBound[3] - this.vanBound[2]) / this.resolution;
    this.crimeRates = new Array(this.resolution);
    for(var i = 0; i < this.resolution; i++) {
      this.crimeRates[i] = new Array(this.resolution);
      this.crimeRates[i].fill(0); //default val
    }
  }
  initializeCrimeDataSet() {
    var that = this;

    return new Promise(function(resolve, reject) {
      db.initializeDb()
        .then((result) => db.checkLastUpdate())
        .then((result) => {
          if (!result) {
            console.log("Table empty, loading crime data...");
            that.updateCrimeDataSet().then((result) => resolve());
          } else {
            var date = new Date(result.created_at);
            //console.log(result.created_at);
            //console.log("Database last updated was " + date);

            if (new Date() - EPOCH_WEEK > date) {
              //console.log("Database last updated was more than a week ago, loading crime data...");
              that.updateCrimeDataSet().then((result) => resolve());
            } else {
              //console.log("Table up to date!");
              resolve();
            }
          }
        }).then((result) => {
          console.log("Server ready for requests!");
        }).catch((err) => {
            reject(err);
        });
    })
  }

  between(x, min, max) {
    return x >= min && x <= max;
  }

  getIndex(lat, lng){
    console.log(lat, lng, this.vanBound)
    if(!this.between(lat, this.vanBound[2], this.vanBound[3]) || !this.between(lng, this.vanBound[0], this.vanBound[1])){
      console.log("Parameters outside of bounds!")
      return [0,0];
    }
    console.log([Math.floor((lng - this.vanBound[0]) / this.latincr), Math.floor((lat - this.vanBound[2]) / this.lngincr)]);
    return [Math.floor((lng - this.vanBound[0]) / this.latincr), Math.floor((lat - this.vanBound[2]) / this.lngincr)];
  }

  // Fast O(1) lookup for crime safety index
  getCrimeRate(lat, lng){
    var point = this.getIndex(lat, lng);
    return this.crimeRates[point[0]][point[1]];
  }

  // Precache crime rate in blocks within Vancouver
  updateCrimeSafety() {
    return new Promise((res, rej) => {
      db.getAllQuery().then((crimes) => {
        console.log(crimes.length);
        for(let i = 0; i < this.crimeRates.length; i++){
          for(let j = 0; j < this.crimeRates[i].length; j++){
            //console.log(this.crimeRates + "\n\n");
            //console.log(crimes + "\n\n");
            var currlat = this.vanBound[0] + this.latincr * i;
            var currlng = this.vanBound[2] + this.lngincr * j;
            // console.log(currlat, currlng);
            // let convcoord = latlongToUTM.latLonToUTM(currlat, currlng);
            let convcoord = [currlat, currlng];
            let crimecount = crimes.filter((val) => util.filterCrimes(val, convcoord)).length;
            // console.log(crimecount);
            this.crimeRates[parseInt(i)][parseInt(j)] = crimecount > 2000 ? 0 : Math.floor(10 - crimecount / 200);
          }
        }
        // console.log(this.crimeRates);
        res();
      }).catch((err) => {
          rej(err);
        })
    });
  }

  getCrimeData(xmin, xmax, ymin, ymax, year) {
    return db.sendQuery(xmin, xmax, ymin, ymax, year);
  }

  updateCrimeDataSet() {
    var that = this;
    return that.updateVancouverDataSet()
      .then((result) => {
        return that.updateChicagoDataSet()
      })
      .then(() => {
        return that.updateCrimeSafety();
      });
  }

  updateVancouverDataSet() {
    var that = this;
    return new Promise(function(resolve, reject) {
      const output = fs.createWriteStream("crimedata.zip");
      output.on("finish", () => {
        that.unzipFile()
        .then((result) => {that.mapCoordinates()})
        .then((result) => {
          const parseColumns = "(type, year, @dummy, @dummy, @dummy, @dummy, @dummy, @dummy, lat, lng)"
          return db.loadTable("crimedata_cov.csv", "crime_data", parseColumns);
        })
        .then((result) => resolve())
        .catch((error) => reject(error));
      });
      that.requestCrimeData(output, COVconfig).catch((error) => reject(error));
    });
  }

  updateChicagoDataSet() {
    var that = this;
    return new Promise(function(resolve, reject) {
      const output = fs.createWriteStream("crimes_-_2019.csv");
      output.on("finish", () => {
        //ID CaseNumber	Date	Block	IUCR	PrimaryTypeDescription	Secondary, LocationDescription	Arrest	Domestic	Beat District Ward	CommunityArea	FBICode	XCoordinate	YCoordinate	Year Updated Latitude	Longitude	Location
        const parseColumns = "(@dummy, @dummy, @dummy, @dummy, @dummy, type, @dummy, @dummy, @dummy, @dummy, @dummy, @dummy, @dummy, @dummy, @dummy, @dummy, @dummy, year, @dummy, lat, lng, @dummy)"
        db.loadTable("crimes_-_2019.csv", "crime_data", parseColumns).then((result) => {
          resolve();
        })
        .catch((error) => reject(error));
      });
      that.requestCrimeData(output, COCconfig).catch((error) => reject(error));
    });
  }

  requestCrimeData(output, config) {
    return new Promise(function(resolve, reject) {
      const request = http.get(config);
      request.on("response", (response) => {
        console.log("Request to " + config.url + " Successful with code " + response.statusCode);
          response.pipe(output);
          resolve();
        console.log(config.url + " Response has been saved to file!");
      }).on("err", (error) => {
        console.log(error + " Request to " + config.url + " Failed");
        reject(error);
      });
    });
  }

  unzipFile() {
    return new Promise(function(resolve, reject) {
      try {
        console.log("Extracting crime data from zipped file...");
        var file = new Zip("crimedata.zip");
        file.extractEntryTo(fileName, "./", false, true);
        console.log("Crime Data has been extracted!");
        resolve();
      } catch (err) {
        reject(err);
      }

    });
  }

  mapCoordinates() {
    return new Promise(function(resolve, reject) {
      var readStream = fs.createReadStream("crimedata_csv_all_years.csv");
      var writeStream = fs.createWriteStream("crimedata_cov.csv");

      console.log("Converting COV file to use latitude longitude...")
      readStream.pipe(csv.parse({ columns: true }))
      .pipe(csv.transform(function(data) {
          if(typeof(data['X']) != 'X') {
            let x = data['X'];
            let y = data['Y'];
            var latlon = new Array(2)
            latlongToUTM.UTMXYToLatLon(x, y, latlon)
            data['X'] = latlon[0];
            data['Y'] = latlon[1];
          }
          return data;
      }))
      .pipe(csv.stringify())
      .pipe(writeStream);

      writeStream.on('finish', () => {
        console.log("Finished conversion");
        resolve()
      })
    });
  }
}

var crimeDataService = new CrimeDataService();
module.exports = crimeDataService;
