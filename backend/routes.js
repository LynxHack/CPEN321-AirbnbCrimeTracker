require('dotenv').config();

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

router.post('/getListing', (req, res) => {
  try{
    axios.get(`http://localhost:${pythonport}/${req.body.query}`, (res)=>{
      res.send(done);
      res.status(200).json(res);
    });
  }
  catch(err){
    console.log(err);
    res.status(500).send('Failed to load from Airbnb Microservice')
  }
})

module.exports = router;
