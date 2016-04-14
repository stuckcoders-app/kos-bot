/**
 * Created by oluwatobi.okusanya on 14/04/16.
 */

var MongoClient = require('mongodb').MongoClient;

var state = {
    db: null,
}

var connect = function(url, done) {
    if (state.db) return done();

    MongoClient.connect(url, function(err, db) {
        if (err) return done(err);
        state.db = db;
        done()
    })
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




