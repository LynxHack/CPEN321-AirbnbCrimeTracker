require("dotenv").config();
var util = require("util");
var express = require("express");
var router = express.Router();
const bodyParser = require("body-parser");
var crimeDataService = require("./CrimeDataService");
const latlongToUTM = require("./latlongToUTM");
// Middleware
router.use(bodyParser.urlencoded({extended: true}));
router.use(require("method-override")("_method"));

//API Calls
var pythonport = "5000";
var axios = require("axios");

// Define the home page route
router.get("/", (req, res) => {
  //console.log("Received home request");
  res.send("home page");
});

// Clean up circular jsons
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return null;
      }
      seen.add(value);
    }
    return value;
  };
};
var getdist = function(x1,y1,x2,y2) {
  return (x1-x2)*(x1-x2) + (y1-y2)*(y1-y2);
};


var filterCrimes = function(val, convcoord) {
  var radiuspreset = 10000;
  return getdist(convcoord[0], convcoord[1], val.x, val.y) < radiuspreset;
};

// Look under listings for airbnb posts
const reverse = require("reverse-geocode");
router.get("/getListing", (req, res) => {
  // res.setHeader("Content-Type", "application/json");
  //console.log("Received request" , req.query);
  var xrange = [Number(req.query["xmin"]), Number(req.query["xmax"])];
  var yrange = [Number(req.query["ymin"]), Number(req.query["ymax"])];
  var coord = [(xrange[0] + xrange[1])/2,(yrange[0] + yrange[1])/2];
  //console.log(coord);
  // mainquery = reverse.lookup(coord[0], coord[1], "ca").city;
  var mainquery = "vancouver";
  //console.log(mainquery);
  try {
      var arr = [];
      axios.get(`http://localhost:${pythonport}/${mainquery}`).then((result) => {
      var len = result.data.explore_tabs[0].sections.length;
      var pruned = result.data.explore_tabs[0].sections[len - 1];
      pruned = JSON.parse(JSON.stringify(pruned, getCircularReplacer()));
      pruned.listings.map((x) => {return x.listing;});
      // //console.log(pruned);
      // Filter certain information and also to cap within certain range from lat and long
      var listingsarr = pruned.listings;
      // //console.log(listingsarr);
      // var arr = []
      // //console.log(listingsarr.length);
      for(let i = 0; i < listingsarr.length; i++){
        var tmp = {};
        tmp["id"] = listingsarr[i].listing.id;
        tmp["lat"] = listingsarr[i].listing.lat;
        tmp["lng"] = listingsarr[i].listing.lng;
        tmp["name"] = listingsarr[i].listing.name;
        tmp["star_rating"] = listingsarr[i].listing.star_rating;
        tmp["reviews_count"] = parseInt(listingsarr[i].listing.reviews_count);
        tmp["person_capacity"] = listingsarr[i].listing.person_capacity;
        tmp["picture"] = listingsarr[i].listing.picture.picture;
        tmp["safety_index"] = 1;
        // //console.log(tmp);
        arr.push(tmp);
      }
      // //console.log("Finished this")
      // arr = arr.filter((x) => {
      //   return x.lat >= xrange[0]
      //       && x.lat <= xrange[1]
      //       && x.lng >= yrange[0]
      //       && x.lng <= yrange[1];
      // })

      // Size of radius to check for crimes

      crimeDataService.getCrimeData(-123.3, -123, 49, 49.5).then((crimes) => {
        // //console.log(crimes);
        if(!crimes.length){
          return;
        }
        //console.log("Finished this crime");
        for(let i = 0; i < arr.length; i++){
          let convcoord = latlongToUTM(arr[i].lng, arr[i].lat);
          let crimecount = crimes.filter((val) => filterCrimes(val, convcoord)).length;
          // //console.log(crimecount);
          if(crimecount < 50){
            arr[i].safety_index = 10;
          }
          else if(crimecount < 100){
            arr[i].safety_index = 9;
          }
          else if(crimecount < 200){
            arr[i].safety_index = 8;
          }
          else if(crimecount < 300){
            arr[i].safety_index = 7;
          }
          else if(crimecount < 600){
            arr[i].safety_index = 6;
          }
          else if(crimecount < 900){
            arr[i].safety_index = 5;
          }
          else if(crimecount < 1200){
            arr[i].safety_index = 4;
          }
          else if(crimecount < 1500){
            arr[i].safety_index = 3;
          }
          else if(crimecount < 1800){
            arr[i].safety_index = 2;
          }
          else if(crimecount < 2000){
            arr[i].safety_index = 1;
          }
          else{
            arr[i].safety_index = 0;
          }
        }
        // //console.log(arr);
        res.status(200).send(JSON.stringify({"Listings" : arr}));
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
