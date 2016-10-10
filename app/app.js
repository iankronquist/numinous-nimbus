/*jslint node: true */
'use strict';

var express = require('express');
var nunjucks = require('nunjucks');
var bodyParser = require('body-parser');

var knex = require('knex')({
  client: process.env.CLIENT || 'sqlite3',
  connection: process.env.DATABASE_URL || { filename: 'dev.sqlite3' }
});

var app = express();
var app_port = process.env.PORT || 8888;
var app_ip = process.env.IP || '0.0.0.0';
app.use(express.static(__dirname + '/static'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('knex', knex);

nunjucks.configure('app/views', {
  autoescape: true,
  express: app
});

var searchPackage = require('./search');
var updatePackage = require('./update');
var createPackage = require('./create');

app.get('404', function(req, res) {
  return res.render('404.html');
});

app.get('/', function (req, res) {
  return res.render('index.html');
});

app.post('/', function (req, res) {
  console.log('post');
  return searchPackage(app, res, req.body.package, req.body.distro);
});

app.post('/update', function (req, res) {
  return updatePackage(app, res, req.body);
});

app.post('/create', function (req, res) {
  return createPackage(app, res, req.body);
});



/*
app.get('/:package', function (req, res) {
  return searchPackage(res, req.params.package);
});
*/

app.listen(app_port, app_ip, function () {
    console.log('App now listening on %s', app_port);
});

module.exports = app;
