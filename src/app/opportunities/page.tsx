"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SmartPasteResult } from "@/lib/ai-service";

// Dynamically import Syncfusion Grid component (client-side only)
const OpportunityGrid = dynamic(() => import("@/components/OpportunityGrid"), {
  ssr: false,
  loading: () => (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  ),
});

// Dynamically import AI-enhanced components
const OpportunityCharts = dynamic(() => import("@/components/OpportunityCharts"), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
  ),
});

const SmartPasteForm = dynamic(() => import("@/components/SmartPasteForm"), {
  ssr: false,
  loading: () => (
    <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
  ),
});

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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://mindrian-api.onrender.com";

// Status badge colors
const statusColors: Record<string, string> = {
  exploring: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  validated: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  parked: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  archived: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
};

// Demo data matching backend API structure
const DEMO_DATA: Opportunity[] = [
  {
    id: "demo-1",
    name: "AI-Powered Recipe Generator",
    description: "App that suggests recipes based on ingredients you have",
    problem_statement: "Home cooks struggle to use ingredients before they expire",
    target_audience: "Busy professionals who want to reduce food waste",
    domains: ["AI", "Food Tech"],
    csio_score: 0.85,
    priority: "high",
    status: "exploring",
    tags: ["AI", "Food", "Sustainability"],
    created_at: "2024-12-15T10:00:00Z",
    updated_at: "2024-12-17T14:30:00Z",
    deep_dive_count: 2,
  },
  {
    id: "demo-2",
    name: "Mental Health Check-in Bot",
    description: "AI companion that monitors wellbeing patterns",
    problem_statement: "People don't recognize early signs of burnout",
    target_audience: "Remote workers in high-stress industries",
    domains: ["Health Tech", "AI"],
    csio_score: 0.92,
    priority: "high",
    status: "validated",
    tags: ["Health", "AI", "HR Tech"],
    created_at: "2024-12-10T09:00:00Z",
    updated_at: "2024-12-18T11:00:00Z",
    deep_dive_count: 5,
  },
  {
    id: "demo-3",
    name: "Local Business Discovery Platform",
    description: "Connecting local shops with community consumers",
    problem_statement: "Small businesses struggle to compete with big chains online",
    target_audience: "Local shop owners and community-minded consumers",
    domains: ["E-commerce", "Local"],
    csio_score: 0.67,
    priority: "medium",
    status: "parked",
    tags: ["Local", "E-commerce", "Community"],
    created_at: "2024-12-05T15:00:00Z",
    updated_at: "2024-12-12T16:45:00Z",
    deep_dive_count: 1,
  },
  {
    id: "demo-4",
    name: "Smart Home Energy Optimizer",
    description: "Automated energy management for connected homes",
    problem_statement: "Homeowners waste energy without realizing it",
    target_audience: "Environmentally conscious homeowners with smart devices",
    domains: ["IoT", "CleanTech"],
    csio_score: 0.78,
    priority: "medium",
    status: "exploring",
    tags: ["IoT", "Sustainability", "Smart Home"],
    created_at: "2024-12-08T11:00:00Z",
    updated_at: "2024-12-16T09:30:00Z",
    deep_dive_count: 0,
  },
  {
    id: "demo-5",
    name: "Freelancer Tax Assistant",
    description: "AI-powered tax optimization for self-employed",
    problem_statement: "Freelancers miss deductions and overpay taxes",
    target_audience: "Independent contractors and gig workers",
    domains: ["FinTech", "AI"],
    csio_score: 0.88,
    priority: "high",
    status: "validated",
    tags: ["FinTech", "AI", "Productivity"],
    created_at: "2024-11-28T14:00:00Z",
    updated_at: "2024-12-18T10:00:00Z",
    deep_dive_count: 3,
  },
];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [showSmartPaste, setShowSmartPaste] = useState(false);
  const [showCharts, setShowCharts] = useState(true);

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

  // Handle smart paste opportunity creation
  const handleSmartPasteCreate = async (data: SmartPasteResult) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/opportunities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.title,
          description: data.description,
          problem_statement: data.problem_statement,
          target_audience: data.target_audience,
          tags: data.tags || [],
          priority: data.priority || "medium",
          status: "exploring",
        }),
      });

      if (response.ok) {
        setShowSmartPaste(false);
        fetchOpportunities(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to create opportunity:", error);
      // Add to local state as fallback
      const newOpp: Opportunity = {
        id: `local-${Date.now()}`,
        name: data.title || "New Opportunity",
        description: data.description || "",
        problem_statement: data.problem_statement,
        target_audience: data.target_audience,
        domains: [],
        tags: data.tags || [],
        priority: data.priority || "medium",
        status: "exploring",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deep_dive_count: 0,
      };
      setOpportunities([newOpp, ...opportunities]);
      setShowSmartPaste(false);
    }
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
            <Button
              variant={showCharts ? "default" : "outline"}
              size="sm"
              onClick={() => setShowCharts(!showCharts)}
            >
              {showCharts ? "Hide" : "Show"} Analytics
            </Button>
            <Link href="/">
              <Button variant="outline" size="sm">
                Back to Chat
              </Button>
            </Link>
            <ThemeToggle />
            <Button
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600"
              onClick={() => setShowSmartPaste(true)}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Smart Paste
            </Button>
          </div>
        </div>
      </header>

      {/* Smart Paste Modal */}
      {showSmartPaste && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full">
            <SmartPasteForm
              onOpportunityCreated={handleSmartPasteCreate}
              onCancel={() => setShowSmartPaste(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* AI Analytics Dashboard */}
        {showCharts && opportunities.length > 0 && (
          <div className="mb-8">
            <OpportunityCharts opportunities={opportunities} />
          </div>
        )}

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
                (opportunities.reduce((sum, o) => sum + (o.csio_score || 0), 0) /
                  opportunities.length) *
                  100
              ) || 0}%
            </div>
            <div className="text-sm text-slate-500">Avg CSIO Score</div>
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
                    {opp.name}
                  </h3>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${statusColors[opp.status] || "bg-gray-100 text-gray-700"}`}
                  >
                    {opp.status}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {opp.description}
                </p>

                {/* Problem & Target */}
                <div className="space-y-2 mb-4 text-sm">
                  {opp.problem_statement && (
                    <div>
                      <span className="text-slate-500">Problem: </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {opp.problem_statement}
                      </span>
                    </div>
                  )}
                  {opp.target_audience && (
                    <div>
                      <span className="text-slate-500">Target: </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {opp.target_audience}
                      </span>
                    </div>
                  )}
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
                    {opp.csio_score !== undefined && (
                      <>
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              opp.csio_score >= 0.8
                                ? "bg-green-500"
                                : opp.csio_score >= 0.5
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${opp.csio_score * 100}%` }}
                          />
                        </div>
                        <span className={`text-xs font-medium ${getClarityColor(opp.csio_score)}`}>
                          {Math.round(opp.csio_score * 100)}%
                        </span>
                      </>
                    )}
                    {opp.deep_dive_count > 0 && (
                      <span className="text-xs text-slate-400 ml-2">
                        {opp.deep_dive_count} dive{opp.deep_dive_count > 1 ? "s" : ""}
                      </span>
                    )}
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
