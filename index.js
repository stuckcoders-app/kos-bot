
"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const assert = require('assert');
const models = require('./models');
const Questions = models.Questions;
const config = require('./config/config');
const db = require('./config/db');
const utils = require('./components/utils');
const data = require('./data');
const app = express();
const router = express.Router();

// instruct the app to use the `bodyParser()` middleware for all routes
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

require('./config/routes.js')(app);

app.get('/test-mongo', function(req, res) {
    /*
        var query = {'user_id': "1111111111"};
        Questions.findOneAndUpdate(query, { "response": 'fisherman' }, {upsert:true}, function(err, doc){
            if (err) return res.send(500, { error: err });
            return res.send("succesfully saved");
        });
    */
});

app.post('/webhook/', function (req, res) {
  var messaging_events = req.body.entry[0].messaging;
  for (i = 0; i < messaging_events.length; i++) {
    event = req.body.entry[0].messaging[i];
    sender = event.sender.id;

    if (event.message && event.message.text) {
        text = event.message.text;
        if(text.substring(0,5).toUpperCase() == 'TRACK') {
            var order_number = text.substring(5,text.length).trim();
            var data = {
                "user_id" : sender,
                "question_type" : "TRACK_QUESTION",
                "response" : "",
                "timestamp" : new Date()
            };
            var question = new Questions(data);
            track(sender,order_number);
        } else {
            processText(sender, text);
        }
    }
    else if (event.postback) {
      var postback_text = event.postback.payload;
        switch (postback_text) {
            case "USER_REQUEST_SHIPPING_PRICE" :
                utils.sendTextMessage(sender, "Can I know what state you are shipping from?");
                var data = {
                    "user_id" : sender,
                    "question_type" : "STATE_QUESTION",
                    "response" : "",
                    "timestamp" : new Date()
                };
                var question = new Questions(data);
                question.save(data);
                break;

            case "USER_TRACK_PACKAGE" :
                utils.sendTextMessage(sender, "Can I have your order number? :)");
                var data = {
                    "user_id" : sender,
                    "question_type" : "TRACK_QUESTION",
                    "response" : "",
                    "timestamp" : new Date()
                };
                var question = new Questions(data);
                question.save(data);
                break;

            default:
                utils.sendTextMessage(doc.user_id, "An error occured? :)");
        }
    }
  }
  res.sendStatus(200);
});

var track = function (sender,text) {
    utils.sendTextMessage(sender, "Just a minute...");
    var postData = {
        "order_no": text,
        "domain_name": 'kos.ng/track.php'
    }
    var url = config.track_url;
    var options = {
        method: 'post',
        body: postData,
        json: true,
        url: url
    }
    request(options, function (err, res, body) {
        if(body.status) {
            if(body.status == 'fail') {
                utils.sendTextMessage(sender, "No tracking Information available yet for "+text+ " :(");
            }
            else if (body.status == 'success') {
                var data = [
                    {
                        "type":"web_url",
                        "url":config.track_info_url+text,
                        "title":"View More Info"
                    }
                ]

                if(body.data.tracking_info) {
                    utils.sendGenericMessage(sender, "Your package's current status: "+body.data.tracking_info+ " :)",data);
                } else if(body.data.packages[text]) {
                    var info = body.data.packages[text].results[0];
                    info = info.status + " " + info.location_name;
                    utils.sendGenericMessage(sender, "Your package's current status: "+info+ " :)",data);
                }
            }
        } else {
            utils.sendTextMessage(doc.user_id, "An error occured? :(");
        }
    });
}

function processText(sender, text) {
    var query =  Questions.
        find({ user_id: sender }).
        limit(1).
        sort('-timestamp').
        exec();

    query.then(function (doc) {
        doc = doc[0];
        switch(doc.question_type) {
            case 'TRACK_QUESTION':
                    track(sender,text);
                break;
            case 'STATE_QUESTION':
                //we asked the user what his state is, so this must be an answer to that question
                //check if user's answer is valid, if valid, update db with users response and ask for LGA

                var found = false;
                for(var i in data.states) {
                    if(text.toLowerCase() == data.states[i].name.toLowerCase()) {
                        found = true;
                        var query = {'user_id': doc.user_id,  question_type:'STATE_QUESTION'};
                        Questions.findOneAndUpdate(query, { "response": data.states[i].name, "response_id" : data.states[i].id }, {upsert:false, sort: { 'timestamp': -1 }}, function(err, doc){
                            if (!err) {
                                var sample_data = {
                                    "user_id" : doc.user_id,
                                    "question_type" : "LGA_QUESTION",
                                    "response" : "",
                                    "response_id" : "",
                                    "timestamp" : new Date()
                                };
                                var gnr = new Questions(sample_data);
                                gnr.save();
                                utils.sendTextMessage(doc.user_id, "Cool, what Local Government in "+ text +" are you shipping from ?");
                            }
                        });
                        break;
                    }
                }
                if(!found) {
                    utils.sendTextMessage(doc.user_id, "Sorry, we don't ship from "+text);
                }

                break;
            case 'LGA_QUESTION':
                //we asked the user what his lga is, so this must be an answer to that question
                //check if user's answer is valid, if valid, update db with users response and ask for second state
                //first get the state answer

                var found_lga = false;
                var query_state =  Questions.
                    find({ user_id: sender, question_type:'STATE_QUESTION' }).
                    limit(1).
                    sort('-timestamp').
                    exec();

                query_state.then(function (doc) {
                    var state = doc[0].response;
                    dance:
                    for(var i in data.states) {
                        if(state.toLowerCase() == data.states[i].name.toLowerCase()) {
                            if(data.states[i].lgas) {
                                for(var j in data.states[i].lgas) {
                                    if(text.toLowerCase() == data.states[i].lgas[j].name.toLowerCase()) {
                                        found_lga = true;
                                        var query = {'user_id': sender,  question_type:'LGA_QUESTION'};
                                        Questions.findOneAndUpdate(query, { "response": data.states[i].lgas[j].name, "response_id" : data.states[i].lgas[j].id }, {upsert:false, sort: { 'timestamp': -1 }}, function(err, doc){
                                            if (!err) {
                                                var sample_data = {
                                                    "user_id" : sender,
                                                    "question_type" : "STATE_TWO_QUESTION",
                                                    "response" : "",
                                                    "response_id" : "",
                                                    "timestamp" : new Date()
                                                };
                                                var gnr = new Questions(sample_data);
                                                gnr.save();
                                                utils.sendTextMessage(sender, "Nice, what state are you shipping to? ");
                                            }
                                        });
                                        break dance;
                                    }
                                }
                            }
                        }
                    }
                    if(!found_lga) {
                        utils.sendTextMessage(sender, "Sorry, the LGA "+text+" cannot be found in "+state+" state");
                    }
                });
                break;
            case 'STATE_TWO_QUESTION':
                var found = false;
                for(var i in data.states) {
                    if(text.toLowerCase() == data.states[i].name.toLowerCase()) {
                        found = true;
                        var query = {'user_id': doc.user_id,  question_type:'STATE_TWO_QUESTION'};
                        Questions.findOneAndUpdate(query, { "response": data.states[i].name, "response_id" : data.states[i].id  }, {upsert:false, sort: { 'timestamp': -1 }}, function(err, doc){
                            if (!err) {
                                var sample_data = {
                                    "user_id" : doc.user_id,
                                    "question_type" : "LGA_TWO_QUESTION",
                                    "response" : "",
                                    "response_id" : "",
                                    "timestamp" : new Date()
                                };
                                var gnr = new Questions(sample_data);
                                gnr.save();
                                utils.sendTextMessage(doc.user_id, "Cool, what Local Government in "+ text +" are you shipping to ?");
                            }
                        });
                        break;
                    }
                }
                if(!found) {
                    utils.sendTextMessage(doc.user_id, "Sorry, we don't ship to "+text);
                }

                break;
            case 'LGA_TWO_QUESTION':
                var found_lga = false;
                var query_state =  Questions.
                    find({ user_id: sender, question_type:'STATE_TWO_QUESTION' }).
                    limit(1).
                    sort('-timestamp').
                    exec();

                query_state.then(function (doc) {
                    var state = doc[0].response;
                    dance:
                        for(var i in data.states) {
                            if(state.toLowerCase() == data.states[i].name.toLowerCase()) {
                                if(data.states[i].lgas) {
                                    for(var j in data.states[i].lgas) {
                                        if(text.toLowerCase() == data.states[i].lgas[j].name.toLowerCase()) {
                                            found_lga = true;
                                            var query = {'user_id': sender,  question_type:'LGA_TWO_QUESTION'};
                                            Questions.findOneAndUpdate(query, { "response": data.states[i].lgas[j].name, "response_id" : data.states[i].lgas[j].id }, {upsert:false, sort: { 'timestamp': -1 }}, function(err, doc){
                                                if (!err) {
                                                    var sample_data = {
                                                        "user_id" : sender,
                                                        "question_type" : "WEIGHT_QUESTION",
                                                        "response" : "",
                                                        "response_id" : "",
                                                        "timestamp" : new Date()
                                                    };
                                                    var gnr = new Questions(sample_data);
                                                    gnr.save();
                                                    utils.sendTextMessage(sender, "You are doing great! Can I know the weight (in KG) of the item you intend to ship");
                                                }
                                            });
                                            break dance;
                                        }
                                    }
                                }
                            }
                        }
                    if(!found_lga) {
                        utils.sendTextMessage(sender, "Sorry, the LGA "+text+" cannot be found in "+state+" state");
                    }
                });
                break;
            case 'WEIGHT_QUESTION':
                //check if weight is a valid float
                var weight = parseFloat(text);
                if(isNaN(text)) {
                    utils.sendTextMessage(doc.user_id, "Please enter a valid weight");
                    return;
                }
                //check that we have all info to fetch shipping fee,
                var state_from, state_text, lga_from, lga_text,  state_to, state_2_text,  lga_to, lga_2_text;
                var result_query_state =  Questions.
                    find({ user_id: sender, question_type:'STATE_QUESTION' }).
                    limit(1).
                    sort('-timestamp').
                    exec();

                result_query_state.then(function (doc) {
                    if(doc[0].response) {
                        state_from = doc[0].response_id;
                        state_text = doc[0].response;

                        var result_query_lga =  Questions.
                            find({ user_id: sender, question_type:'LGA_QUESTION' }).
                            limit(1).
                            sort('-timestamp').
                            exec();

                        result_query_lga.then(function (doc) {
                            if(doc[0].response) {
                                lga_from = doc[0].response_id;
                                lga_text = doc[0].response;

                                var result_query_state_2 =  Questions.
                                    find({ user_id: sender, question_type:'STATE_TWO_QUESTION' }).
                                    limit(1).
                                    sort('-timestamp').
                                    exec();

                                result_query_state_2.then(function (doc) {
                                   if(doc[0].response) {
                                       state_to = doc[0].response_id;
                                       state_2_text = doc[0].response;

                                       var result_query_lga_2 =  Questions.
                                           find({ user_id: sender, question_type:'LGA_TWO_QUESTION' }).
                                           limit(1).
                                           sort('-timestamp').
                                           exec();

                                       result_query_lga_2.then(function (doc) {
                                           if(doc[0].response) {
                                               lga_to = doc[0].response_id;
                                               lga_2_text = doc[0].response;

                                               utils.sendTextMessage(sender,"Just a minute...");

                                               request({
                                                   url: 'http://api.mercury.ng/v3/shipping-prices',
                                                   qs: {from_lga:lga_from,state:state_from,lga:lga_to,client_id:3,weight:weight},
                                                   method: 'GET',
                                               }, function(error, response, body) {

                                                   body = JSON.parse(response.body);
                                                   console.log(body);
                                                   if (error) {
                                                       console.log('Error sending message: ', error);
                                                   } else if (response.body.error) {
                                                       console.log('Error: ', response.body.error);
                                                   }
                                                   else if(body.data) {
                                                       utils.sendTextMessage(sender,"The shipping price for an item of "+weight+"(kg) between "+state_text+"("+lga_text+") and "+state_2_text+"("+lga_2_text+")"+"is =N="+body.data);
                                                   }
                                                   else if(body.message == "No price bound found"){
                                                       utils.sendTextMessage(sender, "Sorry, We currently don't ship items of "+weight+"(kg) between "+lga_text+"("+state_text+") and "+lga_2_text+"("+state_2_text+")");

                                                   }
                                                   else if(body.message == "No zone mapping found for this LGA"){
                                                       utils.sendTextMessage(sender, "Sorry, We currently don't ship  between "+lga_text+"("+state_text+") and "+lga_2_text+"("+state_2_text+")");
                                                   }
                                               });
                                           }
                                       });
                                   }

                                });
                            }
                        });
                    }

                });

                //notify user that we are fetching shipping fee and fetch
                break;

            default:
                utils.sendTextMessage(doc.user_id, "An error occured? :(");
        }
    });

}

db.connect(config.db_url, function(err) {
    if (err) {
        console.log('Unable to connect to Mongo.')
        process.exit(1)
    } else {
        app.listen(app.get('port'), function() {
            console.log('Listening on port...', app.get('port'))
        })
    }
})


