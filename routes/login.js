const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "danbalacaithuboibac";
const router = require("express").Router();
const User = require("../services/user");

router.post("/", async function (req, res, next) {
  const { username, password } = req.body;
  if (username && password) {
    let user = await User.getUser({ username });
    if (!user) {
      res.status(401).json({ message: "No such user found" });
    }
    if (User.verifyPassword(password, user.password)) {
      let payload = { id: user.id, role: user.role };
      let token = jwt.sign(payload, JWT_SECRET, {
        issuer: "vnbc@rip113",
        expiresIn: "1d",
      });
      res.json({
        message: "ok",
        token: token,
        verified_email: user.verified_email,
      });
    } else {
      res.status(401).json({ msg: "Password is incorrect" });
    }
  }
});

module.exports = router;
