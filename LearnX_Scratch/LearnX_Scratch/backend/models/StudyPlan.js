const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    title: String,
    subject: String,
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    duration: String,
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    day: String,
    date: String,
    tasks: [taskSchema],
  },
  { _id: false }
);

const studyPlanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subjects: String,
    topics: String,
    examDate: String,
    hours: Number,
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    tasks: [daySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudyPlan", studyPlanSchema);