const router = require("express").Router();
const Account = require("../services/account");
const passport = require("passport");
const _ = require("lodash");

router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const role = _.get(req, "user.dataValues.role");
    const userIdFromToken = _.get(req, "user.dataValues.id");
    if (role === "customer") {
      console.log(" userid from token : ", userIdFromToken);
      const accs = await Account.getAccountsByUser({
        userId: userIdFromToken,
      });
      return res.json({
        accounts: accs,
      });
    } else {
      // staff:
      const userId = _.get(req, "query.userId");
      console.log("id query : ", userId);
      const accs = await Account.getAccountsByUser({
        userId,
      });
      return res.json({
        accounts: accs,
      });
    }
  }
);
router.post("/", passport.authenticate("jwt", { session: false }), function (
  req,
  res
) {
  const userId = req.user.dataValues.id;
  const userStatus = req.user.dataValues.status;
  if (userStatus !== "verified") {
    return res.json({
      error: {
        message: "Account is not verified or banned.",
      },
    });
  }
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
    // check account belong to user before
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
  "/activate",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const account_id = _.get(req, "body.account_id", null);
    const accountFound = await Account.findAccount(account_id);
    if (!accountFound) {
      return res.status(400).send({
        error: "Account not found.",
      });
    }
    await Account.activateAccount(account_id);
    res.json({
      message: "Successfully activate account.",
    });
  }
);
router.post(
  "/charge",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (req, res) => {
    const stateUser = _.get(req, "user.dataValues");
    if (stateUser.role !== "staff") {
      return res.statusCode(400).send({
        error: "Staff required.",
      });
    }
    const account_id = _.get(req, "body.account_id", null);
    const amount = _.get(req, "body.amount", 0);
    const accountFound = await Account.findAccount(account_id);
    if (!accountFound) {
      return res.status(400).send({
        error: "Account not found.",
      });
    }
    let accountData = {
      account_balance: accountFound.account_balance + parseFloat(amount),
    };
    if (
      accountFound.account_type === "saving" &&
      accountFound.account_balance === 0
    ) {
      _.set(accountData, "active_date", new Date().toLocaleString());
    }
    // nap tien xd
    await Account.updateAccount({
      account_id,
      accountData,
    });

    res.json({
      message: "Successfully charge account.",
    });
  }
);
router.put(
  "/update-account",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (req, res) => {
    const stateUser = _.get(req, "user.dataValues");
    if (stateUser.role !== "staff") {
      return res.statusCode(400).send({
        error: "Staff required.",
      });
    }
    const accountId = _.get(req, "query.accountId");
    const account = await Account.findAccount(accountId);
    if (!account) {
      return res.status(400).send({
        error: "Account not found.",
      });
    }
    const data = _.get(req, "body");
    try {
      await Account.updateAccount({
        account_id: accountId,
        accountData: {
          ...data,
        },
      });
      return res.json({
        message: "Successfully update account.",
      });
    } catch (err) {
      return res.status(500).send({
        error: "Server error.",
      });
    }
  }
);
router.post(
  "/withdraw",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (req, res) => {
    try {
      const sav_account_id = _.get(req, "body.sav_account_id");
      const des_account_id = _.get(req, "body.des_account_id");

      const savAccount = await Account.findAccount(sav_account_id);
      if (!savAccount || savAccount.account_type === "spending") {
        return res.status(400).send({
          error: "Account not found or spending account detected.",
        });
      }
      const desAccount = await Account.findAccount(des_account_id);
      if (!desAccount || desAccount.account_type === "saving") {
        return res.status(400).send({
          error: "Destination account must be spending account.",
        });
      }
      // set saving balance to 0
      await Account.updateAccount({
        account_id: sav_account_id,
        accountData: {
          account_balance: 0,
          active: false,
        },
      });

      // calc interest

      let newBalance = Account.calcInterest({
        balance: desAccount.account_balance,
        dateFrom: new Date(savAccount.active_date),
        dateTo: new Date(),
      });

      let newHistory = _.get(desAccount, "transaction_history");
      newHistory.data.push({
        action: "receive",
        deposit_account_id: sav_account_id,
        receive_account_id: des_account_id,
        amount: parseFloat(newBalance),
        message: `Withdraw from saving account: ${sav_account_id}`,
        date: new Date().toLocaleString(),
      });
      await Account.updateAccount({
        account_id: des_account_id,
        accountData: {
          account_balance: desAccount.account_balance + newBalance,
          transaction_history: newHistory,
        },
      });
      return res.json({
        message: "Successfully withdraw.",
      });
    } catch (err) {
      console.log("err cmnr : ", err);
      return res.status(500).send({
        error: "Internal server error.",
      });
    }
  }
);
module.exports = router;
