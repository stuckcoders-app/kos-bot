/**
 * Created by oluwatobi.okusanya on 14/04/16.
 */
var assert = require('assert');
var config = require('../config');

var questions = {
    insertDocument: function() {
        var collection = config.get().collection('questions');
        collection.insertOne({
            "user_id" : 1,
            "question_type" : "1",
            "response" : "Lagos"
        },
        function(err, result) {
            assert.equal(err, null);
            console.log("Inserted a document into the questions collection.");
            callback();
        });
        config.get().close();
    }
};

module.exports = questions;
