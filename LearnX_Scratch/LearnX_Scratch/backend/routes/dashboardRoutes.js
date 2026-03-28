const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    getStudentDashboard,
    getStudentAnalysis,
    getGrades,
    getGradeDashboard
} = require("../controllers/dashboardController");

router.get("/analysis/:studentId/:subject", getStudentAnalysis);
router.get("/", protect, getStudentDashboard);
router.get("/grades", getGrades);

// 🔥 IMPORTANT ROUTE
router.get("/grade/:grade/:subject", getGradeDashboard);

module.exports = router;