'use strict'


module.exports = function(app, res, package_name, distro) {
  console.log(knex);
  var knex = app.get('knex');

  knex.select('*')
    .from('packages')
    .join('distros', 'distros.id', 'packages.distro')
    .where('packages.name', package_name)
    .then(function(packages) {
      console.log('packages', packages, package_name, distro);
      if (packages.length == 0) {
        return res.render('index.html', {
          package_name: package_name,
          distro: distro,
          not_found: true
        });
      } else {
        for (var i = 0; i < packages.length; i++) {
          if (packages[i].install_command == '') {
            packages[i].install_command = packages[i].default_install_command + package_name;
          }
        }
        return res.render('package.html', {
          packages: packages,
          package_name: package_name,
        });
      }
    });
}
