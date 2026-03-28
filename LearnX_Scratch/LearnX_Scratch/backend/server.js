require("dotenv").config({ path: "./backend/.env" });
const path = require("path");
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const teacherRoutes = require("./routes/teacherRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");


const app = express();

connectDB();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/lesson-planner", require("./routes/lessonPlannerRoutes"));
app.use("/api/study-plan", require("./routes/studyPlannerRoutes"));
app.use("/api/streak", require("./routes/streakRoutes"));// alias for compatibility
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/student/dashboard", require("./routes/dashboardRoutes"));
app.use("/api/quiz-results", require("./routes/quizRoutes"));
app.use("/api/leaderboard", require("./routes/leaderboardRoutes"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/textbooks", require("./routes/textbookRoutes"));
app.use("/api/chatbot", require("./routes/chatbotRoutes"));
app.use("/api/teacher", require("./routes/teacherDashboardRoutes"));
app.use("/api/performance", require("./routes/performanceRoutes"));
app.use("/api/dashboard", dashboardRoutes);
app.get("/", (req, res) => {
  res.send("LearnX API is running");
});



app.use("/api/teacher", teacherRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});