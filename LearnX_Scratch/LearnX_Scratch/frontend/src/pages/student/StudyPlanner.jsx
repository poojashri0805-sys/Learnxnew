import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../api/axios";
import { CheckCircle, Circle } from "lucide-react";

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
    fetchPlans();
  }, []);

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
      setError(
        err.response?.data?.message || "❌ Failed to generate study plan"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (dayIndex, taskIndex) => {
    console.log("Toggle task called:", dayIndex, taskIndex);

    if (!selectedPlan?._id) {
      console.log("No selected plan");
      return;
    }

    const updatedPlanLocal = JSON.parse(JSON.stringify(selectedPlan));

    if (!updatedPlanLocal.tasks?.[dayIndex]?.tasks?.[taskIndex]) {
      console.log("Task not found");
      return;
    }

    updatedPlanLocal.tasks[dayIndex].tasks[taskIndex].completed =
      !updatedPlanLocal.tasks[dayIndex].tasks[taskIndex].completed;

    setSelectedPlan(updatedPlanLocal);

    try {
      const res = await api.put("/study-plan/task", {
        planId: selectedPlan._id,
        dayIndex,
        taskIndex,
      });

      const updatedPlan = res.data;

      setPlans((prev) =>
        prev.map((p) => (p._id === updatedPlan._id ? updatedPlan : p))
      );

      setSelectedPlan(updatedPlan);

      if (updatedPlan.status === "completed") {
        setShowCompletedBanner(true);

        try {
          await api.post("/streak/complete/daily-study");
        } catch (streakErr) {
          console.log("Streak update failed", streakErr);
        }

        setTimeout(() => {
          setActiveTab("completed");
        }, 100);
      }
    } catch (err) {
      console.error(err);
      setSelectedPlan(selectedPlan);
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

    const total = selectedPlan.tasks.reduce(
      (acc, d) => acc + (d.tasks?.length || 0),
      0
    );

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

  return (
    <DashboardLayout title="Study Planner">
      <div className="space-y-6 relative">
        {showCompletedBanner && (
          <div className="fixed top-6 right-6 z-[2000]">
            <div className="bg-white border border-green-200 shadow-xl rounded-2xl px-5 py-4 animate-bounce">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-xl">
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

        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-semibold">
              {editingPlanId ? "Edit Study Plan" : "Study Plan Setup"}
            </h2>

            {editingPlanId && (
              <button
                onClick={resetForm}
                className="px-4 py-2 rounded-xl border bg-white hover:bg-gray-50 transition-colors"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">
                Subjects (comma-separated)
              </label>
              <input
                value={subjects}
                onChange={(e) => setSubjects(e.target.value)}
                placeholder="Math, Physics"
                className="w-full mt-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Exam Date</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full mt-1 px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium">Topics</label>
            <textarea
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="Enter topics line by line..."
              className="w-full mt-1 px-4 py-3 border rounded-xl min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium">
              Daily Study Hours: {hours}h
            </label>
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
            <div className="mt-3 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="mt-5 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Generating..."
              : editingPlanId
              ? "Update Study Plan"
              : "Generate Study Plan"}
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab("active")}
            className={`px-4 py-2 rounded-xl transition-colors ${
              activeTab === "active"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Active Plans
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2 rounded-xl transition-colors ${
              activeTab === "completed"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Completed Plans
          </button>
        </div>

        {filteredPlans.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {filteredPlans.map((plan) => (
              <button
                key={plan._id}
                onClick={() => setSelectedPlan(plan)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenu({
                    x: e.clientX,
                    y: e.clientY,
                    plan,
                  });
                }}
                className={`px-4 py-2 rounded-xl border transition-colors ${
                  selectedPlan?._id === plan._id
                    ? "bg-blue-600 text-white"
                    : "bg-white hover:bg-gray-50"
                }`}
              >
                {plan.subjects}
              </button>
            ))}
          </div>
        )}

        {filteredPlans.length === 0 && (
          <div className="text-center text-gray-400 mt-6 py-8">
            {activeTab === "completed"
              ? "No completed plans yet. Complete all tasks in a plan to see it here!"
              : "No active plans yet. Generate your first study plan above."}
          </div>
        )}

        {selectedPlan && hasTaskData && (
          <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-blue-900">Overall Progress</h3>
              <span className="text-sm font-medium text-blue-700">
                {progress.done}/{progress.total} tasks
              </span>
            </div>

            <p className="text-sm text-blue-700 mb-3">
              {progress.percent}% complete • {progress.total - progress.done} remaining
            </p>

            <div className="w-full bg-blue-200 h-3 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {selectedPlan && hasTaskData && (
          <div className="grid md:grid-cols-4 gap-4">
            {selectedPlan.tasks.map((day, dayIndex) => {
              const dayTasks = day.tasks || [];
              const dayDone = dayTasks.filter((t) => t.completed).length;
              const dayProgress = dayTasks.length > 0 ? Math.round((dayDone / dayTasks.length) * 100) : 0;

              return (
                <div key={dayIndex} className="bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3 pb-3 border-b">
                    <div>
                      <p className="font-semibold text-gray-900">{day.day}</p>
                      <p className="text-xs text-gray-400 mt-1">{day.date}</p>
                    </div>
                    <span className="text-xs font-medium border border-blue-200 bg-blue-50 text-blue-700 px-2 py-1 rounded">
                      {dayDone}/{dayTasks.length}
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 h-1 rounded-full mb-3">
                    <div
                      className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${dayProgress}%` }}
                    />
                  </div>

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

                          <span className="text-xs text-gray-500 mt-1 inline-block">
                            ⏱ {task.duration}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {menu && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: menu.y,
              left: menu.x,
              zIndex: 1000,
            }}
            className="bg-white border rounded-xl shadow-lg w-44 overflow-hidden"
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                editPlan(menu.plan);
              }}
              className="w-full px-4 py-2 hover:bg-gray-100 text-left transition-colors flex items-center gap-2"
            >
              <span>✏️</span>
              <span>Edit Plan</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                deletePlan(menu.plan._id);
              }}
              className="w-full px-4 py-2 hover:bg-red-100 text-red-600 text-left transition-colors flex items-center gap-2"
            >
              <span>🗑</span>
              <span>Delete Plan</span>
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
