/**
 * Created by oluwatobi.okusanya on 14/04/16.
 */
var assert = require('assert');
var config = require('../config');
var db = config.get();

var questions = {
    insertDocument: function(req, res, data) {
        config.get().collection('questions').insertOne(data,
            function(err, result) {
                assert.equal(err, null);
                console.log("Inserted a document into the questions collection.");
                //res.status(200).send({message: "success" + result});
            });
    }
};

module.exports = questions;
