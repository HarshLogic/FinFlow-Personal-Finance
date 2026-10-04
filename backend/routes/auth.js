const router = require("express").Router();
const { User } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const JWT_SECRET = process.env.JWT_SECRET;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
};

router.post("/register", async (req, res) => {
  try {
    const { email, userId, password } = req.body;
    if (!email || !userId || !password) {
      return res.status(400).json({ error: "Email, User ID, and password are required" });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { userId }] });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email or User ID" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, userId, password: hashedPassword });
    const token = generateToken(user.userId);

    res.status(201).json({ token, user: { email: user.email, userId: user.userId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier can be email or userId
    if (!identifier || !password) {
      return res.status(400).json({ error: "Email/UserID and password are required" });
    }

    const user = await User.findOne({ $or: [{ email: identifier }, { userId: identifier }] });
    if (!user || !user.password) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user.userId);
    res.json({ token, user: { email: user.email, userId: user.userId } });
  } catch (err) {
    console.error("Login 500 Error:", err);
    res.status(500).json({ error: err.message });
  }
});

router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, sub: googleId } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      // Create a user if they don't exist. We use googleId as the internal userId for simplicity or generate one.
      user = await User.create({ email, userId: googleId, googleId });
    } else if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }

    const token = generateToken(user.userId);
    res.json({ token, user: { email: user.email, userId: user.userId } });
  } catch (err) {
    res.status(401).json({ error: "Google Authentication failed" });
  }
});

router.get("/me", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ userId: decoded.userId });
    if (!user) return res.status(404).json({ error: "User not found" });
    
    res.json({ 
      user: { 
        email: user.email, 
        userId: user.userId,
        createdAt: user.createdAt,
        authMethod: user.googleId ? "Google OAuth" : "Email & Password"
      } 
    });
  } catch (err) {
    res.status(401).json({ error: "Invalid token" });
  }
});

router.post("/change-password", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ error: "No token provided" });
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current and new password are required" });
    }

    const user = await User.findOne({ userId: decoded.userId });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.password) {
      return res.status(400).json({ error: "Account uses Google Sign-In. Password cannot be changed." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect current password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
