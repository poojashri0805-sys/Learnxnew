const mongoose = require("mongoose");

const studyMaterialSchema = new mongoose.Schema(
    {
        gradeClass: {
            type: String,
            required: true,
        },
        subject: {
            type: String,
            required: true,
        },
        chapter: {
            type: String,
            default: "",
        },
        title: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
        sourceType: {
            type: String,
            enum: ["book", "notes", "pdf"],
            default: "book",
        },
        embedding: {
            type: [Number],
            default: [],
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("StudyMaterial", studyMaterialSchema);