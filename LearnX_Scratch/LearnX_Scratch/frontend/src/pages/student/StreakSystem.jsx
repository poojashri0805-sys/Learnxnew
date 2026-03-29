import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import DashboardLayout from "../../components/DashboardLayout";
import {
  Flame,
  Trophy,
  Brain,
  BookOpen,
  Bot,
  BadgeCheck,
  Zap,
  Medal,
  Sparkles,
  Clock3,
  Target,
  RefreshCw,
} from "lucide-react";

const HEATMAP_CLASSES = [
  "bg-slate-100",
  "bg-emerald-200",
  "bg-emerald-300",
  "bg-emerald-400",
  "bg-emerald-600",
];

const ICONS = {
  flame: Flame,
  trophy: Trophy,
  brain: Brain,
  book: BookOpen,
  bot: Bot,
  badge: BadgeCheck,
  zap: Zap,
  medal: Medal,
  sparkles: Sparkles,
  clock: Clock3,
  target: Target,
};

function getHeatmapClass(count) {
  if (count <= 0) return HEATMAP_CLASSES[0];
  if (count === 1) return HEATMAP_CLASSES[1];
  if (count === 2) return HEATMAP_CLASSES[2];
  if (count === 3) return HEATMAP_CLASSES[3];
  return HEATMAP_CLASSES[4];
}

export default function StreakSystem() {
  const navigate = useNavigate();

  const [data, setData] = useState({
    currentStreak: 0,
    longestStreak: 0,
    totalPoints: 0,
    rank: 5,
    todayPoints: 0,
    nextBadgeDays: 14,
    heatmap: [],
    activities: [],
    achievements: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStreak = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/streak");
      setData(res.data || {});
    } catch (err) {
      console.error("Fetch streak error:", err);
      setError(err.response?.data?.error || "Failed to load streak dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStreak();
  }, []);

  const handleActivityClick = (key) => {
    switch (key) {
      case "daily-study":
        navigate("/student/study-planner");
        break;
      case "quiz-attempt":
        navigate("/student/quiz");
        break;
      case "flashcard-review":
        navigate("/student/flashcards");
        break;
      case "ai-tutor-session":
        navigate("/student/ai-tutor");
        break;
      default:
        break;
    }
  };

  const heatmapCells = useMemo(() => {
    const cells = Array.isArray(data.heatmap) ? data.heatmap : [];

    if (!cells.length) {
      return Array.from({ length: 35 }, () => ({ dateKey: "", count: 0 }));
    }

    const firstDateKey = cells[0]?.dateKey;

    let startPadding = 0;
    if (firstDateKey) {
      const [y, m, d] = firstDateKey.split("-").map(Number);
      const firstDate = new Date(y, m - 1, d);
      startPadding = firstDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    }

    const prefix = Array.from({ length: startPadding }, () => ({
      dateKey: "",
      count: 0,
    }));

    const full = [...prefix, ...cells];

    while (full.length % 7 !== 0) {
      full.push({ dateKey: "", count: 0 });
    }

    return full.slice(-42);
  }, [data.heatmap]);

  const currentStreak = data.currentStreak || 0;
  const daysTo14 = Math.max(0, 14 - currentStreak);

  const completedTodayCount = (data.activities || []).filter(
    (activity) => activity.status === "done" || activity.completed
  ).length;

  const remainingTodayCount = Math.max(0, 3 - completedTodayCount);

  if (loading) {
    return (
      <DashboardLayout title="Streak System">
        <div className="min-h-full bg-slate-50 p-6">
          <div className="max-w-[1300px] mx-auto space-y-6">
            <div className="bg-gradient-to-r from-orange-500 to-orange-400 p-10 text-white shadow-sm">
              <div className="flex flex-col items-center text-center gap-3 animate-pulse">
                <Flame className="w-14 h-14" />
                <div className="h-16 w-28 bg-white/20 rounded-none" />
                <div className="h-8 w-40 bg-white/20 rounded-none" />
                <div className="h-6 w-80 bg-white/20 rounded-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 p-6 shadow-sm">
                <div className="h-6 w-64 bg-slate-100 rounded-none animate-pulse" />
                <div className="mt-5 grid grid-cols-7 gap-1 animate-pulse">
                  {Array.from({ length: 35 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="aspect-square bg-slate-100 rounded-none"
                    />
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-6 shadow-sm">
                <div className="h-6 w-52 bg-slate-100 rounded-none animate-pulse" />
                <div className="mt-5 space-y-4 animate-pulse">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="h-20 bg-slate-100 rounded-none" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Streak System">
      <div className="min-h-full bg-slate-50 p-6">
        <div className="max-w-[1300px] mx-auto space-y-6">
          <div className="bg-gradient-to-r from-orange-500 to-orange-400 rounded-none p-10 text-white shadow-sm">
            <div className="flex flex-col items-center text-center gap-3">
              <Flame className="w-14 h-14" />
              <div className="text-6xl font-extrabold leading-none">
                {currentStreak}
              </div>
              <div className="text-2xl font-semibold">Day Streak</div>
              <p className="text-lg opacity-95">
                Keep going! {daysTo14} more days to unlock ⚡ 14-Day Streak badge
              </p>
              <p className="text-base opacity-95">
                {remainingTodayCount === 0
                  ? "Daily goal completed ✅"
                  : `Complete ${remainingTodayCount} more activities today to keep your streak`}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <div className="px-4 py-2 bg-white/15 rounded-sm text-white font-semibold shadow-sm">
                  🏆 {data.totalPoints?.toLocaleString() || 0} total points
                </div>
                <div className="px-4 py-2 bg-white/15 rounded-sm text-white font-semibold shadow-sm">
                  📍 Rank #{data.rank || 5}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                onClick={fetchStreak}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-sm font-medium rounded-none hover:bg-red-700"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-none shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Activity Heatmap — Last 35 Days
              </h2>

              <div className="mt-5">
                <div className="grid grid-cols-7 text-center text-xs text-slate-400 mb-2">
                  <span>S</span>
                  <span>M</span>
                  <span>T</span>
                  <span>W</span>
                  <span>T</span>
                  <span>F</span>
                  <span>S</span>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {heatmapCells.map((cell, idx) => (
                    <div
                      key={`${cell.dateKey || "blank"}-${idx}`}
                      className={`aspect-square rounded-none ${getHeatmapClass(
                        cell.count || 0
                      )}`}
                      title={`${cell.dateKey || "No data"} • ${cell.count || 0}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2 mt-5 text-xs text-slate-400">
                  <span>Less</span>
                  <div className="w-4 h-4 bg-slate-100" />
                  <div className="w-4 h-4 bg-emerald-200" />
                  <div className="w-4 h-4 bg-emerald-300" />
                  <div className="w-4 h-4 bg-emerald-400" />
                  <div className="w-4 h-4 bg-emerald-600" />
                  <span>More</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-none shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-900">
                  Today&apos;s Activities
                </h2>
                <div className="px-4 py-1 border border-orange-300 text-orange-500 text-sm font-medium rounded-none">
                  {data.todayPoints || 0} pts earned
                </div>
              </div>

              <p className="text-sm text-slate-500 mt-1">
                {remainingTodayCount === 0
                  ? "Daily goal achieved"
                  : `${remainingTodayCount} more activities needed today`}
              </p>

              <div className="mt-5 space-y-4">
                {(data.activities || []).map((activity) => {
                  const completed =
                    activity.status === "done" || activity.completed;

                  return (
                    <div
                      key={activity.key}
                      className={`flex items-center justify-between gap-4 border px-4 py-4 rounded-none ${
                        completed
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-white border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="text-2xl shrink-0">
                          {activity.icon}
                        </div>

                        <div className="min-w-0">
                          <div
                            className={`text-base ${
                              completed
                                ? "line-through text-slate-400"
                                : "text-slate-800"
                            }`}
                          >
                            {activity.title}
                          </div>
                          <div className="text-sm text-slate-400">
                            +{activity.points} points
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleActivityClick(activity.key)}
                        className={`min-w-[84px] px-4 py-2 text-sm font-semibold rounded-none shadow-sm ${
                          completed
                            ? "bg-emerald-500 text-white cursor-default"
                            : "bg-orange-500 text-white hover:bg-orange-600"
                        }`}
                      >
                        {completed ? "Done ✓" : "Go"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-6 rounded-none shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-orange-500" />
              <h2 className="text-xl font-semibold text-slate-900">
                Achievements
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {(data.achievements || []).map((item) => {
                const Icon = ICONS[item.icon] || Sparkles;

                return (
                  <div
                    key={item.title}
                    className={`border p-5 rounded-none min-h-[140px] flex flex-col items-center justify-center text-center ${
                      item.unlocked
                        ? "bg-amber-50 border-amber-300"
                        : "bg-slate-50 border-slate-200 opacity-60"
                    }`}
                  >
                    <Icon className="w-10 h-10 text-slate-400 mb-3" />
                    <div className="font-semibold text-slate-900">
                      {item.title}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                      {item.description}
                    </div>

                    <div className="mt-3">
                      {item.unlocked ? (
                        <span className="inline-flex px-3 py-1 text-xs font-semibold bg-orange-500 text-white rounded-none">
                          Unlocked
                        </span>
                      ) : (
                        <div className="text-xs text-slate-500">
                          {item.progress}/{item.target}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
