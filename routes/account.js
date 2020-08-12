const router = require("express").Router();
const Account = require("../services/account");
const passport = require("passport");
const _ = require("lodash");

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const accs = await Account.getAccountsByUser({
      userId: req.user.dataValues.id,
    });
    res.json({
      accounts: accs,
    });
  }
);
router.post("/", passport.authenticate("jwt", { session: false }), function (
  req,
  res
) {
  const userId = req.user.dataValues.id;
  const { account_type, currency } = req.body;
  Account.createAccount({
    account_type,
    currency,
    userId,
  }).then((account) =>
    res.json({ account, message: "Account created successfully" })
  );
});
router.get("/all", passport.authenticate("jwt", { session: false }), function (
  req,
  res
) {
  const userId = req.user.dataValues.id;
  Account.getAccountsByUser({
    userId,
  }).then((account) => res.json({ account, message: "Find these accounts." }));
});

router.post(
  "/deactivate",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const user = _.get(req, "user.dataValues", null);
    if (user.role !== "staff") {
      return res.status(400).send({
        error: `You must be our staff to make this request.`,
      });
    }
    const account_id = _.get(req, "body.account_id", null);
    await Account.deactivateAccount(account_id);
    res.json({
      message: "Successfully deactivate account.",
    });
  }
);
module.exports = router;
