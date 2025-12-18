"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { chartInsightsHandler, detectAnomalies } from "@/lib/ai-service";

// Dynamically import Syncfusion Charts (client-side only)
const ChartComponent = dynamic(
  () => import("@syncfusion/ej2-react-charts").then((mod) => mod.ChartComponent),
  { ssr: false }
);
const SeriesCollectionDirective = dynamic(
  () => import("@syncfusion/ej2-react-charts").then((mod) => mod.SeriesCollectionDirective),
  { ssr: false }
);
const SeriesDirective = dynamic(
  () => import("@syncfusion/ej2-react-charts").then((mod) => mod.SeriesDirective),
  { ssr: false }
);
const Inject = dynamic(
  () => import("@syncfusion/ej2-react-charts").then((mod) => mod.Inject),
  { ssr: false }
);

interface Opportunity {
  id: string;
  name: string;
  description: string;
  problem_statement?: string;
  target_audience?: string;
  domains: string[];
  csio_score?: number;
  priority: string;
  status: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  deep_dive_count: number;
}

interface OpportunityChartsProps {
  opportunities: Opportunity[];
}

/**
 * AI-Powered Opportunity Charts
 *
 * Visualizes opportunity data with AI-generated insights.
 * Features:
 * - CSIO Score distribution
 * - Status breakdown
 * - Priority distribution
 * - AI-generated insights
 * - Anomaly highlighting
 */
export default function OpportunityCharts({ opportunities }: OpportunityChartsProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [activeChart, setActiveChart] = useState<"score" | "status" | "priority">("score");

  useEffect(() => {
    if (opportunities.length > 0) {
      loadInsights();
      loadAnomalies();
    }
  }, [opportunities]);

  const loadInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const result = await chartInsightsHandler(opportunities);
      setInsights(result);
    } catch (error) {
      console.error("Failed to load insights:", error);
    } finally {
      setIsLoadingInsights(false);
    }
  };

  const loadAnomalies = async () => {
    try {
      const result = await detectAnomalies(opportunities);
      setAnomalies(result);
    } catch (error) {
      console.error("Failed to detect anomalies:", error);
    }
  };

  // Prepare chart data
  const scoreData = opportunities
    .filter(o => o.csio_score !== undefined)
    .map(o => ({
      x: o.name.substring(0, 15) + (o.name.length > 15 ? "..." : ""),
      y: Math.round((o.csio_score || 0) * 100),
      color: (o.csio_score || 0) >= 0.8 ? "#22c55e" : (o.csio_score || 0) >= 0.5 ? "#eab308" : "#ef4444"
    }));

  const statusData = [
    { x: "Exploring", y: opportunities.filter(o => o.status === "exploring").length, color: "#3b82f6" },
    { x: "Validated", y: opportunities.filter(o => o.status === "validated").length, color: "#22c55e" },
    { x: "Parked", y: opportunities.filter(o => o.status === "parked").length, color: "#eab308" },
    { x: "Archived", y: opportunities.filter(o => o.status === "archived").length, color: "#6b7280" },
  ].filter(d => d.y > 0);

  const priorityData = [
    { x: "High", y: opportunities.filter(o => o.priority === "high").length, color: "#ef4444" },
    { x: "Medium", y: opportunities.filter(o => o.priority === "medium").length, color: "#eab308" },
    { x: "Low", y: opportunities.filter(o => o.priority === "low").length, color: "#22c55e" },
  ].filter(d => d.y > 0);

  if (opportunities.length === 0) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">No opportunities to visualize yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Insights Panel */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs">
              AI
            </span>
            Insights
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadInsights}
            disabled={isLoadingInsights}
          >
            {isLoadingInsights ? "Analyzing..." : "Refresh"}
          </Button>
        </div>
        <div className="space-y-2">
          {insights.length > 0 ? (
            insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-blue-500 mt-0.5">•</span>
                <span className="text-muted-foreground">{insight}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              {isLoadingInsights ? "Generating insights..." : "Click Refresh to generate AI insights"}
            </p>
          )}
        </div>

        {/* Anomalies */}
        {anomalies.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Notable Outliers</h4>
            {anomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                className={`text-xs px-2 py-1 rounded mb-1 ${
                  anomaly.anomalyType === "high_performer"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {anomaly.name}: {anomaly.anomalyType === "high_performer" ? "Exceptional performer" : "Needs attention"}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Chart Tabs */}
      <Card className="p-4">
        <div className="flex gap-2 mb-4">
          <Button
            variant={activeChart === "score" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveChart("score")}
          >
            CSIO Scores
          </Button>
          <Button
            variant={activeChart === "status" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveChart("status")}
          >
            Status
          </Button>
          <Button
            variant={activeChart === "priority" ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveChart("priority")}
          >
            Priority
          </Button>
        </div>

        {/* Simple Chart Visualization (fallback without Syncfusion Charts) */}
        <div className="h-64">
          {activeChart === "score" && (
            <div className="h-full flex items-end gap-2 pb-8">
              {scoreData.map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t transition-all hover:opacity-80"
                    style={{
                      height: `${(item.y / 100) * 180}px`,
                      backgroundColor: item.color,
                      minHeight: "20px"
                    }}
                  />
                  <div className="text-xs mt-1 font-medium">{item.y}%</div>
                  <div className="text-xs text-muted-foreground truncate w-full text-center" title={item.x}>
                    {item.x}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeChart === "status" && (
            <div className="h-full flex items-center justify-center gap-8">
              {statusData.map((item, i) => (
                <div key={i} className="text-center">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto"
                    style={{ backgroundColor: item.color }}
                  >
                    {item.y}
                  </div>
                  <div className="mt-2 text-sm font-medium">{item.x}</div>
                </div>
              ))}
            </div>
          )}

          {activeChart === "priority" && (
            <div className="h-full flex items-center justify-center">
              <div className="w-48 h-48 relative">
                {priorityData.map((item, i) => {
                  const total = priorityData.reduce((sum, d) => sum + d.y, 0);
                  const percentage = (item.y / total) * 100;
                  return (
                    <div
                      key={i}
                      className="absolute inset-0 flex items-center justify-center"
                      style={{
                        clipPath: `polygon(50% 50%, ${50 + 50 * Math.cos((i * 2 * Math.PI) / priorityData.length - Math.PI / 2)}% ${50 + 50 * Math.sin((i * 2 * Math.PI) / priorityData.length - Math.PI / 2)}%, ${50 + 50 * Math.cos(((i + 1) * 2 * Math.PI) / priorityData.length - Math.PI / 2)}% ${50 + 50 * Math.sin(((i + 1) * 2 * Math.PI) / priorityData.length - Math.PI / 2)}%)`
                      }}
                    >
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>
                  );
                })}
                <div className="absolute inset-8 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{opportunities.length}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                </div>
              </div>
              <div className="ml-8 space-y-2">
                {priorityData.map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm">{item.x}: {item.y}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
