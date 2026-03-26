const Streak = require("../models/Streak");

const ACTIVITY_DEFINITIONS = [
  {
    key: "daily-study",
    title: "Daily Study",
    points: 50,
    icon: "📚",
  },
  {
    key: "quiz-attempt",
    title: "Quiz Attempt",
    points: 30,
    icon: "📝",
  },
  {
    key: "flashcard-review",
    title: "Flashcard Review",
    points: 20,
    icon: "🃏",
  },
  {
    key: "ai-tutor-session",
    title: "AI Tutor Session",
    points: 10,
    icon: "🤖",
  },
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

async function getOrCreateStreak(userId) {
  try {
    if (!userId) {
      throw new Error("Invalid userId: " + userId);
    }

    let streak = await Streak.findOne({ user: userId });

    if (!streak) {
      streak = new Streak({
        user: userId,
        currentStreak: 0,
        longestStreak: 0,
        totalPoints: 0,
        rank: 5,
        lastActiveDateKey: null,
        activityLog: [],
      });

      await streak.save();
    }

    if (!Array.isArray(streak.activityLog)) streak.activityLog = [];
    if (typeof streak.currentStreak !== "number") streak.currentStreak = 0;
    if (typeof streak.longestStreak !== "number") streak.longestStreak = 0;
    if (typeof streak.totalPoints !== "number") streak.totalPoints = 0;
    if (typeof streak.rank !== "number") streak.rank = 5;
    if (typeof streak.lastActiveDateKey !== "string") {
      streak.lastActiveDateKey = null;
    }

    return streak;
  } catch (err) {
    console.error("getOrCreateStreak error:", err);
    throw err;
  }
}

function buildHeatmap(activityLog) {
  try {
    const log = Array.isArray(activityLog) ? activityLog : [];
    const todayKey = getTodayKey();
    const counts = {};

    for (const item of log) {
      const dateKey = item?.dateKey;
      if (!dateKey || typeof dateKey !== "string") continue;
      counts[dateKey] = (counts[dateKey] || 0) + 1;
    }

    const days = [];
    for (let i = 34; i >= 0; i--) {
      const dateKey = shiftDateKey(todayKey, -i);
      days.push({
        dateKey,
        count: counts[dateKey] || 0,
      });
    }

    return days;
  } catch (err) {
    console.error("buildHeatmap error:", err);
    return [];
  }
}

function buildActivityCounts(activityLog) {
  const log = Array.isArray(activityLog) ? activityLog : [];
  const counts = {};

  for (const item of log) {
    const key = item?.key;
    if (!key) continue;
    counts[key] = (counts[key] || 0) + 1;
  }

  return counts;
}

function buildAchievements(streak, activityCounts) {
  const currentStreakVal = streak?.currentStreak || 0;
  const totalPointsVal = streak?.totalPoints || 0;

  const items = [
    {
      title: "7-Day Streak",
      description: "Study 7 days in a row",
      icon: "🔥",
      progress: currentStreakVal,
      target: 7,
    },
    {
      title: "Quiz Master",
      description: "Complete 3 quizzes",
      icon: "🧠",
      progress: activityCounts["quiz-attempt"] || 0,
      target: 3,
    },
    {
      title: "Flashcard Pro",
      description: "Review 100 flashcards",
      icon: "🃏",
      progress: activityCounts["flashcard-review"] || 0,
      target: 100,
    },
    {
      title: "14-Day Streak",
      description: "Study 14 days in a row",
      icon: "⚡",
      progress: currentStreakVal,
      target: 14,
    },
    {
      title: "30-Day Streak",
      description: "Study 30 days in a row",
      icon: "🏅",
      progress: currentStreakVal,
      target: 30,
    },
    {
      title: "Top Scorer",
      description: "Reach 5,000 points",
      icon: "🏆",
      progress: totalPointsVal,
      target: 5000,
    },
    {
      title: "Night Owl",
      description: "Complete 5 late study sessions",
      icon: "🦉",
      progress: activityCounts["ai-tutor-session"] || 0,
      target: 5,
    },
    {
      title: "Early Bird",
      description: "Complete 5 morning study sessions",
      icon: "🌅",
      progress: activityCounts["daily-study"] || 0,
      target: 5,
    },
  ];

  return items.map((item) => ({
    ...item,
    unlocked: (item.progress || 0) >= (item.target || 1),
  }));
}

function buildDashboardPayload(streak) {
  try {
    const activityLog = Array.isArray(streak?.activityLog) ? streak.activityLog : [];
    const todayKey = getTodayKey();

    const activityCounts = buildActivityCounts(activityLog);

    const completedToday = new Set(
      activityLog
        .filter((item) => item?.dateKey === todayKey)
        .map((item) => item?.key)
        .filter(Boolean)
    );

    const todayPoints = activityLog
      .filter((item) => item?.dateKey === todayKey)
      .reduce((sum, item) => sum + (item?.points || 0), 0);

    const activities = ACTIVITY_DEFINITIONS.map((activity) => {
      const done = completedToday.has(activity.key);
      return {
        ...activity,
        completed: done,
        status: done ? "done" : "pending",
      };
    });

    const heatmap = buildHeatmap(activityLog);
    const achievements = buildAchievements(streak, activityCounts);

    return {
      _id: streak._id || null,
      currentStreak: streak.currentStreak || 0,
      longestStreak: streak.longestStreak || 0,
      totalPoints: streak.totalPoints || 0,
      rank: streak.rank || 5,
      todayPoints: todayPoints || 0,
      nextBadgeDays: Math.max(0, 14 - (streak.currentStreak || 0)),
      heatmap,
      activities,
      achievements,
    };
  } catch (err) {
    console.error("buildDashboardPayload error:", err);
    throw err;
  }
}

exports.getStreakDashboard = async (req, res) => {
  try {
    console.log("🔵 getStreakDashboard called");

    if (!req.user || !req.user._id) {
      console.log("❌ No user found in request");
      return res.status(401).json({ message: "Not authorized" });
    }

    const userId = req.user._id;
    console.log("👤 User ID:", userId);

    let streak;
    try {
      streak = await getOrCreateStreak(userId);
    } catch (err) {
      console.error("❌ Error creating/fetching streak:", err);
      return res.status(500).json({
        message: "Failed to initialize streak",
        error: err.message,
      });
    }

    if (!streak) {
      console.log("❌ Streak is null");
      return res.status(500).json({
        message: "Streak not found or created",
      });
    }

    console.log("📊 Streak loaded:", {
      id: streak._id,
      currentStreak: streak.currentStreak,
      totalPoints: streak.totalPoints,
    });

    if (!Array.isArray(streak.activityLog)) streak.activityLog = [];
    if (typeof streak.currentStreak !== "number") streak.currentStreak = 0;
    if (typeof streak.longestStreak !== "number") streak.longestStreak = 0;
    if (typeof streak.totalPoints !== "number") streak.totalPoints = 0;
    if (typeof streak.rank !== "number") streak.rank = 5;
    if (typeof streak.lastActiveDateKey !== "string") {
      streak.lastActiveDateKey = null;
    }

    let payload;
    try {
      payload = buildDashboardPayload(streak);
    } catch (err) {
      console.error("❌ Error building payload:", err);

      return res.status(500).json({
        message: "Error building dashboard",
        error: err.message,
      });
    }

    console.log("🟢 Dashboard ready");

    return res.status(200).json(payload);
  } catch (err) {
    console.error("🔥 CRITICAL ERROR in getStreakDashboard:", {
      message: err.message,
      stack: err.stack,
    });

    return res.status(500).json({
      message: "Failed to load streak dashboard",
      error: err.message,
    });
  }
};

exports.completeActivity = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const activityKey = req.params.activityKey || req.params.key;
    const activity = ACTIVITY_DEFINITIONS.find((a) => a.key === activityKey);

    if (!activity) {
      return res.status(400).json({ message: "Invalid activity" });
    }

    const streak = await getOrCreateStreak(req.user._id);
    const todayKey = getTodayKey();
    const yesterdayKey = shiftDateKey(todayKey, -1);

    if (!Array.isArray(streak.activityLog)) {
      streak.activityLog = [];
    }

    const alreadyDoneToday = streak.activityLog.some(
      (item) => item.dateKey === todayKey && item.key === activityKey
    );

    if (!alreadyDoneToday) {
      streak.activityLog.push({
        key: activity.key,
        title: activity.title,
        points: activity.points,
        dateKey: todayKey,
        completedAt: new Date(),
      });

      streak.totalPoints = (streak.totalPoints || 0) + activity.points;

      const todayActivities = streak.activityLog.filter(
        (item) => item.dateKey === todayKey
      ).length;

      if (todayActivities >= 3) {
        if (streak.lastActiveDateKey === todayKey) {
          // already counted today
        } else if (streak.lastActiveDateKey === yesterdayKey) {
          streak.currentStreak += 1;
        } else {
          streak.currentStreak = 1;
        }

        streak.lastActiveDateKey = todayKey;
        streak.longestStreak = Math.max(
          streak.longestStreak,
          streak.currentStreak
        );
      }

      await streak.save();
    }

    const fresh = await Streak.findById(streak._id);
    res.json(buildDashboardPayload(fresh));
  } catch (err) {
    console.error("completeActivity error:", err);
    res.status(500).json({ message: err.message });
  }
};