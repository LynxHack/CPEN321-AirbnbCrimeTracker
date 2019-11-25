var crimeDataService = require("../CrimeDataService");
const db = require("../dbs");
const fs = require("fs");
const http = require("http");
const zip = require("adm-zip");
const mysql = require("mysql");
const csv = require("csv");
jest.mock('fs');
jest.mock('http');
jest.mock('adm-zip');
jest.mock("mysql");
jest.mock('csv');

describe('Testing Crime Data Service updateCrimeDataSet()', () => {
  var returnObj = [];

  beforeEach(async () => {
    fs.createWriteStream.mockReturnValue({on: (type, callback) => {setTimeout(3000, callback())}});
    var readStream = { pipe: () => {return readStream} };
    fs.createReadStream.mockReturnValue(readStream);
    csv.transform.mockReturnValue((callback) => callback());
    csv.stringify.mockReturnValue((callback) => callback());
    zip.mockImplementation(() => { return { extractEntryTo: () => {} }});
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {
                    if(qString.includes("SELECT")){
                      func(null, returnObj);
                    } else {
                      func();
                    }}};
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();
    dbReturn = new Array(2005);
    dbReturn.fill({type:"Break and Enter Residential/Other",year:2005,lng:-123.02630548,lat:49.20863951});
    returnObj = dbReturn;

    var getMockReturn = {};
    getMockReturn.on = (type, callback) => {
                          if (type == "response") {
                            callback({ pipe: (output) => { output.val = "Request response" }});
                            return this;
                          } else {
                            return this;
                          }};
    http.get.mockReturnValue(getMockReturn);
  });

  it('Crimedataset updated successfully', async () => {
    var aboveIndex = new Array(2005);
    aboveIndex.fill({type:"Break and Enter Residential/Other",year:2005,lng:-123.02630548,lat:49.20863951});
    returnObj = aboveIndex;

    expect.assertions(3);
    await expect(crimeDataService.updateCrimeDataSet()).resolves.toEqual(undefined);
    expect(crimeDataService.getCrimeRate(49.20863951, -123.02630548)).toBe(0);
    expect(crimeDataService.getCrimeRate(49.40863951, -123.22630548)).toBe(10);
  });

  it('Crimedataset updated successfully, empty input', async () => {
    var dbReturn = new Array();
    returnObj = dbReturn;

    expect.assertions(3);
    await expect(crimeDataService.updateCrimeDataSet()).resolves.toEqual(undefined);
    expect(crimeDataService.getCrimeRate(49.20863951, -123.02630548)).toBe(10);
    expect(crimeDataService.getCrimeRate(49.40863951, -123.22630548)).toBe(10);
  });

  it('Db query failed', async () => {
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {
                    if(qString.includes("SELECT")){
                      throw ("Db Query failed!")
                    } else {
                      func();
                    }}};
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();
    expect.assertions(1);
    return await expect(crimeDataService.updateCrimeDataSet()).rejects.toMatch("Db Query failed!");
  });

  it('Request failed', async () => {
    var getMockReturn = {};
    getMockReturn.on = (type, callback) => {throw "Request failed"};
    http.get.mockReturnValue(getMockReturn);
    expect.assertions(1);
    return await expect(crimeDataService.updateCrimeDataSet()).rejects.toMatch("Request failed");
  });
})
