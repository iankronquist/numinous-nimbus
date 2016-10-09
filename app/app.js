/*jslint node: true */
'use strict';

var express = require('express');
var app = express();
var app_port = process.env.PORT || 8888;
var app_ip = process.env.IP || "0.0.0.0";

app.get('/', function (req, res) {
      res.send('Hello class! The time is ' + (new Date) + '\n');
});

app.listen(app_port, app_ip, function () {
    console.log('App now listening on %s', app_port);
});
