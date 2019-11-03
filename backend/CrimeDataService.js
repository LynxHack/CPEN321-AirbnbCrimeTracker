const http = require("http");
const fs = require("fs");
const Zip = require("adm-zip");
const db = require("./dbs");
const util = require("./util");

const EPOCH_SEC = 1000;
const EPOCH_MIN = EPOCH_SEC * 60;
const EPOCH_HOUR = EPOCH_MIN * 60;
const EPOCH_DAY = EPOCH_HOUR * 24;
const EPOCH_WEEK = EPOCH_DAY * 7;

const COVurl = "geodash.vpd.ca";
const path = "/opendata/crimedata_download/crimedata_csv_all_years.zip?disclaimer=on&x=163&y=41";
const fileName = "crimedata_csv_all_years.csv";
const zipFile = "crimedata.zip";
var cache = null;

const vanBound = [-123.27, -123.02, 49.195, 49.315];
const latincr = (vanBound[1] - vanBound[0]) / resolution;
const lngincr = (vanBound[3] - vanBound[2]) / resolution;
var resolution = 100;
var crimeRates = new Array(resolution);
for(let row of crimeRates){
  var tmp = new Array(resolution);
  tmp.fill(0); //default val
  row = tmp;
}

class CrimeDataService {
  initializeCrimeDataSet() {
    var that = this;

    db.initializeDb().then((result) => {
        db.checkLastUpdate();
      })
      .then(function(result) {
        if (!result) {
          console.log("Table empty, loading crime data...");
          return that.updateCrimeDataSet();
        } else {
          var date = new Date(result.created_at);
          console.log("Database last updated was " + date);

          if (new Date() - EPOCH_WEEK > date) {
            console.log("Database last updated was more than a week ago, loading crime data...");
            return that.updateCrimeDataSet();
          } else {
            console.log("Table up to date!");
            return new Promise(function(resolve, reject) {
              resolve();
            });
          }
        }
      });
  }

  getIndex(lat, lng){
    if(lat < vanBound[0] || lat > vanBound[1] || lng < vanBound[2] || lng > vanBound[3]){
      return [0, 0];
    }
    return [Math.floor((lat - vanBound[0]) / latincr), Math.floor((lng - vanBound[2]) / lngincr)]
  }

  // Fast O(1) lookup for crime safety index
  getCrimeRate(lat, lng){
    var point = this.getIndex(lat, lng);
    return crimeRates[point[0], point[1]];
  }

  // Precache crime rate in blocks within Vancouver
  updateCrimeSafety() {
    return new Promise((res, rej) => {
      try{
        db.getAllQuery().then((crimes) => {
          for(let i = 0; i < crimeRates.length; i++){
            for(let j = 0; j < crimesRates.length; j++){
              var currlat = vanBound[0] + latincr * i;
              var currlng = vanBound[2] + lngincr * j;
              let convcoord = latlongToUTM(currlat, currlng);
              let crimecount = crimes.filter((val) => util.filterCrimes(val, convcoord)).length;
              crimesRates[i][j] = crimecount > 2000 ? 0 : Math.floor(10 - crimecount / 200);
            }
          }
          res();
        });
      }
      catch(err){rej(err)}
    })
  }

  getCrimeData(xmin, xmax, ymin, ymax, year) {
    if (!cache) {
      cache = db.sendQuery(xmin, xmax, ymin, ymax, year);
    }
    return cache;
  }

  updateCrimeDataSet() {
    var that = this;
    return new Promise(function(resolve, reject) {
      const output = fs.createWriteStream(zipFile);
      output.on("finish", () => {
        that.unzipFile().then((result) => {
          db.loadTable();
        });
        resolve();
      });
      that.requestCrimeData(output).then(() => {
        that.updateCrimeSafety();
      })
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
        console.log("Request to City of Vancouver API Successful with code " + response.statusCode);
        console.log("Printing response contents to zip...");
        response.pipe(output);
        console.log("Response has been saved to file!");
        resolve();
      }).on("err", (error) => {
        console.log(error + "Request to City of Vancouver API Failed");
        reject();
      });
    });
  }

  unzipFile() {
    return new Promise(function(resolve, reject) {
      console.log("Extracting crime data from zipped file...");
      var file = new Zip(zipFile);
      file.extractEntryTo(fileName, "./", false, true);
      console.log("Crime Data has been extracted!");
      resolve();
    });
  }
}

var crimeDataService = new CrimeDataService();
module.exports = crimeDataService;
