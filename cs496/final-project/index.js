'use strict';

var crypto = require('crypto');
var express = require('express');
var redis = require('redis');
var bodyParser = require('body-parser');
var bluebird = require('bluebird');

var app = express();
var redisClient = redis.createClient(process.env.REDIS_URL);
bluebird.promisifyAll(redis.RedisClient.prototype);

var app_port = process.env.PORT || 8888;
var app_ip = process.env.IP || '0.0.0.0';

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

function error_builder(message, code) {
  return {'error': message, 'status': code };
}

function message_builder(message, code, key) {
  return {'message': message, 'key': key, 'status': code };
}

function validate_params(body, login_required) {
  if (!body['username']) {
    return error_builder('no username provided', 400);
  } else if (typeof(body['username']) !== 'string') {
    return error_builder('username must be string', 400);
  }
  if (login_required) {
    if (login_required && !body['auth_token']) {
      return error_builder('no auth_token provided', 400);
    } else if (login_required && typeof(body['auth_token']) !== 'string') {
      return error_builder('auth_token must be string', 400);
    }
  } else {
    if (!body['password']) {
      return error_builder('no password provided', 400);
    } else if (typeof(body['password']) !== 'string') {
      return error_builder('password must be string', 400);
    }
  }
  return null;
}

function generate_unique_exercise_id(cb) {
  redisClient.incr('exercise_id_ctr', (err, id) => {
    cb(err, id);
  });
}

// FIXME: Add salt.
function generate_password(password) {
  return crypto.createHmac('sha256', 'secret').update(password).digest('hex');
}

function generate_auth_token() {
  return crypto.randomBytes(32).toString('hex');
}

function authorize_user(username, supplied_token, cb) {
  redisClient.hget('logins',
    username,
    (auth_token) => {
      cb(auth_token === supplied_token);
    }
  );
}

function validate_exercise(body) {
  if (!body['time']) {
    return message_builder('time required', 400);
  } else if (!body['weight']) {
    return message_builder('weight required', 400);
  }
  return null;
}

app.post('/create', function(req, res) {
  var err = validate_params(req.body, true);
  if (err != null) {
    res.statusCode = err.status;
    return res.json(err);
  }

  var err = validate_exercise(req.body);
  if (err != null) {
    res.statusCode = err.status;
    return res.json(err);
  }

  generate_unique_exercise_id((err, id) => {
    if (err != null) {
      res.statusCode = 500
      return res.json(message_builder('database error', res.statusCode));
    }
    var member = {
      time: req.body['time'],
      exercises: req.body['exercises']
    };
    redisClient.hset(req.body['username'] + ':exercises',
      id,
      JSON.stringify(member),
      (err, resp) => {
        if (err) {
          res.statusCode = 500;
          return res.json(error_builder('database error', res.statusCode));
        } else {
          return res.json(message_builder('successfully added', 200));
        }
      });
  });
});


app.post('/login', function(req, res) {
  var err = validate_params(req.body);
  if (err != null) {
    res.statusCode = err.status;
    return res.json(err);
  }
  redisClient.hget('users',
    req.body['username'],
    (err, password) => {
      var got = generate_password(req.body['password']);
      if (got !== password) {
        res.statusCode = 501;
        return res.json(error_builder('invalid password',res.statusCode));
      } else {
        var login = generate_auth_token();
        redisClient.hset('logins', req.body['username'], login);
        return res.json(message_builder('successfully logged in', 200, login));
      }
    }
  );
});

app.post('/signup', function(req, res) {
  var err = validate_params(req.body);
  if (err != null) {
    res.statusCode = err.status;
    return res.json(err);
  }
  redisClient.hget('users',
    req.body['username'],
    (err, username) => {
      if (username) {
        res.statusCode = 400;
        return res.json(error_builder('username already taken', res.statusCode));
      }
      var success = redisClient.hset('users',
        req.body['username'],
        generate_password(req.body['password']),
        (result) => { });
      if (success) {
        var login = generate_auth_token();
        redisClient.hset('logins', req.body['username'], login);
        return res.json(message_builder('successfully created account', 200, login));
      } else {
        res.statusCode = 500;
        return res.json(error_builder('database error', res.statusCode));
      }
    });
});

app.listen(app_port, app_ip, function() {
  console.log('Now listening on http://%s:%s', app_ip, app_port);
});

module.exports = app;
