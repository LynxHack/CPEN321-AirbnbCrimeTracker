require('dotenv').config();

var express = require('express');
var router = express.Router();


// Data Instance Init
var mongoDB = require('./dbs');
var dbname = 'CrimeTracker'; // Change this to atlas dbname

// Connect local
var uri = 'mongodb://localhost:27017'; // Change this to atlas uri

// // Connect via atlas
// var password = process.env.ATLASPASSWORD;
// var uri = `mongodb+srv://crimetracker:${password}@crimetracker-ilzwr.mongodb.net/test?retryWrites=true&w=majority`

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


module.exports = router;
