var session = require('express-session');
var express = require('express');

var app = express();

var app_port = process.env.PORT || 8888;

var app_ip = process.env.IP || '0.0.0.0';

app.use(session({secret:'SuperSecretPassword'}));
app.get('/count',function(req,res){
  var context = {};
  context.count = req.session.count || 0;
  req.session.count = context.count + 1;
  //res.render('counter', context);
  res.send(JSON.stringify(context));
});

app.listen(app_port, app_ip, function () {
    console.log('App now listening on %s', app_port);
});
