const Streak = require("../models/Streak");
const QuizResult = require("../models/QuizResult");
const StudyPlan = require("../models/StudyPlan");

const ACTIVITY_DEFINITIONS = [
  { key: "daily-study", title: "Daily Study", icon: "📚" },
  { key: "quiz-attempt", title: "Quiz Attempt", icon: "📝" },
  { key: "flashcard-review", title: "Flashcard Review", icon: "🃏" },
  { key: "ai-tutor-session", title: "AI Tutor Session", icon: "🤖" },
];

function getTodayKey() {
  try {
    const date = new Date();

    const year = date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
    });

    const month = date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      month: "2-digit",
    });

    const day = date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
    });

    return `${year}-${month}-${day}`;
  } catch (err) {
    console.error("getTodayKey error:", err);
    return new Date().toISOString().split("T")[0];
  }
}

function shiftDateKey(dateKey, days) {
  try {
    const [y, m, d] = dateKey.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);

    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
    }).format(date);
  } catch (err) {
    console.error("shiftDateKey error:", err);
    return getTodayKey();
  }
}

function formatRelativeTime(dateValue) {
  try {
    const date = new Date(dateValue);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } catch {
    return "Recently";
  }
}

function buildWeeklyPerformance(activityLog) {
  const counts = [0, 0, 0, 0, 0, 0, 0]; // Mon -> Sun

  for (const item of activityLog || []) {
    if (!item?.dateKey) continue;

    const [y, m, d] = item.dateKey.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.getDay(); // 0 Sun, 1 Mon, ...
    const idx = day === 0 ? 6 : day - 1; // Mon=0 ... Sun=6

    counts[idx] += Number(item.points || 0);
  }

  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return labels.map((day, idx) => ({
    day,
    score: Math.max(50, Math.min(100, 60 + counts[idx] * 1.2)),
  }));
}

function flattenStudyPlan(plan) {
  const output = [];
  const days = Array.isArray(plan?.tasks) ? plan.tasks : [];

  for (const day of days) {
    const dayTasks = Array.isArray(day?.tasks) ? day.tasks : [];
    for (const task of dayTasks) {
      output.push({
        title: task?.title || "Untitled task",
        sub: `${day?.day || "Study"} • ${task?.duration || "Task"}`,
        done: Boolean(task?.completed),
      });
    }
  }

  return output.slice(0, 4);
}

function buildAchievements({ currentStreak, quizScore, totalPoints, flashcardsReviewed }) {
  const items = [
    {
      title: "7-Day Streak",
      description: "Study 7 days in a row",
      icon: "🔥",
      progress: currentStreak,
      target: 7,
    },
    {
      title: "Quiz Master",
      description: "Score 80%+ on a quiz",
      icon: "🧠",
      progress: quizScore,
      target: 80,
    },
    {
      title: "Flashcard Pro",
      description: "Review 100 flashcards",
      icon: "🃏",
      progress: flashcardsReviewed,
      target: 100,
    },
    {
      title: "14-Day Streak",
      description: "Study 14 days in a row",
      icon: "⚡",
      progress: currentStreak,
      target: 14,
    },
    {
      title: "30-Day Streak",
      description: "Study 30 days in a row",
      icon: "🏅",
      progress: currentStreak,
      target: 30,
    },
    {
      title: "Top Scorer",
      description: "Reach 5,000 points",
      icon: "🏆",
      progress: totalPoints,
      target: 5000,
    },
  ];

  return items.map((item) => ({
    ...item,
    unlocked: (item.progress || 0) >= (item.target || 1),
  }));
}

function buildRecentActivity({ activityLog, quizResult }) {
  const log = Array.isArray(activityLog) ? activityLog : [];

  const recentFromLog = log.slice(-4).reverse().map((item) => {
    const def = ACTIVITY_DEFINITIONS.find((a) => a.key === item.key);

    return {
      title: `${def?.title || item.title || "Activity"} completed`,
      time: formatRelativeTime(item.completedAt || new Date()),
      icon: def?.icon || "✨",
    };
  });

  if (quizResult) {
    recentFromLog.unshift({
      title: `Quiz score: ${quizResult.percentage}% on ${
        quizResult.quizTitle || quizResult.topic || "latest quiz"
      }`,
      time: formatRelativeTime(quizResult.submittedAt || quizResult.createdAt),
      icon: "📝",
    });
  }

  return recentFromLog.slice(0, 5);
}

exports.getStudentDashboard = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const userId = req.user._id;
    const todayKey = getTodayKey();

    const streak = await Streak.findOne({ user: userId });
    const activityLog = Array.isArray(streak?.activityLog) ? streak.activityLog : [];

    const quizResult = await QuizResult.findOne({ user: userId }).sort({
      submittedAt: -1,
      createdAt: -1,
    });

    let activePlan = null;
    try {
      activePlan = await StudyPlan.findOne({
        user: userId,
        status: "active",
      }).sort({ updatedAt: -1, createdAt: -1 });
    } catch (planErr) {
      console.error("StudyPlan lookup error:", planErr.message);
    }

    const allStreaks = await Streak.find({ user: { $ne: null } })
      .select("user totalPoints")
      .sort({ totalPoints: -1 })
      .lean();

    const rank =
      allStreaks.findIndex(
        (entry) => entry.user?.toString?.() === userId.toString()
      ) + 1 || allStreaks.length + 1;

    const todayActivities = activityLog.filter(
      (item) => item?.dateKey === todayKey
    );

    const todayCompletedKeys = new Set(
      todayActivities.map((item) => item?.key).filter(Boolean)
    );

    const flashcardReviewsToday = todayActivities.filter(
      (item) => item?.key === "flashcard-review"
    ).length;

    const currentStreak = streak?.currentStreak || 0;
    const totalPoints = streak?.totalPoints || 0;
    const quizScore = quizResult?.percentage || 0;
    const quizCount = await QuizResult.countDocuments({ user: userId });

    const weeklyPerformance = buildWeeklyPerformance(activityLog);
    const recentActivity = buildRecentActivity({ activityLog, quizResult });

    const todayPlan = flattenStudyPlan(activePlan);
    const todayPlanDone = todayPlan.filter((item) => item.done).length;
    const studyProgress = todayPlan.length
      ? Math.round((todayPlanDone / todayPlan.length) * 100)
      : Math.min(100, Math.round((todayActivities.length / 3) * 100));

    const flashcardsDue = Math.max(0, 24 - flashcardReviewsToday);

    const achievements = buildAchievements({
      currentStreak,
      quizScore,
      totalPoints,
      flashcardsReviewed: activityLog.filter(
        (item) => item?.key === "flashcard-review"
      ).length,
    });

    const badgesEarned = achievements.filter((item) => item.unlocked).length;

    const liveActivities = ACTIVITY_DEFINITIONS.map((activity) => ({
      ...activity,
      done: todayCompletedKeys.has(activity.key),
    }));

    res.json({
      studentName: req.user?.fullName || req.user?.name || "Student",
      currentStreak,
      flashcardsDue,
      studyProgress,
      leaderboardRank: rank,
      totalPoints,
      badgesEarned,
      quizScore,
      quizCount,
      weeklyPerformance,
      recentActivity,
      todayPlan,
      activities: liveActivities,
      achievements,
      nextBadgeDays: Math.max(0, 14 - currentStreak),
      todayActivityCount: todayActivities.length,
      dailyGoal: 3,
    });
  } catch (err) {
    console.error("getStudentDashboard error:", err);
    res.status(500).json({
      message: "Failed to load student dashboard",
      error: err.message,
    });
  }
};