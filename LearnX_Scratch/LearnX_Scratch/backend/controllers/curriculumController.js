const CurriculumTracker = require("../models/CurriculumTracker");

function createDefaultTracker(teacherId) {
  return {
    teacherId,
    className: "Class 12",
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

async function loadOrCreateTracker(teacherId) {
  let tracker = await CurriculumTracker.findOne({ teacherId });

  if (!tracker) {
    tracker = await CurriculumTracker.create(createDefaultTracker(teacherId));
  }

  return tracker;
}

exports.getMyCurriculum = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req);
    const tracker = await loadOrCreateTracker(teacherId);

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
    const tracker = await loadOrCreateTracker(teacherId);

    const {
      className,
      academicYear,
      warningMessage,
      targetDate,
    } = req.body;

    if (className !== undefined) tracker.className = className;
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
    const tracker = await loadOrCreateTracker(teacherId);
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
    const tracker = await loadOrCreateTracker(teacherId);

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
    const tracker = await loadOrCreateTracker(teacherId);
    const { topicId } = req.params;
    const { subjectId, name, status } = req.body;

    let targetSubject = null;
    let targetTopic = null;

    if (subjectId) {
      targetSubject = tracker.subjects.id(subjectId);
      if (targetSubject) {
        targetTopic = targetSubject.topics.id(topicId);
      }
    }

    if (!targetTopic) {
      for (const subject of tracker.subjects) {
        const maybeTopic = subject.topics.id(topicId);
        if (maybeTopic) {
          targetSubject = subject;
          targetTopic = maybeTopic;
          break;
        }
      }
    }

    if (!targetTopic) {
      return res.status(404).json({ message: "Topic not found" });
    }

    if (name !== undefined) targetTopic.name = name;
    if (status !== undefined) targetTopic.status = status;

    const decorated = decorateTracker(tracker);
    tracker.overallCompletion = decorated.overallCompletion;

    await tracker.save();
    res.json(decorateTracker(tracker));
  } catch (error) {
    res.status(500).json({
      message: "Failed to update topic",
      error: error.message,
    });
  }
};

exports.deleteTopic = async (req, res) => {
  try {
    const teacherId = await getTeacherId(req);
    const tracker = await loadOrCreateTracker(teacherId);
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
    const tracker = await loadOrCreateTracker(teacherId);
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