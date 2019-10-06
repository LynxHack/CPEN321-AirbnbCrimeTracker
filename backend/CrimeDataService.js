const http = require('http');
const fs = require('fs');
const zip = require('adm-zip');
const db = require('./dbs');

var COVurl = 'geodash.vpd.ca';
var path = '/opendata/crimedata_download/crimedata_csv_all_years.zip?disclaimer=on&x=163&y=41';
var fileName = 'crimedata_csv_all_years.csv';
var zipFile = 'crimedata.zip';

class CrimeDataService {
  initializeCrimeDataSet() {
    var that = this;
    return new Promise(function(resolve, reject) {
      const output = fs.createWriteStream(zipFile);
      output.on("finish", () => {
        that.unzipFile().then(db.loadTable()).then(db.printTopTen());
        resolve();
      });

      that.requestCrimeData(output);
    });
  }

  requestCrimeData(output) {
    return new Promise(function(resolve, reject) {
      const request = http.get({ url: "http://" + COVurl,
                                 path: path,
                                 host: COVurl,
                                 headers: { 'Accept-Encoding': 'gzip,deflate', 'connection': 'keep-alive'} });

      request.on('response', (response) => {
        console.log("Request to City of Vancouver API Successful with code " + response.statusCode);
        console.log("Printing response contents to zip...");
        response.pipe(output);
        console.log("Response has been saved to file!");
        resolve();
      }).on('err', (error) => {
        console.log(error + "Request to City of Vancouver API Failed");
        reject();
      });
    });
  }

  unzipFile() {
    return new Promise(function(resolve, reject) {
      console.log("Extracting crime data from zipped file...");
      var file = new zip(zipFile);
      file.extractEntryTo(fileName, './', false, true);
      console.log("Crime Data has been extracted!");
    });
  }
}

var crimeDataService = new CrimeDataService();
module.exports = crimeDataService;
