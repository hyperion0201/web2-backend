const Sequelize = require("sequelize");

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:12345@localhost:5432/postgres";
const db = new Sequelize(connectionString);

module.exports = db;