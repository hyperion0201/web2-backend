const router = require("express").Router();
const Account = require("../services/account");
const passport = require("passport");
const _ = require("lodash");

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const role = _.get(req, "user.dataValues.role");
    if (role === "customer") {
      const accs = await Account.getAccountsByUser({
        userId: req.user.dataValues.id,
      });
      return res.json({
        accounts: accs,
      });
    }
    // staff:
    const userId = _.get(req, "query.userId");
    const accs = await Account.getAccountsByUser({
      userId,
    });
    return res.json({
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
    const account_id = _.get(req, "body.account_id", null);
    const accountFound = await Account.findAccount(account_id);
    if (!accountFound) {
      return res.status(400).send({
        error: "Account not found.",
      });
    }
    await Account.deactivateAccount(account_id);
    res.json({
      message: "Successfully deactivate account.",
    });
  }
);
router.post(
  "/charge",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (req, res) => {
    const user = _.get(req, "user.dataValues");
    const account_id = _.get(req, "body.account_id", null);
    const amount = _.get(req, "body.amount", 0);
    const accountFound = await Account.findAccount(account_id);
    if (!accountFound) {
      return res.status(400).send({
        error: "Account not found.",
      });
    }
    // nap tien xd
    await Account.updateAccount({
      account_id,
      accountData: {
        account_balance: accountFound.account_balance + parseFloat(amount),
      },
    });

    res.json({
      message: "Successfully charge account.",
    });
  }
);
module.exports = router;
