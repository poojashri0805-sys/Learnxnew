const mongoose = require("mongoose");

const taskSessionSchema = new mongoose.Schema(
  {
    startedAt: { type: Date, default: null },
    pausedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    elapsedSeconds: { type: Number, default: 0 },
    treeStage: { type: Number, default: 0 },
    progress: { type: Number, default: 0 },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    subject: { type: String, default: "Study" },
    duration: { type: String, default: "25 min" },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    treeStage: { type: Number, default: 0 },
    progress: { type: Number, default: 0 },
    sessionHistory: { type: [taskSessionSchema], default: [] },
  },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    day: { type: String, required: true },
    date: { type: String, required: true },
    tasks: { type: [taskSchema], default: [] },
  },
  { _id: false }
);

const studyPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    subjects: { type: String, required: true, trim: true },
    topics: { type: String, required: true, trim: true },
    examDate: { type: String, required: true },
    hours: { type: Number, default: 5 },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    totalTasks: { type: Number, default: 0 },
    completedTasks: { type: Number, default: 0 },
    tasks: { type: [daySchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudyPlan", studyPlanSchema);