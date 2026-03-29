const express = require("express");
const router = express.Router();
const protect = require("../middleware/authMiddleware");

const {
  getForestTrees,
  deleteForestTree,
} = require("../controllers/forestController");

router.get("/", protect, getForestTrees);
router.delete("/:id", protect, deleteForestTree);

module.exports = router;