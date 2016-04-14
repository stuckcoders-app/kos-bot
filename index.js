var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var assert = require('assert');
var models = require('./models');
var config = require('./config');
var app = express();
var token = "CAAI8S9mStGQBAIK1SROK1uxYZA7mIv5mYcoX3ngHwYUCkriu11aRFXsoZAGb3kBAZAOhMTYFhztcBeZBFRoyyXuQZChZATj5CfELeeDZAy5NAcBkGwj01talblSb6IzozFGuIsw4mc74SKZBZBLZBjx8OR8xpduaVkivNjZA6A6dI3YNA9MQZBumsl2dAZByaH5atLQ0ZD";
var db_url = 'mongodb://tobisanya:babapass1!@ds023540.mlab.com:23540/kos-shipping';

// instruct the app to use the `bodyParser()` middleware for all routes
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

function sendGenericMessage(sender,text,data) {
    console.log(data);
    return;
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
var states = ["lagos", "abuja", "oyo"];

function processMessage(message,text) {
    var type = message.question_type;
    switch(type) {
        case 'STATE_QUESTION':
            //we asked the user what his state is, so this must be an answer to that question
            //check if user's answer is valid, if valid, update db with users response and ask for LGA

            if(states.indexOf(text.toLowerCase()) !== -1) {

                sendTextMessage(message.user_id, "Cool, Kindly select your LGA from the list");
                sendGenericMessage(message.user_id, "Lgas in "+text);

            } else {
                sendTextMessage(message.user_id, "Sorry, we don't ship from "+text);
            }

            break;
        default:
            sendTextMessage(message.user_id, "An error occured? :)");

    }
}
app.get('/test-mongo', function(req, res) {
});

function processText(text) {

    //check if user is replying a previous message
    //get type of last message sent to user
    models.questions.getLastMessage(sender, text, processMessage);

    //if user isn't take an action on 'blank' messages


}

function buildButton(data) {
    var full_data = {
        button: []
    };

    for(var i in data) {

        var state = data[i];

        full_data.button.push({
            "type"      : 'postback',
            "title"     : state.name,
            "payload"   : 'LGA_'+state.id
        });
    }

    return (full_data.button);
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

        processText(text);


      if (text === 'Generic') {
        sendGenericMessage(sender);
        continue;
      }
    }
    else if (event.postback) {

      var postback_text = event.postback.payload;
      if (postback_text == "USER_REQUEST_SHIPPING_PRICE") {

          var button_data;
          request({
              url: 'http://api.mercury.ng/v3/states?per-page=100',
              method: 'GET',
          }, function(error, response, body) {
              if (error) {
                  console.log('Error fetching states: ', error);
              } else if (response.body.error) {
                  console.log('Error: ', response.body.error);
              }
             button_data =  buildButton(response.data);
              sendGenericMessage(sender, "Kindly select your state from the list",button_data);
          });

          var sample_data = {
              "user_id" : sender,
              "question_type" : "STATE_QUESTION",
              "response" : "",
              "timestamp" : new Date()
          };
          models.questions.insertDocument(req, res, sample_data);


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


