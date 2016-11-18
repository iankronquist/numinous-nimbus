'use strict';

// First, import the libraries we'll be using.
var express = require('express');
var nunjucks = require('nunjucks');
var bodyParser = require('body-parser');
var request = require('request');

// Next, get the application's port and IP address from environment variables.
var app_port = process.env.PORT || 8888;
var app_ip = process.env.IP || '0.0.0.0';

// For this how-to we'll be hard-coding the Imgur & dropbox API OAuth key, secret, and access token.
var dropbox_secret = '1cl1sajsenyfiz7';
var dropbox_key = 'rn7wvvbi1tb5ap2';
var dropbox_token = 'VisxM_7dpZAAAAAAAAAAB7UlLlPIGBIPSIMe4ySYmlOWJgj0CYG4PcwVWiaiTie1';

var imgur_key = 'e4d31dbb14e259fa15db0878bb1ae5def4075fb0';
var imgur_client_id = '669c016e544468d';

// Next, instantiate the express application object.
var app = express();

// Configure the bodyparser to accept JSON and URL encoded data.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure nunjucks to use the views directory and the express app.
nunjucks.configure('views', {
  autoescape: true,
  express: app
});

function searchPhotos(type, cb) {
  return request({
    url: 'https://api.dropboxapi.com/2/files/search',
    method: 'POST',
    json: {
      path: '',
      query: type,
    },
    headers: {
      'Authorization': 'Bearer ' + dropbox_token,
      'Content-Type': 'application/json',
    },
  }, cb);
}

function downloadPhoto(path, cb) {
  return request({
    url: 'https://content.dropboxapi.com/2/files/download',
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + dropbox_token,
      'Dropbox-API-Arg': JSON.stringify({ path: path }),
    },
  }, cb);
}

function postPhoto(contents, cb) {
  var buf = new Buffer(contents.body, 'binary').toString('base64');
  //console.log(contents.body.slice(100));
  var post = request.post({
    url: 'https://api.imgur.com/3/upload.json',
    //data: { type: 'base64', image: buf },
    form: { type: 'base64', image: contents.body },
    headers: {
      'Authorization': 'Client-ID ' + imgur_client_id,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': buf.length,
    },
  }, cb);
}

// Create the root GET endpoint
app.get('/', function(req, res) {
  if (req.query.path) {
    return downloadPhoto('/' + req.query.path, function(err, dropbox_res, dropbox_file) {
      var fs = require('fs');
      console.log(dropbox_res.body.length, typeof(dropbox_res.body));
      fs.writeFile('./test.png', dropbox_res.body);
      if (err) throw err;
      return postPhoto(dropbox_res, function(err, imgur_res, body, c) {
        //console.log(body, err, Object.keys(imgur_res), imgur_res.statusCode);
        if (err) throw err;
        return searchPhotos('.png', function(err, dropbox_res, body) {
          if (err) {
            throw err;
          }
          return res.render('index.html', body);
        });
      });
    });
  }
  return searchPhotos('.png', function(err, drop_box_res, body) {
    if (err) {
      throw err;
    }
    return res.render('index.html', body);
  });
});

// Start listening on the port and IP.
app.listen(app_port, app_ip, function () {
  console.log('App now listening on http://%s:%s', app_ip, app_port);
});
