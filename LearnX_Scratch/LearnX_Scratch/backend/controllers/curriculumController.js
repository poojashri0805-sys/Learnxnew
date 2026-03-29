const CurriculumTracker = require("../models/Curriculum");

// Fix MongoDB indexes on startup
async function fixIndexes() {
  try {
    const collection = CurriculumTracker.collection;
    
    // Get all existing indexes
    const indexes = await collection.getIndexes();
    console.log("[Curriculum] Existing indexes:", Object.keys(indexes));
    
    // Drop old unique index on teacherId if it exists
    if (indexes.teacherId_1) {
      console.log("[Curriculum] Dropping old teacherId_1 index");
      await collection.dropIndex("teacherId_1");
    }
    
    // Ensure compound index exists
    console.log("[Curriculum] Creating compound index (teacherId_1, className_1)");
    await collection.createIndex({ teacherId: 1, className: 1 }, { unique: true });
    
    console.log("[Curriculum] Indexes fixed successfully");
  } catch (error) {
    console.error("[Curriculum] Error fixing indexes:", error.message);
  }
}

// Call on module load
setTimeout(() => fixIndexes(), 1000);

function createDefaultTracker(teacherId) {
  return {
    teacherId,
    className: "Grade 10",
    academicYear: "2025-2026",
    warningMessage:
      "At Risk — Need 10 more days than available to finish the remaining curriculum.",
    targetDate: new Date("2026-04-12"),
    subjects: [
      {
        name: "Math",
        order: 1,
        topics: [
          { name: "Algebraic expressions", status: "Done", order: 1 },
          { name: "Quadratic equations", status: "Done", order: 2 },
          { name: "Trigonometry", status: "Pending", order: 3 },
          { name: "Integration", status: "Pending", order: 4 },
        ],
      },
      {
        name: "Physics",
        order: 2,
        topics: [
          { name: "Newton's laws", status: "Done", order: 1 },
          { name: "Work & motion", status: "In Progress", order: 2 },
          { name: "Mechanics", status: "Pending", order: 3 },
        ],
      },
      {
        name: "Chemistry",
        order: 3,
        topics: [
          { name: "Atomic structure", status: "Done", order: 1 },
          { name: "Organic chemistry", status: "In Progress", order: 2 },
        ],
      },
      {
        name: "Biology",
        order: 4,
        topics: [
          { name: "Cell biology", status: "Done", order: 1 },
          { name: "Genetics", status: "Pending", order: 2 },
        ],
      },
    ],
  };
}

function toPlain(doc) {
  return doc?.toObject ? doc.toObject() : doc;
}

function decorateTracker(doc) {
  const tracker = toPlain(doc);

  let totalTopics = 0;
  let completedTopics = 0;

  const subjects = (tracker.subjects || [])
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((subject) => {
      const topics = (subject.topics || [])
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((topic) => {
          totalTopics += 1;
          if (topic.status === "Done") completedTopics += 1;
          return topic;
        });

      const topicCount = topics.length;
      const subjectCompleted = topics.filter((t) => t.status === "Done").length;
      const subjectInProgress = topics.filter((t) => t.status === "In Progress").length;
      const subjectPending = topics.filter((t) => t.status === "Pending").length;

      return {
        ...subject,
        topics,
        topicCount,
        completedTopics: subjectCompleted,
        inProgressTopics: subjectInProgress,
        pendingTopics: subjectPending,
      };
    });

  const overallCompletion = totalTopics
    ? Math.round((completedTopics / totalTopics) * 100)
    : 0;

  return {
    ...tracker,
    subjects,
    totalTopics,
    completedTopics,
    overallCompletion,
  };
}

async function getTeacherId(req) {
  return (
    req.user?.teacherId ||
    req.user?._id?.toString() ||
    req.headers["x-teacher-id"] ||
    req.params.teacherId ||
    req.body.teacherId ||
    "demo-teacher"
  );
}

async function loadOrCreateTracker(teacherId, className = "Grade 10") {
  let tracker = await CurriculumTracker.findOne({ teacherId, className });

  if (!tracker) {
    tracker = await CurriculumTracker.create({
      teacherId,
      className,
      academicYear: "2025-2026",
      warningMessage: "At Risk — Need 10 more days than available to finish the remaining curriculum.",
      targetDate: new Date("2026-04-12"),
      subjects: [
        {
          name: "Math",
          order: 1,
          topics: [
            { name: "Algebraic expressions", status: "Done", order: 1 },
            { name: "Quadratic equations", status: "Done", order: 2 },
            { name: "Trigonometry", status: "Pending", order: 3 },
            { name: "Integration", status: "Pending", order: 4 },
          ],
        },
        {
          name: "Physics",
          order: 2,
          topics: [
            { name: "Newton's laws", status: "Done", order: 1 },
            { name: "Work & motion", status: "In Progress", order: 2 },
            { name: "Mechanics", status: "Pending", order: 3 },
          ],
        },
        {
          name: "Chemistry",
          order: 3,
          topics: [
            { name: "Atomic structure", status: "Done", order: 1 },
            { name: "Organic chemistry", status: "In Progress", order: 2 },
          ],
        },
        {
          name: "Biology",
          order: 4,
          topics: [
            { name: "Cell biology", status: "Done", order: 1 },
            { name: "Genetics", status: "Pending", order: 2 },
          ],
        },
      ],
    });
  }

  return tracker;
}

exports.getMyCurriculum = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req);
    const className = req.query.className || req.body.className || "Grade 10";
    const tracker = await loadOrCreateTracker(teacherId, className);

    tracker.overallCompletion = decorateTracker(tracker).overallCompletion;
    await tracker.save();

    res.json(decorateTracker(tracker));
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch curriculum tracker",
      error: error.message,
    });
  }
};

exports.updateCurriculum = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req);
    const className = req.query.className || req.body.className || "Grade 10";
    const tracker = await loadOrCreateTracker(teacherId, className);

    const {
      academicYear,
      warningMessage,
      targetDate,
    } = req.body;

    if (academicYear !== undefined) tracker.academicYear = academicYear;
    if (warningMessage !== undefined) tracker.warningMessage = warningMessage;
    if (targetDate !== undefined) tracker.targetDate = targetDate || null;

    const decorated = decorateTracker(tracker);
    tracker.overallCompletion = decorated.overallCompletion;

    await tracker.save();
    res.json(decorateTracker(tracker));
  } catch (error) {
    res.status(500).json({
      message: "Failed to update curriculum tracker",
      error: error.message,
    });
  }
};

exports.addSubject = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req);
    const className = req.query.className || req.body.className || "Grade 10";
    const tracker = await loadOrCreateTracker(teacherId, className);
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Subject name is required" });
    }

    tracker.subjects.push({
      name: name.trim(),
      order: tracker.subjects.length + 1,
      topics: [],
    });

    const decorated = decorateTracker(tracker);
    tracker.overallCompletion = decorated.overallCompletion;

    await tracker.save();
    res.status(201).json(decorateTracker(tracker));
  } catch (error) {
    res.status(500).json({
      message: "Failed to add subject",
      error: error.message,
    });
  }
};

exports.addTopic = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req);
    const className = req.query.className || req.body.className || "Grade 10";
    const tracker = await loadOrCreateTracker(teacherId, className);

    const { subjectId, name, status = "Pending" } = req.body;

    if (!subjectId) {
      return res.status(400).json({ message: "subjectId is required" });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Topic name is required" });
    }

    const subject = tracker.subjects.id(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    subject.topics.push({
      name: name.trim(),
      status,
      order: subject.topics.length + 1,
    });

    const decorated = decorateTracker(tracker);
    tracker.overallCompletion = decorated.overallCompletion;

    await tracker.save();
    res.status(201).json(decorateTracker(tracker));
  } catch (error) {
    res.status(500).json({
      message: "Failed to add topic",
      error: error.message,
    });
  }
};

exports.updateTopic = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req);
    const className = req.query.className || req.body.className || "Grade 10";
    const tracker = await loadOrCreateTracker(teacherId, className);
    const { topicId } = req.params;
    const { subjectId, name, status, subjectName } = req.body;

    let targetSubject = null;
    let targetTopic = null;

    // First try to find by topicId if provided (MongoDB ID)
    if (subjectId) {
      try {
        targetSubject = tracker.subjects.id(subjectId);
        if (targetSubject) {
          targetTopic = targetSubject.topics.id(topicId);
        }
      } catch (err) {
        console.log(`[updateTopic] Could not find by MongoDB ID: ${err.message}`);
      }
    }

    // If not found by ID, try to find by subject name + topic name
    if (!targetTopic && subjectName && name) {
      console.log(`[updateTopic] Searching by subject name "${subjectName}" and topic name "${name}"`);
      
      for (const subject of tracker.subjects) {
        if (subject.name.toLowerCase() === subjectName.toLowerCase()) {
          targetSubject = subject;
          // Find topic by name
          const maybeTopic = subject.topics.find(t => 
            t.name && t.name.toLowerCase() === name.toLowerCase()
          );
          if (maybeTopic) {
            targetTopic = maybeTopic;
            break;
          }
        }
      }
    }

    // Last resort: search all subjects for topicId
    if (!targetTopic) {
      for (const subject of tracker.subjects) {
        try {
          const maybeTopic = subject.topics.id(topicId);
          if (maybeTopic) {
            targetSubject = subject;
            targetTopic = maybeTopic;
            break;
          }
        } catch (err) {
          continue;
        }
      }
    }

    if (!targetTopic) {
      console.log(`[updateTopic] Topic not found - topicId: ${topicId}, subject: ${subjectName}, name: ${name}`);
      return res.status(404).json({ message: "Topic not found" });
    }

    if (name !== undefined && name !== targetTopic.name) targetTopic.name = name;
    if (status !== undefined) targetTopic.status = status;

    const decorated = decorateTracker(tracker);
    tracker.overallCompletion = decorated.overallCompletion;

    await tracker.save();
    console.log(`[updateTopic] ✅ Updated topic: ${targetTopic.name} → ${status}`);
    res.json(decorateTracker(tracker));
  } catch (error) {
    console.error(`[updateTopic] Error:`, error);
    res.status(500).json({
      message: "Failed to update topic",
      error: error.message,
    });
  }
};

exports.deleteTopic = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req);
    const className = req.query.className || req.body.className || "Grade 10";
    const tracker = await loadOrCreateTracker(teacherId, className);
    const { topicId } = req.params;

    let removed = false;

    for (const subject of tracker.subjects) {
      const topic = subject.topics.id(topicId);
      if (topic) {
        topic.deleteOne();
        removed = true;
        break;
      }
    }

    if (!removed) {
      return res.status(404).json({ message: "Topic not found" });
    }

    const decorated = decorateTracker(tracker);
    tracker.overallCompletion = decorated.overallCompletion;

    await tracker.save();
    res.json(decorateTracker(tracker));
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete topic",
      error: error.message,
    });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req);
    const className = req.query.className || req.body.className || "Grade 10";
    const tracker = await loadOrCreateTracker(teacherId, className);
    const { subjectId } = req.params;

    const subject = tracker.subjects.id(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    subject.deleteOne();

    const decorated = decorateTracker(tracker);
    tracker.overallCompletion = decorated.overallCompletion;

    await tracker.save();
    res.json(decorateTracker(tracker));
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete subject",
      error: error.message,
    });
  }
};

// Update curriculum from lesson plan topics - SIMPLIFIED with findOneAndUpdate
exports.updateFromLessonPlan = async (teacherId, subject, topics, className = "Grade 10") => {
  try {
    console.log(`[updateFromLessonPlan] Starting with teacherId: ${teacherId}, subject: ${subject}, className: ${className}, topics count: ${topics?.length}`);
    
    if (!teacherId || !subject || !topics || topics.length === 0) {
      console.log(`[updateFromLessonPlan] Validation failed - missing required data`);
      return null;
    }

    // Find or create tracker using atomic operation
    let tracker = await CurriculumTracker.findOne({ teacherId, className });
    
    if (!tracker) {
      console.log(`[updateFromLessonPlan] Tracker not found, creating new tracker for ${teacherId} - ${className}`);
      tracker = await CurriculumTracker.create({
        teacherId,
        className,
        academicYear: "2025-2026",
        subjects: []
      });
    }

    console.log(`[updateFromLessonPlan] Operating on tracker with ${tracker.subjects.length} subjects`);

    // Find or create subject
    let subjectObj = tracker.subjects.find(s => s.name.toLowerCase() === subject.toLowerCase());
    
    if (!subjectObj) {
      console.log(`[updateFromLessonPlan] Subject "${subject}" not found, creating new subject`);
      subjectObj = {
        name: subject,
        order: tracker.subjects.length + 1,
        topics: []
      };
      tracker.subjects.push(subjectObj);
    } else {
      console.log(`[updateFromLessonPlan] Found existing subject "${subject}" with ${subjectObj.topics.length} topics`);
    }

    // Add or update topics
    let topicsAdded = 0;
    let topicsUpdated = 0;
    
    topics.forEach((topicName) => {
      if (!topicName || !topicName.trim()) return;

      const topicTrim = topicName.trim();
      const existingTopicIndex = subjectObj.topics.findIndex(
        t => t.name.toLowerCase() === topicTrim.toLowerCase()
      );

      if (existingTopicIndex === -1) {
        // Add new topic as "In Progress"
        subjectObj.topics.push({
          name: topicTrim,
          status: "In Progress",
          order: subjectObj.topics.length + 1
        });
        console.log(`[updateFromLessonPlan] Added topic: "${topicTrim}"`);
        topicsAdded++;
      } else if (subjectObj.topics[existingTopicIndex].status === "Pending") {
        // Update pending topic to "In Progress"
        subjectObj.topics[existingTopicIndex].status = "In Progress";
        console.log(`[updateFromLessonPlan] Updated topic "${topicTrim}" from Pending to In Progress`);
        topicsUpdated++;
      } else {
        console.log(`[updateFromLessonPlan] Topic "${topicTrim}" already exists with status "${subjectObj.topics[existingTopicIndex].status}"`);
      }
    });

    // Calculate completion
    const decorated = decorateTracker(tracker);
    tracker.overallCompletion = decorated.overallCompletion;

    // Save tracker
    await tracker.save();
    console.log(`[updateFromLessonPlan] ✅ Successfully updated curriculum tracker. Added: ${topicsAdded}, Updated: ${topicsUpdated}`);
    console.log(`[updateFromLessonPlan] Overall completion: ${decorated.overallCompletion}%`);
    
    return decorateTracker(tracker);
  } catch (error) {
    console.error("[updateFromLessonPlan] ❌ Error:", error.message);
    console.error("[updateFromLessonPlan] Stack:", error.stack);
    return null;
  }
};