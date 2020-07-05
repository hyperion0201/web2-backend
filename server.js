require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const db = require("./services/database");
const passport = require("passport");
const PORT = process.env.PORT || 3000;
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// middlewares
app.use(passport.initialize());
require("./middlewares/passport")(passport);
app.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  async (req, res) => {
    res.json({
      message: "Okay.",
    });
  }
);
app.use("/register", require("./routes/register"));
app.use("/login", require("./routes/login"));
app.use('/account', require('./routes/account'))
db.sync()
  .then(() => {
    app.listen(PORT);
    console.log("server running at : ", PORT);
  })
  .catch((err) => {
    console.log(err);
  });
