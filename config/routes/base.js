var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
	res.render('pages/index');
});

router.get('/webhook/', function (req, res) {
  if (req.query['hub.verify_token'] === 'my_very_own_token') {
    res.send(req.query['hub.challenge']);
  }
  res.send('Error, wrong validation token');
});

module.exports = router;