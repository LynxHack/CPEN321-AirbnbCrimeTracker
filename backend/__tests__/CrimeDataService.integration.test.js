var crimeDataService = require("../CrimeDataService");
const db = require("../dbs");
const fs = require("fs");
const http = require("http");
const zip = require("adm-zip");
const mysql = require("mysql");
jest.mock('fs');
jest.mock('http');
jest.mock('adm-zip');
jest.mock("mysql");


describe('Testing Crime Data Service updateCrimeDataSet()', () => {
  var returnObj = [];

  beforeEach(async () => {
    fs.createWriteStream.mockReturnValue({on: (type, callback) => {setTimeout(3000, callback())}});
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
    dbReturn.fill({type:"Break and Enter Residential/Other",year:2005,x:498084,y:5450650});
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
    aboveIndex.fill({type:"Break and Enter Residential/Other",year:2005,x:498084,y:5450650});
    returnObj = aboveIndex;

    expect.assertions(3);
    await expect(crimeDataService.updateCrimeDataSet()).resolves.toEqual(undefined);
    expect(crimeDataService.getCrimeRate(-123.02630548, 49.20863951)).toBe(0);
    expect(crimeDataService.getCrimeRate(-123.22630548, 49.40863951)).toBe(10);
  });

  it('Crimedataset updated successfully, empty input', async () => {
    var dbReturn = new Array();
    returnObj = dbReturn;

    expect.assertions(3);
    await expect(crimeDataService.updateCrimeDataSet()).resolves.toEqual(undefined);
    expect(crimeDataService.getCrimeRate(-123.02630548, 49.20863951)).toBe(10);
    expect(crimeDataService.getCrimeRate(-123.22630548, 49.40863951)).toBe(10);
  });

  it('Unzip file failed', async () => {
    zip.mockImplementation(() => { throw "Invalid filename" });
    expect.assertions(1);
    return await expect(crimeDataService.updateCrimeDataSet()).rejects.toMatch("Invalid filename");
  });

  it('Db load table failed', async () => {
    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {
                    if(qString.includes("SELECT")){
                      func(null, returnObj);
                    } else {
                      throw "DB load failed!";
                    }}};
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();
    expect.assertions(1);
    return await expect(crimeDataService.updateCrimeDataSet()).rejects.toMatch("DB load failed!");
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
