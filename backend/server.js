require("dotenv").config();

// Express Params
const express = require("express");
const app = express();
const crimeDataService = require("./CrimeDataService");
const PORT = 3000;

var d = new Date();
//console.log("Starting server at " + d.toLocaleString());

crimeDataService.initializeCrimeDataSet().then((result) => {
  console.log("DONE" + result);
});
// crimeDataService.updateCrimeSafety();
// console.log(crimeDataService.crimeRates);
// Routes
app.use(require("./routes"));

app.listen(PORT, () => {
  //console.log(`Server listening on port ${PORT}`);
});
