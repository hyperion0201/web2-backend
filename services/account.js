const Sequelize = require("sequelize");
const db = require("./database");
const User = require("./user");
const Model = Sequelize.Model;
const bankRate = require("../services/rate");
class Account extends Model {
  static createAccount = async ({ account_type, currency, userId }) => {
    return await Account.create({
      account_id: Math.random().toString().split(".")[1].substring(0, 13),
      account_type,
      active: account_type === "saving" ? false : true,
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
  static async activateAccount(account_id) {
    return await Account.update(
      {
        active: true,
      },
      {
        where: { account_id },
      }
    );
  }
  static async checkAccountBelongToUser(account_id, userId) {
    return await Account.findOne({
      where: {
        account_id,
        userId: userId,
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
  static async updateAccount({ account_id, accountData }) {
    return await Account.update(
      {
        ...accountData,
      },
      {
        where: { account_id },
      }
    );
  }
  static getMonthDiff(dateFrom, dateTo) {
    return Math.abs(
      dateTo.getMonth() -
        dateFrom.getMonth() +
        12 * (dateTo.getFullYear() - dateFrom.getFullYear())
    );
  }
  static calcInterest({ balance, dateFrom, dateTo }) {
    // calc month
    let mondiff = this.getMonthDiff(dateFrom, dateTo);
    if (mondiff < 12) {
      return balance + (balance / 100) * 0.5;
    } else if (mondiff < 24) {
      return balance + (balance / 100) * 1.5;
    } else if (mondiff < 36) {
      return balance + (balance / 100) * 2;
    } else if (mondiff < 72) {
      return balance + (balance / 100) * 2.5;
    } else if (mondiff < 81) {
      return balance + (balance / 100) * 3.5;
    } else if (mondiff < 144) {
      return balance + (balance / 100) * 4.5;
    } else {
      return balance + (balance / 100) * 6;
    }
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
      defaultValue: {
        data: [],
      },
    },
    account_balance: {
      type: Sequelize.FLOAT,
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
    active_date: {
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
