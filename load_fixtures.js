'use strict'

var sqlFixtures = require('sql-fixtures');
var knexfile = require('./knexfile');

var testData = require('./fixtures.json');
var env = process.env.NODE_ENV || 'development';


sqlFixtures.create(knexfile[env], testData).then(function(arg) {
  console.log(arg);
  process.exit(0);
});
