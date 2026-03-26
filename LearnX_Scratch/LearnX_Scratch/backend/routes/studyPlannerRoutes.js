const express = require("express");
const router = express.Router();

const {
  getPlans,
  updateTask,
  deletePlan,
} = require("../controllers/studyPlannerController");

const {
  generateAIPlan,
  updateAIPlan,
} = require("../controllers/studyPlannerAIController");

const protect = require("../middleware/authMiddleware");

router.post("/generate", protect, generateAIPlan);
router.put("/:id", protect, updateAIPlan);

router.get("/", protect, getPlans);
router.put("/task", protect, updateTask);
router.delete("/:id", protect, deletePlan);

module.exports = router;