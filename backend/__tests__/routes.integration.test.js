const express = require("express");
const axios = require("axios");
const reverse = require("reverse-geocode");
var crimeDataService = require("../CrimeDataService");
var db = require("../dbs.js");
const mysql = require("mysql");
jest.mock("mysql");
jest.mock("express");
jest.mock("axios");
jest.mock("reverse-geocode");

var funcMap = {};
express.Router.mockImplementation(() => {
  return {
    get: (path, func) => {
        funcMap[path] = func;
    },
    use: () => {},
    testEndpoint: (path, params, res) => { funcMap[path](params, res) }
  }
});

var routes = require("../routes.js");
var res = null;

beforeEach(async () => {
  res = {message : null, state: null};
  res.send = (message) => {
    res.message = message;
    return res;
  };

  res.status = (code) => {
    res.state = code;
    return res;
  };

  var aboveIndex = new Array(2005);
  aboveIndex.fill({type:"Break and Enter Residential/Other",year:2005,x:498084,y:5450650});
  sqlCon = { connect: (func) => {func()},
              on: (type, func) => {},
              query: (qString, func) => {func(null, aboveIndex)} };
  mysql.createConnection.mockReturnValue(sqlCon);
  await db.connectToDb();
  await crimeDataService.updateCrimeSafety();
});

describe('Testing Routes getListings', () => {
  it('getListings success, listing has crime index of 0', async() => {
    var test = {
      id: "1",
      lat: -123.02630548,
      lng: 49.20863951,
      name: "listing 1",
      star_rating: 2.5,
      reviews_count: 10,
      person_capacity: 5,
      picture: {}
    }

    var tabs = {sections: [{listings: [{listing: test}]}]}
    var axiosReturnObj = {data: {explore_tabs: [tabs]}}
    axios.get.mockReturnValue(new Promise(function(resolve, reject) { resolve(axiosReturnObj) }));
    reverse.lookup.mockReturnValue({city:{split: () => {return ["Vancouver"]}}});

    expect.assertions(2);
    await routes.testEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
    expect(res.message).toBe('{"Listings":[{"id":"1","lat":-123.02630548,"lng":49.20863951,"name":"listing 1","star_rating":2.5,"reviews_count":10,"person_capacity":5,"picture":{},"safetyIndex":0}]}');
    expect(res.state).toBe(200);
  })

  it('getListings success, listing has crime index of 10', async() => {
    var test = {
      id: "1",
      lat: -123.02630548,
      lng: 49.20863951,
      name: "listing 1",
      star_rating: 2.5,
      reviews_count: 10,
      person_capacity: 5,
      picture: {}
    }

    var tabs = {sections: [{listings: [{listing: test}]}]}
    var axiosReturnObj = {data: {explore_tabs: [tabs]}}
    axios.get.mockReturnValue(new Promise(function(resolve, reject) { resolve(axiosReturnObj) }));
    reverse.lookup.mockReturnValue({city:{split: () => {return ["Vancouver"]}}});

    expect.assertions(2);
    await routes.testEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
    expect(res.message).toBe('{"Listings":[{"id":"1","lat":-123.02630548,"lng":49.20863951,"name":"listing 1","star_rating":2.5,"reviews_count":10,"person_capacity":5,"picture":{},"safetyIndex":0}]}');
    expect(res.state).toBe(200);
  })

  it('getListings success, no listings', async() => {
    var tabs = {sections: [{listings: []}]}
    var axiosReturnObj = {data: {explore_tabs: [tabs]}}
    axios.get.mockReturnValue(new Promise(function(resolve, reject) { resolve(axiosReturnObj) }));
    reverse.lookup.mockReturnValue({city:{split: () => {return ["Vancouver"]}}});

    expect.assertions(2);
    await routes.testEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
    expect(res.message).toBe("{\"Listings\":[]}");
    expect(res.state).toBe(200);
  })

  it('getListings success with multiple listings and indices', async() => {
    var insideIndex = {
      id: "1",
      lat: -123.02630548,
      lng: 49.20863951,
      name: "listing 1",
      star_rating: 2.5,
      reviews_count: 10,
      person_capacity: 5,
      picture: {}
    }

    var outsideIndex = {
      id: "2",
      lat: -123.22630548,
      lng: 49.80863951,
      name: "listing 2",
      star_rating: 2.5,
      reviews_count: 10,
      person_capacity: 5,
      picture: {}
    }
    var listingsArr = new Array(10);
    listingsArr.fill({listing: insideIndex}, 0, 5)
    listingsArr.fill({listing: outsideIndex}, 5, 10)
    var tabs = {sections: [{listings: listingsArr}]}
    var axiosReturnObj = {data: {explore_tabs: [tabs]}}
    axios.get.mockReturnValue(new Promise(function(resolve, reject) { resolve(axiosReturnObj) }));
    reverse.lookup.mockReturnValue({city:{split: () => {return ["Vancouver"]}}});

    expect.assertions(3);
    await routes.testEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
    expect(res.message).toEqual(expect.stringContaining('{"id":"1","lat":-123.02630548,"lng":49.20863951,"name":"listing 1","star_rating":2.5,"reviews_count":10,"person_capacity":5,"picture":{},"safetyIndex":0}'));
    expect(res.message).toEqual(expect.stringContaining('{"id":"2","lat":-123.22630548,"lng":49.80863951,"name":"listing 2","star_rating":2.5,"reviews_count":10,"person_capacity":5,"picture":{},"safetyIndex":10}'));
    expect(res.state).toBe(200);
  })

  it('getListings failure', async() => {
    axios.get.mockReturnValue(new Promise(function(resolve, reject) { reject("Python exception") }));
    await routes.testEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
    setTimeout(5000, () => {
      expect.assertions(2);
      expect(res.message).toBe("Failed to load from Airbnb Microservice");
      expect(res.state).toBe(500);
    })
  })

  it('Invalid axios.get response', async() => {
    var test = {
      id: "1",
      lat: -123.02630548,
      lng: 49.20863951,
      name: "listing 1",
      star_rating: 2.5,
      reviews_count: 10,
      person_capacity: 5,
      picture: {}
    }

    //missing inner object fields
    var axiosReturnObj = {data: {explore_tabs: []}}
    axios.get.mockReturnValue(new Promise(function(resolve, reject) { resolve(axiosReturnObj) }));
    reverse.lookup.mockReturnValue({city:{split: () => {return ["Vancouver"]}}});

    axios.get.mockReturnValue(new Promise(function(resolve, reject) { reject("Python exception") }));
    await routes.testEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
    setTimeout(5000, () => {
      expect.assertions(2);
      expect(res.message).toBe("Failed to load from Airbnb Microservice");
      expect(res.state).toBe(500);
    })
  })

  it('Db query failed', async() => {
    var test = {
      id: "1",
      lat: -123.02630548,
      lng: 49.20863951,
      name: "listing 1",
      star_rating: 2.5,
      reviews_count: 10,
      person_capacity: 5,
      picture: {}
    }

    var tabs = {sections: [{listings: [{listing: test}]}]}
    var axiosReturnObj = {data: {explore_tabs: [tabs]}}
    axios.get.mockReturnValue(new Promise(function(resolve, reject) { resolve(axiosReturnObj) }));
    reverse.lookup.mockReturnValue({city:{split: () => {return ["Vancouver"]}}});

    sqlCon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {func("Query failed!", null)} };
    mysql.createConnection.mockReturnValue(sqlCon);
    await db.connectToDb();

    await routes.testEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
    setTimeout(5000, () => {
      expect.assertions(2);
      expect(res.message).toBe("Failed to load from Airbnb Microservice");
      expect(res.state).toBe(500);
    })
  })

})
