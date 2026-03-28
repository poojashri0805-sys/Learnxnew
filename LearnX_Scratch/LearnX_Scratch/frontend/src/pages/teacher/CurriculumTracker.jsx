import React, { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import {
  AlertTriangle,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Edit2,
  GripVertical,
  Plus,
  StickyNote,
  Trash2,
  X,
} from "lucide-react";

const STORAGE_KEY = "curriculum_grade_tracker_v5";
const SELECTED_GRADE_KEY = "curriculum_grade_tracker_selected_grade_v5";

const GRADES = ["Grade 10", "Grade 11", "Grade 12"];

const DEFAULT_TOPIC_STATUSES = ["pending", "in-progress", "completed"];

const GRADE_THEME = {
  "Grade 10": {
    selectedCard:
      "border-violet-500 bg-violet-600 text-white shadow-lg shadow-violet-200",
    unselectedCard: "border-slate-200 bg-white hover:border-violet-400",
    chip: "bg-violet-100 text-violet-700",
    chipSelected: "bg-white/20 text-white",
    panel: "border-violet-300 bg-violet-50/70",
    heading: "text-violet-700",
    button: "bg-violet-600 hover:bg-violet-700",
    subjectBorder: "border-violet-200",
    topicPill: "border-violet-200 bg-violet-50 text-violet-700",
    delete: "text-violet-700 hover:bg-violet-100",
    subtleBorder: "border-violet-200",
    accent: "bg-violet-600",
    secondaryButton: "border-violet-200 text-violet-700 hover:bg-violet-50",
  },
  "Grade 11": {
    selectedCard:
      "border-sky-500 bg-sky-600 text-white shadow-lg shadow-sky-200",
    unselectedCard: "border-slate-200 bg-white hover:border-sky-400",
    chip: "bg-sky-100 text-sky-700",
    chipSelected: "bg-white/20 text-white",
    panel: "border-sky-300 bg-sky-50/70",
    heading: "text-sky-700",
    button: "bg-sky-600 hover:bg-sky-700",
    subjectBorder: "border-sky-200",
    topicPill: "border-sky-200 bg-sky-50 text-sky-700",
    delete: "text-sky-700 hover:bg-sky-100",
    subtleBorder: "border-sky-200",
    accent: "bg-sky-600",
    secondaryButton: "border-sky-200 text-sky-700 hover:bg-sky-50",
  },
  "Grade 12": {
    selectedCard:
      "border-emerald-500 bg-emerald-600 text-white shadow-lg shadow-emerald-200",
    unselectedCard: "border-slate-200 bg-white hover:border-emerald-400",
    chip: "bg-emerald-100 text-emerald-700",
    chipSelected: "bg-white/20 text-white",
    panel: "border-emerald-300 bg-emerald-50/70",
    heading: "text-emerald-700",
    button: "bg-emerald-600 hover:bg-emerald-700",
    subjectBorder: "border-emerald-200",
    topicPill: "border-emerald-200 bg-emerald-50 text-emerald-700",
    delete: "text-emerald-700 hover:bg-emerald-100",
    subtleBorder: "border-emerald-200",
    accent: "bg-emerald-600",
    secondaryButton: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
  },
};

const TOPIC_STATUS_META = {
  pending: {
    label: "Pending",
    icon: CircleDashed,
    className: "border-amber-200 bg-amber-50 text-amber-700",
  },
  "in-progress": {
    label: "Progress",
    icon: Clock3,
    className: "border-sky-200 bg-sky-50 text-sky-700",
  },
  completed: {
    label: "Completed",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
};

function makeId(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeParseJSON(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function formatDateDisplay(value) {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return date.toLocaleDateString("en-GB");
}

function parseDateAsLocalDate(dateString) {
  if (!dateString) return null;
  const [year, month, day] = dateString.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function getDaysLeft(examDate) {
  const target = parseDateAsLocalDate(examDate);
  if (!target) return null;

  const today = new Date();
  const localToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const diffMs = target.getTime() - localToday.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function createTopic(name, status = "pending") {
  return {
    id: makeId("topic"),
    name,
    status: DEFAULT_TOPIC_STATUSES.includes(status) ? status : "pending",
  };
}

function createSubject(name, topicDefs = []) {
  return {
    id: makeId("subject"),
    name,
    topics: topicDefs.map((item) => {
      if (typeof item === "string") {
        return createTopic(item, "pending");
      }

      return createTopic(item.name, item.status || "pending");
    }),
  };
}

function createInitialGradeData() {
  return {
    "Grade 10": {
      examDate: "2026-03-27",
      reminderNotes: "",
      subjects: [
        createSubject("Mathematics", [
          { name: "Algebraic expressions", status: "completed" },
          { name: "Geometry basics", status: "in-progress" },
          { name: "Quadratic equations", status: "pending" },
        ]),
        createSubject("Physics", [
          { name: "Motion", status: "completed" },
          { name: "Force and laws", status: "in-progress" },
        ]),
        createSubject("Chemistry", [
          { name: "Periodic Table", status: "pending" },
        ]),
      ],
    },
    "Grade 11": {
      examDate: "2026-03-28",
      reminderNotes: "",
      subjects: [
        createSubject("Chemistry", [
          { name: "Atomic structure", status: "completed" },
          { name: "Periodic table", status: "completed" },
          { name: "Chemical bonding", status: "in-progress" },
        ]),
        createSubject("English", [
          { name: "Grammar", status: "pending" },
          { name: "Reading comprehension", status: "in-progress" },
        ]),
      ],
    },
    "Grade 12": {
      examDate: "2026-03-29",
      reminderNotes: "",
      subjects: [
        createSubject("Biology", [
          { name: "Cell biology", status: "completed" },
          { name: "Genetics", status: "in-progress" },
        ]),
        createSubject("Computer Science", [
          { name: "Algorithms", status: "pending" },
          { name: "Data structures", status: "pending" },
        ]),
      ],
    },
  };
}

function getTheme(grade) {
  return GRADE_THEME[grade] || GRADE_THEME["Grade 10"];
}

function getTopicStatusMeta(status) {
  return TOPIC_STATUS_META[status] || TOPIC_STATUS_META.pending;
}

function getSubjectStats(subject) {
  const topics = subject?.topics || [];
  const total = topics.length;
  const completed = topics.filter((topic) => topic.status === "completed").length;
  const inProgress = topics.filter((topic) => topic.status === "in-progress").length;
  const pending = topics.filter((topic) => topic.status === "pending").length;

  let status = "pending";
  if (total > 0 && completed === total) {
    status = "completed";
  } else if (completed > 0 || inProgress > 0) {
    status = "progress";
  }

  const percent = total ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    completed,
    inProgress,
    pending,
    status,
    percent,
  };
}

function getGradeStats(gradeState) {
  const subjects = gradeState?.subjects || [];
  const examDate = gradeState?.examDate || "";
  const reminderNotes = gradeState?.reminderNotes || "";

  const totalTopics = subjects.reduce((sum, subject) => {
    return sum + (subject.topics?.length || 0);
  }, 0);

  const completedTopics = subjects.reduce((sum, subject) => {
    return (
      sum +
      (subject.topics || []).filter((topic) => topic.status === "completed")
        .length
    );
  }, 0);

  const inProgressTopics = subjects.reduce((sum, subject) => {
    return (
      sum +
      (subject.topics || []).filter((topic) => topic.status === "in-progress")
        .length
    );
  }, 0);

  const remainingTopics = Math.max(totalTopics - completedTopics, 0);
  const daysLeft = getDaysLeft(examDate);

  return {
    subjectCount: subjects.length,
    totalTopics,
    completedTopics,
    remainingTopics,
    inProgressTopics,
    daysLeft,
    examDate,
    reminderNotes,
  };
}

function getRiskMeta(stats) {
  const { remainingTopics, daysLeft, examDate } = stats;

  if (!examDate) {
    return {
      label: "Set exam date",
      subtitle: "Pick an exam date to calculate progress risk.",
      tone: "border-slate-200 bg-slate-50 text-slate-700",
      icon: CalendarDays,
      type: "neutral",
    };
  }

  const safeDaysLeft = typeof daysLeft === "number" ? daysLeft : 0;
  const gap = Math.max(remainingTopics - Math.max(safeDaysLeft, 0), 0);

  if (safeDaysLeft < remainingTopics) {
    return {
      label: `At Risk — Need ${gap} more days`,
      subtitle: "The remaining topics need more time than available.",
      tone: "border-red-200 bg-red-50 text-red-700",
      icon: AlertTriangle,
      type: "risk",
    };
  }

  if (safeDaysLeft <= remainingTopics + 3) {
    return {
      label: `Needs Attention — Need ${gap} more days`,
      subtitle: "You're close to the edge. Tighten the plan.",
      tone: "border-amber-200 bg-amber-50 text-amber-700",
      icon: Clock3,
      type: "warning",
    };
  }

  return {
    label: "On Track — Safe buffer available",
    subtitle: "You have enough time to finish the remaining topics.",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: CheckCircle2,
    type: "safe",
  };
}

function MetricCard({ label, value, note, theme, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-500">{label}</div>
          <div className={`mt-1 text-2xl font-bold ${theme.heading}`}>
            {value}
          </div>
        </div>
        {Icon ? (
          <div className={`rounded-full border border-slate-200 p-2 ${theme.panel}`}>
            <Icon className={`h-4 w-4 ${theme.heading}`} />
          </div>
        ) : null}
      </div>
      {note ? <div className="mt-2 text-xs text-slate-500">{note}</div> : null}
    </div>
  );
}

function StatusPill({ status }) {
  const meta = getTopicStatusMeta(status);
  const Icon = meta.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${meta.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function TopicChip({ topic, onContextMenu, theme }) {
  const meta = getTopicStatusMeta(topic.status);

  return (
    <button
      type="button"
      onContextMenu={onContextMenu}
      className={`inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${theme.topicPill}`}
      title="Right click for edit and delete"
    >
      <span className="max-w-[200px] truncate">{topic.name}</span>
      <span
        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.className}`}
      >
        {meta.label}
      </span>
    </button>
  );
}

function TopicContextMenu({ open, position, onEdit, onDelete, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed z-50 min-w-[170px] rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl"
      style={{
        top: position?.top ?? 0,
        left: position?.left ?? 0,
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button
        type="button"
        onClick={onEdit}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
      >
        <Edit2 className="h-4 w-4" />
        Edit topic
      </button>

      <button
        type="button"
        onClick={onDelete}
        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        Delete topic
      </button>

      <button
        type="button"
        onClick={onClose}
        className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50"
      >
        <X className="h-4 w-4" />
        Close
      </button>
    </div>
  );
}

function TopicEditModal({
  open,
  topicName,
  setTopicName,
  topicStatus,
  setTopicStatus,
  onSave,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-slate-900">Edit Topic</div>
            <div className="mt-1 text-sm text-slate-500">
              Update the topic title and status.
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Topic name
            </label>
            <input
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-violet-400"
              placeholder="Enter topic name"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Topic status
            </label>
            <select
              value={topicStatus}
              onChange={(e) => setTopicStatus(e.target.value)}
              className="h-11 w-full rounded-xl border border-slate-300 px-4 text-sm outline-none focus:border-violet-400"
            >
              <option value="pending">Pending</option>
              <option value="in-progress">Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700"
          >
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function SubjectCard({
  subject,
  theme,
  onTopicContextMenu,
  onAddTopicPrompt,
  onRemoveSubject,
}) {
  const stats = getSubjectStats(subject);

  return (
    <div
      className={`rounded-2xl border ${theme.subjectBorder} bg-white p-4 shadow-sm transition hover:shadow-md`}
    >
      <div className="flex flex-col gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-base font-semibold text-slate-900">
              {subject.name}
            </div>
            <StatusPill
              status={
                stats.status === "completed"
                  ? "completed"
                  : stats.status === "progress"
                  ? "in-progress"
                  : "pending"
              }
            />
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>{stats.total} topics</span>
            <span>{stats.completed} completed</span>
            <span>{stats.inProgress} in progress</span>
            <span>{stats.pending} pending</span>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${theme.accent}`}
              style={{ width: `${stats.percent}%` }}
            />
          </div>

          <div className="mt-2 text-xs text-slate-500">
            {stats.percent}% complete
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(subject.topics || []).length === 0 ? (
          <div className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-xs text-slate-500">
            No topics yet
          </div>
        ) : (
          subject.topics.map((topic) => (
            <TopicChip
              key={topic.id}
              topic={topic}
              theme={theme}
              onContextMenu={(e) => onTopicContextMenu(e, subject.id, topic.id)}
            />
          ))
        )}
      </div>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <button
          type="button"
          onClick={onAddTopicPrompt}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${theme.secondaryButton}`}
        >
          <Plus className="h-4 w-4" />
          Add Topic
        </button>

        <button
          type="button"
          onClick={onRemoveSubject}
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold transition ${theme.delete}`}
        >
          <Trash2 className="h-4 w-4" />
          Remove Subject
        </button>
      </div>
    </div>
  );
}

export default function CurriculumTracker() {
  const [gradeData, setGradeData] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = safeParseJSON(saved, null);
        if (parsed?.gradeData) {
          return parsed.gradeData;
        }
      }
    } catch (error) {
      console.error("Failed to load saved grade data", error);
    }

    return createInitialGradeData();
  });

  const [selectedGrade, setSelectedGrade] = useState(() => {
    try {
      const saved = localStorage.getItem(SELECTED_GRADE_KEY);
      if (saved && GRADES.includes(saved)) {
        return saved;
      }
    } catch (error) {
      console.error("Failed to load selected grade", error);
    }

    return GRADES[0];
  });

  const [error, setError] = useState("");

  const [contextMenu, setContextMenu] = useState({
    open: false,
    x: 0,
    y: 0,
    subjectId: "",
    topicId: "",
  });

  const [editingTopic, setEditingTopic] = useState({
    open: false,
    subjectId: "",
    topicId: "",
    name: "",
    status: "pending",
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          gradeData,
          selectedGrade,
        })
      );
      localStorage.setItem(SELECTED_GRADE_KEY, selectedGrade);
    } catch (err) {
      setError("Could not save curriculum data locally.");
    }
  }, [gradeData, selectedGrade]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setContextMenu({
          open: false,
          x: 0,
          y: 0,
          subjectId: "",
          topicId: "",
        });
        setEditingTopic({
          open: false,
          subjectId: "",
          topicId: "",
          name: "",
          status: "pending",
        });
      }
    };

    const closeMenu = () => {
      setContextMenu({
        open: false,
        x: 0,
        y: 0,
        subjectId: "",
        topicId: "",
      });
    };

    window.addEventListener("keydown", handleEscape);
    window.addEventListener("click", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    window.addEventListener("resize", closeMenu);

    return () => {
      window.removeEventListener("keydown", handleEscape);
      window.removeEventListener("click", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
      window.removeEventListener("resize", closeMenu);
    };
  }, []);

  const selectedGradeData = gradeData[selectedGrade] || {
    examDate: "",
    reminderNotes: "",
    subjects: [],
  };

  const selectedTheme = getTheme(selectedGrade);

  const gradeCards = useMemo(() => {
    return GRADES.map((grade) => {
      const gradeState = gradeData[grade] || {
        examDate: "",
        reminderNotes: "",
        subjects: [],
      };
      const stats = getGradeStats(gradeState);
      const risk = getRiskMeta(stats);

      return {
        grade,
        ...stats,
        risk,
      };
    });
  }, [gradeData]);

  const selectedStats = useMemo(() => {
    return getGradeStats(selectedGradeData);
  }, [selectedGradeData]);

  const selectedRisk = useMemo(() => {
    return getRiskMeta(selectedStats);
  }, [selectedStats]);

  const contextMenuPosition = useMemo(() => {
    if (!contextMenu.open) return null;

    const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;

    const estimatedWidth = 210;
    const estimatedHeight = 154;

    return {
      top: Math.min(contextMenu.y, viewportHeight - estimatedHeight - 12),
      left: Math.min(contextMenu.x, viewportWidth - estimatedWidth - 12),
    };
  }, [contextMenu]);

  function updateSelectedGradeData(updater) {
    setGradeData((prev) => {
      const current = prev[selectedGrade] || {
        examDate: "",
        reminderNotes: "",
        subjects: [],
      };

      const nextGradeData =
        typeof updater === "function" ? updater(current) : updater;

      return {
        ...prev,
        [selectedGrade]: nextGradeData,
      };
    });
  }

  function handleGradeChange(grade) {
    setSelectedGrade(grade);
    setError("");
    setContextMenu({
      open: false,
      x: 0,
      y: 0,
      subjectId: "",
      topicId: "",
    });
  }

  function handleExamDateChange(event) {
    const value = event.target.value;
    updateSelectedGradeData((current) => ({
      ...current,
      examDate: value,
    }));
  }

  function handleReminderNotesChange(event) {
    const value = event.target.value;
    updateSelectedGradeData((current) => ({
      ...current,
      reminderNotes: value,
    }));
  }

  function handleAddSubject() {
    const subjectName = window.prompt(`Enter subject name for ${selectedGrade}:`);
    const value = (subjectName || "").trim();
    if (!value) return;

    const duplicate = (selectedGradeData.subjects || []).some(
      (subject) => subject.name.trim().toLowerCase() === value.toLowerCase()
    );

    if (duplicate) {
      setError(`"${value}" already exists in ${selectedGrade}.`);
      return;
    }

    updateSelectedGradeData((current) => ({
      ...current,
      subjects: [
        ...(current.subjects || []),
        {
          id: makeId("subject"),
          name: value,
          topics: [],
        },
      ],
    }));

    setError("");
  }

  function handleRemoveSubject(subjectId) {
    updateSelectedGradeData((current) => ({
      ...current,
      subjects: (current.subjects || []).filter(
        (subject) => subject.id !== subjectId
      ),
    }));
  }

  function handleTopicContextMenu(event, subjectId, topicId) {
    event.preventDefault();
    event.stopPropagation();

    setContextMenu({
      open: true,
      x: event.clientX,
      y: event.clientY,
      subjectId,
      topicId,
    });
  }

  function closeContextMenu() {
    setContextMenu({
      open: false,
      x: 0,
      y: 0,
      subjectId: "",
      topicId: "",
    });
  }

  function findTopicFromIds(subjectId, topicId) {
    const subject = (selectedGradeData.subjects || []).find(
      (item) => item.id === subjectId
    );

    const topic = subject?.topics?.find((item) => item.id === topicId) || null;

    return { subject, topic };
  }

  function openEditTopicModal() {
    const { subject, topic } = findTopicFromIds(
      contextMenu.subjectId,
      contextMenu.topicId
    );

    if (!subject || !topic) return;

    setEditingTopic({
      open: true,
      subjectId: subject.id,
      topicId: topic.id,
      name: topic.name,
      status: topic.status || "pending",
    });

    closeContextMenu();
  }

  function handleDeleteTopic() {
    const { subject, topic } = findTopicFromIds(
      contextMenu.subjectId,
      contextMenu.topicId
    );

    if (!subject || !topic) return;

    updateSelectedGradeData((current) => ({
      ...current,
      subjects: (current.subjects || []).map((item) => {
        if (item.id !== subject.id) return item;

        return {
          ...item,
          topics: (item.topics || []).filter((t) => t.id !== topic.id),
        };
      }),
    }));

    closeContextMenu();
  }

  function handleSaveEditedTopic() {
    const newName = editingTopic.name.trim();
    if (!newName) return;

    updateSelectedGradeData((current) => ({
      ...current,
      subjects: (current.subjects || []).map((subject) => {
        if (subject.id !== editingTopic.subjectId) return subject;

        return {
          ...subject,
          topics: (subject.topics || []).map((topic) => {
            if (topic.id !== editingTopic.topicId) return topic;
            return {
              ...topic,
              name: newName,
              status: DEFAULT_TOPIC_STATUSES.includes(editingTopic.status)
                ? editingTopic.status
                : "pending",
            };
          }),
        };
      }),
    }));

    setEditingTopic({
      open: false,
      subjectId: "",
      topicId: "",
      name: "",
      status: "pending",
    });
  }

  function handleCancelEditTopic() {
    setEditingTopic({
      open: false,
      subjectId: "",
      topicId: "",
      name: "",
      status: "pending",
    });
  }

  function handleAddTopicPrompt(subjectId) {
    const subject = (selectedGradeData.subjects || []).find(
      (item) => item.id === subjectId
    );

    if (!subject) return;

    const topicName = window.prompt(`Enter topic name for ${subject.name}:`);
    const value = (topicName || "").trim();
    if (!value) return;

    const duplicate = (subject.topics || []).some(
      (topic) => topic.name.trim().toLowerCase() === value.toLowerCase()
    );

    if (duplicate) {
      setError(`"${value}" already exists under ${subject.name}.`);
      return;
    }

    updateSelectedGradeData((current) => ({
      ...current,
      subjects: (current.subjects || []).map((item) => {
        if (item.id !== subjectId) return item;

        return {
          ...item,
          topics: [
            ...(item.topics || []),
            {
              id: makeId("topic"),
              name: value,
              status: "pending",
            },
          ],
        };
      }),
    }));

    setError("");
  }

  return (
    <DashboardLayout title="Curriculum Tracker">
      <div className="mx-auto max-w-[1600px]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div
            className={`w-full rounded-2xl border p-4 shadow-sm ${selectedRisk.tone}`}
          >
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <selectedRisk.icon className="h-4 w-4" />
                  <span>{selectedGrade} Status</span>
                </div>

                <div className="mt-2 text-xl font-bold">
                  {selectedRisk.label}
                </div>

                <div className="mt-1 text-sm opacity-90">
                  {selectedRisk.subtitle}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
                    {selectedStats.completedTopics} topics done
                  </div>
                  <div className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
                    {selectedStats.remainingTopics} topics remaining
                  </div>
                  <div className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
                    {typeof selectedStats.daysLeft === "number"
                      ? `${selectedStats.daysLeft} days left until exam`
                      : "Days left unavailable"}
                  </div>
                  <div className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700">
                    {selectedStats.subjectCount} subjects
                  </div>
                </div>
              </div>

              <div className="flex min-w-[250px] flex-col gap-2 rounded-2xl border border-white/70 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <CalendarDays className="h-4 w-4" />
                  Exam date
                </div>

                <input
                  type="date"
                  value={selectedGradeData.examDate || ""}
                  onChange={handleExamDateChange}
                  className="h-11 rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-violet-400"
                />

                <div className="text-xs text-slate-500">
                  {selectedGradeData.examDate
                    ? `Selected: ${formatDateDisplay(selectedGradeData.examDate)}`
                    : "Pick a date for progress tracking."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
            {error}
          </div>
        ) : null}

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {gradeCards.map((item) => {
            const isActive = selectedGrade === item.grade;
            const theme = getTheme(item.grade);
            const riskIcon = item.risk.icon;

            return (
              <button
                key={item.grade}
                type="button"
                onClick={() => handleGradeChange(item.grade)}
                className={`min-h-[175px] rounded-2xl border p-5 text-left transition ${
                  isActive ? theme.selectedCard : theme.unselectedCard
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-semibold">{item.grade}</div>
                    <div
                      className={`mt-1 text-sm ${
                        isActive ? "text-white/80" : "text-slate-500"
                      }`}
                    >
                      Click to manage curriculum
                    </div>
                  </div>

                  <div
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      isActive ? theme.chipSelected : theme.chip
                    }`}
                  >
                    {item.subjectCount} Subjects
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-semibold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : item.risk.type === "risk"
                        ? "bg-red-50 text-red-700"
                        : item.risk.type === "warning"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    <riskIcon className="h-3.5 w-3.5" />
                    {item.risk.label}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div
                    className={`rounded-xl border px-3 py-3 ${
                      isActive
                        ? "border-white/20 bg-white/10"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div
                      className={`text-xs ${
                        isActive ? "text-white/80" : "text-slate-500"
                      }`}
                    >
                      Topics
                    </div>
                    <div
                      className={`mt-1 text-xl font-bold ${
                        isActive ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {item.totalTopics}
                    </div>
                  </div>

                  <div
                    className={`rounded-xl border px-3 py-3 ${
                      isActive
                        ? "border-white/20 bg-white/10"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div
                      className={`text-xs ${
                        isActive ? "text-white/80" : "text-slate-500"
                      }`}
                    >
                      Exam Date
                    </div>
                    <div
                      className={`mt-1 text-sm font-semibold ${
                        isActive ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {formatDateDisplay(item.examDate)}
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-4 flex items-center justify-between rounded-xl border px-3 py-2 text-xs ${
                    isActive
                      ? "border-white/20 bg-white/10"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <span
                    className={isActive ? "text-white/80" : "text-slate-500"}
                  >
                    Current curriculum set
                  </span>
                  <span className={isActive ? "text-white" : "text-slate-900"}>
                    {item.subjectCount} subjects · {item.totalTopics} topics
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className={`mb-4 rounded-2xl border p-5 shadow-sm ${selectedTheme.panel}`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div
                className={`flex items-center gap-2 text-lg font-semibold ${selectedTheme.heading}`}
              >
                <BookOpenText className="h-5 w-5" />
                {selectedGrade} Curriculum
              </div>
              <div className="mt-1 text-sm text-slate-600">
                Manage subjects, topics, and status for {selectedGrade}.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <MetricCard
                label="Subjects"
                value={selectedStats.subjectCount}
                theme={selectedTheme}
                icon={BookOpenText}
              />
              <MetricCard
                label="Topics"
                value={selectedStats.totalTopics}
                theme={selectedTheme}
                icon={GripVertical}
              />
              <MetricCard
                label="Completed"
                value={selectedStats.completedTopics}
                note="Completed topics"
                theme={selectedTheme}
                icon={CheckCircle2}
              />
              <MetricCard
                label="Remaining"
                value={selectedStats.remainingTopics}
                note="Topics left to finish"
                theme={selectedTheme}
                icon={CircleDashed}
              />
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <StickyNote className="h-4 w-4" />
              Reminder Notes
            </div>
            <textarea
              value={selectedGradeData.reminderNotes || ""}
              onChange={handleReminderNotesChange}
              placeholder="Write curriculum reminders, exam prep notes, revision priorities, or anything the teacher should remember..."
              className="mt-3 min-h-[120px] w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-400"
            />
          </div>
        </div>

        <div className="space-y-4">
          {(selectedGradeData.subjects || []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
              No subjects added yet for {selectedGrade}.
            </div>
          ) : (
            (selectedGradeData.subjects || []).map((subject) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                theme={selectedTheme}
                onTopicContextMenu={handleTopicContextMenu}
                onAddTopicPrompt={() => handleAddTopicPrompt(subject.id)}
                onRemoveSubject={() => handleRemoveSubject(subject.id)}
              />
            ))
          )}
        </div>
      </div>

      <TopicContextMenu
        open={contextMenu.open}
        position={contextMenuPosition}
        onEdit={openEditTopicModal}
        onDelete={handleDeleteTopic}
        onClose={closeContextMenu}
      />

      <TopicEditModal
        open={editingTopic.open}
        topicName={editingTopic.name}
        setTopicName={(value) =>
          setEditingTopic((prev) => ({
            ...prev,
            name: value,
          }))
        }
        topicStatus={editingTopic.status}
        setTopicStatus={(value) =>
          setEditingTopic((prev) => ({
            ...prev,
            status: value,
          }))
        }
        onSave={handleSaveEditedTopic}
        onCancel={handleCancelEditTopic}
      />
    </DashboardLayout>
  );
}