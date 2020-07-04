const bcrypt = require("bcrypt");
const Sequelize = require("sequelize");
const db = require("./database");

const Model = Sequelize.Model;

class User extends Model {
  static hashPassword(pass) {
    return bcrypt.hashSync(pass, 10);
  }

  static verifyPassword(password, hashPassword) {
    return bcrypt.compareSync(password, hashPassword);
  }
  static async getUser(user) {
    return await User.findOne({
      where: user,
    });
  }
  static async getAllUsers() {
    return await User.findAll();
  }
  static createUser = async ({
    username,
    password,
    email,
    fullName,
    identity_type,
    identity_id,
    user_type,
  }) => {
    return await User.create({
      username,
      password: this.hashPassword(password),
      email,
      fullName,
      identity_type,
      identity_id,
      user_type,
    });
  };
}
User.init(
  {
    username: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
    },
    fullName: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    password: {
      type: Sequelize.STRING,
    },
    identity_type: {
      type: Sequelize.ENUM,
      values: ["cmnd", "cccd"],
      defaultValue: "cmnd",
    },
    identity_id: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    role: {
      type: Sequelize.ENUM,
      values: ["customer", "staff"],
      defaultValue: "customer",
    },
  },
  {
    sequelize: db,
    modelName: "user",
  }
);

module.exports = User;
