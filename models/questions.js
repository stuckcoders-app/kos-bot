/**
 * Created by oluwatobi.okusanya on 14/04/16.
 */
"use strict";

const mongoose = require('mongoose');

// Document schema in MongoDB
let QuestionSchema = new mongoose.Schema({
    user_id: Number,
    question_type: String,
    response: String,
    response_id: Number,
    timestamp: Object
});

let Questions = mongoose.model('questions', QuestionSchema);

module.exports = Questions;
