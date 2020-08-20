const router = require("express").Router();
const multer = require("multer");
const User = require("../services/user");
const passport = require("passport");
const path = require("path");
const _ = require("lodash");
const sendMail = require("../services/email");

const storageConfiguration = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log("dir name : ", __dirname);
    cb(null, path.join(__dirname, "../public/uploads"));
  },
  filename: function (req, file, cb) {
    const username = _.get(req, "user.dataValues.username");
    cb(null, username + path.extname(file.originalname)); //Appending extension
  },
});
const upload = multer({
  storage: storageConfiguration,
});
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    res.json({
      user: req.user.dataValues,
    });
  }
);
router.post(
  "/changePassword",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const userId = _.get(req, "user.dataValues.id", null);
    const oldPass = _.get(req, "body.oldPass", null);
    const newPass = _.get(req, "body.newPass", null);
    const currentPassHashed = _.get(req, "user.dataValues.password");
    const verifyPassword = User.verifyPassword(oldPass, currentPassHashed);
    if (!verifyPassword) {
      return res.status(400).send({
        error: `Old password didn't match.`,
      });
    }
    await User.updatePassword(userId, newPass);
    res.json({
      message: "Successfully updated password.",
    });
  }
);
router.post("/forgotPassword", async (req, res) => {
  const email = _.get(req, "body.email", null);
  const user = await User.getUser({
    email,
  });
  if (!user) {
    return res.status(400).send({
      error: "Email not exist.",
    });
  }
  let rPass = Math.random().toString(36).substring(3);
  // update new password
  await User.updatePassword(user.id, rPass);
  await sendMail(
    email,
    "[VNBC Bank] - Password reset",
    `Your username is : ${user.username}
     Your new password is : ${rPass}

     Thanks
     VNBC Bank - The best bank on the planet`
  );
  res.json({
    message: "Okay",
  });
});

router.post(
  "/upload-id",
  passport.authenticate("jwt", { session: false }),
  upload.single("identity"),
  async (req, res) => {
    // store link to user
    const userId = _.get(req, "user.dataValues.id", null);
    const username = _.get(req, "user.dataValues.username", null);
    const link = `https://web2-be.herokuapp.com/uploads/${username}.jpg`;
    await User.updateIdentityImage(userId, link);
    res.json({
      message: "uploaded.",
      identity_image_url: link,
    });
  }
);
router.post(
  "/verify-user",
  passport.authenticate("jwt", {
    session: false,
  })
);
router.post(
  "/all",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const user = _.get(req, "user.dataValues");
    const query = _.get(req, "body.query", {});
    if (user.role !== "staff") {
      return res.status(400).send({
        error: "Staff required.",
      });
    }

    const users = await User.getAllUsers();
    if (_.isEmpty(query)) {
      let filteredUser  = _.filter(users, (el) => {
        return _.includes(el.role, "customer");
      })
      return res.json(filteredUser);
    }
    const filteredUser = _.filter(users, (el) => {
      return (
        (_.includes(el.username, query.username) ||
          _.includes(el.identity_id, query.identity_id)) &&
        _.includes(el.role, "customer")
      );
    });
    res.json(filteredUser);
  }
);
router.put(
  "/update-user",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    // check staff token
    const stateUser = _.get(req, "user.dataValues");
    if (stateUser.role !== "staff") {
      return res.status(400).send({
        error: "Staff required.",
      });
    }
    // get userId to update
    const userId = _.get(req, "query.userId", null);
    const user = await User.getUser({
      id: userId,
    });
    if (!user) {
      return res.status(400).send({
        error: "User not found.",
      });
    }
    const data = _.get(req, "body");
    try {
      await User.updateUser({
        userId,
        ...data,
      });
      return res.json({
        message: "Sucessfully updated user.",
      });
    } catch (err) {
      console.log(err);
      res.status(500).send({
        error: "Server error.",
      });
    }
  }
);
module.exports = router;
