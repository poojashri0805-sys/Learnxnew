const mongoose = require("mongoose");

const chatHistorySchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        gradeClass: {
            type: String,
            required: true,
        },
        subject: {
            type: String,
            default: "General",
        },
        question: {
            type: String,
            required: true,
        },
        answer: {
            type: String,
            required: true,
        },
        sessionId: {
            type: String,
            required: true,
            default: "old-session",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ChatHistory", chatHistorySchema);