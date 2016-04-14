/**
 * Created by oluwatobi.okusanya on 14/04/16.
 */


var questions = {
    insertDocument: function(db, callback) {
        db.collection('questions').insertOne( {
            "user_id" : 1,
            "question_type" : "1",
            "response" : "Lagos",
        }, function(err, result) {
            assert.equal(err, null);
            console.log("Inserted a document into the questions collection.");
            callback();
        });
    }
};

module.exports = questions;
