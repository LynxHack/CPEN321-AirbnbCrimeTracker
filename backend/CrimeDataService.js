const http = require("http");
const fs = require("fs");
const Zip = require("adm-zip");
const db = require("./dbs");

const EPOCH_SEC = 1000;
const EPOCH_MIN = EPOCH_SEC * 60;
const EPOCH_HOUR = EPOCH_MIN * 60;
const EPOCH_DAY = EPOCH_HOUR * 24;
const EPOCH_WEEK = EPOCH_DAY * 7;

var COVurl = "geodash.vpd.ca";
var path = "/opendata/crimedata_download/crimedata_csv_all_years.zip?disclaimer=on&x=163&y=41";
var fileName = "crimedata_csv_all_years.csv";
var zipFile = "crimedata.zip";
var cache = null;

class CrimeDataService {

initializeCrimeDataSet() {
    var that = this;

    db.initializeDb().then(result => { db.checkLastUpdate(); })
										 .then(function(result) {
        if (!result) {
          console.log("Table empty, loading crime data...");
          return that.updateCrimeDataSet();
        } else {
          var date = new Date(result.created_at);
          console.log("Database last updated was " + date);

          if(new Date() - EPOCH_WEEK > date) {
            console.log("Database last updated was more than a week ago, loading crime data...");
            return that.updateCrimeDataSet();
          } else {
            console.log("Table up to date!");
            return new Promise(function(resolve, reject) { resolve(); });
          }
        }
      });
  }

  getCrimeData(xmin, xmax, ymin, ymax, year) {
	  if(!cache) {
			cache = db.sendQuery(xmin, xmax, ymin, ymax, year);
	  }
	return cache;
  }

  updateCrimeDataSet() {
    var that = this;
    return new Promise(function(resolve, reject) {
      const output = fs.createWriteStream(String(zipFile));
      output.on("finish", () => {
        that.unzipFile().then(result => { db.loadTable(); });
        resolve();
      });

      that.requestCrimeData(output);
    });
  }

  requestCrimeData(output) {
    return new Promise(function(resolve, reject) {
      const request = http.get({ url: "http://" + COVurl,
                                 path,
                                 host: COVurl,
                                 headers: { "Accept-Encoding": "gzip,deflate", "connection": "keep-alive"} });

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
