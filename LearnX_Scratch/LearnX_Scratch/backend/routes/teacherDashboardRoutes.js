const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { getTeacherDashboard } = require("../controllers/teacherDashboardController");

router.get("/dashboard", authMiddleware, getTeacherDashboard);

module.exports = router;