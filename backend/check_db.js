const mongoose = require("mongoose");
require("dotenv").config();
mongoose.connect(process.env.MONGO_URI, { dbName: "finflow" }).then(async () => {
  const { Liquid, Expense, Stock } = require("./models");
  console.log("Liquid:", await Liquid.find());
  process.exit(0);
});
