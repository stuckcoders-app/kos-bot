/**
 * Created by oluwatobi.okusanya on 14/04/16.
 */
var assert = require('assert');
var mongoose = require('mongoose');

// Document schema in MongoDB
var QuestionSchema = new mongoose.Schema({
    user_id: Number,
    question_type: String,
    response: String,
    timestamp: Object
});


var Questions = mongoose.model('questions', QuestionSchema);

module.exports = Questions;
