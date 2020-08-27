const router = require("express").Router();
const User = require("../services/user");
const sendMail = require("../services/email");
const crypto = require("crypto");

router.post("/", function (req, res, next) {
  const {
    username,
    password,
    email,
    fullName,
    identity_type,
    identity_id,
    identity_issued_date,
  } = req.body;
  User.createUser({
    username,
    password,
    email,
    fullName,
    identity_type,
    identity_id,
    identity_issued_date: new Date(identity_issued_date).toLocaleString(),
  })
    .then(async (user) => {
      let verifyCode = crypto.randomBytes(20).toString("hex");
      await User.update(
        {
          verified_code: verifyCode,
        },
        {
          where: {
            id: user.id,
          },
        }
      );
      // send email confirm
      sendMail(
        user.email,
        `[VNBC Bank - Confirm your email]`,
        `
        Hello ${user.fullName},
        Your account has been created. But we need one more step. Here is the confirmation link. Please click this:
        https://web2-be.herokuapp.com/user/email-confirmation?username=${user.username}&verifyCode=${verifyCode}


        Thanks
        VNBC Bank - The best bank on the planet
        `
      );

      res.json({ message: "User created successfully" });
    })
    .catch((err) => {
      res.json({
        error: "Error when create account.",
      });
    });
});
module.exports = router;
