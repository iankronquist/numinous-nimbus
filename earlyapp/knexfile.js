module.exports = {

  development: {
    client: 'sqlite3',
    connection: {
      filename: './dev.sqlite3'
    }
  },

  staging: {
    client: 'postgres',
    connection: process.env.DATABASE_URL,
    ssl: true,
    migrations: {
      tableName: 'knex_migrations'
    }
  },

  production: {
    client: 'postgres',
    connection: process.env.DATABASE_URL + '?ssl=true'
  }

};
