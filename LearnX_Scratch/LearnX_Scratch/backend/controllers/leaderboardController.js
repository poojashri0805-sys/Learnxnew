const User = require("../models/User");
const Streak = require("../models/Streak");
const QuizResult = require("../models/QuizResult");

exports.getLeaderboard = async (req, res) => {
  try {
    const { sortBy = "points", grade } = req.query;

    const userFilter = { role: "student" };

    if (req.user?.role === "student") {
      userFilter.gradeClass = req.user.gradeClass || "Grade 10";
    } else if (grade) {
      userFilter.gradeClass = grade;
    }

    const users = await User.find(userFilter).select("fullName gradeClass");

    const userIds = users.map((u) => u._id);
    const streaks = await Streak.find({ user: { $in: userIds } }).lean();
    const quizResults = await QuizResult.find({ user: { $in: userIds } }).lean();

    const streakMap = streaks.reduce((map, item) => {
      map[item.user.toString()] = item;
      return map;
    }, {});

    const quizMap = quizResults.reduce((map, quiz) => {
      const id = quiz.user.toString();
      if (!map[id]) map[id] = { total: 0, count: 0 };
      const quizScore = Number(
        quiz.percentage ??
          (quiz.total > 0 ? (quiz.score / quiz.total) * 100 : 0)
      ) || 0;
      map[id].total += quizScore;
      map[id].count += 1;
      return map;
    }, {});

    const leaderboard = users.map((user) => {
      const streak = streakMap[user._id.toString()];
      const userQuizzes = quizMap[user._id.toString()] || { total: 0, count: 0 };
      const avgScore = userQuizzes.count
        ? Math.round(userQuizzes.total / userQuizzes.count)
        : 0;

      return {
        userId: user._id,
        name: user.fullName,
        gradeClass: user.gradeClass || "Unknown",
        points: streak?.totalPoints || 0,
        streak: streak?.currentStreak || 0,
        quizScore: avgScore,
      };
    });

    // SORTING
    leaderboard.sort((a, b) => {
      if (sortBy === "quiz") return b.quizScore - a.quizScore;
      if (sortBy === "streak") return b.streak - a.streak;
      return b.points - a.points;
    });

    // ADD RANK
    const ranked = leaderboard.map((u, i) => ({
      ...u,
      rank: i + 1,
    }));

    res.json({
      leaderboard: ranked,
      top3: ranked.slice(0, 3),
      currentUser: req.user._id,
    });
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Failed to load leaderboard" });
  }
};