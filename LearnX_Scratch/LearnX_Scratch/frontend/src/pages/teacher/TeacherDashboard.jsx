import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Brain,
  BookOpen,
  Layers3,
  CheckSquare,
  Search,
  Video,
  Trophy,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  BookText,
  Sparkles,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  FileText,
  BadgeAlert,
  ClipboardList,
  CircleAlert,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
}) {
  return (
    <div className="rounded-sm border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-medium uppercase tracking-wide text-slate-500">
            {title}
          </div>
          <div className="mt-1 text-[30px] font-semibold leading-none text-slate-900">
            {value}
          </div>
          {trend ? (
            <div className="mt-3 text-[13px] font-medium text-emerald-600">
              {trend}
            </div>
          ) : null}
          {subtitle ? (
            <div className="mt-2 text-[13px] text-slate-500">{subtitle}</div>
          ) : null}
        </div>

        <div className={`flex h-10 w-10 items-center justify-center rounded-sm ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get("/teacher/dashboard");
        setData(res.data);
      } catch (err) {
        console.error("Teacher dashboard fetch error:", err);
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const subjectData = useMemo(() => data?.subjectData || [], [data]);

  const stats = useMemo(
    () => [
      {
        title: "Students Tracked",
        value: data?.stats?.studentsTracked ?? "0",
        trend: "",
        icon: Users,
        iconBg: "bg-[#f3efff]",
        iconColor: "text-[#7a39f0]",
      },
      {
        title: "Quizzes Created",
        value: data?.stats?.quizzesCreated ?? "0",
        trend: "",
        icon: Brain,
        iconBg: "bg-[#eef2ff]",
        iconColor: "text-[#4b46e5]",
      },
      {
        title: "Avg Class Score",
        value:
          data?.stats?.avgClassScore !== undefined && data?.stats?.avgClassScore !== null
            ? `${data.stats.avgClassScore}%`
            : "0%",
        trend: "",
        icon: TrendingUp,
        iconBg: "bg-[#eafbf2]",
        iconColor: "text-emerald-600",
      },
      {
        title: "At-Risk Alerts",
        value: data?.stats?.atRiskAlerts ?? "0",
        subtitle: "Needs attention",
        trend: "",
        icon: AlertTriangle,
        iconBg: "bg-[#fff0f3]",
        iconColor: "text-rose-500",
      },
      {
        title: "Lessons Planned",
        value: data?.stats?.lessonsPlanned ?? "0",
        trend: "",
        icon: BookText,
        iconBg: "bg-[#fff8e7]",
        iconColor: "text-amber-500",
      },
      {
        title: "Topics Done",
        value: data?.stats?.topicsDone ?? "0/0",
        trend: "",
        icon: Layers3,
        iconBg: "bg-[#eef6ff]",
        iconColor: "text-sky-600",
      },
    ],
    [data]
  );

  const quickAccess = [
    { title: "Performance Tracker", icon: BarChart3, bg: "bg-[#f3efff]", text: "text-[#7a39f0]", path: "/teacher/performance-tracker" },
    { title: "Quiz Generator", icon: BrainCircuit, bg: "bg-[#eef2ff]", text: "text-[#4b46e5]", path: "/teacher/quiz-generator" },
    { title: "Lesson Planner", icon: CalendarDays, bg: "bg-[#fef8e8]", text: "text-[#c96d00]", path: "/teacher/lesson-planner" },
    { title: "Leaderboard", icon: Trophy, bg: "bg-[#fff0f3]", text: "text-[#e14b5a]", path: "/teacher/leaderboard" },
  ];

  const alerts = data?.alerts || [];
  const recentActivity = data?.recentActivity || [];

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#f7f8fc] text-slate-900">
        <div className="px-4 py-4 md:px-6">
          <section className="relative overflow-hidden bg-gradient-to-r from-[#6b46f7] via-[#6240f2] to-[#5d3ef1] px-6 py-6 text-white shadow-sm md:px-8 md:py-7">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="relative">
              <div className="mb-1 flex items-center gap-2 text-[14px] font-medium text-white/90">
                <Sparkles className="h-4 w-4" />
                <span>Teacher Copilot</span>
              </div>

              <h1 className="text-[26px] font-bold tracking-tight md:text-[30px]">
                Good morning, {user?.name?.charAt(0).toUpperCase() + user?.name?.slice(1) || "Teacher"}!{" "}
                <span className="inline-block">👋</span>
              </h1>

              <p className="mt-2 max-w-2xl text-[15px] text-white/85">
                You have {data?.stats?.atRiskAlerts ?? 0} at-risk student alerts and 3 quizzes scheduled today.
              </p>

              <button className="mt-5 inline-flex items-center gap-3 rounded-none bg-white/15 px-4 py-2.5 text-[14px] font-medium text-white transition hover:bg-white/20">
                View Alerts
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          {error ? (
            <div className="mt-4 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <section className="mt-5 grid gap-4 lg:grid-cols-6">
            {stats.map((item) => (
              <StatCard key={item.title} {...item} />
            ))}
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
            <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-[15px] font-semibold text-slate-900">
                Subject-wise Average Score
              </h2>

              <div className="h-[270px] w-full">
                {loading ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-500">
                    Loading chart...
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine tickLine={false} />
                      <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="score" radius={[4, 4, 0, 0]} barSize={34} fill="#6b46f7" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="rounded-sm border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-[15px] font-semibold text-slate-900">
                Recent Activity
              </h2>

              <div className="space-y-4">
                {loading ? (
                  <div className="text-sm text-slate-500">Loading activity...</div>
                ) : recentActivity.length ? (
                  recentActivity.map((item, index) => {
                    const Icon =
                      index === 0
                        ? FileText
                        : index === 1
                        ? BadgeAlert
                        : index === 2
                        ? CalendarDays
                        : ClipboardList;

                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-md bg-slate-50 text-slate-500">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-[14px] text-slate-700">
                            {item.text || item.message || "Activity"}
                          </div>
                          <div className="mt-1 text-[12px] text-slate-400">
                            {item.time || ""}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-sm text-slate-500">No recent activity found.</div>
                )}
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-sm border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-[15px] font-semibold text-slate-900">
              Quick Access
            </h2>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {quickAccess.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    onClick={() => navigate(item.path)}
                    className={`flex h-[88px] items-start gap-3 rounded-none px-4 py-4 ${item.bg} cursor-pointer transition hover:opacity-80`}
                  >
                    <Icon className={`h-7 w-7 ${item.text}`} />
                    <div className="pt-7">
                      <div className={`text-[14px] font-semibold ${item.text}`}>
                        {item.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="mt-6 rounded-sm border border-[#ffc7cf] bg-[#fff5f6] p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[#e14b5a]">
                <CircleAlert className="h-4 w-4" />
                <h2 className="text-[15px] font-semibold">AI At-Risk Alerts</h2>
              </div>
              <div className="rounded-sm border border-slate-200 bg-white px-3 py-1 text-[13px] font-semibold text-slate-700 shadow-sm">
                {alerts.length} students
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="text-sm text-slate-500">Loading alerts...</div>
              ) : alerts.length ? (
                alerts.map((student) => (
                  <div
                    key={student.id || student.name}
                    className="flex items-center justify-between gap-4 rounded-sm border border-[#f4d8dd] bg-white px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ffe7ea] text-[12px] font-semibold text-[#e14b5a]">
                        {student.initials}
                      </div>
                      <div>
                        <div className="text-[14px] font-semibold text-slate-900">
                          {student.name}
                        </div>
                        <div className="text-[12px] text-slate-500">{student.detail}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="rounded-sm border border-slate-200 bg-white px-3 py-1 text-[13px] font-semibold text-slate-700 shadow-sm">
                        {student.score}
                      </div>
                      <button className="rounded-sm border border-[#ff7d90] px-4 py-1.5 text-[13px] font-medium text-[#ff5d79] hover:bg-[#fff6f8]">
                        View
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">No at-risk students found.</div>
              )}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}