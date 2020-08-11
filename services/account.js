const Sequelize = require("sequelize");
const db = require("./database");
const { v1 } = require("uuid");
const User = require("./user");
const Model = Sequelize.Model;

class Account extends Model {
  static createAccount = async ({ account_type, userId }) => {
    return await Account.create({
      account_id: v1(),
      account_type,
      userId,
    });
  };
  static getAccountsByUser = async ({ userId }) => {
    return await Account.findAll({
      where: {
        userId,
      },
    });
  };
}
Account.init(
  {
    account_id: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    active: {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    },
    transaction_history: {
      type: Sequelize.JSON,
      defaultValue: {},
    },
    account_balance: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    currency: {
      type: Sequelize.ENUM,
      values: ["USD", "VND"],
      defaultValue: "VND",
    },
    account_type: {
      type: Sequelize.ENUM,
      values: ["spending", "saving"],
      defaultValue: "spending",
    },
    interest_rate: {
      type: Sequelize.FLOAT,
      defaultValue: 0,
    },
    maturity_date: {
      type: Sequelize.DATE,
    },
    term: {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize: db,
    modelName: "account",
  }
);
User.hasMany(Account);
Account.belongsTo(User);
module.exports = Account;
