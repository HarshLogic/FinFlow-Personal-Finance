const express = require("express");
const router = require("express").Router();
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const auth = require("../middleware/auth");

const SECRET = process.env.JWT_SECRET || "fallback_secret";

// POST /api/auth/register
router.post("/register", asyncHandler(async (req, res) => {
  const { name, email, password, currency } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ error: "Email already in use" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash: hashed, currency });

  const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "7d" });
  res.status(201).json({ token, user: { id: user._id, name, email, currency: user.currency } });
}));

// POST /api/auth/login
router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(400).json({ error: "Invalid credentials" });

  const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: "7d" });
  res.json({ token, user: { id: user._id, name: user.name, email, currency: user.currency } });
}));

// GET /api/auth/me
router.get("/me", auth, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ id: user._id, name: user.name, email: user.email, currency: user.currency });
}));

// PUT /api/auth/settings
router.put("/settings", auth, asyncHandler(async (req, res) => {
  const { currency } = req.body;
  const user = await User.findByIdAndUpdate(req.user.id, { currency }, { new: true });
  res.json({ id: user._id, name: user.name, email: user.email, currency: user.currency });
}));

module.exports = router;
