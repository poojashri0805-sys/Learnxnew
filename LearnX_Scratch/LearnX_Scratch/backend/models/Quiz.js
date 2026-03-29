const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    topic: {
      type: String,
      default: "",
    },
    subject: {
      type: String,
      default: "",
    },
    className: {
      type: String,
      default: "",
    },
    teacherName: {
      type: String,
      default: "",
    },
    teacher: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    questions: [
      {
        question: String,
        options: [String],
        correctAnswer: String,
      },
    ],
    type: {
      type: String,
      default: "MCQ",
    },
    difficulty: {
      type: String,
      default: "Medium",
    },
    timer: {
      type: Number,
      default: 60,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", quizSchema);