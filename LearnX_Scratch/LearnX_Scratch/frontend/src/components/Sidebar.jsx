import { NavLink } from "react-router-dom";
import {
  LayoutGrid,
  CalendarDays,
  StickyNote,
  MessageCircle,
  Flame,
  Trophy,
  Users,
  Brain,
  BookOpen,
  Layers3,
  CheckSquare,
  Search,
  Video,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const studentMenu = [
  { label: "Dashboard", path: "/student/dashboard", icon: LayoutGrid },
  { label: "Study Planner", path: "/student/study-planner", icon: CalendarDays },
  { label: "Flashcards", path: "/student/flashcards", icon: StickyNote },
  { label: "AI Tutor", path: "/student/ai-tutor", icon: MessageCircle },
  { label: "Streak System", path: "/student/streak-system", icon: Flame },
  { label: "Leaderboard", path: "/student/leaderboard", icon: Trophy },
  { label: "Quiz", path: "/student/quiz", icon: Brain },
];

const teacherMenu = [
  { label: "Dashboard", path: "/teacher/dashboard", icon: LayoutGrid },
  { label: "Performance Tracker", path: "/teacher/performance-tracker", icon: Users },
  { label: "Quiz Generator", path: "/teacher/quiz-generator", icon: Brain },
  { label: "Lesson Planner", path: "/teacher/lesson-planner", icon: BookOpen },
  { label: "Curriculum Tracker", path: "/teacher/curriculum-tracker", icon: Layers3 },
  { label: "Textbook Upload", path: "/teacher/textbook-upload", icon: BookOpen },
  { label: "Auto Grading", path: "/teacher/auto-grading", icon: CheckSquare },
  { label: "Learning Gaps", path: "/teacher/learning-gaps", icon: Search },
  { label: "Video Generator", path: "/teacher/video-generator", icon: Video },
  { label: "Leaderboard", path: "/teacher/leaderboard", icon: Trophy },
  
];

export default function Sidebar() {
  const { user } = useAuth();
  const role = user?.role || "student";
  const menuItems = role === "teacher" ? teacherMenu : studentMenu;

  return (
    <aside className="w-72 min-h-screen bg-[#0f172a] text-white border-r border-white/10 flex flex-col">
      <div className="px-5 py-6 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-md">
          ✦
        </div>
        <div>
          <h1 className="text-2xl font-bold text-purple-300">LearnX</h1>
          <p className="text-xs text-slate-400 capitalize">{role} Copilot</p>
        </div>
      </div>

      <nav className="px-2 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-[15px] transition",
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-white/5 hover:text-white",
                ].join(" ")
              }
            >
              <Icon size={19} className="shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}