"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";

// Dynamically import AI components
const SmartChatInput = dynamic(() => import("@/components/SmartChatInput"), {
  ssr: false,
  loading: () => <div className="h-[52px] bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />,
});

const AIDiagram = dynamic(() => import("@/components/AIDiagram"), {
  ssr: false,
  loading: () => <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />,
});

const OpportunityNotes = dynamic(() => import("@/components/OpportunityNotes"), {
  ssr: false,
  loading: () => <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />,
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

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface DeepDiveFocus {
  key: string;
  label: string;
  description: string;
  icon: string;
}

const FOCUS_AREAS: DeepDiveFocus[] = [
  { key: "validate_assumptions", label: "Validate Assumptions", description: "Challenge and verify core assumptions", icon: "🎯" },
  { key: "market_research", label: "Market Research", description: "Size market and analyze competitors", icon: "📊" },
  { key: "customer_discovery", label: "Customer Discovery", description: "Identify and understand target users", icon: "👥" },
  { key: "technical_feasibility", label: "Technical Feasibility", description: "Assess technical requirements", icon: "⚙️" },
  { key: "business_model", label: "Business Model", description: "Explore revenue and cost models", icon: "💰" },
  { key: "go_to_market", label: "Go to Market", description: "Plan launch and growth", icon: "🚀" },
  { key: "competitive_advantage", label: "Competitive Advantage", description: "Identify moats and differentiators", icon: "🏆" },
  { key: "risk_analysis", label: "Risk Analysis", description: "Map risks and mitigations", icon: "⚠️" },
  { key: "mvp_planning", label: "MVP Planning", description: "Define minimum viable product", icon: "🛠️" },
];

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://mindrian-api.onrender.com";

// Demo data for fallback
const DEMO_OPPORTUNITIES: Record<string, Opportunity> = {
  "demo-1": {
    id: "demo-1",
    name: "AI-Powered Recipe Generator",
    description: "Home cooks struggle to use ingredients before they expire",
    problem_statement: "Home cooks struggle to use ingredients before they expire",
    target_audience: "Busy professionals who want to reduce food waste",
    domains: ["AI", "Food Tech", "Sustainability"],
    csio_score: 0.85,
    priority: "high",
    status: "exploring",
    tags: ["AI", "Food", "Sustainability"],
    created_at: "2024-12-15T10:00:00Z",
    updated_at: "2024-12-17T14:30:00Z",
    deep_dive_count: 2,
  },
  "demo-2": {
    id: "demo-2",
    name: "Mental Health Check-in Bot",
    description: "People don't recognize early signs of burnout",
    problem_statement: "People don't recognize early signs of burnout",
    target_audience: "Remote workers in high-stress industries",
    domains: ["Health Tech", "AI", "HR"],
    csio_score: 0.92,
    priority: "high",
    status: "validated",
    tags: ["Health", "AI", "HR Tech"],
    created_at: "2024-12-10T09:00:00Z",
    updated_at: "2024-12-18T11:00:00Z",
    deep_dive_count: 5,
  },
};

const statusColors: Record<string, string> = {
  exploring: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  validated: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  parked: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  archived: "bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300",
};

const priorityColors: Record<string, string> = {
  high: "text-red-600",
  medium: "text-yellow-600",
  low: "text-green-600",
};

export default function DeepDivePage() {
  const params = useParams();
  const opportunityId = params.id as string;

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFocus, setSelectedFocus] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isDeepDiving, setIsDeepDiving] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"chat" | "diagram" | "notes">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOpportunity();
    initSession();
  }, [opportunityId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const initSession = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_type: "larry" }),
      });
      const data = await response.json();
      setSessionId(data.session_id);
    } catch (error) {
      console.error("Failed to create session:", error);
      setSessionId(`local-${Date.now()}`);
    }
  };

  const fetchOpportunity = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/opportunities/${opportunityId}`);
      if (!response.ok) throw new Error("Failed to fetch opportunity");
      const data = await response.json();
      setOpportunity(data);
    } catch (err) {
      console.error("Error fetching opportunity:", err);
      // Use demo data if available
      if (DEMO_OPPORTUNITIES[opportunityId]) {
        setOpportunity(DEMO_OPPORTUNITIES[opportunityId]);
        setError("Using demo data - server might be starting up");
      } else {
        setError("Opportunity not found");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startDeepDive = async (focusKey: string) => {
    if (!opportunity) return;

    setSelectedFocus(focusKey);
    setIsDeepDiving(true);

    const focusArea = FOCUS_AREAS.find(f => f.key === focusKey);

    // Add initial message
    const startMessage: Message = {
      id: `system-${Date.now()}`,
      role: "assistant",
      content: `Starting deep dive into "${opportunity.name}" with focus on: ${focusArea?.label}\n\nI'll analyze this opportunity and help you explore ${focusArea?.description.toLowerCase()}.`,
      timestamp: new Date(),
    };
    setMessages([startMessage]);

    try {
      const response = await fetch(`${API_URL}/api/v1/opportunities/${opportunityId}/deep-dive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunity_id: opportunityId,
          focus: focusKey,
        }),
      });

      const data = await response.json();

      const resultMessage: Message = {
        id: `result-${Date.now()}`,
        role: "assistant",
        content: data.result || "Deep dive analysis completed. What questions do you have?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, resultMessage]);

      // Add insights if available
      if (data.insights && data.insights.length > 0) {
        const insightsMessage: Message = {
          id: `insights-${Date.now()}`,
          role: "assistant",
          content: `**Key Insights:**\n${data.insights.map((i: string) => `• ${i}`).join('\n')}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, insightsMessage]);
      }

    } catch (err) {
      console.error("Deep dive failed:", err);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: `I'm ready to help you explore ${focusArea?.label.toLowerCase()}. The server might be warming up, but you can still ask me questions about this opportunity.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsDeepDiving(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || isDeepDiving) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsDeepDiving(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: `[Deep Dive Context: "${opportunity?.name}" - Focus: ${selectedFocus}]\n\n${input}`,
        }),
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.response || "Let me think about that...",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I had trouble connecting. Try again in a moment.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsDeepDiving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-semibold mb-2">Opportunity not found</h2>
          <p className="text-slate-500 mb-4">{error}</p>
          <Link href="/opportunities">
            <Button>Back to Opportunities</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/opportunities">
              <Button variant="ghost" size="sm">← Back</Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Deep Dive
              </h1>
              <p className="text-xs text-slate-500">
                {opportunity.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[opportunity.status]}`}>
              {opportunity.status}
            </span>
            <span className={`text-xs px-2 py-1 ${priorityColors[opportunity.priority]}`}>
              {opportunity.priority} priority
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Error Banner */}
      {error && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm">
            {error}
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Opportunity Details & Focus Areas */}
          <div className="space-y-4">
            {/* Opportunity Card */}
            <Card className="p-5">
              <h2 className="font-semibold text-lg mb-3">{opportunity.name}</h2>

              {opportunity.problem_statement && (
                <div className="mb-3">
                  <span className="text-xs text-slate-500 uppercase">Problem</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {opportunity.problem_statement}
                  </p>
                </div>
              )}

              {opportunity.target_audience && (
                <div className="mb-3">
                  <span className="text-xs text-slate-500 uppercase">Target Audience</span>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {opportunity.target_audience}
                  </p>
                </div>
              )}

              {opportunity.csio_score && (
                <div className="mb-3">
                  <span className="text-xs text-slate-500 uppercase">CSIO Score</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          opportunity.csio_score >= 0.8
                            ? "bg-green-500"
                            : opportunity.csio_score >= 0.5
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        }`}
                        style={{ width: `${opportunity.csio_score * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">
                      {Math.round(opportunity.csio_score * 100)}%
                    </span>
                  </div>
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-4 pt-4 border-t">
                {opportunity.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-600 dark:text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>

            {/* Focus Areas */}
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Choose Focus Area</h3>
              <div className="space-y-2">
                {FOCUS_AREAS.map((focus) => (
                  <button
                    key={focus.key}
                    onClick={() => startDeepDive(focus.key)}
                    disabled={isDeepDiving}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedFocus === focus.key
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30"
                        : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                    } ${isDeepDiving ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{focus.icon}</span>
                      <span className="font-medium text-sm">{focus.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 ml-6">
                      {focus.description}
                    </p>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right: Deep Dive Panel with Tabs */}
          <div className="lg:col-span-2">
            {/* Tab Navigation */}
            <div className="flex gap-2 mb-4">
              <Button
                variant={activeTab === "chat" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("chat")}
              >
                💬 Chat
              </Button>
              <Button
                variant={activeTab === "diagram" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("diagram")}
              >
                📊 Diagram
              </Button>
              <Button
                variant={activeTab === "notes" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab("notes")}
              >
                📝 Notes
              </Button>
            </div>

            {/* Chat Tab */}
            {activeTab === "chat" && (
              <Card className="h-[calc(100vh-280px)] flex flex-col">
                {/* Chat Messages */}
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center">
                      <div>
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mx-auto mb-4 flex items-center justify-center">
                          <span className="text-2xl text-white">🔍</span>
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Ready to Deep Dive</h3>
                        <p className="text-slate-500 max-w-sm">
                          Select a focus area to start exploring this opportunity in depth.
                          Larry will guide you through the analysis.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.role === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          {message.role === "assistant" && (
                            <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <span className="text-sm text-white font-semibold">L</span>
                            </Avatar>
                          )}
                          <Card
                            className={`max-w-[80%] p-4 ${
                              message.role === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-white dark:bg-slate-800"
                            }`}
                          >
                            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${
                              message.role === "user"
                                ? "text-white"
                                : "text-slate-700 dark:text-slate-300"
                            }`}>
                              {message.content}
                            </p>
                          </Card>
                          {message.role === "user" && (
                            <Avatar className="w-8 h-8 bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                              <span className="text-sm text-slate-600 dark:text-slate-300">U</span>
                            </Avatar>
                          )}
                        </div>
                      ))}
                      {isDeepDiving && (
                        <div className="flex gap-3 justify-start">
                          <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-sm text-white font-semibold">L</span>
                          </Avatar>
                          <Card className="p-4 bg-white dark:bg-slate-800">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                            </div>
                          </Card>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                {/* Chat Input with AI Autocomplete */}
                {selectedFocus && (
                  <div className="p-4 border-t">
                    <SmartChatInput
                      value={input}
                      onChange={setInput}
                      onSend={sendMessage}
                      disabled={isDeepDiving}
                      placeholder="Ask a follow-up question..."
                      userRole={`innovation analyst exploring ${opportunity?.name || "an opportunity"}`}
                    />
                  </div>
                )}
              </Card>
            )}

            {/* Diagram Tab */}
            {activeTab === "diagram" && opportunity && (
              <AIDiagram
                initialText={`${opportunity.problem_statement || opportunity.description || ""}\n\nTarget: ${opportunity.target_audience || "Not specified"}\n\nGoal: Understand the problem space and identify key components.`}
                onDiagramGenerated={(result) => {
                  console.log("Diagram generated:", result);
                }}
              />
            )}

            {/* Notes Tab */}
            {activeTab === "notes" && opportunity && (
              <OpportunityNotes
                opportunityId={opportunity.id}
                onSave={(blocks) => {
                  console.log("Saving notes:", blocks);
                  // TODO: Save to backend
                }}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
