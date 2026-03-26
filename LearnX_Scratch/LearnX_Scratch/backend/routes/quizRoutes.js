const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const {
  createQuizResult,
  getLatestQuizResult,
} = require("../controllers/quizResultController");

router.post("/", protect, createQuizResult);
router.get("/latest", protect, getLatestQuizResult);

module.exports = router;