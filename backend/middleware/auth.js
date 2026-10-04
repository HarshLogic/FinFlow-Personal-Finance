const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

const requireAuth = () => {
  return (req, res, next) => {
    console.log("INSIDE requireAuth middleware!");
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.auth = { userId: decoded.userId };
      next();
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
};

module.exports = { requireAuth };
