const express = require("express");
const router = express.Router();
const upload = require("../config/upload");
const authMiddleware = require("../middleware/authMiddleware");

const {
    uploadPerformanceData,
    getPerformanceDashboard,
    getStudentProfile,
    getAllGrades,
    addTestMarks,
    getDbStats,
} = require("../controllers/performanceController");

// Upload Excel performance data
router.post("/upload", authMiddleware, upload.single("file"), uploadPerformanceData);

// Debug: Get database statistics
router.get("/debug/stats", authMiddleware, getDbStats);

// Get all grades with subjects
router.get("/grades", authMiddleware, getAllGrades);

// Get performance dashboard for a grade and subject
router.get("/dashboard/:grade/:subject", authMiddleware, getPerformanceDashboard);

// Get student profile details
router.get("/student/:studentId/:grade/:subject", authMiddleware, getStudentProfile);

// Add more test marks
router.post("/student/:studentId/:grade/:subject/test", authMiddleware, addTestMarks);

module.exports = router;
