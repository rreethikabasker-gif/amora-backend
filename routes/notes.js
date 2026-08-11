const express = require("express");
const router = express.Router();

const Note = require("../models/Note");
const User = require("../models/User");
const auth = require("../middleware/auth");

async function requireCircle(req, res) {
  const user = await User.findById(req.userId);
  if (!user.circle) {
    res.status(400).json({ message: "Join or create a circle first" });
    return null;
  }
  return user.circle;
}

router.post("/", auth, async (req, res) => {
  const circleId = await requireCircle(req, res);
  if (!circleId) return;

  const { type, text, mood } = req.body;
  if (!["note", "mood"].includes(type)) {
    return res.status(400).json({ message: "type must be 'note' or 'mood'" });
  }
  if (type === "note" && !text?.trim()) {
    return res.status(400).json({ message: "text is required for a note" });
  }
  if (type === "mood" && !mood?.trim()) {
    return res.status(400).json({ message: "mood is required for a mood update" });
  }

  const note = await Note.create({ circle: circleId, sender: req.userId, type, text, mood });
  const populated = await note.populate("sender", "name avatar");

  const io = req.app.get("io");
  io.to(String(circleId)).emit("note:new", populated);

  res.status(201).json({ note: populated });
});

router.get("/latest", auth, async (req, res) => {
  const circleId = await requireCircle(req, res);
  if (!circleId) return;

  const latest = await Note.findOne({ circle: circleId }).sort({ createdAt: -1 }).populate("sender", "name avatar");
  res.json({ note: latest || null });
});

router.get("/history", auth, async (req, res) => {
  const circleId = await requireCircle(req, res);
  if (!circleId) return;

  const notes = await Note.find({ circle: circleId })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("sender", "name avatar");
  res.json({ notes });
});

module.exports = router;
