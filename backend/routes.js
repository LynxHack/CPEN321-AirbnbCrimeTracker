require('dotenv').config();
var util = require('util');
var express = require('express');
var router = express.Router();
const bodyParser = require("body-parser");

// Middleware
router.use(bodyParser.urlencoded({extended: true}));
router.use(require('method-override')('_method'));

//API Calls
var pythonport = '5000'
var axios = require('axios');

// Data Instance Init
var mongoDB = require('./dbs');
var dbname = 'CrimeTracker'; // Change this to atlas dbname

// Connect local
// var uri = 'mongodb://localhost:27017'; // Change this to atlas uri for production

// // Connect via atlas
var password = process.env.ATLASPASSWORD;
var uri = `mongodb+srv://crimetracker:${password}@crimetracker-ilzwr.mongodb.net/test?retryWrites=true&w=majority`
var db = new mongoDB(uri, dbname);

// Define the home page route
router.get('/', (req, res) => {
  res.send('home page');
});

router.get('/testdb', (req, res) => {
    db.getTest({}).then((result) => {
        res.send(JSON.stringify(result));
    });
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

module.exports = router;
