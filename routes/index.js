var express = require('express');
var router = express.Router();
var request = require('request');


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'APM Portal' });
});
router.get('/index.html', function(req, res, next) {
  res.render('index', { title: 'APM Portal' });
});
// routing for angular templates


module.exports = router;
