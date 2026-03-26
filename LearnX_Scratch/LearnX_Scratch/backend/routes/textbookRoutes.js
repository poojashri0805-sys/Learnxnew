const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const upload = require("../config/upload");

const {
    uploadTextbook,
    extractTextFromTextbook,
    processTextbookChunks,
    generateEmbeddingsForTextbook,
    getTextbooksByGrade,
    getAllTextbooks,
} = require("../controllers/textbookController");

router.post("/upload", protect, upload.single("pdf"), uploadTextbook);
router.get("/", protect, getAllTextbooks);
router.get("/extract/:id", protect, extractTextFromTextbook);
router.post("/process/:id", protect, processTextbookChunks);
router.post("/embed/:id", protect, generateEmbeddingsForTextbook);
router.get("/:gradeClass", protect, getTextbooksByGrade);

module.exports = router;