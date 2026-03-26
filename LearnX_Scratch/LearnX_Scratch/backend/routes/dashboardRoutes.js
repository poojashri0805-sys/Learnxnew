const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");
const { getStudentDashboard } = require("../controllers/dashboardController");

router.get("/", protect, getStudentDashboard);

module.exports = router;