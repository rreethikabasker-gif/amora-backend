const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema(
  {
    circle: { type: mongoose.Schema.Types.ObjectId, ref: "Circle", required: true, index: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    url: { type: String, required: true },
    caption: { type: String, default: "" },
    type: { type: String, enum: ["photo", "doodle"], default: "photo" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Photo", photoSchema);
