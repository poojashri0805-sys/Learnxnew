import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/student/StudentDashboard";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import { useAuth } from "./context/AuthContext";
import Flashcards from "./pages/student/Flashcards";
import QuizGenerator from "./pages/teacher/QuizGenerator";
import StudentQuiz from "./pages/student/StudentQuiz";
import AutoGrading from "./pages/teacher/AutoGrading";
import LessonPlanner from "./pages/teacher/LessonPlanner";
import StudyPlanner from "./pages/student/StudyPlanner";
import StreakSystem from "./pages/student/StreakSystem";
import Leaderboard from "./pages/student/Leaderboard";
import TextbookUpload from "./pages/teacher/TextbookUpload";
import StudentAiTutor from "./pages/student/StudentAiTutor";
import PerformanceTracker from "./pages/teacher/PerformanceTracker";

import CurriculumTracker from "./pages/teacher/CurriculumTracker";
function ProtectedRoute({ children, role }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}/dashboard`} />;

  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute role="teacher">
            <TeacherDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/flashcards"
        element={
          <ProtectedRoute role="student">
            <Flashcards />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/study-planner"
        element={
          <ProtectedRoute role="student">
            <StudyPlanner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/streak-system"
        element={
          <ProtectedRoute role="student">
            <StreakSystem />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/quiz-generator"
        element={
          <ProtectedRoute role="teacher">
            <QuizGenerator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/quiz"
        element={
          <ProtectedRoute role="student">
            <StudentQuiz />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/leaderboard"
        element={
          <ProtectedRoute role="student">
            <Leaderboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/leaderboard"
        element={
          <ProtectedRoute role="teacher">
            <Leaderboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/auto-grading"
        element={
          <ProtectedRoute role="teacher">
            <AutoGrading />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/ai-tutor"
        element={
          <ProtectedRoute role="student">
            <StudentAiTutor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/textbook-upload"
        element={
          <ProtectedRoute role="teacher">
            <TextbookUpload />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/lesson-planner"
        element={
          <ProtectedRoute role="teacher">
            <LessonPlanner />
          </ProtectedRoute>
        }
      />
        <Route
        path="/teacher/performance-tracker"
        element={
          <ProtectedRoute role="teacher">
            <PerformanceTracker />
          </ProtectedRoute>
        }
      />

      <Route
        path="/teacher/curriculum-tracker"
        element={
          <ProtectedRoute role="teacher">
            <CurriculumTracker />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={user ? `/${user.role}/dashboard` : "/login"} />} />
    </Routes>
    
  );
  
}
