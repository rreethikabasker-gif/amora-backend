const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const router = express.Router();

const User = require("../models/User");
const Circle = require("../models/Circle");
const auth = require("../middleware/auth");

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    circle: user.circle
  };
}

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email, and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "An account with that email already exists" });
    }

    const user = await User.create({ name, email, password });
    const token = signToken(user._id);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Signup failed", error: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || "").toLowerCase() });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = signToken(user._id);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

router.post("/circle/create", auth, async (req, res) => {
  try {
    const inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase();
    const circle = await Circle.create({
      name: req.body.name || "Us",
      inviteCode,
      members: [req.userId],
      createdBy: req.userId
    });
    await User.findByIdAndUpdate(req.userId, { circle: circle._id });
    res.status(201).json({ circle });
  } catch (err) {
    res.status(500).json({ message: "Could not create circle", error: err.message });
  }
});

router.post("/circle/join", auth, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const circle = await Circle.findOne({ inviteCode: (inviteCode || "").toUpperCase() });
    if (!circle) return res.status(404).json({ message: "Invalid invite code" });

    if (!circle.members.includes(req.userId)) {
      circle.members.push(req.userId);
      await circle.save();
    }
    await User.findByIdAndUpdate(req.userId, { circle: circle._id });
    res.json({ circle });
  } catch (err) {
    res.status(500).json({ message: "Could not join circle", error: err.message });
  }
});

router.get("/circle", auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user.circle) return res.status(400).json({ message: "Join or create a circle first" });
  const circle = await Circle.findById(user.circle).populate("members", "name avatar");
  res.json({ circle });
});

router.put("/circle/settings", auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user.circle) return res.status(400).json({ message: "Join or create a circle first" });

  const { name, anniversaryDate, theme } = req.body;
  const update = {};
  if (name !== undefined) update.name = name;
  if (anniversaryDate !== undefined) update.anniversaryDate = anniversaryDate;
  if (theme !== undefined) update.theme = theme;

  const circle = await Circle.findByIdAndUpdate(user.circle, update, { new: true });
  res.json({ circle });
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json({ user: publicUser(user) });
});

module.exports = router;
