const router = require("express").Router();
const User = require("../services/user");
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
    .then((user) => res.json({ user, message: "User created successfully" }))
    .catch((err) => {
      res.json({
        error: "Error when create account.",
      });
    });
});
module.exports = router;
