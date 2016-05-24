var express = require('express');
var bodyParser = require('body-parser');
var inspect = require('eyespect').inspector();
var request = require('request');
var assert = require('assert');
var models = require('./models');
var Questions = models.Questions;
var config = require('./config');
var app_data = require('./data');
var app = express();

var token = "CAAI8S9mStGQBAIK1SROK1uxYZA7mIv5mYcoX3ngHwYUCkriu11aRFXsoZAGb3kBAZAOhMTYFhztcBeZBFRoyyXuQZChZATj5CfELeeDZAy5NAcBkGwj01talblSb6IzozFGuIsw4mc74SKZBZBLZBjx8OR8xpduaVkivNjZA6A6dI3YNA9MQZBumsl2dAZByaH5atLQ0ZD";
var db_url = 'mongodb://tobisanya:babapass1!@ds023540.mlab.com:23540/kos-shipping';

// instruct the app to use the `bodyParser()` middleware for all routes
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

function sendGenericMessage(sender,text,data) {

  messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": text,
          "buttons": data
      }
    }
  };
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {access_token:token},
    method: 'POST',
    json: {
      recipient: {id:sender},
      message: messageData,
    }
  }, function(error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });
}

function sendTextMessage(sender, text) {
    messageData = {
        text:text
    }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:token},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
}

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index');
});

app.get('/test-mongo', function(req, res) {

    /*var query = {'user_id': "1111111111"};

    Questions.findOneAndUpdate(query, { "response": 'fisherman' }, {upsert:true}, function(err, doc){
        if (err) return res.send(500, { error: err });
        return res.send("succesfully saved");
    });
*/


});

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
                sendTextMessage(sender, "Just a minute...");

                var postData = {
                    "order_no": "F67544689001",
                    "domain_name": 'kos.ng/track.php'
                }

                var url = 'http://api.mercury.ng/UtilityNonAuth/GetTrackingDetailForOrderNumber'
                var options = {
                    method: 'post',
                    body: postData,
                    url: url
                }
                request(options, function (err, res, body) {
                    if (err) {
                        inspect(err, 'error posting json')
                        return
                    }
                    var headers = res.headers
                    var statusCode = res.statusCode
                    inspect(headers, 'headers')
                    inspect(statusCode, 'statusCode')
                    inspect(body, 'body')
                })

                break;
            case 'STATE_QUESTION':
                //we asked the user what his state is, so this must be an answer to that question
                //check if user's answer is valid, if valid, update db with users response and ask for LGA

                var found = false;


                for(var i in app_data.states) {
                    if(text.toLowerCase() == app_data.states[i].name.toLowerCase()) {
                        found = true;

                        var query = {'user_id': doc.user_id,  question_type:'STATE_QUESTION'};

                        Questions.findOneAndUpdate(query, { "response": app_data.states[i].name, "response_id" : app_data.states[i].id }, {upsert:false, sort: { 'timestamp': -1 }}, function(err, doc){
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

                                sendTextMessage(doc.user_id, "Cool, what Local Government in "+ text +" are you shipping from ?");
                            }

                        });

                        break;
                    }
                }
                if(!found) {
                    sendTextMessage(doc.user_id, "Sorry, we don't ship from "+text);
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
                    for(var i in app_data.states) {

                        if(state.toLowerCase() == app_data.states[i].name.toLowerCase()) {

                            if(app_data.states[i].lgas) {

                                for(var j in app_data.states[i].lgas) {

                                    if(text.toLowerCase() == app_data.states[i].lgas[j].name.toLowerCase()) {

                                        found_lga = true;

                                        var query = {'user_id': sender,  question_type:'LGA_QUESTION'};

                                        Questions.findOneAndUpdate(query, { "response": app_data.states[i].lgas[j].name, "response_id" : app_data.states[i].lgas[j].id }, {upsert:false, sort: { 'timestamp': -1 }}, function(err, doc){
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

                                                sendTextMessage(sender, "Nice, what state are you shipping to? ");
                                            }

                                        });

                                        break dance;
                                    }
                                }
                            }
                        }
                    }
                    if(!found_lga) {
                        sendTextMessage(sender, "Sorry, the LGA "+text+" cannot be found in "+state+" state");
                    }
                });
                break;
            case 'STATE_TWO_QUESTION':

                var found = false;


                for(var i in app_data.states) {
                    if(text.toLowerCase() == app_data.states[i].name.toLowerCase()) {
                        found = true;

                        var query = {'user_id': doc.user_id,  question_type:'STATE_TWO_QUESTION'};

                        Questions.findOneAndUpdate(query, { "response": app_data.states[i].name, "response_id" : app_data.states[i].id  }, {upsert:false, sort: { 'timestamp': -1 }}, function(err, doc){
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

                                sendTextMessage(doc.user_id, "Cool, what Local Government in "+ text +" are you shipping to ?");
                            }

                        });

                        break;
                    }
                }
                if(!found) {
                    sendTextMessage(doc.user_id, "Sorry, we don't ship to "+text);
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
                        for(var i in app_data.states) {

                            if(state.toLowerCase() == app_data.states[i].name.toLowerCase()) {

                                if(app_data.states[i].lgas) {

                                    for(var j in app_data.states[i].lgas) {

                                        if(text.toLowerCase() == app_data.states[i].lgas[j].name.toLowerCase()) {

                                            found_lga = true;

                                            var query = {'user_id': sender,  question_type:'LGA_TWO_QUESTION'};

                                            Questions.findOneAndUpdate(query, { "response": app_data.states[i].lgas[j].name, "response_id" : app_data.states[i].lgas[j].id }, {upsert:false, sort: { 'timestamp': -1 }}, function(err, doc){
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

                                                    sendTextMessage(sender, "You are doing great! Can I know the weight (in KG) of the item you intend to ship");
                                                }

                                            });

                                            break dance;
                                        }
                                    }
                                }
                            }
                        }
                    if(!found_lga) {
                        sendTextMessage(sender, "Sorry, the LGA "+text+" cannot be found in "+state+" state");
                    }
                });
                break;
            case 'WEIGHT_QUESTION':
                //check if weight is a valid float
                var weight = parseFloat(text);

                if(isNaN(text)) {

                    sendTextMessage(doc.user_id, "Please enter a valid weight");

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

                                               sendTextMessage(sender,"Just a minute...");

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
                                                       sendTextMessage(sender,"The shipping price for an item of "+weight+"(kg) between "+state_text+"("+lga_text+") and "+state_2_text+"("+lga_2_text+")"+"is =N="+body.data);
                                                   }
                                                   else if(body.message == "No price bound found"){
                                                       sendTextMessage(sender, "Sorry, We currently don't ship items of "+weight+"(kg) between "+lga_text+"("+state_text+") and "+lga_2_text+"("+state_2_text+")");

                                                   }
                                                   else if(body.message == "No zone mapping found for this LGA"){
                                                       sendTextMessage(sender, "Sorry, We currently don't ship  between "+lga_text+"("+state_text+") and "+lga_2_text+"("+state_2_text+")");

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
                sendTextMessage(doc.user_id, "An error occured? :)");

        }
    });

}

app.get('/webhook/', function (req, res) {

  if (req.query['hub.verify_token'] === 'my_very_own_token') {
    res.send(req.query['hub.challenge']);
  }
  res.send('Error, wrong validation token');
});
app.post('/webhook/', function (req, res) {

  messaging_events = req.body.entry[0].messaging;
  for (i = 0; i < messaging_events.length; i++) {
    event = req.body.entry[0].messaging[i];
    sender = event.sender.id;

    if (event.message && event.message.text) {


        text = event.message.text;

        processText(sender, text);

    }
    else if (event.postback) {

      var postback_text = event.postback.payload;
        switch (postback_text) {

            case "USER_REQUEST_SHIPPING_PRICE" :

                sendTextMessage(sender, "Can I know what state you are shipping from?");

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

                sendTextMessage(sender, "Can I have your order number? :)");

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
                sendTextMessage(doc.user_id, "An error occured? :)");
        }


    }
  }
  res.sendStatus(200);
});


config.connect(db_url, function(err) {
    if (err) {
        console.log('Unable to connect to Mongo.')
        process.exit(1)
    } else {
        app.listen(app.get('port'), function() {
            console.log('Listening on port...', app.get('port'))
        })
    }
})


