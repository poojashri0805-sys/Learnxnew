const fetch = require("node-fetch");
const StudyPlan = require("../models/StudyPlan");

function toLocalDate(dateStr) {
  // Avoid UTC shift issues from new Date("YYYY-MM-DD")
  const [y, m, d] = String(dateStr).split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isPastDate(examDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const exam = toLocalDate(examDate);
  exam.setHours(0, 0, 0, 0);

  return exam < today;
}

function generateDates(examDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = toLocalDate(examDate);
  end.setHours(0, 0, 0, 0);

  const dates = [];
  let current = new Date(today);

  while (current <= end) {
    const dayName = current.toLocaleDateString("en-US", {
      weekday: "short",
    });

    dates.push({
      day: dayName,
      date: formatLocalDate(current),
    });

    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function extractJson(text) {
  if (!text) return null;

  const cleaned = String(text)
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch (err) {
        return null;
      }
    }
  }

  return null;
}

function durationToMinutes(duration) {
  const text = String(duration || "").toLowerCase().trim();
  const match = text.match(/(\d+(?:\.\d+)?)/);
  if (!match) return 0;

  const value = Number(match[1]);
  if (text.includes("hour")) return Math.round(value * 60);
  return Math.round(value);
}

function minutesToDuration(minutes) {
  return `${Math.max(15, Math.round(minutes))} min`;
}

function normalizeTasks(tasks, hours) {
  const maxMinutes = Number(hours || 1) * 60;

  return (Array.isArray(tasks) ? tasks : []).map((day) => {
    const dayTasks = Array.isArray(day.tasks) ? day.tasks : [];

    const total = dayTasks.reduce(
      (acc, t) => acc + durationToMinutes(t.duration),
      0
    );

    if (total > maxMinutes && total > 0) {
      const ratio = maxMinutes / total;

      return {
        ...day,
        tasks: dayTasks.map((task) => {
          const mins = durationToMinutes(task.duration);
          const scaled = Math.max(15, Math.round(mins * ratio));

          return {
            ...task,
            duration: minutesToDuration(scaled),
            completed: false,
          };
        }),
      };
    }

    return {
      ...day,
      tasks: dayTasks.map((task) => ({
        ...task,
        duration: task.duration ? task.duration : "30 min",
        completed: false,
      })),
    };
  });
}

async function buildAIPlan({ subjects, topics, examDate, hours }) {
  const subjectList = subjects
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const topicList = topics
    .split("\n")
    .map((t) => t.trim())
    .filter(Boolean);

  const dateList = generateDates(examDate);
  const totalDays = dateList.length;

  const prompt = `
Create a study plan from TODAY until the exam date.

Subjects:
${subjectList.map((s) => `- ${s}`).join("\n")}

Topics:
${topicList.map((t) => `- ${t}`).join("\n")}

Total Days:
${totalDays}

Exam Date:
${examDate}

Daily Study Hours:
${hours}

Rules:
- Generate exactly ${totalDays} day entries
- More time for hard topics, less time for easy topics
- Keep each day within the daily study hours limit
- Use realistic durations in minutes only
- Do not repeat the same topic too often unless needed for revision
- Put final revision near the exam date
- Return ONLY valid JSON
- No markdown
- No explanation

JSON format:
{
  "tasks": [
    {
      "day": "Mon",
      "date": "YYYY-MM-DD",
      "tasks": [
        {
          "title": "Topic name",
          "subject": "Subject name",
          "difficulty": "easy|medium|hard",
          "duration": "90 min",
          "completed": false
        }
      ]
    }
  ]
}
`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY1 || process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are an expert academic planner that returns only JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.25,
      max_tokens: 1500,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data?.error?.message || "Groq API error");
    err.raw = data;
    throw err;
  }

  const content = data?.choices?.[0]?.message?.content || "";
  const parsed = extractJson(content);

  if (!parsed || !Array.isArray(parsed.tasks)) {
    const err = new Error("AI returned invalid plan format");
    err.raw = content;
    throw err;
  }

  const aiTasks = parsed.tasks;

  const mappedTasks = dateList.map((d, i) => {
    const dayData = aiTasks[i % aiTasks.length] || {};
    const dayTasks = Array.isArray(dayData.tasks) ? dayData.tasks : [];

    return {
      day: d.day,
      date: d.date,
      tasks: dayTasks.map((task) => ({
        ...task,
        date: d.date,
        completed: false,
      })),
    };
  });

  return normalizeTasks(mappedTasks, hours);
}

exports.generateAIPlan = async (req, res) => {
  try {
    const { subjects, topics, examDate, hours } = req.body;

    if (!subjects || !topics || !examDate || !hours) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (isPastDate(examDate)) {
      return res.status(400).json({
        message: "Exam date must be today or a future date",
      });
    }

    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const tasks = await buildAIPlan({
      subjects,
      topics,
      examDate,
      hours,
    });

    const plan = await StudyPlan.create({
      user: req.user._id,
      subjects,
      topics,
      examDate,
      hours,
      tasks,
      status: "active",
    });

    return res.status(201).json(plan);
  } catch (err) {
    console.error("generateAIPlan error:", err);
    return res.status(500).json({
      message: err.message || "Failed to generate AI study plan",
      raw: err.raw,
    });
  }
};

exports.updateAIPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjects, topics, examDate, hours } = req.body;

    if (!subjects || !topics || !examDate || !hours) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (isPastDate(examDate)) {
      return res.status(400).json({
        message: "Exam date must be today or a future date",
      });
    }

    if (!req.user?._id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const plan = await StudyPlan.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!plan) {
      return res.status(404).json({ message: "Study plan not found" });
    }

    const tasks = await buildAIPlan({
      subjects,
      topics,
      examDate,
      hours,
    });

    plan.subjects = subjects;
    plan.topics = topics;
    plan.examDate = examDate;
    plan.hours = hours;
    plan.tasks = tasks;
    plan.status = "active";

    await plan.save();

    return res.json(plan);
  } catch (err) {
    console.error("updateAIPlan error:", err);
    return res.status(500).json({
      message: err.message || "Failed to update AI study plan",
      raw: err.raw,
    });
  }
};