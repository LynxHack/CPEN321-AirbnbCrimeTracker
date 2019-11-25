const express = require("express");
const crimeDataService = require("../CrimeDataService");
const userService = require("../UserService");
const axios = require("axios");
const reverse = require("reverse-geocode");
jest.mock("express");
jest.mock("../CrimeDataService");
jest.mock("../UserService");
jest.mock("axios");
jest.mock("reverse-geocode");

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

  res.end = () => {}
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
      picture: {},
    }

    var tabs = {sections: [{listings: [{listing: test,
                                        pricing_quote:{
                                          "rate":{
                                            "amount":60
                                          }
                                        }}]}]}
    var axiosReturnObj = {data: {explore_tabs: [tabs]}}
    axios.get.mockReturnValue(new Promise(function(resolve, reject) { resolve(axiosReturnObj) }));
    reverse.lookup.mockReturnValue({city:{split: () => {return ["Vancouver"]}}});
    crimeDataService.getCrimeRate.mockReturnValue(0);

    expect.assertions(2);
    await routes.testGetEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
    expect(res.message).toBe("{\"Listings\":[{\"id\":\"1\",\"lat\":-123.02630548,\"lng\":49.20863951,\"name\":\"listing 1\",\"star_rating\":2.5,\"reviews_count\":10,\"person_capacity\":5,\"picture\":{},\"pricing_quote\":{\"rate\":{\"amount\":60}},\"safetyIndex\":0}]}");
    expect(res.state).toBe(200);
  })

  it('getListings success, no listings', async() => {
    var tabs = {sections: [{listings: []}]}
    var axiosReturnObj = {data: {explore_tabs: [tabs]}}
    axios.get.mockReturnValue(new Promise(function(resolve, reject) { resolve(axiosReturnObj) }));
    reverse.lookup.mockReturnValue({city:{split: () => {return ["Vancouver"]}}});
    crimeDataService.getCrimeRate.mockReturnValue(0);

    expect.assertions(2);
    await routes.testGetEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
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
      picture: {},
    }
    var listingsArr = new Array(10);
    listingsArr.fill({listing: test,
                      pricing_quote:{
                        rate:{
                          amount:80
                        }
                      }
                    })
    var tabs = {sections: [{listings: listingsArr}]}
    var axiosReturnObj = {data: {explore_tabs: [tabs]}}
    axios.get.mockReturnValue(new Promise(function(resolve, reject) { resolve(axiosReturnObj) }));
    reverse.lookup.mockReturnValue({city:{split: () => {return ["Vancouver"]}}});

    for(var i = 0; i < 10; i++) {
        crimeDataService.getCrimeRate.mockReturnValueOnce(i);
    }

    expect.assertions(2);
    await routes.testGetEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
    expect(res.message).toEqual(expect.stringContaining("{\"Listings\":[{\"id\":\"1\",\"lat\":-123.02630548,\"lng\":49.20863951,\"name\":\"listing 1\",\"star_rating\":2.5,\"reviews_count\":10,\"person_capacity\":5,\"picture\":{},\"pricing_quote\":{\"rate\":{\"amount\":80}},\"safetyIndex\":0},{\"id\":\"1\",\"lat\":-123.02630548,\"lng\":49.20863951,\"name\":\"listing 1\",\"star_rating\":2.5,\"reviews_count\":10,\"person_capacity\":5,\"picture\":{},\"pricing_quote\":{\"rate\":{\"amount\":80}},\"safetyIndex\":1},{\"id\":\"1\",\"lat\":-123.02630548,\"lng\":49.20863951,\"name\":\"listing 1\",\"star_rating\":2.5,\"reviews_count\":10,\"person_capacity\":5,\"picture\":{},\"pricing_quote\":{\"rate\":{\"amount\":80}},\"safetyIndex\":2},{\"id\":\"1\",\"lat\":-123.02630548,\"lng\":49.20863951,\"name\":\"listing 1\",\"star_rating\":2.5,\"reviews_count\":10,\"person_capacity\":5,\"picture\":{},\"pricing_quote\":{\"rate\":{\"amount\":80}},\"safetyIndex\":3},{\"id\":\"1\",\"lat\":-123.02630548,\"lng\":49.20863951,\"name\":\"listing 1\",\"star_rating\":2.5,\"reviews_count\":10,\"person_capacity\":5,\"picture\":{},\"pricing_quote\":{\"rate\":{\"amount\":80}},\"safetyIndex\":4},{\"id\":\"1\",\"lat\":-123.02630548,\"lng\":49.20863951,\"name\":\"listing 1\",\"star_rating\":2.5,\"reviews_count\":10,\"person_capacity\":5,\"picture\":{},\"pricing_quote\":{\"rate\":{\"amount\":80}},\"safetyIndex\":5},{\"id\":\"1\",\"lat\":-123.02630548,\"lng\":49.20863951,\"name\":\"listing 1\",\"star_rating\":2.5,\"reviews_count\":10,\"person_capacity\":5,\"picture\":{},\"pricing_quote\":{\"rate\":{\"amount\":80}},\"safetyIndex\":6},{\"id\":\"1\",\"lat\":-123.02630548,\"lng\":49.20863951,\"name\":\"listing 1\",\"star_rating\":2.5,\"reviews_count\":10,\"person_capacity\":5,\"picture\":{},\"pricing_quote\":{\"rate\":{\"amount\":80}},\"safetyIndex\":7},{\"id\":\"1\",\"lat\":-123.02630548,\"lng\":49.20863951,\"name\":\"listing 1\",\"star_rating\":2.5,\"reviews_count\":10,\"person_capacity\":5,\"picture\":{},\"pricing_quote\":{\"rate\":{\"amount\":80}},\"safetyIndex\":8},{\"id\":\"1\",\"lat\":-123.02630548,\"lng\":49.20863951,\"name\":\"listing 1\",\"star_rating\":2.5,\"reviews_count\":10,\"person_capacity\":5,\"picture\":{},\"pricing_quote\":{\"rate\":{\"amount\":80}},\"safetyIndex\":9}]}"  ));
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
      lat: -123.02630548,
      lng: 49.20863951,
      name: "listing 1",
      star_rating: 2.5,
      reviews_count: 10,
      person_capacity: 5,
      picture: {},
    }

    //missing inner object fields
    var axiosReturnObj = {data: {explore_tabs: []}}
    axios.get.mockReturnValue(new Promise(function(resolve, reject) { resolve(axiosReturnObj) }));
    reverse.lookup.mockReturnValue({city:{split: () => {return ["Vancouver"]}}});
    crimeDataService.getCrimeRate.mockReturnValue(0);

    axios.get.mockReturnValue(new Promise(function(resolve, reject) { reject("Python exception") }));
    await routes.testGetEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315}}, res);
    expect.assertions(2);
    expect(res.message).toBe("Failed to load from Airbnb Microservice");
    expect(res.state).toBe(500);
  })

  it('getListings price filtering', async() => {
    var test1 = {
      id: "1",
      lat: -123.02630548,
      lng: 49.20863951,
      name: "listing 1",
      star_rating: 2.5,
      reviews_count: 10,
      person_capacity: 5,
      picture: {}
    }
    var test2 = {
      id: "2",
      lat: -123.02630548,
      lng: 49.20863951,
      name: "listing 1",
      star_rating: 2.5,
      reviews_count: 10,
      person_capacity: 5,
      picture: {}
    }
    var listingsArr = [
      {listing:test1, 
        pricing_quote:{
        rate:{
          amount:60
        }
      }}, {
        listing:test2,
        pricing_quote:{
          rate:{
            amount:80
          }
        }
      }];
    var tabs = {sections: [{listings: listingsArr}]}
    var axiosReturnObj = {data: {explore_tabs: [tabs]}}
    axios.get.mockReturnValue(new Promise(function(resolve, reject) { resolve(axiosReturnObj) }));
    reverse.lookup.mockReturnValue({city:{split: () => {return ["Vancouver"]}}});

    for(var i = 0; i < 2; i++) {
        crimeDataService.getCrimeRate.mockReturnValueOnce(i);
    }


    expect.assertions(2);
    await routes.testGetEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315, minprice: 60, maxprice: 70}}, res);
    expect(res.message).toBe("{\"Listings\":[{\"id\":\"1\",\"lat\":-123.02630548,\"lng\":49.20863951,\"name\":\"listing 1\",\"star_rating\":2.5,\"reviews_count\":10,\"person_capacity\":5,\"picture\":{},\"pricing_quote\":{\"rate\":{\"amount\":60}},\"safetyIndex\":0}]}");
    expect(res.state).toBe(200);
  })

  it('getListings safety index filtering', async() => {
    var test1 = {
      id: "1",
      lat: -123.02630548,
      lng: 49.20863951,
      name: "listing 1",
      star_rating: 2.5,
      reviews_count: 10,
      person_capacity: 5,
      picture: {}
    }
    var test2 = {
      id: "2",
      lat: -123.02630548,
      lng: 49.20863951,
      name: "listing 1",
      star_rating: 2.5,
      reviews_count: 10,
      person_capacity: 5,
      picture: {}
    }
    var listingsArr = [
      {listing:test1, 
        pricing_quote:{
        rate:{
          amount:60
        }
      }}, {
        listing:test2,
        pricing_quote:{
          rate:{
            amount:80
          }
        }
      }];
    var tabs = {sections: [{listings: listingsArr}]}
    var axiosReturnObj = {data: {explore_tabs: [tabs]}}
    axios.get.mockReturnValue(new Promise(function(resolve, reject) { resolve(axiosReturnObj) }));
    reverse.lookup.mockReturnValue({city:{split: () => {return ["Vancouver"]}}});

    for(var i = 0; i < 2; i++) {
        crimeDataService.getCrimeRate.mockReturnValueOnce(i);
    }

    expect.assertions(2);
    await routes.testGetEndpoint("/getListing", {query: {xmin:-123.27, xmax:-123.02, ymin:49.195, ymax:49.315, minsafety: 0, maxsafety: 4}}, res);
    expect(res.message).toBe("{\"Listings\":[{\"id\":\"1\",\"lat\":-123.02630548,\"lng\":49.20863951,\"name\":\"listing 1\",\"star_rating\":2.5,\"reviews_count\":10,\"person_capacity\":5,\"picture\":{},\"pricing_quote\":{\"rate\":{\"amount\":60}},\"safetyIndex\":0},{\"id\":\"2\",\"lat\":-123.02630548,\"lng\":49.20863951,\"name\":\"listing 1\",\"star_rating\":2.5,\"reviews_count\":10,\"person_capacity\":5,\"picture\":{},\"pricing_quote\":{\"rate\":{\"amount\":80}},\"safetyIndex\":1}]}");
    expect(res.state).toBe(200);
  })
})

describe('Testing Routes GET /favourites', () => {
  it('getListings success', async() => {
    userService.getFavourites.mockReturnValue(new Promise(function(resolve, reject) {resolve({response:"response"})}));
    await routes.testGetEndpoint("/favourites", {query: {userId: "1"}}, res);
    expect.assertions(2);
    expect(res.message).toBe('{"Listings":{\"response\":\"response\"}}');
    expect(res.state).toBe(200);
  })

  it('getListings bad params', async() => {
    userService.getFavourites.mockReturnValue(new Promise(function(resolve, reject) {resolve({response:"response"})}));
    await routes.testGetEndpoint("/favourites", {query: {}}, res);
    expect.assertions(2);
    expect(res.message).toBe("Invalid params");
    expect(res.state).toBe(400);
  })

  it('getListings userservice failure', async() => {
    userService.getFavourites.mockReturnValue(new Promise(function(resolve, reject) {reject("Error from service")}))
    await routes.testGetEndpoint("/favourites", {query: {userId: "1"}}, res);

    expect.assertions(2);
    expect(res.message).toBe("Error while getting airbnbs from favourites!");
    expect(res.state).toBe(500);
  })
})

describe('Testing Routes PUT /favourites', () => {
  it('putListings success', async() => {
    userService.addFavourite.mockReturnValue(new Promise(function(resolve, reject) {resolve()}));
    await routes.testPutEndpoint("/favourites", {body: {userId: "1", airbnbId: "2"}}, res);
    expect.assertions(1);
    expect(res.state).toBe(200);
  })

  it('putListings bad params', async() => {
    userService.addFavourite.mockReturnValue(new Promise(function(resolve, reject) {resolve()}));
    await routes.testPutEndpoint("/favourites", {body: {}}, res);
    expect.assertions(2);
    expect(res.message).toBe("Invalid params");
    expect(res.state).toBe(400);
  })

  it('putListings bad params, no userId', async() => {
    userService.addFavourite.mockReturnValue(new Promise(function(resolve, reject) {resolve()}));
    await routes.testPutEndpoint("/favourites", {body: {airbnbId: "2"}}, res);
    expect.assertions(2);
          expect(res.message).toBe("Invalid params");
    expect(res.state).toBe(400);
  })

  it('putListings bad params, no userId', async() => {
    userService.addFavourite.mockReturnValue(new Promise(function(resolve, reject) {resolve()}));
    await routes.testPutEndpoint("/favourites", {body: {userId: "2"}}, res);
    expect.assertions(2);
    expect(res.message).toBe("Invalid params");
    expect(res.state).toBe(400);
  })


  it('putListings userservice failure', async() => {
    userService.addFavourite.mockReturnValue(new Promise(function(resolve, reject) {reject("Error from service")}))
    await routes.testPutEndpoint("/favourites", {body: {userId: "1", airbnbId: "2"}}, res);

    expect.assertions(2);
    expect(res.message).toBe("Error while adding airbnb to favourites!");
    expect(res.state).toBe(500);
  })
})

describe('Testing Routes DELETE /favourites', () => {
  it('deleteListings success', async() => {
    userService.deleteFavourite.mockReturnValue(new Promise(function(resolve, reject) {resolve()}));
    await routes.testDeleteEndpoint("/favourites", {query: {userId: "1", airbnbId: "2"}}, res);
    expect.assertions(1);
    expect(res.state).toBe(200);
  })

  it('deleteListings bad params', async() => {
    userService.deleteFavourite.mockReturnValue(new Promise(function(resolve, reject) {resolve()}));
    await routes.testDeleteEndpoint("/favourites", {query: {}}, res);
    expect.assertions(2);
    expect(res.message).toBe("Invalid params");
    expect(res.state).toBe(400);
  })

  it('deleteListings bad params, no userId', async() => {
    userService.deleteFavourite.mockReturnValue(new Promise(function(resolve, reject) {resolve()}));
    await routes.testDeleteEndpoint("/favourites", {query: {airbnbId: "2"}}, res);
    expect.assertions(2);
    expect(res.message).toBe("Invalid params");
    expect(res.state).toBe(400);
  })

  it('deleteListings bad params, no userId', async() => {
    userService.deleteFavourite.mockReturnValue(new Promise(function(resolve, reject) {resolve()}));
    await routes.testDeleteEndpoint("/favourites", {query: {userId: "2"}}, res);
    expect.assertions(2);
    expect(res.message).toBe("Invalid params");
    expect(res.state).toBe(400);
  })


  it('deleteListings userservice failure', async() => {
    userService.deleteFavourite.mockReturnValue(new Promise(function(resolve, reject) {reject("Error from service")}))
    await routes.testDeleteEndpoint("/favourites", {query: {userId: "1", airbnbId: "2"}}, res);

    expect.assertions(2);
    expect(res.message).toBe("Error while removing airbnb from favourites!");
    expect(res.state).toBe(500);
  })
})
