/**
 * Created by oluwatobi.okusanya on 14/04/16.
 */

var mongoose = require('mongoose');

var connect = function(url, done) {
    mongoose.connect(url);

    var db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        // we're connected!
        done()
    });
};

module.exports = {
    connect: connect,
};




