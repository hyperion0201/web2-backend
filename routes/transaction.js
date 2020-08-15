const router = require("express").Router();
const Account = require("../services/account");
const passport = require("passport");
const User = require("../services/user");
const sendMail = require("../services/email");

const _ = require("lodash");

router.post(
  "/transfer",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const dUser = _.get(req, "user.dataValues", null);
    const deposit_account_id = _.get(req, "body.deposit_account_id", null);
    const receive_account_id = _.get(req, "body.receive_account_id", null);
    const amount = _.get(req, "body.amount", null);
    // check account is fake
    const dAccount = await Account.checkAccountBelongToUser(
      deposit_account_id,
      dUser.id
    );
    if (!dAccount) {
      return res.status(400).send({
        error: `Deposit account didn't belong to current user.`,
      });
    }
    // check receive account is exist?
    const rAccount = await Account.findAccount(receive_account_id);
    if (!rAccount) {
      return res.status(400).send({
        error: `Receive account not exist.`,
      });
    }
    const rUser = await User.getUser({ id: rAccount.userId });
    // get deposit currency
    // check if 2 account same currency
    if (dAccount.currency !== rAccount.currency) {
      return res.json({
        message: "Two account is not same currency.",
      });
    }
    // check dAccount has enough money to transfer
    if (dAccount.account_balance <= parseFloat(amount)) {
      return res.json({
        message: "Not enough money to transfer.",
      });
    }
    // perform transfer
    let dHistory = _.get(dAccount, "transaction_history");
    // push new receipt
    dHistory.data.push({
      action: "send",
      to: rUser.fullName,
      amount: parseFloat(amount),
      date: new Date().toLocaleString(),
    });
    // update dAccount
    await Account.updateAccount({
      account_id: deposit_account_id,
      accountData: {
        transaction_history: dHistory,
        account_balance: dAccount.account_balance - parseFloat(amount),
      },
    });
    let rHistory = _.get(rAccount, "transaction_history");
    rHistory.data.push({
      action: "receive",
      from: dUser.fullName,
      amount: parseFloat(amount),
      date: new Date().toLocaleString(),
    });
    // update rAccount
    await Account.updateAccount({
      account_id: receive_account_id,
      accountData: {
        transaction_history: rHistory,
        account_balance: rAccount.account_balance + parseFloat(amount),
      },
    });
    // send receipt via email
    sendMail(
      dUser.email,
      "[VNBC Bank] - Transfer receipt",
      `Action : send
     From: ${dUser.fullName}
     To: ${rUser.fullName}
     Amount: ${amount} ${dAccount.currency}


     Thanks
     VNBC Bank - The best bank on the planet`
    );

    sendMail(
      rUser.email,
      "[VNBC Bank] - Transfer receipt",
      `Action : receive
     From: ${dUser.fullName}
     To: ${rUser.fullName}
     Amount: ${amount} ${dAccount.currency}


     Thanks
     VNBC Bank - The best bank on the planet`
    );

    res.json({
      message: "Okay",
    });
  }
);

router.get(
  "/transaction-history",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const account_id = _.get(req, "query.accountId");
    console.log("account : ", account_id);
    const account = await Account.findAccount(account_id);
    res.json(account.transaction_history);
  }
);
module.exports = router;
