const bcrypt = require("bcrypt");
const Sequelize = require("sequelize");
const db = require("./database");

const Model = Sequelize.Model;

class User extends Model {
  static hashPassword(pass) {
    return bcrypt.hashSync(pass, 10);
  }
  static async updateIdentityImage(userId, identity_image_url) {
    return await User.update(
      { identity_image_url },
      {
        where: { id: userId },
      }
    );
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
  static async updatePassword(userId, newPass) {
    return await User.update(
      {
        password: this.hashPassword(newPass),
      },
      {
        where: { id: userId },
      }
    );
  }
  static async updateUser({
    userId,
    email,
    fullName,
    identity_type,
    identity_id,
    status,
  }) {
    return await User.update(
      {
        email,
        fullName,
        identity_id,
        identity_type,
        status,
      },
      {
        where: { id: userId },
      }
    );
  }
  static createUser = async ({
    username,
    password,
    email,
    fullName,
    identity_type,
    identity_id,
    identity_issued_date
  }) => {
    return await User.create({
      username,
      password: this.hashPassword(password),
      email,
      fullName,
      identity_type,
      identity_id,
      identity_issued_date
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
    verified_email: {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    },
    status: {
      type: Sequelize.ENUM,
      values: ["unverified", "verified", "banned"],
      defaultValue: "unverified",
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
    identity_image_url: {
      type: Sequelize.STRING,
      defaultValue: null,
      allowNull: true,
    },
    identity_issued_date: {
      type: Sequelize.DATE,
      defaultValue: null,
      allowNull: true
    },
    verified_code: {
      type: Sequelize.STRING,
      defaultValue: null,
      allowNull: true
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
