require("dotenv").config();
const util = require("./util");
const express = require("express");
const router = new express.Router();
const bodyParser = require("body-parser");
const crimeDataService = require("./CrimeDataService");
const latlongToUTM = require("./latlongToUTM");
// Middleware
router.use(bodyParser.urlencoded({extended: true}));
router.use(require("method-override")("_method"));

//API Calls
const pythonport = "5000";
const axios = require("axios");

// Define the home page route
router.get("/", (req, res) => {
  //console.log("Received home request");
  res.send("home page");
});

// Look under listings for airbnb posts
// const reverse = require("reverse-geocode"); // For future cities
router.get("/getListing", (req, res) => {
  // var xrange = [Number(req.query["xmin"]), Number(req.query["xmax"])];
  // var yrange = [Number(req.query["ymin"]), Number(req.query["ymax"])];
  // var coord = [(xrange[0] + xrange[1])/2,(yrange[0] + yrange[1])/2];
  var mainquery = "vancouver";
  try {
      axios.get(`http://localhost:${pythonport}/${mainquery}`).then((result) => {
      var len = result.data.explore_tabs[0].sections.length;
      var pruned = result.data.explore_tabs[0].sections[len - 1];
      pruned = JSON.parse(JSON.stringify(pruned)).listings.map((x) => {return x.listing;});
      pruned = pruned.map((listing) => {
                    return (({id,
                              lat,
                              lng,
                              name,
                              star_rating,
                              reviews_count,
                              person_capacity,
                              picture}) =>
                              ({id,
                                lat,
                                lng,
                                name,
                                star_rating,
                                reviews_count,
                                person_capacity,
                                picture}))(listing);
                    });
      // Size of radius to check for crimes
      crimeDataService.getCrimeData(-123.3, -123, 49, 49.5).then((crimes) => {
        if(!crimes.length){
          return;
        }
        for(let listing of pruned){
          let convcoord = latlongToUTM(listing.lng, listing.lat);
          let crimecount = crimes.filter((val) => util.filterCrimes(val, convcoord)).length;
          listing.safety_index = crimecount > 2000 ? 0 : Math.floor(10 - crimecount / 200);
        }
        res.status(200).send(JSON.stringify({"Listings" : pruned}));
      });

    });
  }
  catch(err){
    //console.log(err);
    res.status(500).send("Failed to load from Airbnb Microservice");
  }
});

// Look under listings for airbnb posts
router.get("/crimes", async (req, res) => {
    crimeDataService.getCrimeData(req.query.xmin, req.query.xmax, req.query.ymin, req.query.ymax, req.query.year)
                    .then((result) => res.status(200).send(JSON.stringify(result)));
});

module.exports = router;
