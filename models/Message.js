const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    circle: { type: mongoose.Schema.Types.ObjectId, ref: "Circle", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: "" },
    photoUrl: { type: String, default: "" },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
