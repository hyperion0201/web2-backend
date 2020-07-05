const router = require("express").Router();
const User = require("../services/user");
router.post("/", function (req, res, next) {
  console.log("go herer ? ", req.body);
  const {
    username,
    password,
    email,
    fullName,
    identify_type,
    identity_id,
  } = req.body;
  User.createUser({
    username,
    password,
    email,
    fullName,
    identify_type,
    identity_id,
  }).then((user) => res.json({ user, message: "User created successfully" }));
});
module.exports = router;
