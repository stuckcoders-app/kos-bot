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
    },
    updateDocument:function(query,data) {
        config.get().collection('questions').updateOne(query,data,
               function(err, results) {
                    console.log(results);
                });

    },
    getLastMessage: function(sender, text, callback) {

            var sender = parseInt(sender);
            var cursor = config.get().collection('questions').find({"user_id": sender}).sort({'time': -1}).limit(1);


            cursor.each(function (err, doc) {
                assert.equal(err, null);
                if (doc != null) {
                    callback(doc,text)
                } else {
                }
            });
           // res.status(200).send({message: "success"});

    }
};

module.exports = questions;
