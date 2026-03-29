import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { Sprout, Trees } from "lucide-react";

function clamp(n, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n));
}

function getStage(progress = 0, planted = false) {
  if (planted) return 4;
  if (progress <= 0) return 0;
  if (progress < 0.25) return 1;
  if (progress < 0.5) return 2;
  if (progress < 0.8) return 3;
  return 4;
}

function stageLabel(stage) {
  if (stage === 0) return "Seed";
  if (stage === 1) return "Young sprout";
  if (stage === 2) return "Growing";
  if (stage === 3) return "Mature";
  return "Tree planted";
}

function TreeScene({ stage, progress }) {
  const p = clamp(progress);

  const trunkHeight = [0, 30, 52, 78, 100][stage];
  const trunkOpacity = [0, 0.9, 1, 1, 1][stage];
  const leafOpacity = [0, 0.25, 0.55, 0.82, 1][stage];
  const canopyScale = [0, 0.22, 0.5, 0.78, 1][stage];
  const soilScale = [0.9, 0.94, 0.98, 1, 1][stage];

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      <svg
        viewBox="0 0 420 420"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="sceneGlow" cx="50%" cy="42%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.92" />
            <stop offset="45%" stopColor="#eef3ff" stopOpacity="0.82" />
            <stop offset="100%" stopColor="#eaf9ee" stopOpacity="0.95" />
          </radialGradient>

          <radialGradient id="halo" cx="50%" cy="40%" r="35%">
            <stop offset="0%" stopColor="#b8ffe2" stopOpacity="0.65" />
            <stop offset="70%" stopColor="#b8ffe2" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#b8ffe2" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="soilGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a96a26" />
            <stop offset="100%" stopColor="#7d4718" />
          </linearGradient>

          <linearGradient id="trunkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bc7434" />
            <stop offset="100%" stopColor="#8b5a2b" />
          </linearGradient>

          <linearGradient id="leafGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#90f3a0" />
            <stop offset="100%" stopColor="#18b767" />
          </linearGradient>

          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#0f172a" floodOpacity="0.12" />
          </filter>

          <filter id="leafShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="5" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.15" />
          </filter>
        </defs>

        <circle cx="210" cy="200" r="150" fill="url(#sceneGlow)" />
        <circle cx="210" cy="190" r="92" fill="url(#halo)" />

        <motion.circle
          cx="332"
          cy="82"
          r="7"
          fill="#8bd91f"
          animate={{ scale: [1, 1.12, 1] }}
          transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          opacity={stage >= 3 ? 1 : 0}
        />

        <motion.path
          d="M118 306 C150 286, 270 286, 302 306 C278 328, 142 328, 118 306 Z"
          fill="url(#soilGrad)"
          filter="url(#shadow)"
          initial={false}
          animate={{ scaleX: soilScale, scaleY: soilScale }}
          transition={{ type: "spring", stiffness: 110, damping: 16 }}
          style={{ transformOrigin: "210px 306px" }}
        />

        <motion.rect
          x="204"
          width="12"
          rx="6"
          fill="url(#trunkGrad)"
          initial={false}
          animate={{
            y: 306 - trunkHeight,
            height: trunkHeight,
            opacity: trunkOpacity,
          }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
        />

        <motion.rect
          x="208"
          width="3"
          rx="1.5"
          fill="#f4b36d"
          initial={false}
          animate={{
            y: 306 - trunkHeight,
            height: trunkHeight,
            opacity: stage >= 1 ? 0.55 : 0,
          }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
        />

        <motion.path
          d="M210 244 C198 238, 190 230, 182 218"
          fill="none"
          stroke="#8b5a2b"
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: stage >= 2 ? 1 : 0, opacity: stage >= 2 ? 0.9 : 0 }}
          transition={{ duration: 0.7 }}
        />
        <motion.path
          d="M210 244 C222 238, 230 230, 238 218"
          fill="none"
          stroke="#8b5a2b"
          strokeWidth="5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: stage >= 2 ? 1 : 0, opacity: stage >= 2 ? 0.9 : 0 }}
          transition={{ duration: 0.7 }}
        />

        <motion.g
          initial={false}
          animate={{
            opacity: leafOpacity,
            scale: canopyScale,
          }}
          transition={{ type: "spring", stiffness: 110, damping: 16 }}
          style={{ transformOrigin: "210px 208px" }}
          filter="url(#leafShadow)"
        >
          <motion.path
            d="M210 238 L170 284 L250 284 Z"
            fill="url(#leafGrad)"
            initial={false}
            animate={{
              opacity: stage >= 2 ? 1 : 0,
              y: stage >= 2 ? 0 : 16,
            }}
            transition={{ type: "spring", stiffness: 110, damping: 16 }}
          />
          <motion.path
            d="M210 210 L178 252 L242 252 Z"
            fill="#21c56f"
            initial={false}
            animate={{
              opacity: stage >= 3 ? 1 : stage === 2 ? 0.35 : 0,
              y: stage >= 3 ? 0 : 10,
            }}
            transition={{ type: "spring", stiffness: 110, damping: 16 }}
          />
          <motion.path
            d="M210 180 L186 216 L234 216 Z"
            fill="#14a95f"
            initial={false}
            animate={{
              opacity: stage >= 3 ? 1 : 0,
              y: stage >= 3 ? 0 : 8,
            }}
            transition={{ type: "spring", stiffness: 110, damping: 16 }}
          />
          <motion.path
            d="M210 150 L199 170 L221 170 Z"
            fill="#7ef08b"
            initial={false}
            animate={{
              opacity: stage >= 4 ? 1 : 0,
              y: stage >= 4 ? 0 : 6,
            }}
            transition={{ type: "spring", stiffness: 110, damping: 16 }}
          />

          <motion.path
            d="M210 224 C200 220, 192 214, 186 206"
            fill="none"
            stroke="#8b5a2b"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: stage >= 3 ? 1 : 0, opacity: stage >= 3 ? 0.9 : 0 }}
            transition={{ duration: 0.5 }}
          />
          <motion.path
            d="M210 224 C220 220, 228 214, 234 206"
            fill="none"
            stroke="#8b5a2b"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: stage >= 3 ? 1 : 0, opacity: stage >= 3 ? 0.9 : 0 }}
            transition={{ duration: 0.5 }}
          />
        </motion.g>

        {stage === 0 ? (
          <motion.g
            animate={{ scale: [1, 1.1, 1], opacity: [0.75, 1, 0.75] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          >
            <ellipse cx="210" cy="298" rx="5" ry="3.5" fill="#9adf28" />
          </motion.g>
        ) : null}

        {stage <= 1 ? (
          <motion.g
            initial={false}
            animate={{
              opacity: 1,
              scale: stage === 0 ? 0.92 : 1,
            }}
            transition={{ type: "spring", stiffness: 120, damping: 18 }}
            style={{ transformOrigin: "210px 268px" }}
          >
            <Sprout className="absolute left-1/2 top-[54%] hidden h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-lime-500 md:block" />
          </motion.g>
        ) : null}

        <motion.g initial={false} animate={{ opacity: 1 }}>
          <rect x="150" y="348" width="120" height="34" rx="17" fill="rgba(255,255,255,0.82)" />
          <text
            x="210"
            y="370"
            textAnchor="middle"
            fontSize="14"
            fontWeight="600"
            fill="#4c6474"
          >
            {stage >= 4
              ? "Tree planted"
              : stage === 0
              ? "Seed"
              : stage === 1
              ? "Young sprout"
              : stage === 2
              ? "Growing"
              : "Mature"}
          </text>
        </motion.g>
      </svg>
    </div>
  );
}

export default function TreeGrowth({
  progress = 0,
  planted = false,
  size = "medium",
  className = "",
}) {
  const stage = useMemo(() => getStage(progress, planted), [progress, planted]);

  const sizeClass =
    size === "small"
      ? "min-h-[220px]"
      : size === "large"
      ? "min-h-[360px]"
      : "min-h-[300px]";

  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-b from-[#f7fbff] via-[#edf4ff] to-[#e7f8ee] shadow-[0_20px_70px_rgba(76,67,146,0.16)] ${sizeClass} ${className}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(168,85,247,0.15),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(34,197,94,0.12),_transparent_28%)]" />

      <div className="absolute left-4 top-4 rounded-full border border-slate-200 bg-white/85 px-3 py-1 text-[12px] font-medium text-slate-700 shadow-sm backdrop-blur">
        Tree stage {stage}
      </div>

      <div className="absolute right-4 top-4 rounded-full border border-emerald-200 bg-white/85 px-3 py-1 text-[12px] font-semibold text-emerald-700 shadow-sm backdrop-blur">
        {Math.round(clamp(progress) * 100)}%
      </div>

      <TreeScene stage={stage} progress={progress} />
    </div>
  );
}