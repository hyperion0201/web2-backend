const router = require("express").Router();
const Account = require("../services/account");
const passport = require("passport");
const _ = require("lodash");

router.post(
  "/transfer",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    const user = _.get(req, "user.dataValues", null);
    const deposit_account_id = _.get(req, "body.deposit_account_id", null);
    const receive_account_id = _.get(req, "body.receive_account_id", null);
    const amount = _.get(req, "body.amount", null);
    // check account is fake
    const dAccount = await Account.checkAccountBelongToUser(
      deposit_account_id,
      user.id
    );
    if (!dAccount) {
        return res.status(400).send({
            error: `Deposit account didn't belong to current user.`
        })
    }
    // check receive account is exist?
    const rAccount = await Account.findAccount(receive_account_id);
    if (!rAccount) {
        return res.status(400).send({
            error: `Receive account not exist.`
        })
    }
    // get deposit currency
    let dCurrency = _.get(dAccount, 'currency', "VND"); // treat VND as default if it wasn't found.
    // check dAccount has enough money to transfer
    let dBalance 
    //get 
    res.json({
      message: "Okay",
    });
  }
);

module.exports = router;
