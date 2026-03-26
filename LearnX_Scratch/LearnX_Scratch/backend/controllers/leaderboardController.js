const User = require("../models/User");
const Streak = require("../models/Streak");
const Quiz = require("../models/Quiz");

exports.getLeaderboard = async (req, res) => {
  try {
    const { period = "week", subject = "all", sortBy = "points" } = req.query;

    const users = await User.find({ role: "student" }).select("fullName");

    const leaderboard = [];

    for (let user of users) {
      const streak = await Streak.findOne({ user: user._id });

      const quizAttempts = await Quiz.find({ user: user._id });

      const avgScore =
        quizAttempts.length > 0
          ? Math.round(
              quizAttempts.reduce((a, b) => a + b.score, 0) /
                quizAttempts.length
            )
          : 0;

      leaderboard.push({
        userId: user._id,
        name: user.fullName,
        points: streak?.totalPoints || 0,
        streak: streak?.currentStreak || 0,
        quizScore: avgScore,
        speed: Math.floor(Math.random() * 40) + 60, // mock speed
      });
    }

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