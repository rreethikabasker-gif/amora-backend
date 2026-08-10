const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
  {
    circle: { type: mongoose.Schema.Types.ObjectId, ref: "Circle", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["note", "mood"], required: true },
    text: { type: String, default: "" },
    mood: { type: String, default: "" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Note", noteSchema);
