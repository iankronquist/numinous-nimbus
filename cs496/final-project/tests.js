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
        assert(body.id);
        done();
      }
    );
  });

  it('should not create an exercise if a bad token given', (done) => {
    request_endpoint('/create',
      {'username': 'test', 'auth_token': 'abcd', 'weight': 10, 'time': 20},
      (err, resp, body) => {
        assert(!err);
        assert(resp.statusCode == 501);
        done();
      }
    );
  });


  after((done) => {
    redisClient.hdel('users', 'test', 'test2', done);
  });
});


describe('endpoint /update', () => {

  var auth_token;

  before((done) => {
    redisClient.hdel('users', 'test', 'test2', () => {
      request_endpoint('/signup',
        {'username': 'test', 'password': 'test'},
        (err, resp, body) => {
          assert(!err);
          assert(resp.statusCode == 200);
          this.auth_token = body.key;
          request_endpoint('/create',
            {
              'username': 'test',
              'auth_token': this.auth_token,
              'weight': 10,
              'time': 20
            },
            (err, resp, body) => {
              assert(!err);
              assert(resp.statusCode == 200);
              assert(body.id);
              this.id = body.id;
              done();
            }
          );
        }
      );
    });
  });

  it('should update an exercise', (done) => {
    request_endpoint('/update',
      {
        'username': 'test',
        'auth_token': this.auth_token,
        'id': this.id,
        'weight': 20,
        'time': 30
      },
      (err, resp, body) => {
        assert(!err);
        assert(resp.statusCode == 200);
        request_endpoint('/list',
          {'username': 'test', 'auth_token': this.auth_token},
          (err, resp, body) => {
            assert(!err);
            assert(resp.statusCode === 200);
            assert(body['items'][this.id] === '{"time":30,"weight":20}');
            done();
          }
        );
      }
    );
  });

  it('should not update an exercise if a bad token given', (done) => {
    request_endpoint('/update',
      {'username': 'test', 'auth_token': 'abcd', 'id': 0, 'weight': 10, 'time': 20},
      (err, resp, body) => {
        assert(!err);
        assert(resp.statusCode == 501);
        done();
      }
    );
  });


  after((done) => {
    redisClient.hdel('users', 'test', 'test2', done);
  });
});



describe('endpoint /list', () => {

  before((done) => {
    redisClient.hdel('users', 'test', 'test2', () => {
      redisClient.del('exercise_id_ctr', () => {
        redisClient.del('test:exercises', () => {
          request_endpoint('/signup',
            {'username': 'test', 'password': 'test'},
            (err, resp, body) => {
              assert(!err);
              assert(resp.statusCode == 200);
              this.auth_token = body.key;
              request_endpoint('/create',
                {
                  'username': 'test',
                  'auth_token': this.auth_token,
                  'weight': 1,
                  'time': 2
                },
                (err, resp, body) => {
                  assert(!err);
                  assert(resp.statusCode == 200);
                  request_endpoint('/create',
                    {
                      'username': 'test',
                      'auth_token': this.auth_token,
                      'weight': 2,
                      'time': 4
                    },
                    (err, resp, body) => {
                      assert(!err);
                      assert(resp.statusCode == 200);
                      request_endpoint('/create',
                        {
                          'username': 'test',
                          'auth_token': this.auth_token,
                          'weight': 4,
                          'time': 6
                        },
                        (err, resp, body) => {
                          assert(!err);
                          assert(resp.statusCode == 200);
                          done();
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        });
      });
    });
  });

  it('should list exercises', (done) => {
    request_endpoint('/list',
      {'username': 'test', 'auth_token': this.auth_token},
      (err, resp, body) => {
        assert(!err);
        assert(resp.statusCode === 200);
        assert(body['items'][1] === '{"time":2,"weight":1}');
        assert(body['items'][2] === '{"time":4,"weight":2}');
        assert(body['items'][3] === '{"time":6,"weight":4}');
        done();
      }
    );
  });

  it('should not list exercises if a bad token given', (done) => {
    request_endpoint('/list',
      {'username': 'test', 'auth_token': 'abcd'},
      (err, resp, body) => {
        assert(!err);
        assert(resp.statusCode == 501);
        done();
      }
    );
  });


  after((done) => {
    redisClient.hdel('users', 'test', 'test2', done);
  });
});


describe('endpoint /delete', () => {

  before((done) => {
    redisClient.hdel('users', 'test', 'test2', () => {
      redisClient.del('test:exercises', () => {
        request_endpoint('/signup',
          {'username': 'test', 'password': 'test'},
          (err, resp, body) => {
            assert(!err);
            assert(resp.statusCode == 200);
            this.auth_token = body.key;
            request_endpoint('/create',
              {
                'username': 'test',
                'auth_token': this.auth_token,
                'weight': 1,
                'time': 2
              },
              (err, resp, body) => {
                assert(!err);
                assert(resp.statusCode == 200);

                this.id = body.id;
                done();
              });
          }
        );
      });
    });
  });

  it('should delete an exercise', (done) => {
    request_endpoint('/delete',
      {'username': 'test', 'auth_token': this.auth_token, 'id': this.id },
      (err, resp, body) => {
        assert(!err);
        assert(resp.statusCode == 200);

        request_endpoint('/list',
          {
            'username': 'test',
            'auth_token': this.auth_token
          },
          (err, resp, body) => {
            assert(!err);
            assert(resp.statusCode == 200);
            assert(!body.items);
          }
        );
        done();
      }
    );
  });

  it('should not delete an exercise if a bad token given', (done) => {
    request_endpoint('/delete',
      {
        'username': 'test',
        'id': 0,
        'auth_token': 'abcd',
        'weight': 10,
        'time': 20
      },
      (err, resp, body) => {
        assert(!err);
        assert(resp.statusCode == 501);
        done();
      }
    );
  });


  after((done) => {
    redisClient.hdel('users', 'test', 'test2', done);
  });
});
