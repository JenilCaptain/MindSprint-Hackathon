import jwt from "jsonwebtoken";
import User from "../models/User.js";

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");
      
      if (!req.user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      next();
    } catch (error) {
      console.error("Auth middleware error:", error);
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: "Invalid token" });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: "Token expired" });
      }
      return res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    return res.status(401).json({ message: "Not authorized, no token" });
  }
};

export { protect };
