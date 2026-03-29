const express = require("express");
const { generateLessonPlan } = require("../controllers/lessonPlannerController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, generateLessonPlan);

module.exports = router;