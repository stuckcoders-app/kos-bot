/**
 * Created by oluwatobi.okusanya on 14/04/16.
 */

var MongoClient = require('mongodb').MongoClient;
var mongoose = require('mongoose');

var state = {
    db: null,
}

var connect = function(url, done) {
    mongoose.connect(url);

    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        // we're connected!
        done()
    });
};

var get = function() {
    if(state.db) {
        return state.db
    }

};

var close = function(done) {
    if (state.db) {
        state.db.close(function(err, result) {
            state.db = null;
            state.mode = null;
            done(err)
        })
    }
};

module.exports = {
    connect: connect,
    get: get,
    close:close
};




