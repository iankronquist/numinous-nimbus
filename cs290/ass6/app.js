/*jslint node: true */
'use strict';

//   http://access.engr.oregonstate.edu:1776

var express = require('express');
var nunjucks = require('nunjucks');
var bodyParser = require('body-parser');

var app_port = process.env.PORT || 8888;
var app_ip = process.env.IP || '0.0.0.0';
var app = express();

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

nunjucks.configure('views', {
  autoescape: true,
  express: app
});

app.get('/', function(req, res) {
  console.log(req.method, req.params, req.props, req.body);
  return res.render('index.html', {keys:Object.keys,request: req});
});

app.post('/', function (req, res) {
  console.log(req.method, req.params, req.props, req.body);
  return res.render('index.html', {keys:Object.keys,request: req});
});

app.listen(app_port, app_ip, function () {
    console.log('App now listening on %s', app_port);
});

module.exports = app;
