var request = require('supertest');
var app = require('../app/app');

describe('Package creation', function() {
  it('should serve html from /', function(done) {
    request(app)
      .get('/').expect('content-type', /html/)
      .expect(200)
      .end(function(err, res) {
        if (err) throw err;
        done();
      });
  });

  it('should not serve html from /create', function(done) {
    request(app)
      .get('/create')
      .expect(404)
      .end(function(err, res) {
        if (err) throw err;
        done()
      });
  });

  it('should not serve html from /update', function(done) {
    request(app)
      .get('/update')
      .expect(404)
      .end(function(err, res) {
        if (err) throw err;
        done()
      });
  });

  it('should create an object if I post to /create', function() {
    request(app)
      .post('/create')
      .type('form')
      .send('package', 'foobar')
      .send('install_command', '')
      .send('distro', 'ubuntu')
      .send('package_website', 'https://github.com')
      .end(function(err, res) {
        if (err) throw err;
      });
  });

  it('should update an object if I post to /update', function() {
    request(app)
      .post('/update')
      .type('form')
      .send('package', 'foobar')
      .send('install_command', '')
      .send('distro', 'arch')
      .send('updated_time', 0)
      .send('package_website', 'https://github.com')
      .end(function(err, res) {
        if (err) throw err;
      });
  });

  it('should show the new package when I request it', function(done) {
    request(app)
      .post('/')
      .type('form')
      .send('package', 'foobar')
      .send('install_command', '')
      .send('distro', 'ubuntu')
      .expect('content-type', /html/)
      .expect(200)
      .end(function(err, res) {
        if (!res.text.match(/foobar/)) throw res.text
        if (err) throw err;
        done()
      });
  });

  it('should create an object if I post to /create', function() {
    request(app)
      .post('/create')
      .type('form')
      .send('package', 'foo')
      .send('distro', 'ubuntu')
      .end(function(err, res) {
        if (err) throw err;
      });
  });

  it('should show the new package when I request it', function(done) {
    request(app)
      .post('/')
      .type('form')
      .send('package', 'foo')
      .send('distro', 'ubuntu')
      .send('package_website', 'https://github.com')
      .expect('content-type', /html/)
      .expect(200)
      .end(function(err, res) {
        if (!res.text.match(/foo/)) throw res.text
        if (err) throw err;
        done()
      });
  });


  it('should create an object if I post to /create', function() {
    request(app)
      .post('/create')
      .type('form')
      .send('package', 'baz')
      .send('distro', 'ubuntu')
      .send('package_website', 'https://github.com')
      .end(function(err, res) {
        if (err) throw err;
      });
  });


  it('should show the new package when I request it', function(done) {
    request(app)
      .post('/')
      .type('form')
      .send('package', 'baz')
      .send('distro', 'ubuntu')
      .expect('content-type', /html/)
      .expect(200)
      .end(function(err, res) {
        if (!res.text.match(/baz/)) throw res.text
        if (err) throw err;
        done()
      });
  });


});

