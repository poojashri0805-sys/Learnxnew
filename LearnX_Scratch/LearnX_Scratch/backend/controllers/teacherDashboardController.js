const User = require("../models/User");
const Quiz = require("../models/Quiz");
const QuizResult = require("../models/QuizResult");
const StudyPlan = require("../models/StudyPlan");
const Notification = require("../models/Notification");
const Streak = require("../models/Streak");

function toId(value) {
  return value?._id ? String(value._id) : value ? String(value) : "";
}

function average(numbers) {
  const arr = (numbers || []).filter((n) => Number.isFinite(Number(n)));
  if (!arr.length) return 0;
  return arr.reduce((sum, n) => sum + Number(n), 0) / arr.length;
}

function extractPercent(result) {
  const pct = result?.percentage;
  if (Number.isFinite(Number(pct))) return Number(pct);

  const score =
    result?.score ??
    result?.marksObtained ??
    result?.obtainedMarks ??
    result?.mark ??
    0;

  const total =
    result?.totalMarks ??
    result?.maxMarks ??
    result?.outOf ??
    result?.total ??
    null;

  if (Number.isFinite(Number(score)) && Number.isFinite(Number(total)) && Number(total) > 0) {
    return (Number(score) / Number(total)) * 100;
  }

  return Number(score) || 0;
}

function getRelativeTime(date) {
  if (!date) return "";
  const now = Date.now();
  const diff = Math.max(0, now - new Date(date).getTime());

  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;

  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

function pickSubjectFromStudent(student) {
  const subjects = student?.subjects || student?.enrolledSubjects || [];
  if (Array.isArray(subjects) && subjects.length) {
    const first = subjects[0];
    if (typeof first === "string") return first;
    return first?.name || first?.subject || "General";
  }
  return "General";
}

exports.getTeacherDashboard = async (req, res) => {
  try {
    const [
      studentsRaw,
      quizzesRaw,
      resultsRaw,
      plansRaw,
      notificationsRaw,
      streaksRaw,
    ] = await Promise.all([
      User.find({ role: "student" }).lean(),
      Quiz.find({}).sort({ createdAt: -1 }).lean(),
      QuizResult.find({}).sort({ createdAt: -1 }).lean(),
      StudyPlan.find({}).sort({ createdAt: -1 }).lean(),
      Notification.find({}).sort({ createdAt: -1 }).limit(20).lean(),
      Streak.find({}).lean(),
    ]);

    const students = studentsRaw || [];
    const quizzes = quizzesRaw || [];
    const results = resultsRaw || [];
    const plans = plansRaw || [];
    const notifications = notificationsRaw || [];
    const streaks = streaksRaw || [];

    const quizMap = new Map(quizzes.map((q) => [toId(q), q]));
    const streakMap = new Map(
      streaks.map((s) => {
        const studentId = toId(s.studentId || s.userId || s.ownerId);
        return [studentId, s];
      })
    );

    const resultsByStudent = new Map();
    const resultsBySubject = new Map();
    const quizGroups = new Map();

    results.forEach((r) => {
      const studentId = toId(r.studentId || r.userId || r.ownerId);
      const quizId = toId(r.quizId || r.quiz || r.quizRef);
      const quiz = quizMap.get(quizId);

      const subject = r.subject || quiz?.subject || quiz?.topic || "General";
      const percent = extractPercent(r);

      if (studentId) {
        if (!resultsByStudent.has(studentId)) resultsByStudent.set(studentId, []);
        resultsByStudent.get(studentId).push({ ...r, _percent: percent });
      }

      if (!resultsBySubject.has(subject)) resultsBySubject.set(subject, []);
      resultsBySubject.get(subject).push(percent);

      if (quizId) {
        if (!quizGroups.has(quizId)) {
          quizGroups.set(quizId, { count: 0, latestAt: null });
        }
        const group = quizGroups.get(quizId);
        group.count += 1;

        const createdAt = r.createdAt ? new Date(r.createdAt) : null;
        if (createdAt && (!group.latestAt || createdAt > group.latestAt)) {
          group.latestAt = createdAt;
        }
      }
    });

    const subjectData = [...resultsBySubject.entries()].map(([name, scores]) => ({
      name,
      score: Math.round(average(scores)),
    }));

    subjectData.sort((a, b) => a.name.localeCompare(b.name));

    const allPercents = results.map(extractPercent);
    const avgClassScore = Math.round(average(allPercents));

    const atRiskStudents = students
      .map((student) => {
        const sid = toId(student);
        const studentResults = resultsByStudent.get(sid) || [];
        const scores = studentResults.map((r) => r._percent);
        const avgScore = Math.round(average(scores));

        const streakDoc = streakMap.get(sid);
        const currentStreak =
          Number(streakDoc?.currentStreak ?? streakDoc?.streak ?? student?.streak ?? 0) || 0;

        const assignmentsMissing =
          Number(student?.assignmentsMissing ?? student?.missingAssignments ?? 0) || 0;

        const latestQuiz = studentResults[0];
        const latestQuizSubject =
          latestQuiz?.subject ||
          quizMap.get(toId(latestQuiz?.quizId || latestQuiz?.quiz || latestQuiz?.quizRef))
            ?.subject ||
          pickSubjectFromStudent(student);

        const recentLowAttempts = studentResults.slice(0, 3).filter((r) => r._percent < 45).length;

        const reasons = [];
        if (avgScore > 0 && avgScore < 50) reasons.push("Low quiz scores");
        if (assignmentsMissing > 0) reasons.push(`Missing ${assignmentsMissing} assignments`);
        if (currentStreak > 0 && currentStreak < 3) reasons.push(`Streak ${currentStreak}`);
        if (recentLowAttempts >= 2) reasons.push("Weak prerequisites detected");

        if (!reasons.length) return null;

        return {
          id: sid,
          initials:
            (student?.name || "Student")
              .split(" ")
              .filter(Boolean)
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase() || "S",
          name: student?.name || "Student",
          detail: `${latestQuizSubject} • ${reasons[0]}`,
          score: `${avgScore || 0}%`,
          reason: reasons.join(" • "),
          createdAt: student?.createdAt || null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => Number(a.score) - Number(b.score))
      .slice(0, 7);

    const completedTopics = plans.reduce((sum, plan) => {
      if (Number.isFinite(Number(plan?.completedTopics))) {
        return sum + Number(plan.completedTopics);
      }

      if (Array.isArray(plan?.topics)) {
        return (
          sum +
          plan.topics.filter(
            (t) => t?.completed || t?.status === "done" || t?.status === "completed"
          ).length
        );
      }

      if (plan?.status === "done" || plan?.status === "completed") return sum + 1;
      return sum;
    }, 0);

    const totalTopics = plans.reduce((sum, plan) => {
      if (Number.isFinite(Number(plan?.totalTopics))) {
        return sum + Number(plan.totalTopics);
      }

      if (Array.isArray(plan?.topics)) return sum + plan.topics.length;
      return sum + 1;
    }, 0);

    const lessonsPlanned = plans.length;
    const topicsDone = `${completedTopics}/${totalTopics}`;

    const quizActivity = [...quizGroups.entries()]
      .map(([quizId, group]) => {
        const quiz = quizMap.get(quizId);
        return {
          type: "quiz",
          message: `Quiz "${quiz?.title || "Untitled"}" completed by ${group.count} students`,
          createdAt: group.latestAt || quiz?.createdAt || null,
        };
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 2);

    const activityFromPlans = plans.slice(0, 2).map((plan) => ({
      type: "lesson",
      message: `Lesson plan for "${plan?.title || plan?.subject || "Untitled"}" saved`,
      createdAt: plan?.updatedAt || plan?.createdAt || null,
    }));

    const activityFromAlerts = atRiskStudents.slice(0, 1).map((s) => ({
      type: "alert",
      message: `Student ${s.name} is flagged as at-risk in ${s.detail.split(" • ")[0]}`,
      createdAt: s.createdAt || null,
    }));

    const activityFromNotifications = notifications.slice(0, 2).map((n) => ({
      type: n?.type || "notification",
      message: n?.message || n?.title || "Notification received",
      createdAt: n?.createdAt || null,
    }));

    const recentActivity = [
      ...quizActivity,
      ...activityFromAlerts,
      ...activityFromPlans,
      ...activityFromNotifications,
    ]
      .filter((item) => item.message)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .slice(0, 5)
      .map((item) => ({
        type: item.type,
        text: item.message,
        time: getRelativeTime(item.createdAt),
      }));

    return res.json({
      stats: {
        studentsTracked: students.length,
        quizzesCreated: quizzes.length,
        avgClassScore,
        atRiskAlerts: atRiskStudents.length,
        lessonsPlanned,
        topicsDone,
      },
      subjectData,
      recentActivity,
      alerts: atRiskStudents,
    });
  } catch (error) {
    console.error("Teacher dashboard error:", error);
    return res.status(500).json({
      message: "Failed to load teacher dashboard data",
    });
  }
};