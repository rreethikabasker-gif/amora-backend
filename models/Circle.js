const mongoose = require("mongoose");

const circleSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Us" },
    inviteCode: { type: String, required: true, unique: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    anniversaryDate: { type: Date, default: null },
    theme: { type: String, default: "classic" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Circle", circleSchema);
