import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";

const googleClient = new OAuth2Client("1096395453159-rebbv6i2q2dlalpanldpm5d8cj8gl9g4.apps.googleusercontent.com");

/**
 * POST /api/auth/google
 * Body: { credential }  ← Google One-Tap / Sign-In button ID token
 */
export async function googleLogin(req, res) {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ message: "credential required" });

    // Verify Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: "1096395453159-rebbv6i2q2dlalpanldpm5d8cj8gl9g4.apps.googleusercontent.com",
    });
    const { sub: google_id, name, email, picture: avatar } = ticket.getPayload();

    // Upsert user
    let user = await User.findOneAndUpdate(
      { google_id },
      { name, email, avatar },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Sign JWT — 1 year
    const token = jwt.sign(
      { id: user._id.toString(), name: user.name, email: user.email, avatar: user.avatar },
      "Qrcode-generator",
      { expiresIn: "365d" }
    );

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(401).json({ message: "Google authentication failed" });
  }
}

/**
 * GET /api/auth/me
 * Returns current user from token (requireAuth applied in route)
 */
export function getMe(req, res) {
  res.json({ user: req.user });
}