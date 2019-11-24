require("dotenv").config();

const mysql = require("mysql");
const latlongToUTM = require("./latlongToUTM");

var dbName = "crime_data";
var tableName = "crime_data";
var fileName = "crimedata_csv_all_years.csv";
var favouritesTableName = "userFavourites";
const clear = false;

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
        console.log("Connected to Database!");
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
                  return that.createDatabase()
                })
                .then((value) => {
                  if(clear) {
                    return that.clearTable();
                  }
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
          console.log(err + " while creating database!");
          reject(err);
        }
        console.log("Crime data database created");
        that.con.changeUser({
          database: dbName
        }, function(err) {
          if (err) {
            console.log(err + " while changing database!");
            reject(err);
          }
          console.log("Swapping to crime_data database");
          resolve();
        });
      });
    });
  }

  createTable() {
    var that = this;
    return new Promise(function(resolve, reject) {
      that.con.query("CREATE TABLE IF NOT EXISTS " + tableName + " (type VARCHAR(255), year INT, lat DOUBLE, lng DOUBLE, id INT AUTO_INCREMENT PRIMARY KEY, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)", function(err, result) {
        if (err) {
          console.log(err + " while creating table!");
          reject(err);
        }

        console.log("Crime data table created");
        that.con.query("CREATE TABLE IF NOT EXISTS " + favouritesTableName + " (userId VARCHAR(255) NOT NULL, airbnbId VARCHAR(255) NOT NULL, PRIMARY KEY(userId, airbnbId))", function(err, result) {
          if (err) {
            console.log(err + " while creating favourites table!");
            reject(err);
          }
          console.log("favourites table created");
          resolve();
        });
      });
    });
  }

  loadTable(fileName, tableName, columns) {
    var that = this;
    return new Promise(function(resolve, reject) {
      console.log("Loading Crime data " +  fileName + " into table...");
      console.time("dataLoad");
      that.con.query("LOAD DATA LOCAL INFILE '" + fileName + "' INTO TABLE " + tableName + " FIELDS TERMINATED BY ',' ENCLOSED BY '\"' " + columns , function(err, result) {
        if (err) {
          console.log(err + " while loading crime data into table!");
          console.timeEnd("dataLoad");
          reject(err);
        } else {
          console.log("Crime data " +  fileName + " loaded into table");
          console.timeEnd("dataLoad");
          resolve();
        }
      });
    });
  }

  clearTable() {
    var that = this;
    return new Promise(function(resolve, reject) {
      that.con.query("DROP TABLE IF EXISTS " + tableName, function(err, result) {
        if (err) {
          console.log(err + " while dropping table!");
          reject(err);
        }
        that.con.query("DROP TABLE IF EXISTS " + favouritesTableName, function(err, result) {
          if (err) {
            console.log(err + " while loading table!");
            reject(err);
          }
          console.log("Cleared data tables");
          resolve();
        });
      });
    });
  }

  checkLastUpdate() {
    var that = this;
    return new Promise(function(resolve, reject) {
      that.con.query("SELECT created_at FROM " + tableName + " LIMIT 1", function(err, result) {
        if (err) {
          console.log(err + " getting data from table!");
          reject(err);
        }
        if (result.length == 0) {
          resolve();
        } else {
          resolve(result[0]);
        }
      });
    });
  }

  sendQuery(lngmin, lngmax, latmin, latmax, year) {
    var that = this;
    var params = [lngmin, lngmax, latmin, latmax, year];

    var queryString = "SELECT * FROM " + tableName + " WHERE lng >= ? AND lng <= ? AND lat >= ? AND lat <= ?";
    if (year) {
      queryString += " AND year >= ?";
    }
    return new Promise(function(resolve, reject) {
      that.con.query(queryString, params, function(err, result) {
        if (err) {
          console.log(err + " getting data from table!");
          reject(err);
        }
        resolve(result);
      });
    });
  }

  getAllQuery(where) {
    var that = this;
    var queryString = "SELECT * FROM crime_data";
    if(where) {
      queryString += " WHERE " + where;
    }
    return new Promise(function(resolve, reject) {
      that.con.query(queryString,  function(err, result) {
        if (err) {
          console.log(err + " getting data from table!");
          reject(err);
        }
        // console.log("got results crime " + result)
        resolve(result);
      });
    });
  }

  addFavourite(userId, airbnbId) {
    var that = this;
    var params = [userId, airbnbId];
    var queryString = "INSERT IGNORE INTO " + favouritesTableName + "(userId, airbnbId) VALUES ( ?, ? )";
    return new Promise(function(resolve, reject) {
      that.con.query(queryString, params,  function(err, result) {
        if (err) {
           //console.log(err + " adding favourite to table!");
          reject(err);
        }
        //console.log("added " + userId + " " + airbnbId + " favourite to table!");
        resolve();
      });
    });
  }

  deleteFavourite(userId, airbnbId) {
    var that = this;
    var params = [userId, airbnbId];
    var queryString = "DELETE FROM " + favouritesTableName + " WHERE userId = ? AND airbnbId = ?";
    return new Promise(function(resolve, reject) {
      that.con.query(queryString, params,  function(err, result) {
        if (err) {
           //console.log(err + " deleteing favourite from table!");
          reject(err);
        }
        //console.log("remove " + userId + " " + airbnbId + " favourite from table!");
        resolve();
      });
    });
  }

  getFavourites(userId) {
    var that = this;
    var params = [userId];
    var queryString = "SELECT airbnbId FROM " + favouritesTableName + " WHERE userId = ?";
    return new Promise(function(resolve, reject) {
      that.con.query(queryString, params,  function(err, result) {
        if (err) {
           //console.log(err + " getting favourite data from table!");
          reject(err);
        }
        var retList = result.map((row) => row.airbnbId);

        resolve(retList);
      });
    });
  }
}

var database = new Db();
module.exports = database;
