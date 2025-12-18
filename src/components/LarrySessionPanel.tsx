"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface ProblemClarity {
  percentage: number;
  what: string;
  who: string;
  success: string;
}

interface SessionStats {
  questionsAsked: number;
  parkedIdeas: number;
  assumptionsChallenged: number;
}

interface ParkedIdea {
  id: string;
  text: string;
  timestamp: Date;
}

interface LarrySessionPanelProps {
  clarity: ProblemClarity;
  stats: SessionStats;
  parkedIdeas: ParkedIdea[];
  onIdeaClick?: (idea: ParkedIdea) => void;
}

/**
 * Visual Session Panel for Larry conversations
 * Replaces raw markdown with beautiful, interactive UI
 */
export default function LarrySessionPanel({
  clarity,
  stats,
  parkedIdeas,
  onIdeaClick,
}: LarrySessionPanelProps) {
  // Determine clarity color and status
  const getClarityColor = (pct: number) => {
    if (pct >= 80) return { bg: "bg-green-500", text: "text-green-600", glow: "shadow-green-500/30" };
    if (pct >= 50) return { bg: "bg-yellow-500", text: "text-yellow-600", glow: "shadow-yellow-500/30" };
    if (pct >= 25) return { bg: "bg-orange-500", text: "text-orange-600", glow: "shadow-orange-500/30" };
    return { bg: "bg-red-500", text: "text-red-600", glow: "shadow-red-500/30" };
  };

  const clarityColors = getClarityColor(clarity.percentage);

  const getClarityStatus = (pct: number) => {
    if (pct >= 80) return "Crystal Clear";
    if (pct >= 50) return "Getting Clearer";
    if (pct >= 25) return "Still Fuzzy";
    return "Just Starting";
  };

  return (
    <div className="space-y-4">
      {/* Problem Clarity Gauge */}
      <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-none shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
            Problem Clarity
          </h3>
          <span className={`text-xs px-2 py-1 rounded-full ${clarityColors.bg} text-white`}>
            {getClarityStatus(clarity.percentage)}
          </span>
        </div>

        {/* Circular Progress Gauge */}
        <div className="flex items-center gap-6">
          <div className="relative w-24 h-24">
            {/* Background circle */}
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-slate-200 dark:text-slate-700"
              />
              {/* Progress arc */}
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${clarity.percentage * 2.51} 251`}
                strokeLinecap="round"
                className={clarityColors.text}
                style={{
                  transition: "stroke-dasharray 0.5s ease-in-out",
                }}
              />
            </svg>
            {/* Center percentage */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${clarityColors.text}`}>
                {clarity.percentage}%
              </span>
            </div>
          </div>

          {/* Clarity dimensions */}
          <div className="flex-1 space-y-2">
            <ClarityDimension
              label="What"
              value={clarity.what}
              icon="🎯"
              isSet={!clarity.what.includes("Not yet")}
            />
            <ClarityDimension
              label="Who"
              value={clarity.who}
              icon="👥"
              isSet={!clarity.who.includes("Not yet")}
            />
            <ClarityDimension
              label="Success"
              value={clarity.success}
              icon="🏆"
              isSet={!clarity.success.includes("Not yet")}
            />
          </div>
        </div>
      </Card>

      {/* Session Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon="❓"
          value={stats.questionsAsked}
          label="Questions"
          color="blue"
        />
        <StatCard
          icon="💡"
          value={stats.parkedIdeas}
          label="Parked Ideas"
          color="purple"
        />
        <StatCard
          icon="⚡"
          value={stats.assumptionsChallenged}
          label="Challenged"
          color="orange"
        />
      </div>

      {/* Parked Ideas */}
      {parkedIdeas.length > 0 && (
        <Card className="p-4 border-l-4 border-purple-500">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="text-lg">💡</span>
            Parked Ideas
          </h3>
          <div className="space-y-2">
            {parkedIdeas.map((idea) => (
              <button
                key={idea.id}
                onClick={() => onIdeaClick?.(idea)}
                className="w-full text-left p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group"
              >
                <p className="text-sm text-slate-700 dark:text-slate-300 truncate">
                  {idea.text}
                </p>
                <p className="text-xs text-slate-400 group-hover:text-purple-500">
                  Click to explore →
                </p>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// Sub-components

function ClarityDimension({
  label,
  value,
  icon,
  isSet,
}: {
  label: string;
  value: string;
  icon: string;
  isSet: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-6 h-6 flex items-center justify-center rounded-full text-sm ${
        isSet ? "bg-green-100 dark:bg-green-900/50" : "bg-slate-100 dark:bg-slate-800"
      }`}>
        {isSet ? "✓" : icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 uppercase">{label}</span>
        </div>
        <p className={`text-xs truncate ${
          isSet ? "text-slate-700 dark:text-slate-300" : "text-slate-400 italic"
        }`}>
          {value}
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: string;
  value: number;
  label: string;
  color: "blue" | "purple" | "orange";
}) {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
  };

  return (
    <Card className="p-3 text-center bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border-none shadow-md">
      <div className={`w-10 h-10 mx-auto mb-2 rounded-full bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white shadow-lg`}>
        <span className="text-lg">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">
        {value}
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </Card>
  );
}

/**
 * Parse Larry's markdown response to extract session data
 */
export function parseLarryResponse(response: string): {
  message: string;
  clarity: ProblemClarity;
  stats: SessionStats;
  parkedIdeas: ParkedIdea[];
} {
  // Split on the --- separator
  const parts = response.split("---");
  const message = parts[0].trim();

  // Default values
  let clarity: ProblemClarity = {
    percentage: 0,
    what: "Not yet clear",
    who: "Not yet identified",
    success: "Not yet defined",
  };

  let stats: SessionStats = {
    questionsAsked: 0,
    parkedIdeas: 0,
    assumptionsChallenged: 0,
  };

  let parkedIdeas: ParkedIdea[] = [];

  if (parts.length > 1) {
    const metadataSection = parts.slice(1).join("---");

    // Parse Problem Clarity percentage
    const clarityMatch = metadataSection.match(/Problem Clarity:\s*(\d+)%/);
    if (clarityMatch) {
      clarity.percentage = parseInt(clarityMatch[1]);
    }

    // Parse What/Who/Success
    const whatMatch = metadataSection.match(/What is the problem:\s*\[([^\]]+)\]/);
    if (whatMatch) clarity.what = whatMatch[1];

    const whoMatch = metadataSection.match(/Who has this problem:\s*\[([^\]]+)\]/);
    if (whoMatch) clarity.who = whoMatch[1];

    const successMatch = metadataSection.match(/What is success:\s*\[([^\]]+)\]/);
    if (successMatch) clarity.success = successMatch[1];

    // Parse Session Stats
    const questionsMatch = metadataSection.match(/Questions asked:\s*(\d+)/);
    if (questionsMatch) stats.questionsAsked = parseInt(questionsMatch[1]);

    const parkedMatch = metadataSection.match(/Parked ideas:\s*(\d+)/);
    if (parkedMatch) stats.parkedIdeas = parseInt(parkedMatch[1]);

    const challengedMatch = metadataSection.match(/Assumptions challenged:\s*(\d+)/);
    if (challengedMatch) stats.assumptionsChallenged = parseInt(challengedMatch[1]);

    // Parse Parked Ideas list
    const parkedSection = metadataSection.match(/\*\*Parked Ideas:\*\*([^*]+)/);
    if (parkedSection && !parkedSection[1].includes("None")) {
      const ideas = parkedSection[1].split("\n").filter(line => line.trim().startsWith("-"));
      parkedIdeas = ideas.map((idea, idx) => ({
        id: `idea-${idx}`,
        text: idea.replace(/^-\s*/, "").trim(),
        timestamp: new Date(),
      }));
    }
  }

  return { message, clarity, stats, parkedIdeas };
}
