const mongoose = require("mongoose");

const textbookSchema = new mongoose.Schema(
    {
        gradeClass: {
            type: String,
            required: true,
        },
        subject: {
            type: String,
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        originalFileName: {
            type: String,
            required: true,
        },
        filePath: {
            type: String,
            required: true,
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Textbook", textbookSchema);