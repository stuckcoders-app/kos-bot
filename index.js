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


function sendGenericMessage(sender) {
  messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "First card",
          "subtitle": "Element #1 of an hscroll",
          "image_url": "http://messengerdemo.parseapp.com/img/rift.png",
          "buttons": [{
            "type": "web_url",
            "url": "https://www.messenger.com/",
            "title": "Web url"
          }, {
            "type": "postback",
            "title": "Postback",
            "payload": "Payload for first element in a generic bubble",
          }],
        },{
          "title": "Second card",
          "subtitle": "Element #2 of an hscroll",
          "image_url": "http://messengerdemo.parseapp.com/img/gearvr.png",
          "buttons": [{
            "type": "postback",
            "title": "Postback",
            "payload": "Payload for second element in a generic bubble",
          }],
        }]
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

app.get('/test-mongo', function(request, response) {
    var sample_data = {
        "user_id" : 1,
        "question_type" : "1",
        "response" : "Lagos"
    };
    var r = models.questions.insertDocument(request, response, sample_data);
});

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

      if (text === 'Generic') {
        sendGenericMessage(sender);
        continue;
      }
    }
    else if (event.postback) {

      var postback_text = event.postback.payload;
      if (postback_text == "USER_REQUEST_SHIPPING_PRICE") {

        sendTextMessage(sender, "What state are you shipping from?");

          var sample_data = {
              "user_id" : sender,
              "question_type" : "STATE_QUESTION",
              "response" : ""
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


