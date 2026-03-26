import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import useDashboard from "../../hooks/useDashboard";
import {
  BookOpen,
  Brain,
  CalendarDays,
  ChevronRight,
  Flame,
  GraduationCap,
  MessageCircle,
  Sparkles,
  Target,
  Trophy,
  Zap,
  Clock3,
} from "lucide-react";

function formatTimeAgo(value) {
  if (!value) return "";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function LineChart({ data }) {
  const points = Array.isArray(data) ? data : [];
  const width = 700;
  const height = 220;
  const padding = 26;
  const max = 100;
  const min = 50;

  if (!points.length) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-slate-400">
        No chart data available
      </div>
    );
  }

  const stepX = (width - padding * 2) / (points.length - 1 || 1);

  const coords = points.map((item, idx) => {
    const score = Number(item.score || 0);
    const x = padding + idx * stepX;
    const y =
      padding +
      (height - padding * 2) * (1 - (Math.max(min, Math.min(max, score)) - min) / (max - min));
    return { x, y, day: item.day, score };
  });

  const linePath = coords
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - padding} L ${coords[0].x} ${height - padding} Z`;

  return (
    <div className="h-[260px] w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full">
        <defs>
          <linearGradient id="dashboardArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="95%" stopColor="#6366f1" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" />
        <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#cbd5e1" />

        {[50, 65, 80, 100].map((tick) => {
          const y =
            padding +
            (height - padding * 2) * (1 - (tick - min) / (max - min));
          return (
            <g key={tick}>
              <text x={padding - 8} y={y + 4} fontSize="11" fill="#94a3b8" textAnchor="end">
                {tick}
              </text>
            </g>
          );
        })}

        <path d={areaPath} fill="url(#dashboardArea)" />
        <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" />

        {coords.map((p) => (
          <circle key={p.day} cx={p.x} cy={p.y} r="3.5" fill="#6366f1" />
        ))}

        {coords.map((p) => (
          <text
            key={`${p.day}-label`}
            x={p.x}
            y={height - 8}
            textAnchor="middle"
            fontSize="11"
            fill="#64748b"
          >
            {p.day}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data, loading, error } = useDashboard();

  const firstName = useMemo(() => {
    const name = data?.studentName || user?.fullName || user?.name || "Alex";
    return name.split(" ")[0] || "Alex";
  }, [data?.studentName, user]);

  const stats = useMemo(() => {
    return [
      {
        label: "Current Streak",
        value: `${data?.currentStreak || 0} days`,
        icon: Flame,
        trend: "Live streak",
        bg: "bg-amber-50",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
      },
      {
        label: "Flashcards Due",
        value: `${data?.flashcardsDue || 0}`,
        icon: BookOpen,
        trend: "Ready to review",
        bg: "bg-indigo-50",
        iconBg: "bg-indigo-100",
        iconColor: "text-indigo-600",
      },
      {
        label: "Study Progress",
        value: `${data?.studyProgress || 0}%`,
        icon: Target,
        trend: "This week",
        bg: "bg-emerald-50",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
      },
      {
        label: "Leaderboard Rank",
        value: `#${data?.leaderboardRank || 0}`,
        icon: Trophy,
        trend: "Among all students",
        bg: "bg-violet-50",
        iconBg: "bg-violet-100",
        iconColor: "text-violet-600",
      },
      {
        label: "Total Points",
        value: `${Number(data?.totalPoints || 0).toLocaleString()}`,
        icon: Zap,
        trend: "Earning fast",
        bg: "bg-sky-50",
        iconBg: "bg-sky-100",
        iconColor: "text-sky-600",
      },
      {
        label: "Badges Earned",
        value: `${data?.badgesEarned || 0}`,
        icon: CalendarDays,
        trend: "Achievements",
        bg: "bg-rose-50",
        iconBg: "bg-rose-100",
        iconColor: "text-rose-600",
      },
    ];
  }, [data]);

  const recentActivity = Array.isArray(data?.recentActivity) ? data.recentActivity : [];
  const weeklyPerformance = Array.isArray(data?.weeklyPerformance) ? data.weeklyPerformance : [];
  const todayPlan = Array.isArray(data?.todayPlan) ? data.todayPlan : [];
  const achievements = Array.isArray(data?.achievements) ? data.achievements : [];

  const quickAccess = [
    {
      title: "Study Planner",
      icon: CalendarDays,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      path: "/student/study-planner",
    },
    {
      title: "Flashcards",
      icon: Sparkles,
      color: "text-amber-700",
      bg: "bg-amber-50",
      path: "/student/flashcards",
    },
    {
      title: "AI Tutor",
      icon: MessageCircle,
      color: "text-sky-600",
      bg: "bg-sky-50",
      path: "/student/ai-tutor",
    },
    {
      title: "Leaderboard",
      icon: Trophy,
      color: "text-violet-600",
      bg: "bg-violet-50",
      path: "/student/leaderboard",
    },
  ];

  if (loading) {
    return (
      <DashboardLayout title="Dashboard">
        <div className="space-y-6">
          <div className="h-[180px] rounded-none bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="h-[116px] border border-slate-200 bg-white animate-pulse" />
            ))}
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2 h-[320px] border border-slate-200 bg-white animate-pulse" />
            <div className="h-[320px] border border-slate-200 bg-white animate-pulse" />
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="h-[260px] border border-slate-200 bg-white animate-pulse" />
            <div className="h-[260px] border border-slate-200 bg-white animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      <div className="space-y-6">
        {error && (
          <div className="rounded-none border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="relative overflow-hidden rounded-none bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 px-6 py-6 text-white shadow-sm">
          <div className="relative z-10 max-w-4xl">
            <div className="flex items-center gap-2 text-white/90 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>Student Copilot</span>
            </div>

            <h1 className="mt-1 text-3xl md:text-4xl font-extrabold leading-tight">
              Keep it up, {firstName}! 🔥
            </h1>

            <p className="mt-2 text-white/80 text-base md:text-lg">
              You&apos;re on a {data?.currentStreak || 0}-day streak!{" "}
              {data?.flashcardsDue || 0} flashcards due for review today.
            </p>

            <button
              onClick={() => navigate("/student/flashcards")}
              className="mt-4 inline-flex items-center gap-2 rounded-none bg-white/20 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/30 transition"
            >
              Review Flashcards
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-12 right-20 h-28 w-28 rounded-full bg-white/10" />
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`border border-slate-200 rounded-none ${stat.bg} p-4 shadow-sm`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      {stat.label}
                    </p>
                    <h3 className="mt-1 text-3xl font-semibold text-slate-900">
                      {stat.value}
                    </h3>
                    <p className="mt-2 text-xs text-emerald-600">{stat.trend}</p>
                  </div>

                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-none ${stat.iconBg}`}
                  >
                    <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 rounded-none border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Weekly Performance
            </h2>

            <div className="mt-4">
              <LineChart data={weeklyPerformance} />
            </div>
          </div>

          <div className="rounded-none border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Recent Activity
            </h2>

            <div className="mt-4 space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-sm text-slate-400">No activity yet.</p>
              ) : (
                recentActivity.map((item, idx) => {
                  const iconMap = {
                    "📚": BookOpen,
                    "📝": Brain,
                    "🃏": Sparkles,
                    "🤖": MessageCircle,
                    "✨": Sparkles,
                  };
                  const Icon = iconMap[item.icon] || Clock3;

                  return (
                    <div key={`${item.title}-${idx}`} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Icon className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-700">{item.title}</p>
                        <p className="text-xs text-slate-400 mt-1">{item.time}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="rounded-none border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">
              Today&apos;s Study Plan
            </h2>

            <div className="mt-4 space-y-4">
              {todayPlan.length === 0 ? (
                <p className="text-sm text-slate-400">No study plan loaded.</p>
              ) : (
                todayPlan.map((task) => (
                  <div
                    key={task.title}
                    className="flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div
                        className={`mt-0.5 h-5 w-5 rounded-full flex items-center justify-center ${
                          task.done ? "bg-emerald-500" : "border-2 border-slate-300"
                        }`}
                      >
                        {task.done ? (
                          <span className="text-white text-[11px] font-bold">✓</span>
                        ) : null}
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`text-sm ${
                            task.done
                              ? "line-through text-slate-400"
                              : "text-slate-800"
                          }`}
                        >
                          {task.title}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{task.sub}</p>
                      </div>
                    </div>

                    {!task.done ? (
                      <button className="rounded-none border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                        Pending
                      </button>
                    ) : (
                      <div className="w-[70px]" />
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 flex items-center justify-between text-sm">
              <p className="text-slate-500">Progress</p>
              <p className="text-slate-500">{data?.studyProgress || 0}% complete</p>
            </div>

            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-indigo-500"
                style={{ width: `${data?.studyProgress || 0}%` }}
              />
            </div>
          </div>

          <div className="rounded-none border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Quick Access</h2>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {quickAccess.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    onClick={() => navigate(item.path)}
                    className={`flex min-h-[92px] flex-col justify-between rounded-none border border-slate-100 ${item.bg} p-4 text-left transition hover:brightness-95`}
                  >
                    <Icon className={`w-6 h-6 ${item.color}`} />
                    <span className={`text-sm font-semibold ${item.color}`}>
                      {item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-none border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            <h2 className="text-base font-semibold text-slate-900">
              Achievements
            </h2>
          </div>

          <div className="flex flex-wrap gap-4">
            {achievements.map((item) => {
              const Icon = item.icon === "🔥"
                ? Flame
                : item.icon === "🧠"
                ? Brain
                : item.icon === "🃏"
                ? Sparkles
                : item.icon === "⚡"
                ? Zap
                : item.icon === "🏅"
                ? Trophy
                : GraduationCap;

              return (
                <div
                  key={item.title}
                  className={`flex h-[104px] w-[104px] flex-col items-center justify-center rounded-none border ${
                    item.unlocked
                      ? "border-amber-300 bg-amber-50"
                      : "border-slate-200 bg-slate-50 opacity-45"
                  }`}
                >
                  <Icon className={`w-7 h-7 ${item.unlocked ? "text-orange-500" : "text-slate-400"}`} />
                  <p className="mt-2 px-2 text-center text-[11px] text-slate-600">
                    {item.title}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}