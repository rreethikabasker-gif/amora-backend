const express = require("express");
const router = express.Router();

const Event = require("../models/Event");
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

router.get("/", auth, async (req, res) => {
  const circleId = await requireCircle(req, res);
  if (!circleId) return;
  const events = await Event.find({ circle: circleId }).sort({ startTime: 1 });
  res.json({ events });
});

router.post("/", auth, async (req, res) => {
  const circleId = await requireCircle(req, res);
  if (!circleId) return;

  const { title, notes, startTime, endTime, reminderMinutesBefore } = req.body;
  if (!title || !startTime) {
    return res.status(400).json({ message: "title and startTime are required" });
  }

  const event = await Event.create({
    circle: circleId,
    createdBy: req.userId,
    title,
    notes,
    startTime,
    endTime,
    reminderMinutesBefore
  });
  res.status(201).json({ event });
});

router.put("/:id", auth, async (req, res) => {
  const circleId = await requireCircle(req, res);
  if (!circleId) return;

  const event = await Event.findOneAndUpdate(
    { _id: req.params.id, circle: circleId },
    req.body,
    { new: true }
  );
  if (!event) return res.status(404).json({ message: "Event not found" });
  res.json({ event });
});

router.delete("/:id", auth, async (req, res) => {
  const circleId = await requireCircle(req, res);
  if (!circleId) return;

  const event = await Event.findOneAndDelete({ _id: req.params.id, circle: circleId });
  if (!event) return res.status(404).json({ message: "Event not found" });
  res.json({ message: "Event deleted" });
});

module.exports = router;
