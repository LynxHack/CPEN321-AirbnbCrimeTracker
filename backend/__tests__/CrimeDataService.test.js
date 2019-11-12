const db = require("../dbs");
const fs = require("fs");
const http = require("http");
const zip = require("adm-zip");
var crimeDataService = require("../CrimeDataService");
jest.mock("../dbs");
jest.mock('fs');
jest.mock('http');
jest.mock('adm-zip');

beforeEach(() => {

});

describe('Testing Crime Data Service initializeCrimeDataSet()', () => {
  beforeEach(() => {
    fs.createWriteStream.mockReturnValue({on: (type, callback) => {setTimeout(3000, callback())}});
    zip.mockImplementation(() => { return { extractEntryTo: () => {} }});
    db.loadTable.mockReturnValue(new Promise(function(resolve, reject) {resolve()}));
    db.getAllQuery.mockReturnValue(new Promise(function(resolve, reject) {resolve([])}));
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

  it('Db call success, no update', async () => {
    db.initializeDb.mockReturnValue(new Promise(function(resolve, reject) { resolve() }));
    db.checkLastUpdate.mockReturnValue(new Promise(function(resolve, reject) { resolve({"created_at": new Date().toString()}) }))
    expect.assertions(1);
    return await expect(crimeDataService.initializeCrimeDataSet()).resolves.toEqual(undefined);
  });

  it('Db call success, outdated dataset', async () => {
    db.initializeDb.mockReturnValue(new Promise(function(resolve, reject) { resolve() }));
    db.checkLastUpdate.mockReturnValue(new Promise(function(resolve, reject) { resolve({"created_at": "Mon Nov 11 2018 21:09:17"}) }))
    expect.assertions(1);
    return await expect(crimeDataService.initializeCrimeDataSet()).resolves.toEqual(undefined);
  });

  it('Db call success, table empty', async () => {
    db.initializeDb.mockReturnValue(new Promise(function(resolve, reject) { resolve() }));
    db.checkLastUpdate.mockReturnValue(new Promise(function(resolve, reject) { resolve() }))
    expect.assertions(1);
    return await expect(crimeDataService.initializeCrimeDataSet()).resolves.toEqual(undefined);
  });

  it('Db call failed', async () => {
    db.initializeDb.mockReturnValue(new Promise(function(resolve, reject) { reject("DB Connection failed") }));
    expect.assertions(1);
    return await expect(crimeDataService.initializeCrimeDataSet()).rejects.toMatch("DB Connection failed" );
  });
})

describe('Testing Crime Data Service between(x, min, max)', () => {
  it('test valid between', () => {
    expect(crimeDataService.between(3, 1, 5)).toBe(true);
  });

  it('test less than min', () => {
    expect(crimeDataService.between(0, 1, 5)).toBe(false);
  });

  it('test more than max', () => {
    expect(crimeDataService.between(10, 1, 5)).toBe(false);
  });

  it('test less equal to min', () => {
    expect(crimeDataService.between(1, 1, 5)).toBe(true);
  });

  it('test equal to max', () => {
    expect(crimeDataService.between(5, 1, 5)).toBe(true);
  });
})

describe('Testing Crime Data Service getIndex(lat, lng)', () => {
  it('Test valid between', () => {
    expect(crimeDataService.getIndex(-123.1, 49.2)).toStrictEqual([68,4]);
  });

  it('Test below lng, valid lng', () => {
    expect(crimeDataService.getIndex(-124, 49.2)).toStrictEqual([0,0]);
  });

  it('Test below lng, above lat', () => {
    expect(crimeDataService.getIndex(-124, 52)).toStrictEqual([0,0]);
  });

  it('Test above lng, below lat', () => {
    expect(crimeDataService.getIndex(-122, 45)).toStrictEqual([0,0]);
  });

  it('Test above lng, valid lng', () => {
    expect(crimeDataService.getIndex(-122, 49.2)).toStrictEqual([0,0]);
  });

  it('Test below lat, valid lng', () => {
    expect(crimeDataService.getIndex(-123.1, 49)).toStrictEqual([0,0]);
  });

  it('Test below lat, above lng', () => {
    expect(crimeDataService.getIndex(-120.1, 49)).toStrictEqual([0,0]);
  });

  it('Test above lat, below lng', () => {
    expect(crimeDataService.getIndex(-124, 50)).toStrictEqual([0,0]);
  });

  it('Test above lat, valid lng', () => {
    expect(crimeDataService.getIndex(-123.1, 50)).toStrictEqual([0,0]);
  });

  it('Test both above', () => {
    expect(crimeDataService.getIndex(-124, 50)).toStrictEqual([0,0]);
  });

  it('Test both below', () => {
    expect(crimeDataService.getIndex(-120, 45)).toStrictEqual([0,0]);
  });
})

describe('Testing Crime Data Service getCrimeRate(lat, lng)', () => { //////////////////////////////////////////////////fix all
  it('valid index', async () => {
    expect(crimeDataService.getCrimeRate(49.3, -123.1)).toBe(0);
  });

  it('Test below lng, valid lng', () => {
    expect(crimeDataService.getCrimeRate(-124, 49.2)).toBe(0);
  });

  it('Test below lng, above lat', () => {
    expect(crimeDataService.getCrimeRate(-124, 52)).toBe(0);
  });

  it('Test above lng, below lat', () => {
    expect(crimeDataService.getCrimeRate(-122, 45)).toBe(0);
  });

  it('Test above lng, valid lng', () => {
    expect(crimeDataService.getCrimeRate(-122, 49.2)).toBe(0);
  });

  it('Test below lat, valid lng', () => {
    expect(crimeDataService.getCrimeRate(-123.1, 49)).toBe(0);
  });

  it('Test below lat, above lng', () => {
    expect(crimeDataService.getCrimeRate(-120.1, 49)).toBe(0);
  });

  it('Test above lat, below lng', () => {
    expect(crimeDataService.getCrimeRate(-124, 50)).toBe(0);
  });

  it('Test above lat, valid lng', () => {
    expect(crimeDataService.getCrimeRate(-123.1, 50)).toBe(0);
  });

  it('Test both above', () => {
    expect(crimeDataService.getCrimeRate(-124, 50)).toBe(0);
  });

  it('Test both below', () => {
    expect(crimeDataService.getCrimeRate(-120, 45)).toBe(0);
  });
})

describe('Testing Crime Data Service updateCrimeSafety()', () => {
  beforeEach(() => {
    db.getAllQuery.mockReturnValue(new Promise(function(resolve, reject) {resolve([{"type":"Break and Enter Residential/Other","year":2005,"x":498084,"y":5450650},{"type":"Break and Enter Residential/Other","year":2003,"x":498282,"y":5450220},{"type":"Mischief","year":2014,"x":497915,"y":5450780}])}));
  });

  it('Crime safety updated successfully', async () => {
    expect.assertions(2);
    await expect(crimeDataService.updateCrimeSafety()).resolves.toEqual(undefined);
    expect(crimeDataService.getCrimeRate(49.3, -123.1)).toBe(0); ///////////////////////////////////////////////////////////////////////////// fix expected
  });

  it('Db query failed', async () => {
    db.getAllQuery.mockReturnValue(new Promise(function(resolve, reject) { reject("DB Connection failed") }));
    expect.assertions(1);
    return await expect(crimeDataService.updateCrimeSafety()).rejects.toMatch("DB Connection failed" );
  });

  it('Update crime safety with > 2000 crimes', async () => {
    var aboveIndex = new Array(2005);
    aboveIndex.fill({"type":"Break and Enter Residential/Other","year":2005,"x":498084,"y":5450650});
    db.getAllQuery.mockReturnValue(new Promise(function(resolve, reject) {resolve(aboveIndex)}));
    expect.assertions(2);
    await expect(crimeDataService.updateCrimeSafety()).resolves.toEqual(undefined);
    expect(crimeDataService.getCrimeRate(49.20863951, -123.02630548)).toBe(0)/////////////////////////////////////// fix expected
  });
})

describe('Testing Crime Data Service getCrimeData(xmin, xmax, ymin, ymax, year)', () => {
  db.sendQuery.mockReturnValue("Response from db");
  it('test getCrimeData', () => {
    expect(crimeDataService.getCrimeData(1,2,3,1,5)).toBe("Response from db");
  });
})

describe('Testing Crime Data Service updateCrimeDataSet()', () => {
  beforeEach(() => {
    fs.createWriteStream.mockReturnValue({on: (type, callback) => {setTimeout(3000, callback())}});
    zip.mockImplementation(() => { return { extractEntryTo: () => {} }});
    db.loadTable.mockReturnValue(new Promise(function(resolve, reject) {resolve()}));
    db.getAllQuery.mockReturnValue(new Promise(function(resolve, reject) {resolve([])}));
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
    expect.assertions(1);
    return await expect(crimeDataService.updateCrimeDataSet()).resolves.toEqual(undefined);
  });

  it('Unzip file failed', async () => {
    zip.mockImplementation(() => { throw "Invalid filename" });
    expect.assertions(1);
    return await expect(crimeDataService.updateCrimeDataSet()).rejects.toMatch("Invalid filename");
  });

  it('Db load table failed', async () => {
    db.loadTable.mockReturnValue(new Promise(function(resolve, reject) { reject("DB Connection failed") }));
    expect.assertions(1);
    return await expect(crimeDataService.updateCrimeDataSet()).rejects.toMatch("DB Connection failed" );
  });

  it('Update crime safety failed', async () => {
    db.getAllQuery.mockReturnValue(new Promise(function(resolve, reject) { reject("DB Connection failed") }));
    expect.assertions(1);
    return await expect(crimeDataService.updateCrimeDataSet()).rejects.toMatch("DB Connection failed");
  });

  it('Request failed', async () => {
    var getMockReturn = {};
    getMockReturn.on = (type, callback) => {throw "Request failed"};
    http.get.mockReturnValue(getMockReturn);
    expect.assertions(1);
    return await expect(crimeDataService.updateCrimeDataSet()).rejects.toMatch("Request failed");
  });
})

describe('Testing Crime Data Service requestCrimeData(output)', () => {
  it('Request success', async () => {
    var getMockReturn = {};
    getMockReturn.on = (type, callback) => {
                          if (type == "response") {
                            callback({ pipe: (output) => { output.val = "Request response" }});
                            return this;
                          } else {
                            return this;
                          }};
    http.get.mockReturnValue(getMockReturn);
    expect.assertions(2);
    var output = {};
    await expect(crimeDataService.requestCrimeData(output)).resolves.toEqual(undefined);
    expect(output.val).toBe("Request response");
  });

  it('Request failed', async () => {
    var getMockReturn = {};
    getMockReturn.on = (type, callback) => {throw "Request failed"};
    http.get.mockReturnValue(getMockReturn);
    expect.assertions(1);
    var output = {};
    return await expect(crimeDataService.requestCrimeData(output)).rejects.toMatch("Request failed");
  });

  it('Request on error', async () => {
    var getMockReturn = {};
    getMockReturn.on = (type, callback) => {
                          if (type == "response") {
                            return getMockReturn;
                          } else {
                            callback("Request failed");
                          }};
    http.get.mockReturnValue(getMockReturn);
    expect.assertions(1);
    var output = {};
    return await expect(crimeDataService.requestCrimeData(output)).rejects.toMatch("Request failed");
  });
})

describe('Testing Crime Data Service unzipFile()', () => {
  it('unzips file successfully', async () => {
    var isZipped = true;
    zip.mockImplementation(() => { return { extractEntryTo: () => {isZipped = false} }});
    expect.assertions(2);
    await expect(crimeDataService.unzipFile()).resolves.toEqual(undefined);
    expect(isZipped).toBe(false)
  });

  it('error on finding zip file', async () => {
    zip.mockImplementation(() => { throw "Invalid filename" });
    expect.assertions(1);
    return await expect(crimeDataService.unzipFile()).rejects.toMatch("Invalid filename");
  });

  it('error on unzipping file', async () => {
    zip.mockImplementation(() => { return { extractEntryTo: () => { throw "Unzip failed" }} });
    expect.assertions(1);
    return await expect(crimeDataService.unzipFile()).rejects.toMatch("Unzip failed");
  });
})
