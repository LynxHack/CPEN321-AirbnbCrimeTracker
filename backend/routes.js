require('dotenv').config();
var util = require('util');
var express = require('express');
var router = express.Router();
const bodyParser = require("body-parser");
var crimeDataService = require('./CrimeDataService');

// Middleware
router.use(bodyParser.urlencoded({extended: true}));
router.use(require('method-override')('_method'));

//API Calls
var pythonport = '5000'
var axios = require('axios');

// Define the home page route
router.get('/', (req, res) => {
  res.send('home page');
});

// Clean up circular jsons
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

// Look under listings for airbnb posts
const reverse = require('reverse-geocode')
router.post('/getListing', (req, res) => {
  try{
      var xrange = [Number(req.body['xmin']), Number(req.body['xmax'])];
      var yrange = [Number(req.body['ymin']), Number(req.body['ymax'])];
      var coord = [(xrange[0] + xrange[1])/2,(yrange[0] + yrange[1])/2];
      mainquery = reverse.lookup(coord[0], coord[1], 'ca').city;
      axios.get(`http://localhost:${pythonport}/${mainquery}`).then((result)=>{

      var len = result.data.explore_tabs[0].sections.length
      var pruned = result.data.explore_tabs[0].sections[len - 1];
      pruned = JSON.parse(JSON.stringify(pruned, getCircularReplacer()))
      pruned.listings.map((x) => {return x.listing});
      
      // Filter certain information and also to cap within certain range from lat and long
      var listingsarr = pruned.listings;

      var arr = []
      console.log(listingsarr.length);
      for(let i = 0; i < listingsarr.length; i++){
        var tmp = {};
        tmp["id"] = listingsarr[i].listing.id;
        tmp["lat"] = listingsarr[i].listing.lat;
        tmp["lng"] = listingsarr[i].listing.lng;
        tmp["name"] = listingsarr[i].listing.name;
        tmp["star_rating"] = listingsarr[i].listing.star_rating;
        tmp["reviews_count"] =listingsarr[i].listing.reviews_count;
        tmp["person_capacity"] = listingsarr[i].listing.person_capacity;
        tmp["picture"] = listingsarr[i].listing.picture.picture;
        tmp["safety_index"] = Math.round(Math.random() * 10); //temporary
        arr.push(tmp);
      }

      arr = arr.filter((x) => {
        return x.lat >= xrange[0] 
            && x.lat <= xrange[1] 
            && x.lng >= yrange[0] 
            && x.lng <= yrange[1];
      })

      res.status(200).send(JSON.stringify({'listings': arr}));
    });
  }
  catch(err){
    console.log(err);
    res.status(500).send('Failed to load from Airbnb Microservice');
  }
})

module.exports = router;
