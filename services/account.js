const Sequelize = require("sequelize");
const db = require("./database");
const { v1 } = require("uuid");
const User = require("./user");
const Model = Sequelize.Model;

class Account extends Model {
  static createAccount = async ({ account_type, currency, userId }) => {
    return await Account.create({
      account_id: v1(),
      account_type,
      currency,
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
  static async deactivateAccount(account_id) {
    return await Account.update(
      { active: false },
      {
        where: { account_id },
      }
    );
  }
  static async checkAccountBelongToUser(account_id, userId) {
    return await Account.findOne({
      where: {
        account_id,
        userId,
      },
    });
  }
  static async findAccount(account_id) {
    return await Account.findOne({
      where: {
        account_id,
      },
    });
  }
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
