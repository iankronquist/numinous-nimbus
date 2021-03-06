'use strict'

var searchPackage = require('./search');

module.exports = function(app, res, body) {
  var knex = app.get('knex');
  knex('distros')
    .select('id', 'name')
    .where('name', body.distro)
    .first()
    .then(function(distro) {
      knex('packages').insert({
        name: body.package,
        install_command: body.install_command,
        last_release: body.updated_time,
        distro: distro.id,
        website: body.package_website || '',
      }).then(function(result) {
        return searchPackage(app, res, body.package, distro.name);
      });
    });
}
