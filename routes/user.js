const router = require("express").Router();
const multer = require("multer");
const User = require("../services/user");
const passport = require("passport");
const path = require("path");

const storageConfiguration = multer.diskStorage({
  destination: function (req, file, cb) {
      console.log(__dirname);
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); //Appending extension
  },
});
const upload = multer({
  storage: storageConfiguration,
});

router.post(
  "/verify",
  passport.authenticate("jwt", { session: false }),
  upload.single("identity"),
  async (req, res) => {
    console.log("body : ", req.body);
    res.json({
      message: "uploaded.",
    });
  }
);

module.exports = router;
