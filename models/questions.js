/**
 * Created by oluwatobi.okusanya on 14/04/16.
 */
var assert = require('assert');
var config = require('../config');

var db = config.get();

var questions = {
    insertDocument: function(data) {
        config.get().collection('questions').insertOne(data,
            function(err, result) {
                assert.equal(err, null);
                console.log("Inserted a document into the questions collection.");
                //res.status(200).send({message: "success" + result});
            });
    },
    getLastMessage: function(sender, text, callback) {

            var sender = parseInt(sender);
            var cursor = config.get().collection('questions').find({"user_id": sender}).sort({'timestamp': -1}).limit(1);


            cursor.each(function (err, doc) {
                assert.equal(err, null);
                if (doc != null) {
                    callback(doc,text)
                } else {
                }
            });
           // res.status(200).send({message: "success"});

    },
    updateMessage: function(sender, question_type,data) {

            var sender = parseInt(sender);
            var cursor = config.get().collection('questions').find({"user_id": sender, "question_type":question_type}).sort({'time': -1}).limit(1);

            cursor.each(function (err, doc) {
                assert.equal(err, null);
                if (doc != null) {

                    config.get().collection('questions').updateOne({
                            "_id" : doc._id,
                            "user_id" : sender,
                            "question_type" : question_type}
                        ,data,
                        function(err, results) {
                        });

                } else {
                }
            });
           // res.status(200).send({message: "success"});

    },
};

module.exports = questions;
