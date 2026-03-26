const express = require("express");
const multer = require("multer");
const { generateFlashcards, generateQuiz } = require("../controllers/aiController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/flashcards", upload.single("pdf"), generateFlashcards);
router.post("/quiz", generateQuiz);

module.exports = router;