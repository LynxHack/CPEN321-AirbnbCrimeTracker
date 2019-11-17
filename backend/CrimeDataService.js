const http = require("http");
const fs = require("fs");
const Zip = require("adm-zip");
const db = require("./dbs");
const util = require("./util");
const latlongToUTM = require("./latlongToUTM");

const EPOCH_SEC = 1000;
const EPOCH_MIN = EPOCH_SEC * 60;
const EPOCH_HOUR = EPOCH_MIN * 60;
const EPOCH_DAY = EPOCH_HOUR * 24;
const EPOCH_WEEK = EPOCH_DAY * 7;

const COVurl = "geodash.vpd.ca";
const path = "/opendata/crimedata_download/crimedata_csv_all_years.zip?disclaimer=on&x=163&y=41";
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
        .then(function (result) {
          if (!result) {
            // console.log("Table empty, loading crime data...");
            that.updateCrimeDataSet().then((result) => resolve());
          } else {
            var date = new Date(result.created_at);
            // console.log(result.created_at);
            // console.log("Database last updated was " + date);

            if (new Date() - EPOCH_WEEK > date) {
              // console.log("Database last updated was more than a week ago, loading crime data...");
              that.updateCrimeDataSet().then((result) => resolve());
            } else {
              //console.log("Table up to date!");
                resolve();
            }
          }
        }).catch((err) => {
            reject(err);
        });
    })

  }

  between(x, min, max) {
    return x >= min && x <= max;
  }

  getIndex(lat, lng){
    if(!this.between(lat, this.vanBound[0], this.vanBound[1]) || !this.between(lng, this.vanBound[2], this.vanBound[3])){
      // console.log("Parameters outside of bounds!")
      return [0,0];
    }

    return [Math.floor((lat - this.vanBound[0]) / this.latincr), Math.floor((lng - this.vanBound[2]) / this.lngincr)];
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
        for(let i = 0; i < this.crimeRates.length; i++){
          for(let j = 0; j < this.crimeRates[i].length; j++){
            //console.log(this.crimeRates + "\n\n");
            //console.log(crimes + "\n\n");
            var currlat = this.vanBound[0] + this.latincr * i;
            var currlng = this.vanBound[2] + this.lngincr * j;
            let convcoord = latlongToUTM(currlat, currlng);
            let crimecount = crimes.filter((val) => util.filterCrimes(val, convcoord)).length;
            this.crimeRates[parseInt(i)][parseInt(j)] = crimecount > 2000 ? 0 : Math.floor(10 - crimecount / 200);
          }
        }
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
    return new Promise(function(resolve, reject) {
      const output = fs.createWriteStream("crimedata.zip");
      output.on("finish", () => {
        that.unzipFile().then((result) => {
          return db.loadTable();
        }).then((result) => {
          return that.updateCrimeSafety();
        }).then((result) => {
          resolve();
        })
        .catch((error) => reject(error));
      });
      that.requestCrimeData(output).catch((error) => reject(error))
    });
  }

  requestCrimeData(output) {
    return new Promise(function(resolve, reject) {
      const request = http.get({
        url: "http://" + COVurl,
        path,
        host: COVurl,
        headers: {
          "Accept-Encoding": "gzip,deflate",
          "connection": "keep-alive"
        }
      });

      request.on("response", (response) => {
        //console.log("Request to City of Vancouver API Successful with code " + response.statusCode);
        //console.log("Printing response contents to zip...");
          response.pipe(output);
          resolve();
        //console.log("Response has been saved to file!");
      }).on("err", (error) => {
        //console.log(error + "Request to City of Vancouver API Failed");
        reject(error);
      });
    });
  }

  unzipFile() {
    return new Promise(function(resolve, reject) {
      try {
        //console.log("Extracting crime data from zipped file...");
        var file = new Zip("crimedata.zip");
        file.extractEntryTo(fileName, "./", false, true);
        //console.log("Crime Data has been extracted!");
        resolve();
      } catch (err) {
        reject(err);
      }

    });
  }
}

var crimeDataService = new CrimeDataService();
module.exports = crimeDataService;
