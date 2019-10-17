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
router.post('/getListing', (req, res) => {
  try{
    axios.get(`http://localhost:${pythonport}/${req.body.query}`).then((result)=>{
      // get listings via
      // result.data.explore_tabs[0].sections[2].listings[4].listing.lng
      // result.data.explore_tabs[0].sections[2].listings[4].listing.lat
      var numsections = result.data.explore_tabs[0].sections.length
      res.status(200).send(JSON.stringify(result.data.explore_tabs[0].sections[numsections - 1], getCircularReplacer()));
    });
  }
  catch(err){
    console.log(err);
    res.status(500).send('Failed to load from Airbnb Microservice')
  }
})

// Look under listings for airbnb posts
router.get('/crimes', async (req, res) => {
  try{
    crimeDataService.getCrimeData(req.query.xmin, req.query.xmax, req.query.ymin, req.query.ymax, req.query.year)
                    .then(result => res.status(200).send(JSON.stringify(result)));
  }
  catch(err){
    console.log(err);
    res.status(500).send('Failed to load from Airbnb Microservice')
  }
})

module.exports = router;
