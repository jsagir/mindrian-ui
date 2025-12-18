"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";

// Dynamically import components (client-side only)
const SmartChatInput = dynamic(() => import("@/components/SmartChatInput"), {
  ssr: false,
  loading: () => (
    <div className="h-[52px] bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
  ),
});

const LarrySessionPanel = dynamic(
  () => import("@/components/LarrySessionPanel").then((mod) => mod.default),
  { ssr: false }
);

// Import parser separately
import { parseLarryResponse } from "@/components/LarrySessionPanel";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  displayContent: string; // Clean message without metadata
  timestamp: Date;
}

interface SessionData {
  clarity: {
    percentage: number;
    what: string;
    who: string;
    success: string;
  };
  stats: {
    questionsAsked: number;
    parkedIdeas: number;
    assumptionsChallenged: number;
  };
  parkedIdeas: Array<{ id: string; text: string; timestamp: Date }>;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://mindrian-api.onrender.com";

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [showPanel, setShowPanel] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Session data extracted from Larry's responses
  const [sessionData, setSessionData] = useState<SessionData>({
    clarity: {
      percentage: 0,
      what: "Not yet clear",
      who: "Not yet identified",
      success: "Not yet defined",
    },
    stats: {
      questionsAsked: 0,
      parkedIdeas: 0,
      assumptionsChallenged: 0,
    },
    parkedIdeas: [],
  });

  // Initialize session
  useEffect(() => {
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
    initSession();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: input,
      displayContent: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: input,
        }),
      });

      const data = await response.json();
      const fullResponse = data.response || "I couldn't process that. Let's try again.";

      // Parse the response to extract session data
      const parsed = parseLarryResponse(fullResponse);

      // Update session data
      setSessionData({
        clarity: parsed.clarity,
        stats: parsed.stats,
        parkedIdeas: parsed.parkedIdeas,
      });

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: fullResponse,
        displayContent: parsed.message, // Only show the message part
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "Sorry, I had trouble connecting. The server might be starting up - try again in a moment.",
        displayContent: "Sorry, I had trouble connecting. The server might be starting up - try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleParkedIdeaClick = (idea: { id: string; text: string }) => {
    setInput(`Let's explore: ${idea.text}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              M
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                Mindrian
              </h1>
              <p className="text-xs text-slate-500">
                AI Innovation Partner
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showPanel ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPanel(!showPanel)}
              className="hidden md:flex"
            >
              {showPanel ? "Hide" : "Show"} Progress
            </Button>
            <Link href="/opportunities">
              <Button variant="outline" size="sm">
                Bank of Opportunities
              </Button>
            </Link>
            <ThemeToggle />
            <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
              Larry Active
            </span>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex-1 flex max-w-6xl mx-auto w-full">
        {/* Chat Area */}
        <main className={`flex-1 flex flex-col px-4 py-6 ${showPanel ? "md:pr-2" : ""}`}>
          <ScrollArea className="flex-1 h-[calc(100vh-220px)]" ref={scrollRef}>
            <div className="space-y-4 pr-4">
              {messages.length === 0 ? (
                <Card className="p-8 text-center bg-white/50 dark:bg-slate-800/50">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mx-auto mb-4 flex items-center justify-center">
                    <span className="text-2xl text-white font-bold">L</span>
                  </div>
                  <h2 className="text-xl font-semibold mb-2 text-slate-900 dark:text-slate-100">
                    Hi, I&apos;m Larry
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                    I&apos;m your thinking partner. I won&apos;t give you answers - I&apos;ll help you find them.
                    Tell me what&apos;s on your mind, and let&apos;s explore it together.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {[
                      "I have a business idea...",
                      "I'm stuck on a problem...",
                      "Help me think through...",
                    ].map((prompt) => (
                      <Button
                        key={prompt}
                        variant="outline"
                        size="sm"
                        onClick={() => setInput(prompt)}
                        className="text-sm"
                      >
                        {prompt}
                      </Button>
                    ))}
                  </div>
                </Card>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
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
                        {message.displayContent}
                      </p>
                    </Card>
                    {message.role === "user" && (
                      <Avatar className="w-8 h-8 bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm text-slate-600 dark:text-slate-300">U</span>
                      </Avatar>
                    )}
                  </div>
                ))
              )}
              {isLoading && (
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
          </ScrollArea>

          {/* Input Area */}
          <div className="pt-4 border-t mt-4">
            <SmartChatInput
              value={input}
              onChange={setInput}
              onSend={sendMessage}
              disabled={isLoading}
              placeholder="What's on your mind?"
              userRole="entrepreneur exploring a business opportunity"
            />
          </div>
        </main>

        {/* Session Panel - Right Sidebar */}
        {showPanel && (
          <aside className="hidden md:block w-80 p-4 border-l bg-slate-50/50 dark:bg-slate-900/50">
            <LarrySessionPanel
              clarity={sessionData.clarity}
              stats={sessionData.stats}
              parkedIdeas={sessionData.parkedIdeas}
              onIdeaClick={handleParkedIdeaClick}
            />
          </aside>
        )}
      </div>

      {/* Mobile Panel Toggle */}
      <div className="md:hidden fixed bottom-20 right-4 z-20">
        <Button
          size="sm"
          className="rounded-full w-12 h-12 shadow-lg bg-gradient-to-br from-blue-500 to-purple-600"
          onClick={() => setShowPanel(!showPanel)}
        >
          {sessionData.clarity.percentage}%
        </Button>
      </div>

      {/* Mobile Panel Overlay */}
      {showPanel && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/50" onClick={() => setShowPanel(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-slate-900 p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold">Session Progress</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowPanel(false)}>
                Close
              </Button>
            </div>
            <LarrySessionPanel
              clarity={sessionData.clarity}
              stats={sessionData.stats}
              parkedIdeas={sessionData.parkedIdeas}
              onIdeaClick={handleParkedIdeaClick}
            />
          </div>
        </div>
      )}
    </div>
  );
}
