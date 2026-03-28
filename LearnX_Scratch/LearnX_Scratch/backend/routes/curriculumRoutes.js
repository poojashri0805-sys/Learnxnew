const express = require("express");
const router = express.Router();

const {
  getMyCurriculum,
  updateCurriculum,
  addSubject,
  addTopic,
  updateTopic,
  deleteTopic,
  deleteSubject,
} = require("../controllers/curriculumController");

router.get("/me", getMyCurriculum);
router.put("/me", updateCurriculum);

router.post("/subjects", addSubject);
router.delete("/subjects/:subjectId", deleteSubject);

router.post("/topics", addTopic);
router.patch("/topics/:topicId", updateTopic);
router.delete("/topics/:topicId", deleteTopic);

module.exports = router;