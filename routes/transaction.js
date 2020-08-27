const router = require("express").Router();
const Account = require("../services/account");
const passport = require("passport");
const User = require("../services/user");
const crypto = require("crypto");
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
    const message = _.get(req, "body.message", "send");

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
    // check any account is locked
    if (!dAccount.active) {
      return res.json({
        error: {
          message: "Deposit account is locked. Can not transfer.",
        },
      });
    }
    if (!rAccount.active) {
      return res.json({
        error: {
          message: "Receive account is locked. Can not transfer.",
        },
      });
    }
    // get deposit currency
    // check if 2 account same currency
    if (dAccount.currency !== rAccount.currency) {
      return res.json({
        error: {
          message: "Two account is not same currency.",
        },
      });
    }
    // check dAccount has enough money to transfer
    if (dAccount.account_balance <= parseFloat(amount)) {
      return res.json({
        error: {
          message: "Not enough money to transfer.",
        },
      });
    }
    // perform transfer
    let dHistory = _.get(dAccount, "transaction_history");
    // push new receipt with otp ready
    const otpCode = crypto.randomBytes(3).toString("hex");
    dHistory.data.push({
      action: "send",
      otp_status: "unconfirmed",
      otp_code: otpCode,
      deposit_account_id,
      receive_name: rUser.fullName,
      receive_account_id,
      amount: parseFloat(amount),
      message,
      date: new Date().toLocaleString(),
    });

    // send OTP via email to confirm transaction
    sendMail(
      dUser.email,
      `[VNBC Bank] - Transaction confirm`,
      `
      Hello ${dUser.email},
      This is your transaction info: 
      Action : send
      From:  ${deposit_account_id} - ${dUser.fullName} 
      To: ${receive_account_id} - ${rUser.fullName}
      Amount: ${amount} ${dAccount.currency}
      Message: ${message}


      Please read these carefully.
      Your OTP for this transaction is: ${otpCode}. 
      

     Thanks
     VNBC Bank - The best bank on the planet
      `
    );

    // update dAccount
    // await Account.updateAccount({
    //   account_id: deposit_account_id,
    //   accountData: {
    //     transaction_history: dHistory,
    //     account_balance: dAccount.account_balance - parseFloat(amount),
    //   },
    // });

    // let rHistory = _.get(rAccount, "transaction_history");
    // rHistory.data.push({
    //   action: "receive",
    //   deposit_name: dUser.fullName,
    //   deposit_account_id,
    //   receive_account_id,
    //   amount: parseFloat(amount),
    //   message,
    //   date: new Date().toLocaleString(),
    // });

    // update rAccount
    // await Account.updateAccount({
    //   account_id: receive_account_id,
    //   accountData: {
    //     transaction_history: rHistory,
    //     account_balance: rAccount.account_balance + parseFloat(amount),
    //   },
    // });

    // send receipt via email
    // sendMail(
    //   dUser.email,
    //   "[VNBC Bank] - Transfer receipt",
    //   `
    //  Action : send
    //  From:  ${deposit_account_id} - ${dUser.fullName}
    //  To: ${receive_account_id} - ${rUser.fullName}
    //  Amount: ${amount} ${dAccount.currency}
    //  Message: ${message}

    //  Thanks
    //  VNBC Bank - The best bank on the planet`
    // );

    // sendMail(
    //   rUser.email,
    //   "[VNBC Bank] - Transfer receipt",
    //   `
    //  Action : receive
    //  From: ${deposit_account_id} - ${dUser.fullName}
    //  To: ${receive_account_id} - ${rUser.fullName}
    //  Amount: ${amount} ${dAccount.currency}
    //  Message: ${message}

    //  Thanks
    //  VNBC Bank - The best bank on the planet`
    // );

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
router.post(
  "/cashout",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (req, res) => {
    const user = _.get(req, "user.dataValues");
    if (user.role !== "staff") {
      return res.status(400).send({
        error: "Staff required.",
      });
    }
    const spending_account_id = _.get(req, "body.spending_account_id");
    const amount = _.get(req, "body.amount", 0);
    const account = await Account.findAccount(spending_account_id);
    if (!account || account.account_type === "saving") {
      return res.status(400).send({
        error: "Account not found or must be spending account.",
      });
    }
    // check balance to cashout
    if (account.account_balance <= parseFloat(amount)) {
      return res.status(400).send({
        error: "Not enough money to cashout.",
      });
    }

    // perform cashout
    let transHistory = _.get(account, "transaction_history");
    transHistory.data.push({
      action: "cashout",
      amount: parseFloat(amount),
      date: new Date().toLocaleString(),
    });
    //update account
    await Account.updateAccount({
      account_id: spending_account_id,
      accountData: {
        transaction_history: transHistory,
        account_balance: account.account_balance - parseFloat(amount),
      },
    });
    return res.json({
      message: "Sucessfully cashout.",
    });
  }
);
router.post(
  "/otp-confirmation",
  passport.authenticate("jwt", {
    session: false,
  }),
  async (req, res) => {
    try {
      const tokenUser = _.get(req, "user.dataValues");
      const deposit_account_id = _.get(req, "body.deposit_account_id");
      const otp_code = _.get(req, "body.otp_code");

      // check acc belong to user
      const dAccount = await Account.checkAccountBelongToUser(
        deposit_account_id,
        tokenUser.id
      );
      if (!dAccount) {
        return res.status(400).send({
          error: "Account not found or not belong to current user.",
        });
      }
      // check otp code
      const dHistory = _.get(dAccount, "transaction_history");
      let currentTransaction = _.find(dHistory.data, (item) => {
        return (
          item.deposit_account_id === deposit_account_id &&
          item.otp_status === "unconfirmed" &&
          item.otp_code === otp_code
        );
      });
      if (_.isEmpty(currentTransaction)) {
        return res.status(400).send({
          error: "OTP is invalid or expired.",
        });
      }
      // re-assign transaction
      let newDHistory = _.map(dHistory.data, (item) => {
        if (
          item.deposit_account_id === deposit_account_id &&
          item.otp_status === "unconfirmed" &&
          item.otp_code === otp_code
        ) {
          return _.set(item, "otp_status", "confirmed");
        }
        return item;
      });
      console.log("new history: ", newDHistory);

      // perform transfer

      const { receive_account_id, amount, message } = currentTransaction;

      // update dAccount
      await Account.updateAccount({
        account_id: deposit_account_id,
        accountData: {
          transaction_history: {
            data: newDHistory,
          },
          account_balance: dAccount.account_balance - parseFloat(amount),
        },
      });
      // update rAccount

      const rAccount = await Account.findAccount(receive_account_id);
      const rUser = await User.getUser({ id: rAccount.userId });
      let rHistory = _.get(rAccount, "transaction_history");
      rHistory.data.push({
        action: "receive",
        deposit_name: tokenUser.fullName,
        deposit_account_id,
        receive_account_id,
        amount: parseFloat(amount),
        message,
        date: new Date().toLocaleString(),
      });

      //update rAccount
      await Account.updateAccount({
        account_id: receive_account_id,
        accountData: {
          transaction_history: rHistory,
          account_balance: rAccount.account_balance + parseFloat(amount),
        },
      });

      //send receipt via email
      sendMail(
        tokenUser.email,
        "[VNBC Bank] - Transfer receipt",
        `
       Action : send
       From:  ${deposit_account_id} - ${tokenUser.fullName}
       To: ${receive_account_id} - ${rUser.fullName}
       Amount: ${amount} ${dAccount.currency}
       Message: ${message}
  
       Thanks
       VNBC Bank - The best bank on the planet`
      );

      sendMail(
        rUser.email,
        "[VNBC Bank] - Transfer receipt",
        `
       Action : receive
       From: ${deposit_account_id} - ${tokenUser.fullName}
       To: ${receive_account_id} - ${rUser.fullName}
       Amount: ${amount} ${dAccount.currency}
       Message: ${message}
  
       Thanks
       VNBC Bank - The best bank on the planet`
      );
      return res.json({
        message: "Transaction done.",
      });
    } catch (err) {
      console.log(err);
      return res.status(500).send({
        error: "Internal server error.",
      });
    }
  }
);
module.exports = router;
