const http = require("http");
const fs = require("fs");
const Zip = require("adm-zip");
const db = require("./dbs");
const latlongToUTM = require("./latlongToUTM");
const csv = require("csv");

const EPOCH_SEC = 1000;
const EPOCH_MIN = EPOCH_SEC * 60;
const EPOCH_HOUR = EPOCH_MIN * 60;
const EPOCH_DAY = EPOCH_HOUR * 24;
const EPOCH_WEEK = EPOCH_DAY * 7;
const clear = false;

const crimeSeverity = {
  'Theft from Vehicle': 1.2,
  'Theft of Vehicle': 1.5,
  'Theft of Bicycle': 0.8,
  'Other Theft': 0.7,
  'Offence Against a Person': 1.5,
  'Mischief': 0.5,
  'Break and Enter Residential/Other': 1.8,
  'Break and Enter Commercial': 1.8,
  'Vehicle Collision or Pedestrian Struck (with Injury)': 0.6,
  "THEFT" : 1,
  "OFFENSE INVOLVING CHILDREN" : 1.2,
  "NARCOTICS" : 0.8,
  "OTHER OFFENSE" : 0.5,
  "BURGLARY" : 1.5,
  "MOTOR VEHICLE THEFT" : 1.3,
  "ASSAULT" : 1.6,
  "BATTERY" : 1.6,
  "CRIMINAL DAMAGE" : 0.7,
  "WEAPONS VIOLATION" : 0.8,
  "DECEPTIVE PRACTICE" : 1,
  "PUBLIC PEACE VIOLATION" : 0.5,
  "CRIMINAL TRESPASS" : 0.5,
  "ROBBERY" : 1.6,
  "PROSTITUTION" : 0.8,
  "HOMICIDE" : 2.0,
  "LIQUOR LAW VIOLATION" : 0.5,
  "SEX OFFENSE" : 1.4,
  "INTERFERENCE WITH PUBLIC OFFICER" : 0.5,
  "ARSON" : 1.4,
  "CRIM SEXUAL ASSAULT" : 1.5,
  "KIDNAPPING" : 1.8,
  "OTHER NARCOTIC VIOLATION" : 0.8,
  "GAMBLING" : 0.9,
  "OBSCENITY" : 0.8,
  "STALKING" : 1.1,
  "CONCEALED CARRY LICENSE VIOLATION" : 0.7,
  "INTIMIDATION" : 1,
  "HUMAN TRAFFICKING" : 2.0,
  "PUBLIC INDECENCY": 0.8,
  "NON-CRIMINAL" : 0.5
}

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
      db.initializeDb(clear)
        .then((result) => db.checkLastUpdate())
        .then((result) => {
          if (!result) {
            // console.log("Table empty, loading crime data...");
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
          // console.log("Database initialized");
        }).catch((err) => {
            reject(err);
        });
    })
  }

  between(x, min, max) {
    return x >= min && x <= max;
  }

  getIndex(lat, lng){
    // console.log(lat, lng, this.vanBound)
    if(!this.between(lat, this.vanBound[2], this.vanBound[3]) || !this.between(lng, this.vanBound[0], this.vanBound[1])){
      // console.log("Parameters outside of bounds!")
      return [0,0];
    }
    // console.log([Math.floor((lng - this.vanBound[0]) / this.latincr), Math.floor((lat - this.vanBound[2]) / this.lngincr)]);
    return [Math.floor((lng - this.vanBound[0]) / this.latincr), Math.floor((lat - this.vanBound[2]) / this.lngincr)];
  }

  // Fast O(1) lookup for crime safety index
  getCrimeRate(lat, lng){
    var point = this.getIndex(lat, lng);
    return this.crimeRates[point[0]][point[1]];
  }

  // Precache crime rate in blocks within Vancouver
  updateCrimeSafety() {
    const radius = 0.002;
    return new Promise((res, rej) => {
      db.getAllQuery().then((crimes) => {
        // console.log(crimes.length + " crimes in total");
        for(let i = 0; i < this.crimeRates.length; i++){
          for(let j = 0; j < this.crimeRates[i].length; j++){
            var currlat = this.vanBound[0] + this.latincr * i;
            var currlng = this.vanBound[2] + this.lngincr * j;
            let crimecount = 0;
            for(let crime of crimes){
              // console.log(Object.keys(crime));
              if(Math.abs(crime.lng - currlat) < radius && Math.abs(crime.lat - currlng) < radius){
                crimecount += crimeSeverity[crime.type] ? crimeSeverity[crime.type] : 1;
              }
            }
            crimecount = Math.round(crimecount);
            // console.log(crimecount);
            this.crimeRates[parseInt(i)][parseInt(j)] = crimecount > 2000 ? 0 : Math.floor(10 - crimecount / 200);
          }
        }
        // console.log("Crime safety updated");
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
      // .then((result) => {
      //   return that.updateChicagoDataSet()
      // })
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
        .then((result) => {that.mapCoordinates().then(() =>{
          const parseColumns = "(type, year, @dummy, @dummy, @dummy, @dummy, @dummy, @dummy, lat, lng)"
          db.loadTable("crimedata_cov.csv", "crime_data", parseColumns).then(() =>{
            resolve();
          });
        })})
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
        // console.log("Request to " + config.url + " Successful with code " + response.statusCode);
          response.pipe(output);
          resolve();
        // console.log(config.url + " Response has been saved to file!");
      }).on("err", (error) => {
        // console.log(error + " Request to " + config.url + " Failed");
        reject(error);
      });
    });
  }

  unzipFile() {
    return new Promise(function(resolve, reject) {
      try {
        // console.log("Extracting crime data from zipped file...");
        var file = new Zip("crimedata.zip");
        file.extractEntryTo(fileName, "./", false, true);
        // console.log("Crime Data has been extracted!");
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

      // console.log("Converting COV file to use latitude longitude...")
      readStream.pipe(csv.parse({ columns: true }))
      .pipe(csv.transform(function(data) {
          if(typeof(data['X']) != 'number') {
            let x = data['X'];
            let y = data['Y'];
            var latlon = new Array(2)
            latlongToUTM(x, y, latlon)
            data['X'] = latlon[0];
            data['Y'] = latlon[1];
          }
          return data;
      }))
      .pipe(csv.stringify())
      .pipe(writeStream);

      writeStream.on('finish', () => {
        // console.log("Finished conversion");
        resolve()
      })
    });
  }
}

var crimeDataService = new CrimeDataService();
module.exports = crimeDataService;
