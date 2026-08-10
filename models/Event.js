const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    circle: { type: mongoose.Schema.Types.ObjectId, ref: "Circle", required: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    notes: { type: String, default: "" },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    reminderMinutesBefore: { type: Number, default: 30 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
