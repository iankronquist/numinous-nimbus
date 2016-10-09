'use strict'

exports.up = function(knex, Promise) {
  return knex.schema.createTable('distros', function(table) {
    table.integer('id').primary();
    table.string('name').unique();
    table.string('default_install_command');
  }).createTable('packages', function(table) {
    table.integer('id').primary();
    table.integer('distro').references('id').inTable('distros');
    table.string('website');
    table.string('name');
    table.string('install_command');
    table.bigInteger('last_release');
  }).createTable('programs', function(table) {
    table.integer('id').primary();
    table.integer('package_id').references('id').inTable('packages');
    table.string('name');
  }).createTable('caveats', function(table) {
    table.integer('id').primary();
    table.string('contents');
    table.integer('package_id').references('id').inTable('packages');
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('distros')
    .dropTable('packages')
    .dropTable('programs')
    .dropTable('caveats');
};
