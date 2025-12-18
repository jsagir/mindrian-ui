"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Dynamically import Syncfusion Grid component (client-side only)
const OpportunityGrid = dynamic(() => import("@/components/OpportunityGrid"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ),
});

interface Opportunity {
  id: string;
  title: string;
  problem_what: string;
  problem_who: string;
  problem_success: string;
  status: "exploring" | "validated" | "parked" | "archived";
  clarity_score: number;
  created_at: string;
  updated_at: string;
  tags: string[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://mindrian-api.onrender.com";

// Status badge colors
const statusColors: Record<string, string> = {
  exploring: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  validated: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  parked: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  archived: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
};

// Demo data
const DEMO_DATA: Opportunity[] = [
  {
    id: "demo-1",
    title: "AI-Powered Recipe Generator",
    problem_what: "Home cooks struggle to use ingredients before they expire",
    problem_who: "Busy professionals who want to reduce food waste",
    problem_success: "50% reduction in food waste, 3x recipe variety",
    status: "exploring",
    clarity_score: 0.85,
    created_at: "2024-12-15T10:00:00Z",
    updated_at: "2024-12-17T14:30:00Z",
    tags: ["AI", "Food", "Sustainability"],
  },
  {
    id: "demo-2",
    title: "Mental Health Check-in Bot",
    problem_what: "People don't recognize early signs of burnout",
    problem_who: "Remote workers in high-stress industries",
    problem_success: "Early intervention before burnout, 40% reduction in sick days",
    status: "validated",
    clarity_score: 0.92,
    created_at: "2024-12-10T09:00:00Z",
    updated_at: "2024-12-18T11:00:00Z",
    tags: ["Health", "AI", "HR Tech"],
  },
  {
    id: "demo-3",
    title: "Local Business Discovery Platform",
    problem_what: "Small businesses struggle to compete with big chains online",
    problem_who: "Local shop owners and community-minded consumers",
    problem_success: "30% increase in foot traffic for partner businesses",
    status: "parked",
    clarity_score: 0.67,
    created_at: "2024-12-05T15:00:00Z",
    updated_at: "2024-12-12T16:45:00Z",
    tags: ["Local", "E-commerce", "Community"],
  },
  {
    id: "demo-4",
    title: "Smart Home Energy Optimizer",
    problem_what: "Homeowners waste energy without realizing it",
    problem_who: "Environmentally conscious homeowners with smart devices",
    problem_success: "25% reduction in energy bills, carbon footprint tracking",
    status: "exploring",
    clarity_score: 0.78,
    created_at: "2024-12-08T11:00:00Z",
    updated_at: "2024-12-16T09:30:00Z",
    tags: ["IoT", "Sustainability", "Smart Home"],
  },
  {
    id: "demo-5",
    title: "Freelancer Tax Assistant",
    problem_what: "Freelancers miss deductions and overpay taxes",
    problem_who: "Independent contractors and gig workers",
    problem_success: "Average $2,000 savings per user, 90% time reduction",
    status: "validated",
    clarity_score: 0.88,
    created_at: "2024-11-28T14:00:00Z",
    updated_at: "2024-12-18T10:00:00Z",
    tags: ["FinTech", "AI", "Productivity"],
  },
];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/opportunities`);
      if (!response.ok) throw new Error("Failed to fetch opportunities");
      const data = await response.json();
      setOpportunities(data.opportunities || []);
    } catch (err) {
      console.error("Error fetching opportunities:", err);
      setError("Could not load opportunities. The server might be starting up.");
      setOpportunities(DEMO_DATA);
    } finally {
      setIsLoading(false);
    }
  };

  const getClarityColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                M
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Bank of Opportunities
                </h1>
                <p className="text-xs text-slate-500">
                  Your innovation pipeline
                </p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div className="flex rounded-lg border overflow-hidden">
              <button
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  viewMode === "cards"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  viewMode === "table"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Table
              </button>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">
                Back to Chat
              </Button>
            </Link>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
              + New Opportunity
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{opportunities.length}</div>
            <div className="text-sm text-slate-500">Total Ideas</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">
              {opportunities.filter((o) => o.status === "validated").length}
            </div>
            <div className="text-sm text-slate-500">Validated</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-yellow-600">
              {opportunities.filter((o) => o.status === "exploring").length}
            </div>
            <div className="text-sm text-slate-500">Exploring</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">
              {Math.round(
                (opportunities.reduce((sum, o) => sum + o.clarity_score, 0) /
                  opportunities.length) *
                  100
              ) || 0}%
            </div>
            <div className="text-sm text-slate-500">Avg Clarity</div>
          </Card>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
            {error} (Showing demo data)
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : viewMode === "table" ? (
          /* Syncfusion DataGrid View */
          <Card className="p-4 overflow-hidden">
            <OpportunityGrid data={opportunities} />
          </Card>
        ) : (
          /* Card View */
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {opportunities.map((opp) => (
              <Card
                key={opp.id}
                className="p-5 hover:shadow-lg transition-shadow cursor-pointer group"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                    {opp.title}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${statusColors[opp.status]}`}
                  >
                    {opp.status}
                  </span>
                </div>

                {/* Problem Definition */}
                <div className="space-y-2 mb-4 text-sm">
                  <div>
                    <span className="text-slate-500">What: </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {opp.problem_what}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Who: </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {opp.problem_who}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Success: </span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {opp.problem_success}
                    </span>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {opp.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          opp.clarity_score >= 0.8
                            ? "bg-green-500"
                            : opp.clarity_score >= 0.5
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${opp.clarity_score * 100}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${getClarityColor(opp.clarity_score)}`}>
                      {Math.round(opp.clarity_score * 100)}%
                    </span>
                  </div>
                  <Link href={`/opportunities/${opp.id}`}>
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                      Deep Dive →
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && opportunities.length === 0 && (
          <Card className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-100 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">💡</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No opportunities yet</h3>
            <p className="text-slate-500 mb-4">
              Start a conversation with Larry to explore your first idea
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                Talk to Larry
              </Button>
            </Link>
          </Card>
        )}
      </main>
    </div>
  );
}
