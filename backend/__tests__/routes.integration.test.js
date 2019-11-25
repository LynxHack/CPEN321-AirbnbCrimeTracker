const express = require("express");
const axios = require("axios");
const reverse = require("reverse-geocode");
var crimeDataService = require("../CrimeDataService");
var db = require("../dbs.js");
const mysql = require("mysql");
const csv = require("csv");

jest.mock("mysql");
jest.mock("express");
jest.mock("axios");
jest.mock("reverse-geocode");
jest.mock('csv');

var getMap = {};
var putMap = {};
var deleteMap = {};
express.Router.mockImplementation(() => {
  return {
    get: (path, func) => {
        getMap[path] = func;
    },
    put: (path, func) => {
        putMap[path] = func;
    },
    delete: (path, func) => {
        deleteMap[path] = func;
    },
    use: () => {},
    testGetEndpoint: (path, params, res) => { return getMap[path](params, res) },
    testPutEndpoint: (path, params, res) => { return putMap[path](params, res) },
    testDeleteEndpoint: (path, params, res) => { return deleteMap[path](params, res) }
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

  res.end = () => {};
});

describe('Testing Routes getListings', () => {
  beforeEach(async () => {
    var aboveIndex = new Array(2005);
    aboveIndex.fill({type:"Break and Enter Residential/Other",year:2005,lng:-123.02630548,lat:49.20863951});
    var sqlcon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, func) => {func(null, aboveIndex)} };
    mysql.createConnection.mockReturnValue(sqlcon);
    await db.connectToDb();
    await crimeDataService.updateCrimeSafety();
  });

  it('getListings success, listing has crime index of 0', async() => {
    var test = {
      id: "1",
      lat: 49.20863951,
      lng: -123.02630548,
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
    await routes.testGetEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
    expect(res.message).toBe('{"Listings":[{"id":"1","lat":49.20863951,"lng":-123.02630548,"name":"listing 1","star_rating":2.5,"reviews_count":10,"person_capacity":5,"picture":{},"safetyIndex":0}]}');
    expect(res.state).toBe(200);
  })

  it('getListings success, listing has crime index of 10', async() => {
    var test = {
      id: "1",
      lat: 49.20863951,
      lng: -123.02630548,
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
    await routes.testGetEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
    expect(res.message).toBe('{"Listings":[{"id":"1","lat":49.20863951,"lng":-123.02630548,"name":"listing 1","star_rating":2.5,"reviews_count":10,"person_capacity":5,"picture":{},"safetyIndex":0}]}');
    expect(res.state).toBe(200);
  })

  it('getListings success, no listings', async() => {
    var tabs = {sections: [{listings: []}]}
    var axiosReturnObj = {data: {explore_tabs: [tabs]}}
    axios.get.mockReturnValue(new Promise(function(resolve, reject) { resolve(axiosReturnObj) }));
    reverse.lookup.mockReturnValue({city:{split: () => {return ["Vancouver"]}}});

    expect.assertions(2);
    await routes.testGetEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
    expect(res.message).toBe("{\"Listings\":[]}");
    expect(res.state).toBe(200);
  })

  it('getListings success with multiple listings and indices', async() => {
    var insideIndex = {
      id: "1",
      lat: 49.20863951,
      lng: -123.02630548,
      name: "listing 1",
      star_rating: 2.5,
      reviews_count: 10,
      person_capacity: 5,
      picture: {}
    }

    var outsideIndex = {
      id: "2",
      lat: 49.80863951,
      lng: -123.22630548,
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
    await routes.testGetEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
    expect(res.message).toEqual(expect.stringContaining('{"id":"1","lat":49.20863951,"lng":-123.02630548,"name":"listing 1","star_rating":2.5,"reviews_count":10,"person_capacity":5,"picture":{},"safetyIndex":0}'));
    expect(res.message).toEqual(expect.stringContaining('{"id":"2","lat":49.80863951,"lng":-123.22630548,"name":"listing 2","star_rating":2.5,"reviews_count":10,"person_capacity":5,"picture":{},"safetyIndex":10}'));
    expect(res.state).toBe(200);
  })

  it('getListings failure', async() => {
    axios.get.mockReturnValue(new Promise(function(resolve, reject) { reject("Python exception") }));
    await routes.testGetEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
    expect.assertions(2);
    expect(res.message).toBe("Failed to load from Airbnb Microservice");
    expect(res.state).toBe(500);
  })

  it('Invalid axios.get response', async() => {
    var test = {
      id: "1",
      lat: 49.20863951,
      lng: -123.02630548,
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
    await routes.testGetEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
    expect.assertions(2);
    expect(res.message).toBe("Failed to load from Airbnb Microservice");
    expect(res.state).toBe(500);
  })

})

describe('Testing Routes GET /favourites', () => {
  it('getFavourites success', async() => {
    var sqlcon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, params, func) => {func(null, [{airbnbId:"1"}, {airbnbId:"2"}])} };
    mysql.createConnection.mockReturnValue(sqlcon);
    await db.connectToDb();
    await routes.testGetEndpoint("/favourites", {query: {userId: "1"}}, res);
    expect.assertions(2);
    expect(res.message).toBe('{"Listings":["1","2"]}');
    expect(res.state).toBe(200);
  })

  it('getFavourites bad params', async() => {
    var sqlcon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, params, func) => {func(null, {response:"response"})} };
    mysql.createConnection.mockReturnValue(sqlcon);
    await db.connectToDb();

    await routes.testGetEndpoint("/favourites", {query: {}}, res);
    expect.assertions(2);
    expect(res.message).toBe("Invalid params");
    expect(res.state).toBe(400);
  })

  it('getFavourites mysql failure', async() => {
    var sqlcon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, params, func) => {func("Error from service", null)} };
    mysql.createConnection.mockReturnValue(sqlcon);
    await db.connectToDb();
    await routes.testGetEndpoint("/favourites", {query: {userId: "1"}}, res);
    expect.assertions(2);
    expect(res.message).toBe("Error while getting airbnbs from favourites!");
    expect(res.state).toBe(500);
  })
})


describe('Testing Routes PUT /favourites', () => {
  beforeEach(async () => {
    var sqlcon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, params, func) => {func(null, null)} };
    mysql.createConnection.mockReturnValue(sqlcon);
    await db.connectToDb();
  })

  it('putFavourite success', async() => {
    await routes.testPutEndpoint("/favourites", {body: {userId: "1", airbnbId: "2"}}, res);
    expect.assertions(1);
    expect(res.state).toBe(200);
  })

  it('putFavourite bad params', async() => {
    await routes.testPutEndpoint("/favourites", {body: {}}, res);
    expect.assertions(2);
    expect(res.message).toBe("Invalid params");
    expect(res.state).toBe(400);
  })

  it('putFavourite bad params, no userId', async() => {
    await routes.testPutEndpoint("/favourites", {body: {airbnbId: "2"}}, res);
    expect.assertions(2);
    expect(res.message).toBe("Invalid params");
    expect(res.state).toBe(400);
  })

  it('putFavourite bad params, no airbnbId', async() => {
    await routes.testPutEndpoint("/favourites", {body: {userId: "2"}}, res);
    expect.assertions(2);
    expect(res.message).toBe("Invalid params");
    expect(res.state).toBe(400);
  })


  it('putFavourite userservice failure', async() => {
    var sqlcon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, params, func) => {func("Error from service", null)} };
    mysql.createConnection.mockReturnValue(sqlcon);
    await db.connectToDb();
    await routes.testPutEndpoint("/favourites", {body: {userId: "1", airbnbId: "2"}}, res);

    expect.assertions(2);
    expect(res.message).toBe("Error while adding airbnb to favourites!");
    expect(res.state).toBe(500);
  })
})

describe('Testing Routes DELETE /favourites', () => {
  beforeEach(async () => {
    var sqlcon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, params, func) => {func(null, null)} };
    mysql.createConnection.mockReturnValue(sqlcon);
    await db.connectToDb();
  })

  it('deleteFavourite success', async() => {
    await routes.testDeleteEndpoint("/favourites", {query: {userId: "1", airbnbId: "2"}}, res);
    expect.assertions(1);
    expect(res.state).toBe(200);
  })

  it('deleteFavourite bad params', async() => {
    await routes.testDeleteEndpoint("/favourites", {query: {}}, res);
    expect.assertions(2);
    expect(res.message).toBe("Invalid params");
    expect(res.state).toBe(400);
  })

  it('deleteFavourite bad params, no userId', async() => {
    await routes.testDeleteEndpoint("/favourites", {query: {airbnbId: "2"}}, res);
    expect.assertions(2);
    expect(res.message).toBe("Invalid params");
    expect(res.state).toBe(400);
  })

  it('deleteFavourite bad params, no userId', async() => {
    await routes.testDeleteEndpoint("/favourites", {query: {userId: "2"}}, res);
    expect.assertions(2);
    expect(res.message).toBe("Invalid params");
    expect(res.state).toBe(400);
  })


  it('deleteFavourite mysql failure', async() => {
    var sqlcon = { connect: (func) => {func()},
                on: (type, func) => {},
                query: (qString, params, func) => {func("Error from service", null)} };
    mysql.createConnection.mockReturnValue(sqlcon);
    await db.connectToDb();
    await routes.testDeleteEndpoint("/favourites", {query: {userId: "1", airbnbId: "2"}}, res);

    expect.assertions(2);
    expect(res.message).toBe("Error while removing airbnb from favourites!");
    expect(res.state).toBe(500);
  })
})
