const Quiz = require("../models/Quiz");
const User = require("../models/User");
const createNotification = require("../utils/createNotification");

function getStudentClass(user) {
  return (
    user?.gradeClass ||
    user?.grade ||
    user?.className ||
    user?.class ||
    ""
  );
}

exports.createQuiz = async (req, res) => {
  try {
    const {
      topic = "",
      subject = "",
      timer = 60,
      className = "",
      teacherName = "",
      questions = [],
      type = "MCQ",
      difficulty = "Medium",
    } = req.body || {};

    if (!topic || !subject || !className || questions.length === 0) {
      return res.status(400).json({
        message: "Please provide topic, subject, class, and questions.",
      });
    }

    const quiz = await Quiz.create({
      title: topic,
      topic,
      subject,
      className,
      teacherName: teacherName || req.user.fullName || req.user.name || "Teacher",
      questions,
      type,
      difficulty,
      timer,
      createdBy: req.user._id,
      sentAt: new Date(),
    });

    const students = await User.find({ role: "student", gradeClass: className }).select("_id");

    await Promise.all(
      students.map((student) =>
        createNotification({
          user: student._id,
          type: "quiz",
          title: "New quiz assigned",
          message: `New quiz \"${topic}\" has been assigned to ${className}.`,
          link: "/quiz",
        })
      )
    );

    await createNotification({
      user: req.user._id,
      type: "quiz",
      title: "Quiz published",
      message: `Your quiz \"${topic}\" was published to ${className}.`,
      link: "/teacher/dashboard",
    });

    res.status(201).json({ quiz, notifiedCount: students.length });
  } catch (err) {
    console.error("createQuiz error:", err);
    res.status(500).json({
      message: "Failed to create quiz.",
      error: err.message,
    });
  }
};

exports.getQuizzes = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    let quizzes = [];

    if (req.user.role === "teacher") {
      quizzes = await Quiz.find({ createdBy: req.user._id })
        .sort({ createdAt: -1 })
        .lean();
    } else {
      const studentClass = getStudentClass(req.user);
      if (!studentClass) {
        return res.json([]);
      }

      quizzes = await Quiz.find({ className: studentClass })
        .sort({ createdAt: -1 })
        .lean();
    }

    res.json(quizzes || []);
  } catch (err) {
    console.error("getQuizzes error:", err);
    res.status(500).json({
      message: "Failed to load quizzes.",
      error: err.message,
    });
  }
};
