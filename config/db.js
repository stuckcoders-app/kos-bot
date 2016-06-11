/**
 * Created by oluwatobi.okusanya on 14/04/16.
 */
"use strict";

const mongoose = require('mongoose');

let connect = function(url, done) {
    mongoose.connect(url);

    let db = mongoose.connection;
    db.on('error', console.error.bind(console, 'connection error:'));
    db.once('open', function() {
        // we're connected!
        done()
    });
};

module.exports = {
    connect: connect,
};




