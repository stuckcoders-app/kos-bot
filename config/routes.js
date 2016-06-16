"use strict";

let base =  require('../routes/base');

module.exports = (app) => {
    app.use('/', base);
};
