require('dotenv').config()

const mysql = require('mysql');

var dbName = 'crime_data';
var tableName = 'crime_data';
var fileName = 'crimedata_csv_all_years.csv';

class db {
  constructor() {
    this.con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      port: '3306',
      socketPath: '/var/run/mysqld/mysqld.sock'
    });

    this.con.connect(function(err) {
      if (err) {
        console.log(err + " while connecting to mysql!");
        throw err;
      }
      console.log("Connected to Database!");
    });
  }

  initializeDb() {
    var that = this;
    return that.createDatabase().then(that.createTable());
  }

  createDatabase() {
    var that = this;
    return new Promise(function(resolve, reject) {
      that.con.query("CREATE DATABASE IF NOT EXISTS " + dbName, function(err, result) {
        if (err) {
          console.log(err + " while creating database!");
          reject();
        }
        console.log("Crime data database created");
      });

      that.con.changeUser({
        database: dbName
      }, function(err) {
        if (err) {
          console.log(err + " while changing database!");
          reject();
        }
        console.log("Swapping to crime_data database");
        resolve();
      });
    });
  }

  createTable() {
    var that = this;
    return new Promise(function(resolve, reject) {
      that.con.query("CREATE TABLE IF NOT EXISTS " + tableName + " (type VARCHAR(255), year INT, month INT, day INT, hour INT, minute INT, hundred_block VARCHAR(255), neighbourhood VARCHAR(255), x FLOAT, y FLOAT, id INT AUTO_INCREMENT PRIMARY KEY)", function(err, result) {
        if (err) {
          console.log(err + " while loading table!");
          reject();
        }
        console.log("Crime data table created");
      });

      that.con.query("DELETE FROM " + tableName, function(err, result) {
        if (err) {
          console.log(err + " while loading table!");
          reject();
        }
        console.log("Cleared Crime data table");
        resolve();
      });
    });
  }

  loadTable() {
    var that = this;
    return new Promise(function(resolve, reject) {
      that.con.query("LOAD DATA LOCAL INFILE '" + fileName + "' INTO TABLE crime_data FIELDS TERMINATED BY ',' ENCLOSED BY '\"'", function(err, result) {
        if (err) {
          console.log(err + " while loading crime data into table!");
          reject();
        }
        console.log("Crime data loaded into table");
        resolve();
      });
    });
  }
}

var database = new db();
module.exports = database;
