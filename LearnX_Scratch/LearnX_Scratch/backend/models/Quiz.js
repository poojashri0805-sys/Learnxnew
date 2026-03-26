const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
    title: String,
    teacher: String, // simple for now (we can improve later)
    questions: [
        {
            question: String,
            options: [String],
            correctAnswer: String
        }
    ]
});

module.exports = mongoose.model("Quiz", quizSchema);