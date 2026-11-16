const jwt = require("jsonwebtoken");
require("dotenv").config(); // Force load dotenv here

const requireAuth = () => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const JWT_SECRET = process.env.JWT_SECRET || "finflow_dev_jwt_secret_fallback_2026";
      const decoded = jwt.verify(token, JWT_SECRET);
      req.auth = { userId: decoded.userId };
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
};

module.exports = { requireAuth };
