'use strict'

var searchPackage = require('./search');

module.exports = function(app, res, body) {
  console.log(body);
  var knex = app.get('knex');
  knex('distros')
    .select('id')
    .where('name', body.distro)
    .first()
    .then(function(distro) {
      console.log(distro);
      console.log(body);
      knex('packages').update({
        name: body.package,
        install_command: body.install_command,
        last_release: body.updated_time,
        distro: distro.id,
        website: body.package_website,
      }).where({
        name: body.package,
        distro: distro.id,
      }).then(function(result) {
        console.log(result);
        return searchPackage(app, res, body.package, distro.name);
      });
    });
}
