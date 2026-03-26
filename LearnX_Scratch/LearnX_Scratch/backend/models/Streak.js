const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    title: { type: String, required: true },
    points: { type: Number, required: true, default: 0 },
    dateKey: { type: String, required: true }, // YYYY-MM-DD
    completedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const streakSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    rank: { type: Number, default: 5 },
    lastActiveDateKey: { type: String, default: null },
    activityLog: { type: [activityLogSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Streak", streakSchema);