const express = require("express");
const crimeDataService = require("../CrimeDataService");
const axios = require("axios");
const reverse = require("reverse-geocode");
jest.mock("express");
jest.mock("../CrimeDataService");
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

beforeEach(() => {
  res = {message : null, state: null};
  res.send = (message) => {
    res.message = message;
    return res;
  };

  res.status = (code) => {
    res.state = code;
    return res;
  };
});

describe('Testing Routes getListings', () => {
  it('getListings success', async() => {
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
    crimeDataService.getCrimeRate.mockReturnValue(0);

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
    crimeDataService.getCrimeRate.mockReturnValue(0);

    expect.assertions(2);
    await routes.testEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
    expect(res.message).toBe("{\"Listings\":[]}");
    expect(res.state).toBe(200);
  })

  it('getListings success with multiple listings', async() => {
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
    var listingsArr = new Array(10);
    listingsArr.fill({listing: test})
    var tabs = {sections: [{listings: listingsArr}]}
    var axiosReturnObj = {data: {explore_tabs: [tabs]}}
    axios.get.mockReturnValue(new Promise(function(resolve, reject) { resolve(axiosReturnObj) }));
    reverse.lookup.mockReturnValue({city:{split: () => {return ["Vancouver"]}}});

    for(var i = 0; i < 10; i++) {
        crimeDataService.getCrimeRate.mockReturnValueOnce(i);
    }


    expect.assertions(3);
    await routes.testEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
    expect(res.message).toEqual(expect.stringContaining('{"id":"1","lat":-123.02630548,"lng":49.20863951,"name":"listing 1","star_rating":2.5,"reviews_count":10,"person_capacity":5,"picture":{},"safetyIndex":0}'));
    expect(res.message).toEqual(expect.stringContaining('{"id":"1","lat":-123.02630548,"lng":49.20863951,"name":"listing 1","star_rating":2.5,"reviews_count":10,"person_capacity":5,"picture":{},"safetyIndex":9}'));
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
    crimeDataService.getCrimeRate.mockReturnValue(0);

    axios.get.mockReturnValue(new Promise(function(resolve, reject) { reject("Python exception") }));
    await routes.testEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
    setTimeout(5000, () => {
      expect.assertions(2);
      expect(res.message).toBe("Failed to load from Airbnb Microservice");
      expect(res.state).toBe(500);
    })
  })
})
