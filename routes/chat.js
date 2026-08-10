const express = require("express");
const router = express.Router();

const Message = require("../models/Message");
const User = require("../models/User");
const auth = require("../middleware/auth");

router.get("/history", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.circle) return res.status(400).json({ message: "Join or create a circle first" });

    const messages = await Message.find({ circle: user.circle })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("sender", "name avatar");

    res.json({ messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ message: "Could not load messages", error: err.message });
  }
});

module.exports = router;
