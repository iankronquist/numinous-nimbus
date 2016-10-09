'use strict'

var searchPackage = require('./search');

module.exports = function(app, res, body) {
  var knex = app.get('knex');
  knex('distros')
    .select('id')
    .where('name', body.distro)
    .first()
    .then(function(distro) {
      var update = {
        name: body.package,
        install_command: body.install_command,
        distro: distro.id,
        last_release: body.updated_time,
        website: body.package_website,
      };
      if (body.updated_time == '') {
        update.last_release = 0;
      } else {
        update.last_release = body.updated_time;
      }
      knex('packages').update(update).where({
        name: body.package,
        distro: distro.id,
      }).then(function(result) {
        return searchPackage(app, res, body.package, distro.name);
      });
    });
}
