const mongoose = require("mongoose");

const forestTreeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "StudyPlan", required: true, index: true },
    dayIndex: { type: Number, required: true },
    taskIndex: { type: Number, required: true },
    topic: { type: String, required: true, trim: true },
    subject: { type: String, default: "Study" },
    progress: { type: Number, default: 0 },
    treeStage: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    size: {
      type: String,
      enum: ["small", "medium", "large"],
      default: "small",
    },
    plantedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

forestTreeSchema.index(
  { userId: 1, planId: 1, dayIndex: 1, taskIndex: 1 },
  { unique: true }
);

module.exports = mongoose.model("ForestTree", forestTreeSchema);