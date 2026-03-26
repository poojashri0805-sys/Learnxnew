const express = require("express");
const { generateLessonPlan } = require("../controllers/lessonPlannerController");

const router = express.Router();

router.post("/", generateLessonPlan);

module.exports = router;