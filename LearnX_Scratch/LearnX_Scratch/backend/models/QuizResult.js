const mongoose = require("mongoose");

const quizResultSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    quizId: {
      type: String,
      default: "",
    },
    quizTitle: {
      type: String,
      default: "",
    },
    subject: {
      type: String,
      default: "",
    },
    topic: {
      type: String,
      default: "",
    },
    teacherName: {
      type: String,
      default: "",
    },
    className: {
      type: String,
      default: "",
    },
    score: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizResult", quizResultSchema);