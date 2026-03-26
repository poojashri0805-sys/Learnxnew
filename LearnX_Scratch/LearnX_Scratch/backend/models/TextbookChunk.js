const mongoose = require("mongoose");

const textbookChunkSchema = new mongoose.Schema(
    {
        textbookId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Textbook",
            required: true,
        },
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
            default: "",
        },
        chunkIndex: {
            type: Number,
            required: true,
        },
        chunkText: {
            type: String,
            required: true,
        },
        embedding: {
            type: [Number],
            default: [],
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("TextbookChunk", textbookChunkSchema);