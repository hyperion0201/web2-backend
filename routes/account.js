const router = require("express").Router();
const Account = require("../services/account");
const passport = require("passport");
router.post("/", passport.authenticate("jwt", { session: false }), function (
  req,
  res,
  next
) {
  const userId = req.user.dataValues.id;
  const { account_type } = req.body;
  Account.createAccount({
    account_type,
    userId,
  }).then((account) =>
    res.json({ account, message: "Account created successfully" })
  );
});
router.get("/all", passport.authenticate("jwt", { session: false }), function (
  req,
  res,
  next
) {
  const userId = req.user.dataValues.id;
  Account.getAccountsByUser({
    userId,
  }).then((account) => res.json({ account, message: "Find these accounts." }));
});

module.exports = router;
