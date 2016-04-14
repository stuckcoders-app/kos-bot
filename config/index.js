/**
 * Created by oluwatobi.okusanya on 14/04/16.
 */

var url = 'mongodb://tobisanya:babapass1!@ds023540.mlab.com:23540/kos-shipping';
var mongodb = require('mongodb').MongoClient;

var mongo_connect = function () {
    mongodb.connect(url, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
        } else {
            console.log('Connection established to', url);
            return db;

        }
    });
};

module.exports = {
    mongo_connect: mongo_connect
};


