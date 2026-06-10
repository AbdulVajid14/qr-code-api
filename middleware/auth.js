import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, "Qrcode-generator");
    req.user = payload; // { id, name, email, avatar }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}