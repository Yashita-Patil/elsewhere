import jwt from "jsonwebtoken";
import User from "../models/User.js";

const createToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || "elsewhere_secret_key_default", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// What we send back about a user (never the password)
const userResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  savedPlaces: user.savedPlaces.map(String),
});

// POST /api/auth/register
export async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ message: "Name, email and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }
  const user = await User.create({ name, email, password }); // role is always "user" here
  res.status(201).json({ token: createToken(user._id), user: userResponse(user) });
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: "Incorrect email or password" });
  }
  res.json({ token: createToken(user._id), user: userResponse(user) });
}

// GET /api/auth/me  (used on page load to restore the session)
export async function getMe(req, res) {
  res.json({ user: userResponse(req.user) });
}
