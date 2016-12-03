var assert = require('assert');
var request = require('request');
var redis = require('redis');
var redisClient = redis.createClient(process.env.REDIS_URL);

var app_port = process.env.PORT || 8888;
var app_ip = process.env.IP || '0.0.0.0';

function request_endpoint(endpoint, json, cb) {
  var url = 'http://' + app_ip + ':' + app_port + endpoint;
  return request({
    url: url,
    method: "POST",
    json: true,
    headers: {
      "content-type": "application/json",
    },
    body: (json)
  }, cb);
}

describe('endpoint /signup', () => {

  before((done) => {
    redisClient.hdel('users', 'test', 'test2', done);
  });

  it('should create a user with name test', (done) => {
    request_endpoint('/signup',
      {'username': 'test', 'password': 'test'},
      (err, resp, body) => {
        assert(!err);
        assert(resp.statusCode == 200);
        assert(body.key);
        done();
      }
    );
  });

  it('should fail to create a duplicate user with name test', (done) => {
    request_endpoint('/signup',
      {'username': 'test', 'password': 'test'},
      (err, resp, body) => {
        assert(!err);
        assert(resp.statusCode == 400);
        done();
      }
    );
  });

  it('should create a user with name test2', (done) => {
    request_endpoint('/signup',
      {'username': 'test2', 'password': 'test'},
      (err, resp, body) => {
        assert(!err);
        assert(resp.statusCode == 200);
        assert(body.key);
        done();
      }
    );
  });

  after((done) => {
    redisClient.hdel('users', 'test', 'test2', done);
  });
});


describe('endpoint /login', () => {

  before((done) => {
    redisClient.hdel('users', 'test', 'test2', () => {
      request_endpoint('/signup',
        {'username': 'test', 'password': 'test'},
        (err, body, resp) => {
          assert(!err);
          assert(resp.status == 200);
          done();
        }
      );
    });
  });

  it('should return login auth token', (done) => {
    request_endpoint('/login',
      {'username': 'test', 'password': 'test'},
      (err, body, resp) => {
        assert(!err);
        assert(resp.status == 200);
        assert(resp.key);
        done();
      }
    );
  });

  after((done) => {
    redisClient.hdel('users', 'test', 'test2', done);
  });
});

describe('endpoint /create', () => {

  var auth_token;

  before((done) => {
    redisClient.hdel('users', 'test', 'test2', () => {
      request_endpoint('/signup',
        {'username': 'test', 'password': 'test'},
        (err, resp, body) => {
          assert(!err);
          assert(resp.statusCode == 200);
          this.auth_token = body.key;
          done();
        }
      );
    });
  });

  it('should create an exercise', (done) => {
    request_endpoint('/create',
      {'username': 'test', 'auth_token': this.auth_token, 'weight': 10, 'time': 20},
      (err, resp, body) => {
        assert(!err);
        assert(resp.statusCode == 200);
        done();
      }
    );
  });

  after((done) => {
    redisClient.hdel('users', 'test', 'test2', done);
  });
});

