/**
 * Created by oluwatobi.okusanya on 14/04/16.
 */
var assert = require('assert');
var config = require('../config');

var questions = {
    insertDocument: function(req, res, data) {
        var collection = config.get().collection('questions');
        collection.insertOne(data,
            function(err, result) {
                assert.equal(err, null);
                console.log("Inserted a document into the questions collection.");
                config.close(function(e, done){
                });
            });
    }
};

module.exports = questions;
