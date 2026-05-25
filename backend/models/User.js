const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  currency: { type: String, default: "INR" }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
