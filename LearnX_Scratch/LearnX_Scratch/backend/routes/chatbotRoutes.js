const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");
const {
    askChatbot,
    getChatHistory,
} = require("../controllers/chatbotController");

router.post("/ask", protect, askChatbot);
router.get("/history", protect, getChatHistory);

module.exports = router;