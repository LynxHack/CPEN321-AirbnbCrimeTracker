const db = require("../dbs");
const fs = require("fs");
const http = require("http");
const zip = require("adm-zip");
const csv = require("csv");
var crimeDataService = require("../CrimeDataService");

jest.mock("../dbs");
jest.mock('fs');
jest.mock('http');
jest.mock('adm-zip');
jest.mock('csv');


describe('Testing Crime Data Service initializeCrimeDataSet()', () => {
  beforeEach(() => {
    fs.createWriteStream.mockReturnValue({on: (type, callback) => {setTimeout(3000, callback())}});
    var readStream = { pipe: () => {return readStream} };
    fs.createReadStream.mockReturnValue(readStream);
    csv.transform.mockReturnValue((callback) => callback());
    csv.stringify.mockReturnValue((callback) => callback());
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
    expect(crimeDataService.getIndex(49.2, -123.1)).toStrictEqual([68,4]);
  });

  it('Test middle left vancouver bound', () => {
    expect(crimeDataService.getIndex(49.2, -123.2)).toStrictEqual([27,4]);
  });

  it('Test bottom left vancouver bound', () => {
    expect(crimeDataService.getIndex(49.195, -123.27)).toStrictEqual([0,0]);
  });

  it('Test upper right corner vancouver boundary', () => {
    expect(crimeDataService.getIndex(49.315, -123.02)).toStrictEqual([100,99]);
  });

  it('Test bottom right vancouver boundary', () => {
    expect(crimeDataService.getIndex(49.315, -123.27)).toStrictEqual([0,99]);
  });

  it('Test upper left vancouver bound', () => {
    expect(crimeDataService.getIndex(49.195, -123.02)).toStrictEqual([100,0]);
  });

  it('Test middle of vancouver', () => {
    expect(crimeDataService.getIndex(49.25, -123.15)).toStrictEqual([47,45]);
  });

  it('Test out of bound over limit', () => {
    expect(crimeDataService.getIndex(-999, 999)).toStrictEqual([0,0]);
  });

  it('Test zeros as lat long input', () => {
    expect(crimeDataService.getIndex(0, 0)).toStrictEqual([0,0]);
  });

  it('Test unexpected inputs', () => {
    expect(crimeDataService.getIndex('a', 'b')).toStrictEqual([0,0]);
  });

  it('Test below lng, valid lng', () => {
    expect(crimeDataService.getIndex(49.2, -124)).toStrictEqual([0,0]);
  });

  it('Test below lng, above lat', () => {
    expect(crimeDataService.getIndex(52, -124)).toStrictEqual([0,0]);
  });

  it('Test above lng, below lat', () => {
    expect(crimeDataService.getIndex(45, -122)).toStrictEqual([0,0]);
  });

  it('Test above lng, valid lng', () => {
    expect(crimeDataService.getIndex(49.2, -122)).toStrictEqual([0,0]);
  });

  it('Test below lat, valid lng', () => {
    expect(crimeDataService.getIndex(49, -123.1)).toStrictEqual([0,0]);
  });

  it('Test below lat, above lng', () => {
    expect(crimeDataService.getIndex(49, -120.1)).toStrictEqual([0,0]);
  });

  it('Test above lat, below lng', () => {
    expect(crimeDataService.getIndex(50, -124)).toStrictEqual([0,0]);
  });

  it('Test above lat, valid lng', () => {
    expect(crimeDataService.getIndex(50, -123.1)).toStrictEqual([0,0]);
  });

  it('Test both above', () => {
    expect(crimeDataService.getIndex(50, -124)).toStrictEqual([0,0]);
  });

  it('Test both below', () => {
    expect(crimeDataService.getIndex(45, -120)).toStrictEqual([0,0]);
  });
})

describe('Testing Crime Data Service getCrimeRate(lat, lng)', () => {
  it('valid index, no crimes', async () => {
    db.getAllQuery.mockReturnValue(new Promise(function(resolve, reject) {resolve(new Array())}));
    expect.assertions(2);
    await expect(crimeDataService.updateCrimeSafety()).resolves.toEqual(undefined);
    expect(crimeDataService.getCrimeRate(49.3, -123.1)).toBe(10);
  });

  it('valid index, 10', async () => {
    var aboveIndex = new Array(2005);
    aboveIndex.fill({type:"Break and Enter Residential/Other",year:2005,lng:-123.02630548,lat:49.20863951});

    db.getAllQuery.mockReturnValue(new Promise(function(resolve, reject) {resolve(aboveIndex)}));
    expect.assertions(2);
    await expect(crimeDataService.updateCrimeSafety()).resolves.toEqual(undefined);
    expect(crimeDataService.getCrimeRate(49.20863951, -123.02630548)).toBe(0)
  });

  it('valid index, 9', async () => {
    var aboveIndex = new Array(5);
    aboveIndex.fill({type:"Break and Enter Residential/Other",year:2005,lng:-123.02630548,lat:49.20863951});

    db.getAllQuery.mockReturnValue(new Promise(function(resolve, reject) {resolve(aboveIndex)}));
    expect.assertions(2);
    await expect(crimeDataService.updateCrimeSafety()).resolves.toEqual(undefined);
    expect(crimeDataService.getCrimeRate(49.20863951, -123.02630548)).toBe(9)
  });

  it('valid index, 5', async () => {
    var aboveIndex = new Array(1000);
    aboveIndex.fill({type:"Break and Enter Residential/Other",year:2005,lng:-123.02630548,lat:49.20863951});

    db.getAllQuery.mockReturnValue(new Promise(function(resolve, reject) {resolve(aboveIndex)}));
    expect.assertions(2);
    await expect(crimeDataService.updateCrimeSafety()).resolves.toEqual(undefined);
    expect(crimeDataService.getCrimeRate(49.20863951, -123.02630548)).toBe(5)
  });


  it('Test below lng, valid lng', () => {
    expect(crimeDataService.getCrimeRate(-124, 49.2)).toBe(10);
  });

  it('Test below lng, above lat', () => {
    expect(crimeDataService.getCrimeRate(-124, 52)).toBe(10);
  });

  it('Test above lng, below lat', () => {
    expect(crimeDataService.getCrimeRate(-122, 45)).toBe(10);
  });

  it('Test above lng, valid lng', () => {
    expect(crimeDataService.getCrimeRate(-122, 49.2)).toBe(10);
  });

  it('Test below lat, valid lng', () => {
    expect(crimeDataService.getCrimeRate(-123.1, 49)).toBe(10);
  });

  it('Test below lat, above lng', () => {
    expect(crimeDataService.getCrimeRate(-120.1, 49)).toBe(10);
  });

  it('Test above lat, below lng', () => {
    expect(crimeDataService.getCrimeRate(-124, 50)).toBe(10);
  });

  it('Test above lat, valid lng', () => {
    expect(crimeDataService.getCrimeRate(-123.1, 50)).toBe(10);
  });

  it('Test both above', () => {
    expect(crimeDataService.getCrimeRate(-124, 50)).toBe(10);
  });

  it('Test both below', () => {
    expect(crimeDataService.getCrimeRate(-120, 45)).toBe(10);
  });
})

describe('Testing Crime Data Service updateCrimeSafety()', () => {
  beforeEach(() => {
    db.getAllQuery.mockReturnValue(new Promise(function(resolve, reject) {resolve([{"type":"Break and Enter Residential/Other","year":2005,"lng":-123.02630548,"lat":49.20863951},{"type":"Break and Enter Residential/Other","year":2003,"lng":-123.22630548,"lat":49.22863951},{"type":"Mischief","year":2014,"lng":-123.32630548,"lat":49.23863951}])}));
  });

  it('Crime safety updated successfully', async () => {
    expect.assertions(2);
    await expect(crimeDataService.updateCrimeSafety()).resolves.toEqual(undefined);
    expect(crimeDataService.getCrimeRate(49.3, -123.1)).toBe(10);
  });

  it('Db query failed', async () => {
    db.getAllQuery.mockReturnValue(new Promise(function(resolve, reject) { reject("DB Connection failed") }));
    expect.assertions(1);
    return await expect(crimeDataService.updateCrimeSafety()).rejects.toMatch("DB Connection failed" );
  });

  it('Update crime safety with > 2000 crimes', async () => {
    var aboveIndex = new Array(2005);
    aboveIndex.fill({type:"Break and Enter Residential/Other",year:2005,lng:-123.02630548,lat:49.20863951});

    db.getAllQuery.mockReturnValue(new Promise(function(resolve, reject) {resolve(aboveIndex)}));
    expect.assertions(2);
    await expect(crimeDataService.updateCrimeSafety()).resolves.toEqual(undefined);
    expect(crimeDataService.getCrimeRate(49.20863951, -123.02630548)).toBe(0)
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
    var readStream = { pipe: () => {return readStream} };
    fs.createReadStream.mockReturnValue(readStream);
    csv.transform.mockReturnValue((callback) => callback());
    csv.stringify.mockReturnValue((callback) => callback());
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

describe('Testing Crime Data Service updateVancouverDataSet()', () => {
  beforeEach(() => {
    fs.createWriteStream.mockReturnValue({on: (type, callback) => {setTimeout(3000, callback())}});
    var readStream = { pipe: () => {return readStream} };
    fs.createReadStream.mockReturnValue(readStream);
    csv.transform.mockReturnValue((callback) => callback());
    csv.stringify.mockReturnValue((callback) => callback());
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

  it('VancouverDataset updated successfully', async () => {
    expect.assertions(1);
    return await expect(crimeDataService.updateVancouverDataSet()).resolves.toEqual(undefined);
  });

  it('Request failed', async () => {
    var getMockReturn = {};
    getMockReturn.on = (type, callback) => {throw "Request failed"};
    http.get.mockReturnValue(getMockReturn);
    expect.assertions(1);
    return await expect(crimeDataService.updateVancouverDataSet()).rejects.toMatch("Request failed");
  });
})

describe('Testing Crime Data Service updateChicagoDataSet()', () => {
  beforeEach(() => {
    fs.createWriteStream.mockReturnValue({on: (type, callback) => {setTimeout(3000, callback())}});
    var readStream = { pipe: () => {return readStream} };
    fs.createReadStream.mockReturnValue(readStream);
    csv.transform.mockReturnValue((callback) => callback());
    csv.stringify.mockReturnValue((callback) => callback());
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

  it('ChicagoDataset updated successfully', async () => {
    expect.assertions(1);
    return await expect(crimeDataService.updateChicagoDataSet()).resolves.toEqual(undefined);
  });

  it('ChicagoDataset updated unsuccessfully', async () => {
    db.loadTable.mockReturnValue(new Promise(function(resolve, reject) {reject("Load Table Failed!")}));
    expect.assertions(1);
    return await expect(crimeDataService.updateChicagoDataSet()).rejects.toMatch("Load Table Failed!");
  });

  it('Request failed', async () => {
    var getMockReturn = {};
    getMockReturn.on = (type, callback) => {throw "Request failed"};
    http.get.mockReturnValue(getMockReturn);
    fs.createWriteStream.mockReturnValue({on: (type, callback) => {}});
    expect.assertions(1);
    return await expect(crimeDataService.updateChicagoDataSet()).rejects.toMatch("Request failed");
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

describe('Testing Crime Data Service mapCoordinates()', () => {
  beforeEach(() => {
    fs.createWriteStream.mockReturnValue({on: (type, callback) => {setTimeout(3000, callback())}});
    var readStream = { pipe: (callback) => {
                                          if (typeof(callback) == "function") {
                                            callback();
                                          }
                                          return readStream} };
    fs.createReadStream.mockReturnValue(readStream);
    csv.transform.mockImplementation((callback) => callback({}));
    csv.stringify.mockReturnValue(() => {});
  });

  it('mapCoordinates success', async () => {
    expect.assertions(1);
    return await expect(crimeDataService.mapCoordinates()).resolves.toEqual(undefined);
  });

  it('mapCoordinates success, transformed data', async () => {
    csv.transform.mockImplementation((callback) => callback({X:498084,Y:5450650}));
    expect.assertions(1);
    return await expect(crimeDataService.mapCoordinates()).resolves.toEqual(undefined);
  });

  it('mapCoordinates success, no transformed data', async () => {
    csv.transform.mockImplementation((callback) => callback({X:"X",Y:"Y"}));
    expect.assertions(1);
    return await expect(crimeDataService.mapCoordinates()).resolves.toEqual(undefined);
  });
})
