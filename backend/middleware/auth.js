import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Vérifie le jeton et charge l'utilisateur dans req.user
export const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ code: "UNAUTHENTICATED" });
  }

  let payload;
  try {
    payload = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ code: "SESSION_EXPIRED" });
  }

  const user = await User.findById(payload.id);
  if (!user) return res.status(401).json({ code: "UNAUTHENTICATED" });

  req.user = user;
  next();
};

// Vérifie le rôle : authorize("admin"), authorize("chef", "membre")…
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ code: "FORBIDDEN" });
  }
  next();
};
