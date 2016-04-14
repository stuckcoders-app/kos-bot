/**
 * Created by oluwatobi.okusanya on 14/04/16.
 */
var assert = require('assert');
var mongodb = require('../config');

var questions = {
    insertDocument: function(db, callback) {
        console.log(1)
        mongodb.mongo_connect(function(err, db) {
            assert.equal(null, err);
            db.collection('questions').insertOne( {
                "user_id" : 1,
                "question_type" : "1",
                "response" : "Lagos",
            }, function(err, result) {
                assert.equal(err, null);
                console.log("Inserted a document into the questions collection.");
                callback();
            });
        });
    }
};

module.exports = questions;
