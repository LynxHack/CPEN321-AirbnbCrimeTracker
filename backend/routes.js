require('dotenv').config();

var express = require('express');
var router = express.Router();
var crimeDataService = require('./CrimeDataService');

// Define the home page route
router.get('/', (req, res) => {
  res.send('home page');
});

// router.get('/testdb', (req, res) => {
//     db.getTest({}).then((result) => {
//         res.send(JSON.stringify(result));
//     });
// });


module.exports = router;
