import { useEffect, useMemo, useRef, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import FocusSession from "../../components/FocusSession";
import TreeGrowth from "../../components/TreeGrowth";
import { useAuth } from "../../context/AuthContext";
import {
  CheckCircle2,
  Circle,
  Clock3,
  Play,
  Pause,
  Sparkles,
  Trees,
  CalendarDays,
  BookOpen,
  MoreVertical,
} from "lucide-react";

const parseDurationToMinutes = (duration) => {
  if (typeof duration === "number" && Number.isFinite(duration)) return duration;

  const text = String(duration ?? "").trim().toLowerCase();
  const match = text.match(/\d+/);

  if (!match) return 25;

  const value = Number(match[0]);

  if (text.includes("hour") || text.includes("hr") || text.includes("h")) {
    return value * 60;
  }

  return value;
};

const parseLocalDateString = (dateString) => {
  const parts = String(dateString || "").split("-").map(Number);
  if (parts.length !== 3 || parts.some((v) => !Number.isFinite(v))) return null;
  return new Date(parts[0], parts[1] - 1, parts[2]);
};

const isPastLocalDate = (dateString) => {
  const date = parseLocalDateString(dateString);
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
};

const getForestTreeSize = (minutes) => {
  if (minutes >= 90) return "large";
  if (minutes >= 45) return "medium";
  return "small";
};

const getTreeStageFromProgress = (progress = 0) => {
  if (progress <= 0) return 0;
  if (progress < 0.25) return 1;
  if (progress < 0.5) return 2;
  if (progress < 0.8) return 3;
  return 4;
};

const makeTaskKey = (planId, dayIndex, taskIndex) =>
  `${planId || "plan"}-${dayIndex}-${taskIndex}`;

export default function StudyPlanner() {
  const [subjects, setSubjects] = useState("");
  const [topics, setTopics] = useState("");
  const [examDate, setExamDate] = useState("");
  const [hours, setHours] = useState(5);

  const [plans, setPlans] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [editingPlanId, setEditingPlanId] = useState(null);
  const [menu, setMenu] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCompletedBanner, setShowCompletedBanner] = useState(false);

  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [forest, setForest] = useState([]);
  const [loadingForest, setLoadingForest] = useState(true);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const endingSessionRef = useRef(false);
  const sessionCompleteRef = useRef(false);

  const resetForm = () => {
    setSubjects("");
    setTopics("");
    setExamDate("");
    setHours(5);
    setEditingPlanId(null);
  };

  const fetchPlans = async () => {
    try {
      setError("");
      const res = await api.get("/study-plan");
      const data = Array.isArray(res.data) ? res.data : [];
      setPlans(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load plans");
    }
  };

  useEffect(() => {
    if (!user) {
      setPlans([]);
      setSelectedPlan(null);
      return;
    }

    fetchPlans();
    fetchForest();
  }, [user]);

  const fetchForest = async () => {
    try {
      const res = await api.get("/forest");
      setForest(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to fetch forest:", err);
    } finally {
      setLoadingForest(false);
    }
  };

  useEffect(() => {
    const filtered = plans.filter(
      (p) => p.status === activeTab && (p.subjects || "").trim()
    );

    if (selectedPlan?._id) {
      const matchedPlan = filtered.find((p) => p._id === selectedPlan._id);
      if (matchedPlan) {
        setSelectedPlan(matchedPlan);
        return;
      }
    }

    setSelectedPlan(filtered[0] || null);
  }, [plans, activeTab]);

  useEffect(() => {
    const closeMenu = () => setMenu(null);
    if (menu) {
      document.addEventListener("click", closeMenu);
      return () => document.removeEventListener("click", closeMenu);
    }
  }, [menu]);

  useEffect(() => {
    if (!showCompletedBanner) return;

    const timer = setTimeout(() => {
      setShowCompletedBanner(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, [showCompletedBanner]);

  useEffect(() => {
    sessionCompleteRef.current = false;
  }, [session?.planId, session?.dayIndex, session?.taskIndex]);

  useEffect(() => {
    if (!session || session.status !== "running") return;

    const timer = setInterval(() => {
      setSession((prev) => {
        if (!prev || prev.status !== "running") return prev;
        return {
          ...prev,
          elapsedSeconds: Math.min(prev.targetSeconds, prev.elapsedSeconds + 1),
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [session?.status, session?.planId, session?.dayIndex, session?.taskIndex]);

  useEffect(() => {
    if (!session || session.status !== "running") return;
    if (session.elapsedSeconds < session.targetSeconds) return;
    if (sessionCompleteRef.current) return;

    sessionCompleteRef.current = true;
    completeCurrentSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.elapsedSeconds, session?.status]);

  const handleGenerate = async () => {
    if (!subjects.trim() || !topics.trim() || !examDate) {
      setError("⚠️ All fields are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        subjects,
        topics,
        examDate,
        hours,
      };

      let res;
      if (editingPlanId) {
        res = await api.put(`/study-plan/${editingPlanId}`, payload);
      } else {
        res = await api.post("/study-plan/generate", payload);
      }

      const savedPlan = res.data;

      setPlans((prev) => {
        if (editingPlanId) {
          return prev.map((p) => (p._id === savedPlan._id ? savedPlan : p));
        }
        return [savedPlan, ...prev];
      });

      setSelectedPlan(savedPlan);
      setActiveTab(savedPlan.status || "active");
      resetForm();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "❌ Failed to generate study plan");
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (planId, dayIndex, taskIndex) => {
    const sourcePlan = plans.find((p) => p._id === planId) || selectedPlan;
    if (!sourcePlan) return null;

    const currentTask = sourcePlan.tasks?.[dayIndex]?.tasks?.[taskIndex];
    if (!currentTask) return null;
    if (currentTask.completed) return sourcePlan;

    const previousPlans = plans;
    const previousSelected = selectedPlan;

    const optimisticPlan = JSON.parse(JSON.stringify(sourcePlan));
    optimisticPlan.tasks[dayIndex].tasks[taskIndex].completed = true;

    setPlans((prev) => prev.map((p) => (p._id === planId ? optimisticPlan : p)));
    if (selectedPlan?._id === planId) {
      setSelectedPlan(optimisticPlan);
    }

    try {
      const res = await api.put("/study-plan/task", {
        planId,
        dayIndex,
        taskIndex,
      });

      const updatedPlan = res.data;

      setPlans((prev) =>
        prev.map((p) => (p._id === updatedPlan._id ? updatedPlan : p))
      );
      if (selectedPlan?._id === updatedPlan._id) {
        setSelectedPlan(updatedPlan);
      }

      try {
        await api.post("/streak/complete/daily-study");
      } catch (streakErr) {
        console.log("Streak update failed", streakErr);
      }

      if (updatedPlan.status === "completed") {
        setShowCompletedBanner(true);
        setTimeout(() => {
          setActiveTab("completed");
        }, 100);
      }

      window.dispatchEvent(new Event("notification-refresh"));
      return updatedPlan;
    } catch (err) {
      console.error(err);
      setPlans(previousPlans);
      setSelectedPlan(previousSelected);
      setError("Failed to update task");
      return null;
    }
  };

  const beginSession = (dayIndex, taskIndex) => {
    if (!selectedPlan?._id) return;

    const task = selectedPlan.tasks?.[dayIndex]?.tasks?.[taskIndex];
    if (!task || task.completed) return;

    if (session && session.status !== "completed") {
      const sameTask =
        session.planId === selectedPlan._id &&
        session.dayIndex === dayIndex &&
        session.taskIndex === taskIndex;

      if (!sameTask) {
        setError("Finish or pause the current focus session before starting another topic.");
        return;
      }
    }

    const subject =
      task.subject || selectedPlan.subjects?.split(",")?.[0]?.trim() || "Study";
    const minutes = Math.max(1, parseDurationToMinutes(task.duration || 25));

    sessionCompleteRef.current = false;

    setSession({
      open: true,
      planId: selectedPlan._id,
      dayIndex,
      taskIndex,
      topic: task.title || "Untitled topic",
      subject,
      targetSeconds: minutes * 60,
      elapsedSeconds: 0,
      status: "running",
    });
  };

  const pauseSession = () => {
    setSession((prev) => (prev ? { ...prev, status: "paused", open: true } : prev));
  };

  const continueLaterSession = () => {
    setSession((prev) => (prev ? { ...prev, open: false, status: "paused" } : prev));
  };

  const resumeSession = () => {
    setSession((prev) => (prev ? { ...prev, status: "running", open: true } : prev));
  };

  const resetSession = () => {
    sessionCompleteRef.current = false;
    setSession(null);
  };

  const closeSession = () => {
    setSession((prev) => {
      if (!prev) return prev;
      if (prev.status === "completed") return null;
      return { ...prev, open: false };
    });
  };

  const finalizeSession = async ({
    topic,
    subject,
    progress,
    treeStage,
    elapsedSeconds,
  }) => {
    if (!session?.planId) return null;

    const planId = session.planId;
    const dayIndex = session.dayIndex;
    const taskIndex = session.taskIndex;

    const updatedPlan = await completeTask(planId, dayIndex, taskIndex);
    if (!updatedPlan) return null;

    const safeProgress = Number.isFinite(Number(progress))
      ? Number(progress)
      : Math.max(0, Math.min(1, (elapsedSeconds || 0) / Math.max(1, session.targetSeconds || 1)));

    const safeElapsed = Number.isFinite(Number(elapsedSeconds))
      ? Number(elapsedSeconds)
      : session.elapsedSeconds || 0;

    const treeMinutes = Math.max(1, Math.round(safeElapsed / 60));

    const newTree = {
      id: Date.now(),
      topic: topic || session.topic || "Untitled topic",
      subject: subject || session.subject || "Study",
      progress: safeProgress,
      treeStage: Number.isFinite(Number(treeStage))
        ? Number(treeStage)
        : safeProgress >= 0.8
        ? 4
        : safeProgress >= 0.5
        ? 3
        : safeProgress >= 0.25
        ? 2
        : 1,
      duration: safeElapsed,
      plantedAt: new Date().toISOString(),
      dayLabel: selectedPlan?.tasks?.[dayIndex]?.day || "Study Plan",
      size: getForestTreeSize(treeMinutes),
    };

    setSession(null);
    return newTree;
  };

  const endSession = async (payload = {}) => {
    if (endingSessionRef.current || !session?.planId) return;

    endingSessionRef.current = true;
    setIsEndingSession(true);

    const currentSession = session;

    const progress =
      typeof payload.progress === "number"
        ? payload.progress
        : currentSession.targetSeconds
        ? currentSession.elapsedSeconds / currentSession.targetSeconds
        : 0;

    const elapsedSeconds =
      typeof payload.elapsedSeconds === "number"
        ? payload.elapsedSeconds
        : currentSession.elapsedSeconds;

    const body = {
      planId: currentSession.planId,
      dayIndex: currentSession.dayIndex,
      taskIndex: currentSession.taskIndex,
      topic: payload.topic || currentSession.topic,
      subject: payload.subject || currentSession.subject,
      progress,
      treeStage:
        typeof payload.treeStage === "number"
          ? payload.treeStage
          : getTreeStageFromProgress(progress),
      elapsedSeconds,
    };

    setSession((prev) => (prev ? { ...prev, open: false, status: "completed" } : prev));

    try {
      const res = await api.post("/study-plan/session/end", body);

      const updatedPlan = res.data?.plan;
      const plantedTree = res.data?.tree;

      if (updatedPlan) {
        setPlans((prev) =>
          prev.map((p) => (p._id === updatedPlan._id ? updatedPlan : p))
        );
        if (selectedPlan?._id === updatedPlan._id) {
          setSelectedPlan(updatedPlan);
        }
      }

      if (plantedTree) {
        setForest((prev) => {
          const exists = prev.some((t) => String(t._id) === String(plantedTree._id));
          return exists ? prev : [plantedTree, ...prev];
        });
      }

      if (updatedPlan?.status === "completed") {
        setShowCompletedBanner(true);
        setTimeout(() => setActiveTab("completed"), 100);
      }

      window.dispatchEvent(new Event("notification-refresh"));
    } catch (err) {
      console.error("End session API error:", err);
      setError("Failed to end session");
    } finally {
      endingSessionRef.current = false;
      setIsEndingSession(false);
      setSession(null);
    }
  };

  const completeCurrentSession = async () => {
    if (!session?.planId || endingSessionRef.current) return;

    await endSession({
      topic: session.topic,
      subject: session.subject,
      progress: 1,
      treeStage: 4,
      elapsedSeconds: session.targetSeconds,
    });
  };

  const handleTaskPrimaryAction = (dayIndex, taskIndex) => {
    if (!selectedPlan?._id) return;

    const task = selectedPlan.tasks?.[dayIndex]?.tasks?.[taskIndex];
    if (!task) return;
    if (task.completed) return;

    const sameTask =
      session &&
      session.planId === selectedPlan._id &&
      session.dayIndex === dayIndex &&
      session.taskIndex === taskIndex;

    if (!session || session.status === "completed") {
      beginSession(dayIndex, taskIndex);
      return;
    }

    if (!sameTask) return;

    if (session.status === "running") {
      pauseSession();
    } else if (session.status === "paused") {
      resumeSession();
    }
  };

  const deletePlan = async (id) => {
    try {
      await api.delete(`/study-plan/${id}`);

      const updated = plans.filter((p) => p._id !== id);
      setPlans(updated);

      const filtered = updated.filter(
        (p) => p.status === activeTab && (p.subjects || "").trim()
      );
      setSelectedPlan(filtered[0] || null);

      setMenu(null);
    } catch (err) {
      console.error(err);
      setError("Failed to delete plan");
    }
  };

  const editPlan = (plan) => {
    if (!plan) return;

    setSubjects(plan.subjects || "");
    setTopics(plan.topics || "");
    setExamDate(plan.examDate || "");
    setHours(plan.hours || 5);
    setEditingPlanId(plan._id);
    setMenu(null);
  };

  const progress = useMemo(() => {
    if (!selectedPlan?.tasks) {
      return { total: 0, done: 0, percent: 0 };
    }

    const total = selectedPlan.tasks.reduce((acc, d) => acc + (d.tasks?.length || 0), 0);

    const done = selectedPlan.tasks.reduce(
      (acc, d) => acc + (d.tasks?.filter((t) => t.completed)?.length || 0),
      0
    );

    return {
      total,
      done,
      percent: total ? Math.round((done / total) * 100) : 0,
    };
  }, [selectedPlan]);

  const filteredPlans = plans.filter(
    (p) => p.status === activeTab && (p.subjects || "").trim()
  );

  const hasTaskData =
    selectedPlan?.tasks?.some((day) => (day.tasks?.length || 0) > 0) || false;

  const activeSessionMeta = session && session.status !== "completed";

  const forestTrees = useMemo(() => forest, [forest]);

  return (
    <DashboardLayout title="Study Planner">
      <div className="relative space-y-6">
        {showCompletedBanner && (
          <div className="fixed right-6 top-6 z-[2000]">
            <div className="animate-bounce rounded-2xl border border-green-200 bg-white px-5 py-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-xl text-green-600">
                  🎉
                </div>
                <div>
                  <p className="font-semibold text-green-700">Plan Completed!</p>
                  <p className="text-sm text-green-600">
                    Great job! Your study plan is done.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-semibold">
              {editingPlanId ? "Edit Study Plan" : "Study Plan Setup"}
            </h2>

            {editingPlanId && (
              <button
                onClick={resetForm}
                className="rounded-xl border bg-white px-4 py-2 transition-colors hover:bg-gray-50"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Subjects (comma-separated)</label>
              <input
                value={subjects}
                onChange={(e) => setSubjects(e.target.value)}
                placeholder="Math, Physics"
<<<<<<< Updated upstream
                className="w-full mt-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
=======
                className="mt-1 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
>>>>>>> Stashed changes
              />
            </div>

            <div>
              <label className="text-sm font-medium">Exam Date</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
<<<<<<< Updated upstream
                className="w-full mt-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
=======
                className="mt-1 w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
>>>>>>> Stashed changes
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium">Topics</label>
            <textarea
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="Enter topics line by line..."
<<<<<<< Updated upstream
              className="w-full mt-1 px-4 py-3 border rounded-xl min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
=======
              className="mt-1 min-h-[120px] w-full rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
>>>>>>> Stashed changes
            />
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium">Daily Study Hours: {hours}h</label>
            <input
              type="range"
              min="1"
              max="10"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {error && (
            <div className="mt-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
<<<<<<< Updated upstream
            className="mt-5 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
=======
            className="mt-5 rounded-xl bg-purple-600 px-6 py-3 text-white transition-colors hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
>>>>>>> Stashed changes
          >
            {loading
              ? "Generating..."
              : editingPlanId
              ? "Update Study Plan"
              : "Generate Study Plan"}
          </button>
        </div>

        {activeSessionMeta && (
          <div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-violet-700">
                  <Sparkles className="h-4 w-4" />
                  Focus session active
                </div>
                <h3 className="mt-1 text-lg font-semibold text-slate-900">
                  {session.topic}
                </h3>
                <p className="text-sm text-slate-500">
                  {session.subject} • {Math.floor(session.targetSeconds / 60)} min target
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSession((prev) => (prev ? { ...prev, open: true } : prev))}
                  className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
                >
                  Open Session
                </button>
                <button
                  onClick={session.status === "running" ? pauseSession : resumeSession}
                  className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
                >
                  {session.status === "running" ? "Pause" : "Resume"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("active")}
            className={`rounded-xl px-4 py-2 transition-colors ${
              activeTab === "active"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Active Plans
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={`rounded-xl px-4 py-2 transition-colors ${
              activeTab === "completed"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Completed Plans
          </button>
        </div>

        {filteredPlans.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {filteredPlans.map((plan) => (
              <div
                key={plan._id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPlan(plan)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedPlan(plan);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenu({
                    x: e.clientX,
                    y: e.clientY,
                    plan,
                  });
                }}
                className={`group flex items-center justify-between rounded-xl border px-4 py-2 transition-colors ${
                  selectedPlan?._id === plan._id
                    ? "bg-blue-600 text-white"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {plan.subjects}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setMenu({
                      x: e.clientX,
                      y: e.clientY,
                      plan,
                    });
                  }}
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    selectedPlan?._id === plan._id
                      ? "bg-white/15 text-white hover:bg-white/25"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {filteredPlans.length === 0 && (
          <div className="mt-6 py-8 text-center text-gray-400">
            {activeTab === "completed"
              ? "No completed plans yet. Complete all tasks in a plan to see it here!"
              : "No active plans yet. Generate your first study plan above."}
          </div>
        )}

        {selectedPlan && hasTaskData && (
<<<<<<< Updated upstream
          <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-blue-900">Overall Progress</h3>
              <span className="text-sm font-medium text-blue-700">
=======
          <div className="rounded-2xl border border-purple-200 bg-purple-50 p-5">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold text-purple-900">Overall Progress</h3>
              <span className="text-sm font-medium text-purple-700">
>>>>>>> Stashed changes
                {progress.done}/{progress.total} tasks
              </span>
            </div>

<<<<<<< Updated upstream
            <p className="text-sm text-blue-700 mb-3">
              {progress.percent}% complete • {progress.total - progress.done} remaining
            </p>

            <div className="w-full bg-blue-200 h-3 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
=======
            <p className="mb-3 text-sm text-purple-700">
              {progress.percent}% complete • {progress.total - progress.done} remaining
            </p>

            <div className="h-3 w-full overflow-hidden rounded-full bg-purple-200">
              <div
                className="h-3 rounded-full bg-purple-600 transition-all duration-500 ease-out"
>>>>>>> Stashed changes
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {selectedPlan && hasTaskData && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {selectedPlan.tasks.map((day, dayIndex) => {
              const dayTasks = day.tasks || [];
              const dayDone = dayTasks.filter((t) => t.completed).length;
              const dayProgress =
                dayTasks.length > 0 ? Math.round((dayDone / dayTasks.length) * 100) : 0;

              return (
                <div
                  key={dayIndex}
                  className="rounded-2xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between border-b pb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{day.day}</p>
                      <p className="mt-1 text-xs text-gray-400">{day.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPastLocalDate(day.date) && dayTasks.some((task) => !task.completed) ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-semibold text-red-700">
                          Missed
                        </span>
                      ) : null}
                      <span className="rounded border border-purple-200 bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700">
                        {dayDone}/{dayTasks.length}
                      </span>
                    </div>
<<<<<<< Updated upstream
                    <span className="text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      {dayDone}/{dayTasks.length}
                    </span>
=======
>>>>>>> Stashed changes
                  </div>

                  <div className="mb-3 h-1 w-full rounded-full bg-gray-200">
                    <div
<<<<<<< Updated upstream
                      className="bg-blue-600 h-1 rounded-full transition-all duration-300"
=======
                      className="h-1 rounded-full bg-purple-600 transition-all duration-300"
>>>>>>> Stashed changes
                      style={{ width: `${dayProgress}%` }}
                    />
                  </div>

<<<<<<< Updated upstream
                  <div className="space-y-2">
                    {dayTasks.map((task, taskIndex) => (
                      <div
                        key={taskIndex}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          toggleTask(dayIndex, taskIndex);
                        }}
                        className="w-full flex items-start gap-3 text-left group hover:bg-blue-50 p-2 rounded-lg transition-colors cursor-pointer"
                      >
                        {task.completed ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5 group-hover:text-blue-400 transition-colors" />
                        )}

                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm transition-all duration-200 ${
                              task.completed
                                ? "line-through text-gray-400"
                                : "text-gray-900 group-hover:text-blue-700"
                            }`}
                          >
                            {task.title}
                          </p>
=======
                  <div className="space-y-3">
                    {dayTasks.map((task, taskIndex) => {
                      const isSameTask =
                        session &&
                        session.planId === selectedPlan._id &&
                        session.dayIndex === dayIndex &&
                        session.taskIndex === taskIndex;

                      const primaryLabel = task.completed
                        ? "Done"
                        : isSameTask
                        ? session.status === "running"
                          ? "Pause"
                          : session.status === "paused"
                          ? "Resume"
                          : "Open"
                        : session && session.status !== "completed"
                        ? "Session Active"
                        : "Start";
>>>>>>> Stashed changes

                      const primaryIcon = task.completed
                        ? CheckCircle2
                        : isSameTask
                        ? session.status === "running"
                          ? Pause
                          : Play
                        : Play;

                      const primaryDisabled =
                        (!isSameTask && session && session.status !== "completed") ||
                        task.completed;

                      const currentProgress =
                        isSameTask && session.targetSeconds
                          ? Math.round(
                              (session.elapsedSeconds / session.targetSeconds) * 100
                            )
                          : 0;

                      return (
                        <div
                          key={taskIndex}
                          className="group rounded-2xl border border-slate-200 bg-slate-50/70 p-3 transition-colors hover:bg-violet-50/60"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <p
                                className={`text-sm font-medium transition-all ${
                                  task.completed
                                    ? "text-gray-400 line-through"
                                    : "text-slate-900 group-hover:text-violet-700"
                                }`}
                              >
                                {task.title}
                              </p>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className="inline-flex items-center gap-1">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  {task.duration}
                                </span>
                                {task.subject ? (
                                  <span className="rounded-full bg-white px-2 py-0.5 font-medium text-slate-600">
                                    {task.subject}
                                  </span>
                                ) : null}
                              </div>
                            </div>

                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                task.completed
                                  ? "bg-emerald-100 text-emerald-700"
                                  : isSameTask && session?.status === "running"
                                  ? "bg-violet-100 text-violet-700"
                                  : isSameTask && session?.status === "paused"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-200 text-slate-600"
                              }`}
                            >
                              {task.completed
                                ? "Completed"
                                : isSameTask
                                ? session.status.toUpperCase()
                                : "Ready"}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleTaskPrimaryAction(dayIndex, taskIndex);
                              }}
                              disabled={primaryDisabled}
                              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
                                primaryDisabled && !isSameTask
                                  ? "cursor-not-allowed bg-slate-200 text-slate-500"
                                  : task.completed
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-violet-600 text-white hover:bg-violet-700"
                              }`}
                            >
                              {primaryIcon ? <primaryIcon className="h-4 w-4" /> : null}
                              {primaryLabel}
                            </button>

                            {isSameTask && session?.status !== "completed" ? (
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSession((prev) =>
                                    prev ? { ...prev, open: true } : prev
                                  );
                                }}
                                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                              >
                                Focus View
                              </button>
                            ) : null}
                          </div>

                          {isSameTask && session?.status !== "completed" ? (
                            <div className="mt-3">
                              <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                                <span>Focus progress</span>
                                <span>{currentProgress}%</span>
                              </div>
                              <div className="h-2 rounded-full bg-slate-200">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-emerald-400 transition-all"
                                  style={{
                                    width: `${Math.max(currentProgress, 6)}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-violet-700">
                <Trees className="h-4 w-4" />
                Forest
              </div>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">
                Your planted study trees
              </h3>
              <p className="text-sm text-slate-500">
                Every completed topic becomes a tree in your forest.
              </p>
            </div>

            <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700">
              {forestTrees.length} planted
            </div>
          </div>

          {loadingForest ? (
            <div className="text-center py-10 text-gray-400">Loading forest...</div>
          ) : forestTrees.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {forestTrees.map((tree) => (
                <div
                  key={tree._id || tree.id || `${tree.topic}-${tree.plantedAt}`}
                  className="space-y-3"
                >
                  <TreeGrowth
                    progress={tree.progress || 0}
                    planted={false}
                    size={tree.size}
                    className="!min-h-[250px]"
                  />

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {tree.topic}
                        </p>
                        <p className="text-xs text-slate-500">
                          {tree.subject} • {Math.round(tree.duration / 60)} min
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                        Planted
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-violet-500 shadow-sm">
                <Trees className="h-7 w-7" />
              </div>
              <h4 className="mt-4 text-lg font-semibold text-slate-900">
                No trees planted yet
              </h4>
              <p className="mt-2 text-sm text-slate-500">
                Start a topic, finish the session, and your forest will begin to grow here.
              </p>
            </div>
          )}
        </div>

        {menu && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: menu.y,
              left: menu.x,
              zIndex: 1000,
            }}
            className="w-44 overflow-hidden rounded-xl border bg-white shadow-lg"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                editPlan(menu.plan);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-gray-100"
            >
              <span>✏️</span>
              <span>Edit Plan</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                deletePlan(menu.plan._id);
              }}
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-red-600 transition-colors hover:bg-red-100"
            >
              <span>🗑</span>
              <span>Delete Plan</span>
            </button>
          </div>
        )}

        <FocusSession
          open={Boolean(session?.open)}
          topic={session?.topic || "Select a topic"}
          subject={session?.subject || "Study"}
          targetSeconds={session?.targetSeconds || 0}
          elapsedSeconds={session?.elapsedSeconds || 0}
          status={session?.status || "idle"}
          onStart={() => {}}
          onPause={pauseSession}
          onResume={resumeSession}
          onReset={resetSession}
          onClose={closeSession}
          onContinueLater={continueLaterSession}
          onEndSession={endSession}
          isEndingSession={isEndingSession}
        />
      </div>
    </DashboardLayout>
  );
}
