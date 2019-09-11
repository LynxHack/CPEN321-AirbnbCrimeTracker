var express = require('express');
var router = express.Router();

// Data Instance Init
var mongoDB = require('./dbs');
var dbname = 'CrimeTracker'; // Change this to atlas dbname
var uri = 'mongodb://localhost:27017'; // Change this to atlas uri
var db = new mongoDB(uri, dbname);


// Define the home page route
router.get('/', (req, res) => {
  res.send('home page');
});

router.get('/testdb', (req, res) => {
    db.getTest({}).then((res) => {
        res.send(JSON.stringify(res));
    });
});


module.exports = router;
