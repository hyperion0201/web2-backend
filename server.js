require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const db = require("./services/database");
const PORT = process.env.PORT || 3000;

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  res.json({
    message: "Okay.",
  });
});

app.listen(PORT, () => {
  console.log("server is running at " + PORT);
});
