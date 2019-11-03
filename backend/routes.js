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
<<<<<<< HEAD
  //console.log("Received home request");
=======
>>>>>>> 1944a2904061d8a5347c33df2d950e6973712927
  res.send("home page");
});

// Look under listings for airbnb posts
// const reverse = require("reverse-geocode"); // For future cities
router.get("/getListing", (req, res) => {
<<<<<<< HEAD
  // res.setHeader("Content-Type", "application/json");
  //console.log("Received request" , req.query);
  var xrange = [Number(req.query["xmin"]), Number(req.query["xmax"])];
  var yrange = [Number(req.query["ymin"]), Number(req.query["ymax"])];
  var coord = [(xrange[0] + xrange[1])/2,(yrange[0] + yrange[1])/2];
  //console.log(coord);
  // mainquery = reverse.lookup(coord[0], coord[1], "ca").city;
  var mainquery = "vancouver";
  //console.log(mainquery);
=======
  // var xrange = [Number(req.query["xmin"]), Number(req.query["xmax"])];
  // var yrange = [Number(req.query["ymin"]), Number(req.query["ymax"])];
  // var coord = [(xrange[0] + xrange[1])/2,(yrange[0] + yrange[1])/2];
  var mainquery = "vancouver";
>>>>>>> 1944a2904061d8a5347c33df2d950e6973712927
  try {
      axios.get(`http://localhost:${pythonport}/${mainquery}`).then((result) => {
      var len = result.data.explore_tabs[0].sections.length;
      var pruned = result.data.explore_tabs[0].sections[len - 1];
<<<<<<< HEAD
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

=======
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
>>>>>>> 1944a2904061d8a5347c33df2d950e6973712927
      // Size of radius to check for crimes
      crimeDataService.getCrimeData(-123.3, -123, 49, 49.5).then((crimes) => {
<<<<<<< HEAD
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
=======
        if(!crimes.length){
          return;
        }
        for(let listing of pruned){
          let convcoord = latlongToUTM(listing.lng, listing.lat);
          let crimecount = crimes.filter((val) => util.filterCrimes(val, convcoord)).length;
          listing.safety_index = crimecount > 2000 ? 0 : Math.floor(10 - crimecount / 200);
        }
        res.status(200).send(JSON.stringify({"Listings" : pruned}));
>>>>>>> 1944a2904061d8a5347c33df2d950e6973712927
      });

    });
  }
  catch(err){
<<<<<<< HEAD
    //console.log(err);
=======
>>>>>>> 1944a2904061d8a5347c33df2d950e6973712927
    res.status(500).send("Failed to load from Airbnb Microservice");
  }
});

// Look under listings for airbnb posts
router.get("/crimes", async (req, res) => {
    crimeDataService.getCrimeData(req.query.xmin, req.query.xmax, req.query.ymin, req.query.ymax, req.query.year)
                    .then((result) => res.status(200).send(JSON.stringify(result)));
});

module.exports = router;
