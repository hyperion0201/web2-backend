
const router = require("express").Router();
const User = require("../services/user");

router.post("/", function (req, res, next) {
  const { username, password, email } = req.body;
  User.createUser({ username, password, email }).then((user) =>
    res.json({ user, message: "account created successfully" })
  );
});
module.exports = router;
