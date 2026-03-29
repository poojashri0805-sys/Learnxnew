const QuizResult = require("../models/QuizResult");
const Quiz = require("../models/Quiz");
const createNotification = require("../utils/createNotification");

exports.createQuizResult = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const {
      quizId = "",
      quizTitle = "",
      subject = "",
      topic = "",
      teacherName = "",
      className = "",
      score = 0,
      total = 0,
      submittedAt,
    } = req.body || {};

    const numericScore = Number(score) || 0;
    const numericTotal = Number(total) || 0;
    const percentage =
      numericTotal > 0 ? Math.round((numericScore / numericTotal) * 100) : 0;

    const result = await QuizResult.create({
      user: req.user._id,
      quizId,
      quizTitle,
      subject,
      topic,
      teacherName,
      className,
      score: numericScore,
      total: numericTotal,
      percentage,
      submittedAt: submittedAt ? new Date(submittedAt) : new Date(),
    });

    await createNotification({
      user: req.user._id,
      type: "quiz",
      title: "Quiz submitted",
      message: `You completed "${quizTitle || 'a quiz'}" with ${percentage}% score.`,
      link: "/student/quiz",
    });

    if (quizId) {
      try {
        const quiz = await Quiz.findById(quizId).lean();
        if (quiz?.createdBy && String(quiz.createdBy) !== String(req.user._id)) {
          await createNotification({
            user: quiz.createdBy,
            type: "quiz",
            title: "Quiz attempted",
            message: `${req.user.fullName || req.user.name || 'A student'} attempted your quiz "${quiz.title || quiz.topic || quizTitle}" and scored ${percentage}%.`,
            link: "/teacher/dashboard",
          });
        }
      } catch (notifyErr) {
        console.error("Teacher notification error:", notifyErr);
      }
    }

    res.status(201).json(result);
  } catch (err) {
    console.error("createQuizResult error:", err);
    res.status(500).json({
      message: "Failed to save quiz result",
      error: err.message,
    });
  }
};

exports.getLatestQuizResult = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const result = await QuizResult.findOne({ user: req.user._id }).sort({
      submittedAt: -1,
      createdAt: -1,
    });

    res.json(result || null);
  } catch (err) {
    console.error("getLatestQuizResult error:", err);
    res.status(500).json({
      message: "Failed to load quiz result",
      error: err.message,
    });
  }
};