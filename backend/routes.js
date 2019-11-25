require("dotenv").config();
// const util = require("./util");
const express = require("express");
const router = new express.Router();
const bodyParser = require("body-parser");
const crimeDataService = require("./CrimeDataService");
const userService = require("./UserService");

// Middleware
router.use(bodyParser.urlencoded({extended: true}));
router.use(require("method-override")("_method"));

//API Calls
const pythonport = "5000";
const axios = require("axios");

// Other Dependencies
const reverse = require("reverse-geocode"); // For future cities

// Look under listings for airbnb posts
router.get("/getListing", (req, res) => {
  var xrange = [Number(req.query["xmin"]), Number(req.query["xmax"])];
  var yrange = [Number(req.query["ymin"]), Number(req.query["ymax"])];
  var startdate = req.query["startdate"];
  var enddate = req.query["enddate"];
  var minprice = Number(req.query["minprice"]);
  var maxprice = Number(req.query["maxprice"]);
  var minsafety = Number(req.query["minsafety"]);
  var maxsafety = Number(req.query["maxsafety"]);

  var coord = [(yrange[0] + yrange[1])/2,(xrange[0] + xrange[1])/2];
  var mainquery = reverse.lookup(coord[0], coord[1], "ca").city.split(" ")[0];
  mainquery = 'Vancouver';
  return axios.get(`http://localhost:${pythonport}/airbnb`, {
    params:{
      location: mainquery,
      startdate: startdate,
      enddate: enddate
    }
  }).then((result) => {
    var pruned = result.data.explore_tabs[0].sections.pop();
    pruned = JSON.parse(JSON.stringify(pruned)).listings.map((x) => {
      // console.log(x);
      x.listing['pricing_quote'] = x.pricing_quote;
      return x.listing;
    });
    pruned = pruned.map((listing) => {
                  return (({id, lat, lng, name, star_rating, reviews_count, person_capacity, picture, pricing_quote}) =>
                            ({id, lat, lng, name, star_rating, reviews_count, person_capacity, picture, pricing_quote}))(listing);
                  });

    // console.log(pruned);

    // Size of radius to check for crimes
    for(let listing of pruned){
      listing.safetyIndex = crimeDataService.getCrimeRate(listing.lat, listing.lng);
    }

    // Filter by price and min and max safety_index
    if(minprice || maxprice || minsafety || maxsafety){
      minprice = minprice ? minprice : 0;
      maxprice = maxprice ? maxprice : Number.MAX_SAFE_INTEGER;
      minsafety = minsafety ? minsafety : 0;
      maxsafety = maxsafety ? maxsafety : Number.MAX_SAFE_INTEGER;
      pruned = pruned.filter((x) => {return x.pricing_quote.rate.amount >= minprice 
                                         && x.pricing_quote.rate.amount <= maxprice
                                         && x.safetyIndex >= minsafety
                                         && x.safetyIndex <= maxsafety});
    }

    res.status(200).send(JSON.stringify({"Listings" : pruned}));
  }).catch((error) => {
    // console.log(error);
    res.status(500).send("Failed to load from Airbnb Microservice");
  });
});

router.put("/favourites", (req, res) => {
  var userId = req.body.userId;
  var airbnbId = req.body.airbnbId;
    if (!userId || !airbnbId) {
      res.status(400).send("Invalid params");
      return;
    }

    return userService.addFavourite(userId, airbnbId)
    .then(res.status(200).send(JSON.stringify({"message":"Ok"})))
    .catch((error) => {
      res.status(500).send("Error while adding airbnb to favourites!");
    });
});

router.delete("/favourites", (req, res) => {
  var userId = req.query["userId"];
  var airbnbId = req.query["airbnbId"];
    if (!userId || !airbnbId) {
      res.status(400).send("Invalid params");
      return;
    }

    return userService.deleteFavourite(userId, airbnbId)
    .then(res.status(200).send(JSON.stringify({"message":"Ok"})))
    .catch((error) => {
      res.status(500).send("Error while removing airbnb from favourites!");
    });
});

router.get("/favourites", (req, res) => {
  var userId = req.query["userId"];
    if (!userId) {
      res.status(400).send("Invalid params");
      return;
    }

    return userService.getFavourites(userId)
    .then((result) => res.status(200).send(JSON.stringify({"Listings" : result})))
    .catch((error) => {
      res.status(500).send("Error while getting airbnbs from favourites!");
    });
});

// // Look under listings for airbnb posts
// router.get("/crimes", async (req, res) => {
//     crimeDataService.getCrimeData(req.query.xmin, req.query.xmax, req.query.ymin, req.query.ymax, req.query.year)
//                     .then((result) => res.status(200).send(JSON.stringify(result)));
// });

module.exports = router;
