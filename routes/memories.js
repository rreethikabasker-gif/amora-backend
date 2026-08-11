const express = require("express");
const router = express.Router();

const Note = require("../models/Note");
const Photo = require("../models/Photo");
const User = require("../models/User");
const auth = require("../middleware/auth");

router.get("/", auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user.circle) return res.status(400).json({ message: "Join or create a circle first" });

  const [notes, media] = await Promise.all([
    Note.find({ circle: user.circle }).sort({ createdAt: -1 }).limit(100).populate("sender", "name avatar"),
    Photo.find({ circle: user.circle }).sort({ createdAt: -1 }).limit(100).populate("uploadedBy", "name avatar")
  ]);

  const items = [
    ...notes.map((n) => ({
      kind: n.type,
      id: n._id,
      by: n.sender,
      text: n.text,
      mood: n.mood,
      createdAt: n.createdAt
    })),
    ...media.map((m) => ({
      kind: m.type,
      id: m._id,
      by: m.uploadedBy,
      url: m.url,
      caption: m.caption,
      createdAt: m.createdAt
    }))
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ items });
});

module.exports = router;
