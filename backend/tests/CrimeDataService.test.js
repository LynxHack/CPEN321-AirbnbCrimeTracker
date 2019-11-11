// const http = require("http");
// const fs = require("fs");
// const Zip = require("adm-zip");
// const db = require("./dbs");
// const util = require("./util");
// const latlongToUTM = require("./latlongToUTM");

const COVurl = "geodash.vpd.ca";
const path = "/opendata/crimedata_download/crimedata_csv_all_years.zip?disclaimer=on&x=163&y=41";
const fileName = "crimedata_csv_all_years.csv";
// const zipFile = "crimedata.zip";
const db = require("../dbs");
const fs = require("fs");
var crimeDataService = require("../CrimeDataService");
jest.mock("../dbs");
jest.mock('fs');

beforeEach(() => {

});

describe('Testing Crime Data Service getCrimeData(xmin, xmax, ymin, ymax, year)', () => {
  db.sendQuery.mockReturnValue("Response from db");
  it('test getCrimeData', () => {
    expect(crimeDataService.getCrimeData(1,2,3,1,5)).toBe("Response from db");
  });
})

describe('Testing Crime Data Service between(x, min, max)', () => {
  it('works with promises', () => {
    expect.assertions(1);
    expect(true).toBeTruthy();
  });

  it('test valid between', () => {
    expect(crimeDataService.between(3, 1, 5)).toBe(true);
  });

  it('test less than min', () => {
    expect(crimeDataService.between(0, 1, 5)).toBe(false);
  });

  it('test more than max', () => {
    expect(crimeDataService.between(10, 1, 5)).toBe(false);
  });
})
