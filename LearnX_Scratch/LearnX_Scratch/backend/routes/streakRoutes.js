const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const {
  getStreakDashboard,
  completeActivity,
} = require("../controllers/streakController");

router.get("/", protect, getStreakDashboard);
router.post("/complete/:activityKey", protect, completeActivity);

module.exports = router;