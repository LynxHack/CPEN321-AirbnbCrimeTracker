require('dotenv').config()

const MongoClient = require('mongodb').MongoClient;

class mongoDB{
    constructor(uri, dbName){
        if (!(this instanceof mongoDB)) return new mongoDB(uri, dbName);
	    this.connected = new Promise(function(resolve, reject){
            MongoClient.connect(uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            }, (err, client) => {
                if (err) reject(err);
                else {
                    console.log('[MongoClient] Connected to '+uri+'/'+dbName);
                    resolve(client.db(dbName));
                }
            });
        });
    }

    // Add db queries here
    getTest(query){
        return this.connected.then((db) => {
            return db.collection("test").find(query).toArray();
        })
    }

    putTest(query){
        return this.connected.then((db) => {
            return db.collection("test").insertOne(query);
        })
    }
}

module.exports = mongoDB
