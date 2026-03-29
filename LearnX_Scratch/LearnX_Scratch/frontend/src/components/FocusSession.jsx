import React, { useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  X,
  Sparkles,
  Trees,
} from "lucide-react";
import TreeGrowth from "./TreeGrowth";

function formatTime(totalSeconds = 0) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function getTreeStage(progress) {
  if (progress <= 0) return 0;
  if (progress < 0.25) return 1;
  if (progress < 0.5) return 2;
  if (progress < 0.8) return 3;
  return 4;
}

export default function FocusSession({
  open = false,
  topic = "Select a topic",
  subject = "Study",
  targetSeconds = 1800,
  elapsedSeconds = 0,
  status = "idle", // idle | running | paused | completed
  onStart,
  onPause,
  onResume,
  onReset,
  onClose,
  onContinueLater,
  onEndSession,
  onComplete,
  isEndingSession = false,
}) {
  const progress = useMemo(() => {
    if (!targetSeconds) return 0;
    return Math.max(0, Math.min(1, elapsedSeconds / targetSeconds));
  }, [elapsedSeconds, targetSeconds]);

  const timeLeft = Math.max(0, targetSeconds - elapsedSeconds);

  const primaryAction =
    status === "idle"
      ? { label: "Start", icon: Play, handler: onStart }
      : status === "running"
      ? { label: "Pause", icon: Pause, handler: onPause }
      : status === "paused"
      ? { label: "Resume", icon: Play, handler: onResume }
      : { label: "Completed", icon: CheckCircle2, handler: null };

  const statusLabel =
    status === "running"
      ? "Session running"
      : status === "paused"
      ? "Session paused"
      : status === "completed"
      ? "Session completed"
      : "Ready to begin";

  const canContinueLater = status === "paused";
  const canEndSession = status === "running" || status === "paused";

  const handleContinueLater = () => {
    if (!canContinueLater) return;

    if (onContinueLater) {
      onContinueLater();
      return;
    }

    if (onClose) onClose();
  };

  const handleEndSession = () => {
    if (!canEndSession) return;

    const payload = {
      topic,
      subject,
      targetSeconds,
      elapsedSeconds,
      progress,
      treeStage: getTreeStage(progress),
    };

    if (onEndSession) {
      onEndSession(payload);
      return;
    }

    if (onComplete) {
      onComplete(payload);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-slate-950/45 p-2 backdrop-blur-sm sm:p-4 md:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ y: 28, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 18, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 140, damping: 18 }}
            className="w-full max-w-[95vw] max-h-[90vh] overflow-hidden rounded-[28px] border border-white/20 bg-white shadow-[0_30px_120px_rgba(15,23,42,0.35)] sm:rounded-[32px]"
          >
            <div className="grid h-full gap-0 overflow-y-auto lg:grid-cols-[1.05fr_0.95fr]">
              <div className="relative flex min-h-0 flex-col bg-gradient-to-br from-[#0f1730] via-[#18235a] to-[#261d54] p-4 text-white sm:p-5 md:p-6 lg:p-7">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(168,85,247,0.24),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(34,197,94,0.18),_transparent_28%)]" />

                <div className="relative flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[12px] font-medium text-white/90 backdrop-blur">
                      <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                      Forest Focus
                    </div>

                    <h2 className="mt-4 text-[24px] font-semibold tracking-tight sm:text-[28px] md:text-[34px]">
                      {topic}
                    </h2>

                    <p className="mt-2 max-w-xl text-[14px] leading-6 text-white/72">
                      {subject} • Grow your tree while studying, pause when needed, and plant it in your forest when done.
                    </p>
                  </div>

                  <button
                    onClick={onClose}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/85 transition hover:bg-white/15"
                    aria-label="Close focus session"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-5 flex min-h-0 flex-1 items-center justify-center">
                  <div className="flex h-[280px] w-full items-center justify-center sm:h-[320px] md:h-[360px] lg:h-[420px]">
                    <TreeGrowth
                      progress={progress}
                      planted={status === "completed"}
                      size="large"
                      className="h-full w-full"
                    />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/8 p-3 backdrop-blur sm:p-4">
                    <div className="text-[12px] text-white/60">Target</div>
                    <div className="mt-1 text-[16px] font-semibold sm:text-[18px]">
                      {Math.floor(targetSeconds / 60)} min
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/8 p-3 backdrop-blur sm:p-4">
                    <div className="text-[12px] text-white/60">Elapsed</div>
                    <div className="mt-1 text-[16px] font-semibold sm:text-[18px]">
                      {formatTime(elapsedSeconds)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/8 p-3 backdrop-blur sm:p-4">
                    <div className="text-[12px] text-white/60">Progress</div>
                    <div className="mt-1 text-[16px] font-semibold sm:text-[18px]">
                      {Math.round(progress * 100)}%
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative flex min-h-0 flex-col bg-[#f8fafc] p-4 sm:p-5 md:p-6 lg:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[13px] font-medium uppercase tracking-[0.18em] text-slate-500">
                      Focus Session
                    </div>
                    <h3 className="mt-2 text-[20px] font-semibold text-slate-900 sm:text-[22px]">
                      {statusLabel}
                    </h3>
                  </div>

                  <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-700 shadow-sm">
                    {formatTime(timeLeft)}
                  </div>
                </div>

                <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_16px_50px_rgba(15,23,42,0.06)] sm:mt-6 sm:rounded-[28px] sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[13px] font-medium text-slate-500">
                        Current topic
                      </div>
                      <div className="mt-1 text-[16px] font-semibold text-slate-900 sm:text-[18px]">
                        {topic}
                      </div>
                    </div>

                    <div
                      className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
                        status === "running"
                          ? "bg-emerald-50 text-emerald-700"
                          : status === "paused"
                          ? "bg-amber-50 text-amber-700"
                          : status === "completed"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-violet-50 text-violet-700"
                      }`}
                    >
                      {status.toUpperCase()}
                    </div>
                  </div>

                  <div className="mt-5 sm:mt-6">
                    <div className="mb-2 flex items-center justify-between text-[13px] text-slate-500">
                      <span>Session growth</span>
                      <span>{Math.round(progress * 100)}%</span>
                    </div>

                    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-100">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-emerald-400"
                        initial={false}
                        animate={{ width: `${Math.max(6, progress * 100)}%` }}
                        transition={{ type: "spring", stiffness: 100, damping: 20 }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2">
                    <button
                      onClick={primaryAction.handler || undefined}
                      disabled={!primaryAction.handler}
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-[14px] font-semibold transition ${
                        primaryAction.handler
                          ? "bg-violet-600 text-white shadow-[0_14px_28px_rgba(124,58,237,0.26)] hover:bg-violet-700"
                          : "cursor-not-allowed bg-slate-200 text-slate-500"
                      }`}
                    >
                      <primaryAction.icon className="h-4 w-4" />
                      {primaryAction.label}
                    </button>

                    <button
                      onClick={handleContinueLater}
                      disabled={!canContinueLater || isEndingSession}
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[14px] font-semibold transition ${
                        !isEndingSession && canContinueLater
                          ? "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
                          : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                      }`}
                    >
                      <Trees className="h-4 w-4" />
                      Continue later
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      onClick={handleEndSession}
                      disabled={!canEndSession || isEndingSession}
                      className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-[14px] font-semibold transition ${
                        canEndSession && !isEndingSession
                          ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                          : "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                      }`}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {isEndingSession ? "Ending..." : "End session"}
                    </button>

                    <button
                      onClick={onReset}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-[14px] font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </button>
                  </div>

                  <div className="mt-4 rounded-[22px] border border-dashed border-violet-200 bg-violet-50/60 p-4 sm:mt-5 sm:rounded-[24px] sm:p-5">
                    <div className="text-[14px] font-semibold text-violet-900">
                      Forest planting
                    </div>
                    <p className="mt-1 text-[13px] leading-6 text-violet-800/85">
                      When this session ends, the tree is planted in your forest at its current growth stage.
                    </p>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                    <Trees className="h-4 w-4 text-emerald-500" />
                    The tree grows live while the timer is running.
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}