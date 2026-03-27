const mongoose = require("mongoose");

const { Schema } = mongoose;

const TopicSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Done", "In Progress", "Pending"],
      default: "Pending",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { _id: true }
);

const SubjectSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    topics: {
      type: [TopicSchema],
      default: [],
    },
  },
  { _id: true }
);

const CurriculumTrackerSchema = new Schema(
  {
    teacherId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    className: {
      type: String,
      default: "Class 12",
    },
    academicYear: {
      type: String,
      default: "2025-2026",
    },
    warningMessage: {
      type: String,
      default:
        "At Risk — Need 10 more days than available to finish the remaining curriculum.",
    },
    targetDate: {
      type: Date,
      default: null,
    },
    subjects: {
      type: [SubjectSchema],
      default: [],
    },
    overallCompletion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CurriculumTracker", CurriculumTrackerSchema);