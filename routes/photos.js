const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();

const Photo = require("../models/Photo");
const User = require("../models/User");
const auth = require("../middleware/auth");

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "uploads")),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  }
});

router.post("/", auth, upload.single("photo"), async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user.circle) return res.status(400).json({ message: "Join or create a circle first" });
    if (!req.file) return res.status(400).json({ message: "No photo uploaded" });

    const type = req.body.type === "doodle" ? "doodle" : "photo";
    const photo = await Photo.create({
      circle: user.circle,
      uploadedBy: req.userId,
      url: `/uploads/${req.file.filename}`,
      caption: req.body.caption || "",
      type
    });

    const io = req.app.get("io");
    io.to(String(user.circle)).emit(type === "doodle" ? "doodle:new" : "photo:new", photo);

    res.status(201).json({ photo });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

router.get("/", auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user.circle) return res.status(400).json({ message: "Join or create a circle first" });

  const photos = await Photo.find({ circle: user.circle }).sort({ createdAt: -1 });
  res.json({ photos });
});

module.exports = router;
