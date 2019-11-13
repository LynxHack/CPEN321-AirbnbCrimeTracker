require("dotenv").config();

const mysql = require("mysql");
const latlongToUTM = require("./latlongToUTM");

var dbName = "crime_data";
var tableName = "crime_data";
var fileName = "crimedata_csv_all_years.csv";

var dbConfig = {
  host: "localhost",
  user: "root",
  password: "password",
  port: "3306"
};

class Db {
  connectToDb() {
    var that = this;
    return new Promise(function(resolve, reject) {
      that.con = mysql.createConnection(dbConfig);

      that.con.connect(function(err) {
        if (err) {
          //console.log(err + " while connecting to mysql!");
          reject(err);
        }
        //console.log("Connected to Database!");
        resolve();
      });

      that.con.on("error", function(err) {
          reject(err);
      });
    });
  }

  initializeDb() {
    var that = this;
    return that.connectToDb()
                .then((value) => {
                  return that.createDatabase();
                })
                .then((value) => {
                  return that.createTable();
                })
                .catch((error) => {
                  throw error;
                });
  }

  createDatabase() {
    var that = this;
    return new Promise(function(resolve, reject) {

      that.con.query("CREATE DATABASE IF NOT EXISTS " + dbName, function(err, result) {
        if (err) {
          //console.log(err + " while creating database!");
          reject(err);
        }
        //console.log("Crime data database created");
        that.con.changeUser({
          database: dbName
        }, function(err) {
          if (err) {
            //console.log(err + " while changing database!");
            reject(err);
          }
          //console.log("Swapping to crime_data database");
          resolve();
        });
      });
    });
  }

  createTable() {
    var that = this;
    return new Promise(function(resolve, reject) {
      that.con.query("CREATE TABLE IF NOT EXISTS " + tableName + " (type VARCHAR(255), year INT, month INT, day INT, hour INT, minute INT, hundred_block VARCHAR(255), neighbourhood VARCHAR(255), x FLOAT, y FLOAT, id INT AUTO_INCREMENT PRIMARY KEY, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)", function(err, result) {
        if (err) {
          //console.log(err + " while loading table!");
          reject(err);
        }
        //console.log("Crime data table created");
        resolve();
      });
    });
  }

  loadTable() {
    var that = this;
    return new Promise(function(resolve, reject) {
      //console.log("Loading Crime data into table...");
      // console.time("dataLoad");
      that.con.query("LOAD DATA LOCAL INFILE '" + fileName + "' INTO TABLE crime_data FIELDS TERMINATED BY ',' ENCLOSED BY '\"'", function(err, result) {
        if (err) {
          //console.log(err + " while loading crime data into table!");
          // console.timeEnd("dataLoad");
          reject(err);
        } else {
          //console.log("Crime data loaded into table");
          // console.timeEnd("dataLoad");
          resolve();
        }
      });
    });
  }

  clearTable() {
    var that = this;
    return new Promise(function(resolve, reject) {
      that.con.query("DELETE FROM " + tableName, function(err, result) {
        if (err) {
          //console.log(err + " while loading table!");
          reject(err);
        }
        //console.log("Cleared Crime data table");
        resolve();
      });
    });
  }

  checkLastUpdate() {
    var that = this;
    return new Promise(function(resolve, reject) {
      that.con.query("SELECT created_at FROM " + tableName + " LIMIT 1", function(err, result) {
        if (err) {
          //console.log(err + " getting data from table!");
          reject(err);
        }
        if (result.length == 0) {
          reject("No results found");
        } else {
          resolve(result[0]);
        }
      });
    });
  }

  sendQuery(xmin, xmax, ymin, ymax, year) {
    var that = this;
    var mins = latlongToUTM(xmin, ymin);
    var maxs = latlongToUTM(xmax, ymax);
    //console.log("querying between " + mins[0] + " " + maxs[0] + " and " + mins[1] + " " + maxs[1]);
    var params = [mins[0], maxs[0], mins[1], maxs[1], year];

    var queryString = "SELECT type, year, x, y FROM " + tableName + " WHERE x >= ? AND x <= ? AND y >= ? AND y <= ?";
    if (year) {
      queryString += " AND year >= ?";
    }
    return new Promise(function(resolve, reject) {
      that.con.query(queryString, params, function(err, result) {
        if (err) {
          //console.log(err + " getting data from table!");
          reject(err);
        }
        resolve(result);
      });
    });
  }

  getAllQuery() {
    var that = this;
    var queryString = "SELECT * FROM " + tableName;
    return new Promise(function(resolve, reject) {
      that.con.query(queryString,  function(err, result) {
        if (err) {
          // console.log(err + " getting data from table!");
          reject(err);
        }
        // console.log("got results crime " + result)
        resolve(result);
      });
    });
  }
}

var database = new Db();
module.exports = database;
