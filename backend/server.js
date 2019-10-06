require('dotenv').config();

// Express Params
const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const db = require('./dbs');
const crimeDataService = require('./CrimeDataService');
// var methodOverride = require('method-override')

var d = new Date();
console.log("Starting server at " + d.toLocaleString());

db.initializeDb().then(crimeDataService.initializeCrimeDataSet());

// Middleware
app.use(bodyParser.urlencoded({extended: true}));
app.use(require('method-override')('_method'));

// Routes
app.use(require('./routes'));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
