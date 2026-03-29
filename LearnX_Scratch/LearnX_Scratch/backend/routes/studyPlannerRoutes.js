const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const {
  getStudyPlans,
  generateStudyPlan,
  updateStudyPlan,
  deleteStudyPlan,
  completeTask,
  endSessionAndPlantTree,
} = require("../controllers/studyPlannerController");

router.get("/", protect, getStudyPlans);
router.post("/generate", protect, generateStudyPlan);
router.put("/task", protect, completeTask);
router.post("/session/end", protect, endSessionAndPlantTree);
router.put("/:id", protect, updateStudyPlan);
router.delete("/:id", protect, deleteStudyPlan);

module.exports = router;