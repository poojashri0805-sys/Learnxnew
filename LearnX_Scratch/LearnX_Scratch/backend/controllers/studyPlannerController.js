const StudyPlan = require("../models/StudyPlan");
const ForestTree = require("../models/ForestTree");
const createNotification = require("../utils/createNotification");

function clamp(n, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n));
}

function splitTopics(value) {
  if (!value) return [];
  return String(value)
    .split(/\n|,|;/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

function splitSubjects(value) {
  if (!value) return ["Study"];
  const list = String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : ["Study"];
}

function parseLocalDate(value) {
  if (value instanceof Date) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const text = String(value || "").trim();
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
}

function formatDateISO(date) {
  const d = parseLocalDate(date) || new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(date, days) {
  const next = parseLocalDate(date) || new Date();
  next.setDate(next.getDate() + days);
  return next;
}

function daysUntilExam(examDate) {
  const today = parseLocalDate(new Date());
  const exam = parseLocalDate(examDate);
  if (!exam) return 1;

  const diff = Math.ceil((exam - today) / 86400000);
  return Math.max(1, diff + 1);
}

async function notifyExamReminder(userId, examDate) {
  if (!userId || !examDate) return;
  const daysLeft = daysUntilExam(examDate);

  if (daysLeft <= 7) {
    await createNotification({
      user: userId,
      type: "exam",
      title: "Exam date approaching",
      message: `Your exam is in ${daysLeft} day${daysLeft === 1 ? "" : "s"}. Stay on track with your study plan!`,
      link: "/study-planner",
    });
  }
}

function getTreeSizeFromMinutes(minutes) {
  if (minutes >= 90) return "large";
  if (minutes >= 45) return "medium";
  return "small";
}

function getSuggestedDuration(task, minutesPerDay) {
  if (!task || typeof task !== "object") return Math.min(60, minutesPerDay);
  if (task.type === "final") return Math.min(120, minutesPerDay);

  const suggested = {
    easy: 90,
    medium: 120,
    hard: 150,
  }[task.difficulty || "medium"];

  const minDuration = {
    easy: 60,
    medium: 80,
    hard: 100,
  }[task.difficulty || "medium"];

  const maxDuration = {
    easy: 150,
    medium: 210,
    hard: 240,
  }[task.difficulty || "medium"];

  return Math.min(Math.max(suggested, minDuration), Math.min(maxDuration, minutesPerDay));
}

function countCompletedTasks(days) {
  return (days || []).reduce((sum, day) => {
    const done = (day.tasks || []).filter((task) => task.completed).length;
    return sum + done;
  }, 0);
}

function countTotalTasks(days) {
  return (days || []).reduce((sum, day) => sum + (day.tasks || []).length, 0);
}

function inferTreeStage(progress) {
  if (progress <= 0) return 0;
  if (progress < 0.25) return 1;
  if (progress < 0.5) return 2;
  if (progress < 0.8) return 3;
  return 4;
}

function parseTopicEntry(rawTopic) {
  const text = String(rawTopic || "").trim();
  if (!text) return null;

  const lower = text.toLowerCase();
  const difficultyMatch = text.match(/\(?\s*(easy|medium|hard)\s*\)?\s*$/i);
  const difficulty = difficultyMatch ? difficultyMatch[1].toLowerCase() : "medium";
  const title = difficultyMatch
    ? text.slice(0, difficultyMatch.index).replace(/[-|:\s()]+$/g, "").trim()
    : text;

  const weightMap = {
    easy: 0.7,
    medium: 1,
    hard: 1.4,
  };

  return {
    title: title || "Study topic",
    difficulty: difficulty in weightMap ? difficulty : "medium",
    weight: weightMap[difficulty] || 1,
  };
}

function buildPlanDays({ subjects, topics, examDate, hours }) {
  const subjectList = splitSubjects(subjects);
  const topicList = splitTopics(topics)
    .map(parseTopicEntry)
    .filter(Boolean);

  const safeTopics =
    topicList.length > 0
      ? topicList
      : splitSubjects(subjects).map((s) => ({
          title: `${s} revision`,
          difficulty: "medium",
          weight: 1,
        }));

  const totalDaysAvailable = daysUntilExam(examDate);
  const minutesPerDay = Math.max(60, Number(hours || 5) * 60);
  const maxSessionsByHours = Math.max(1, Math.min(3, Math.floor(minutesPerDay / 90)));

  const today = parseLocalDate(new Date());

  const coreTasks = safeTopics.map((topic, index) => ({
    ...topic,
    type: "core",
    subject:
      subjectList[index % subjectList.length] || subjectList[0] || "Study",
  }));

  const sessionsPerDay = Math.min(
    maxSessionsByHours,
    Math.max(1, Math.ceil(coreTasks.length / Math.max(1, totalDaysAvailable)))
  );

  const totalSlots = totalDaysAvailable * sessionsPerDay;
  const planTasks = coreTasks.slice(0, totalSlots);

  const remainingSlots = totalSlots - planTasks.length;
  if (remainingSlots > 0) {
    if (remainingSlots >= 1) {
      planTasks.push({
        title: "Final revision of all topics",
        difficulty: "medium",
        weight: 1.1,
        type: "final",
        subject: subjectList[0] || "Study",
      });
    }
    if (remainingSlots >= 2) {
      planTasks.push({
        title: "Last minute notes and tips",
        difficulty: "medium",
        weight: 0.9,
        type: "final",
        subject: subjectList[0] || "Study",
      });
    }
    for (let i = planTasks.length; i < totalSlots; i += 1) {
      const topic = coreTasks[i % coreTasks.length] || safeTopics[0];
      planTasks.push({
        title: `Revision of ${topic.title}`,
        difficulty: "medium",
        weight: 0.9,
        type: "revision",
        subject: topic.subject || subjectList[0] || "Study",
      });
    }
  }

  const days = Array.from({ length: totalDaysAvailable }, (_, dayIndex) => {
    const dayTasks = planTasks.slice(
      dayIndex * sessionsPerDay,
      (dayIndex + 1) * sessionsPerDay
    );

    const tasks = dayTasks.map((task, taskIndex) => {
      const isSingleTaskDay = dayTasks.length === 1;
      const durationMinutes = isSingleTaskDay
        ? getSuggestedDuration(task, minutesPerDay)
        : (() => {
            const totalWeight = dayTasks.reduce((sum, current) => sum + current.weight, 0);
            const rawMinutes = Math.max(
              30,
              Math.round((minutesPerDay * task.weight) / Math.max(1, totalWeight))
            );
            const minMinutes = Math.max(30, getSuggestedDuration(task, minutesPerDay) / 2);
            return Math.max(
              minMinutes,
              Math.min(
                rawMinutes,
                minutesPerDay - 30 * (dayTasks.length - taskIndex - 1)
              )
            );
          })();

      return {
        title: task.title,
        subject: task.subject || subjectList[(dayIndex + taskIndex) % subjectList.length] || subjectList[0] || "Study",
        duration: `${Math.round(durationMinutes)} min`,
        completed: false,
        completedAt: null,
        treeStage: 0,
        progress: 0,
        sessionHistory: [],
      };
    });

    return {
      day: `Day ${dayIndex + 1}`,
      date: formatDateISO(addDays(today, dayIndex)),
      tasks,
    };
  });

  return days.filter((day) => day.tasks.length > 0);
}

function carryForwardCompletion(previousPlan, nextDays) {
  const previousTasks = [];
  (previousPlan?.tasks || []).forEach((day) => {
    (day.tasks || []).forEach((task) => previousTasks.push(task));
  });

  return nextDays.map((day) => ({
    ...day,
    tasks: day.tasks.map((task) => {
      const match = previousTasks.find(
        (prev) =>
          prev.title.trim().toLowerCase() === task.title.trim().toLowerCase() &&
          prev.subject.trim().toLowerCase() === task.subject.trim().toLowerCase()
      );

      if (match?.completed) {
        return {
          ...task,
          completed: true,
          completedAt: match.completedAt || new Date(),
          treeStage: match.treeStage ?? task.treeStage,
          progress: match.progress ?? task.progress,
        };
      }

      return task;
    }),
  }));
}

function getRequestUserId(req) {
  return req.user?._id || req.user?.id || null;
}

async function findOwnedPlan(req, id) {
  const userId = getRequestUserId(req);
  if (!userId) return null;
  return StudyPlan.findOne({ _id: id, userId });
}

exports.getStudyPlans = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const plans = await StudyPlan.find({ userId }).sort({ createdAt: -1 });
    return res.json(plans);
  } catch (error) {
    console.error("Get study plans error:", error);
    return res.status(500).json({ message: "Failed to load study plans" });
  }
};

exports.generateStudyPlan = async (req, res) => {
  try {
    const userId = getRequestUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const { subjects, topics, examDate, hours } = req.body;

    if (!subjects || !topics || !examDate) {
      return res.status(400).json({ message: "Subjects, topics, and exam date are required" });
    }

    const tasks = buildPlanDays({
      subjects,
      topics,
      examDate,
      hours: Number(hours || 5),
    });

    const plan = await StudyPlan.create({
      userId,
      subjects,
      topics,
      examDate,
      hours: Number(hours || 5),
      status: "active",
      tasks,
      totalTasks: countTotalTasks(tasks),
      completedTasks: 0,
    });

    if (plan.userId) {
      await createNotification({
        user: plan.userId,
        type: "study",
        title: "Study plan ready",
        message: "Your study plan has been created. Start your first session now.",
        link: "/study-planner",
      });
      await notifyExamReminder(plan.userId, plan.examDate);
    }

    return res.status(201).json(plan);
  } catch (error) {
    console.error("Generate study plan error:", error);
    return res.status(500).json({ message: "Failed to generate study plan" });
  }
};

exports.updateStudyPlan = async (req, res) => {
  try {
    const plan = await findOwnedPlan(req, req.params.id);
    if (!plan) return res.status(404).json({ message: "Study plan not found" });

    const { subjects, topics, examDate, hours } = req.body;

    const previousSnapshot = plan.toObject();

    if (subjects !== undefined) plan.subjects = subjects;
    if (topics !== undefined) plan.topics = topics;
    if (examDate !== undefined) plan.examDate = examDate;
    if (hours !== undefined) plan.hours = Number(hours);

    const wantsRebuild =
      subjects !== undefined ||
      topics !== undefined ||
      examDate !== undefined ||
      hours !== undefined;

    if (wantsRebuild) {
      const nextDays = buildPlanDays({
        subjects: plan.subjects,
        topics: plan.topics,
        examDate: plan.examDate,
        hours: plan.hours,
      });

      plan.tasks = carryForwardCompletion(previousSnapshot, nextDays);
      plan.totalTasks = countTotalTasks(plan.tasks);
      plan.completedTasks = countCompletedTasks(plan.tasks);
      plan.status = plan.completedTasks === plan.totalTasks && plan.totalTasks > 0
        ? "completed"
        : "active";
    }

    await plan.save();
    await notifyExamReminder(plan.userId, plan.examDate);
    return res.json(plan);
  } catch (error) {
    console.error("Update study plan error:", error);
    return res.status(500).json({ message: "Failed to update study plan" });
  }
};

exports.deleteStudyPlan = async (req, res) => {
  try {
    const plan = await findOwnedPlan(req, req.params.id);
    if (!plan) return res.status(404).json({ message: "Study plan not found" });

    await plan.deleteOne();
    return res.json({ message: "Study plan deleted" });
  } catch (error) {
    console.error("Delete study plan error:", error);
    return res.status(500).json({ message: "Failed to delete study plan" });
  }
};

exports.completeTask = async (req, res) => {
  try {
    const { planId, dayIndex, taskIndex } = req.body;

    if (!planId && planId !== 0) {
      return res.status(400).json({ message: "planId is required" });
    }

    const plan = await findOwnedPlan(req, planId);
    if (!plan) return res.status(404).json({ message: "Study plan not found" });

    const day = plan.tasks?.[Number(dayIndex)];
    const task = day?.tasks?.[Number(taskIndex)];

    if (!day || !task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const wasCompleted = task.completed;
    if (!task.completed) {
      task.completed = true;
      task.completedAt = new Date();
      task.treeStage = 4;
      task.progress = 1;
    }

    plan.completedTasks = countCompletedTasks(plan.tasks);
    plan.totalTasks = countTotalTasks(plan.tasks);
    plan.status =
      plan.completedTasks === plan.totalTasks && plan.totalTasks > 0
        ? "completed"
        : "active";

    await plan.save();

    if (!wasCompleted && plan.userId) {
      await createNotification({
        user: plan.userId,
        type: "study",
        title: "Task completed",
        message: `Nice work! You completed "${task.title}" from your study plan.`,
        link: "/study-planner",
      });
    }

    return res.json(plan);
  } catch (error) {
    console.error("Complete task error:", error);
    return res.status(500).json({ message: "Failed to update task" });
  }
};

exports.endSessionAndPlantTree = async (req, res) => {
  try {
    const {
      planId,
      dayIndex,
      taskIndex,
      topic,
      subject,
      progress,
      treeStage,
      elapsedSeconds,
    } = req.body;

    const plan = await findOwnedPlan(req, planId);
    if (!plan) return res.status(404).json({ message: "Study plan not found" });

    const day = plan.tasks?.[Number(dayIndex)];
    const task = day?.tasks?.[Number(taskIndex)];
    if (!day || !task) {
      return res.status(404).json({ message: "Task not found" });
    }

    if (!task.completed) {
      task.completed = true;
      task.completedAt = new Date();
    }

    task.progress = clamp(Number(progress) || 0);
    task.treeStage =
      Number.isFinite(Number(treeStage)) ? Number(treeStage) : inferTreeStage(task.progress);
    task.sessionHistory = [
      ...(task.sessionHistory || []),
      {
        startedAt: task.sessionHistory?.length ? task.sessionHistory.at(-1)?.startedAt : new Date(),
        pausedAt: null,
        endedAt: new Date(),
        elapsedSeconds: Number(elapsedSeconds || 0),
        treeStage: task.treeStage,
        progress: task.progress,
      },
    ];

    plan.completedTasks = countCompletedTasks(plan.tasks);
    plan.totalTasks = countTotalTasks(plan.tasks);
    plan.status =
      plan.completedTasks === plan.totalTasks && plan.totalTasks > 0
        ? "completed"
        : "active";

    await plan.save();

    if (plan.userId) {
      await createNotification({
        user: plan.userId,
        type: "study",
        title: "Study session completed",
        message: `Great job! Your session for "${topic || task.title}" is complete, and your tree has grown.`,
        link: "/study-planner",
      });
    }

    const plantedTree = await ForestTree.create({
      userId: plan.userId || req.user?._id || req.user?.id || null,
      planId: plan._id,
      dayIndex: Number(dayIndex),
      taskIndex: Number(taskIndex),
      topic: topic || task.title,
      subject: subject || task.subject || plan.subjects || "Study",
      progress: task.progress,
      treeStage: task.treeStage,
      duration: Number(elapsedSeconds || 0),
      size: getTreeSizeFromMinutes(Math.max(1, Math.round(Number(elapsedSeconds || 0) / 60))),
      plantedAt: new Date(),
    });

    return res.status(201).json({
      plan,
      tree: plantedTree,
    });
  } catch (error) {
    console.error("End session error:", error);
    return res.status(500).json({ message: "Failed to end session" });
  }
};