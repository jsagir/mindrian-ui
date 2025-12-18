"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { textToDiagramHandler, DiagramResult } from "@/lib/ai-service";

interface AIDiagramProps {
  initialText?: string;
  onDiagramGenerated?: (result: DiagramResult) => void;
}

/**
 * AI Diagram Component
 *
 * Converts problem descriptions into visual diagrams (flowcharts or mindmaps).
 * Perfect for systems thinking visualization in Deep Dive sessions.
 *
 * Features:
 * - Text-to-flowchart conversion
 * - Text-to-mindmap conversion
 * - Mermaid diagram rendering
 * - Interactive node display
 */
export default function AIDiagram({ initialText = "", onDiagramGenerated }: AIDiagramProps) {
  const [inputText, setInputText] = useState(initialText);
  const [diagramType, setDiagramType] = useState<"flowchart" | "mindmap">("flowchart");
  const [diagram, setDiagram] = useState<DiagramResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialText) {
      setInputText(initialText);
    }
  }, [initialText]);

  const generateDiagram = async () => {
    if (!inputText.trim()) {
      setError("Please enter a problem description");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await textToDiagramHandler(inputText, diagramType);
      setDiagram(result);
      onDiagramGenerated?.(result);
    } catch (err) {
      console.error("Diagram generation error:", err);
      setError("Failed to generate diagram. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Render a simple visual diagram from nodes and connections
  const renderSimpleDiagram = () => {
    if (!diagram) return null;

    const { nodes, connections } = diagram;

    if (diagramType === "mindmap") {
      // Mindmap: center node with branches
      return (
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Center node */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
            <div className="px-4 py-2 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg shadow-lg text-center font-medium">
              {nodes[0]?.label || "Problem Space"}
            </div>
          </div>

          {/* Branch nodes */}
          {nodes.slice(1).map((node, i) => {
            const angle = (i * 2 * Math.PI) / Math.max(nodes.length - 1, 1);
            const radius = 120;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;

            return (
              <div
                key={node.id}
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  marginLeft: `${x}px`,
                  marginTop: `${y}px`,
                }}
              >
                {/* Connection line */}
                <svg
                  className="absolute"
                  style={{
                    width: "200px",
                    height: "200px",
                    left: "-100px",
                    top: "-100px",
                    pointerEvents: "none",
                  }}
                >
                  <line
                    x1="100"
                    y1="100"
                    x2={100 - x}
                    y2={100 - y}
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeDasharray="4"
                  />
                </svg>

                {/* Node */}
                <div className="px-3 py-1.5 bg-white dark:bg-slate-800 border-2 border-blue-400 rounded shadow text-sm text-center max-w-[150px]">
                  {node.label}
                </div>
              </div>
            );
          })}
        </div>
      );
    } else {
      // Flowchart: vertical flow
      return (
        <div className="flex flex-col items-center gap-4 py-4">
          {nodes.map((node, i) => (
            <div key={node.id} className="flex flex-col items-center">
              {/* Node */}
              <div
                className={`px-4 py-2 rounded shadow text-center min-w-[120px] ${
                  node.type === "start" || node.type === "end"
                    ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full"
                    : node.type === "decision"
                    ? "bg-yellow-100 dark:bg-yellow-900 border-2 border-yellow-400 rotate-45"
                    : "bg-white dark:bg-slate-800 border-2 border-blue-400"
                }`}
              >
                <span className={node.type === "decision" ? "-rotate-45 block" : ""}>
                  {node.label}
                </span>
              </div>

              {/* Arrow to next node */}
              {i < nodes.length - 1 && (
                <div className="flex flex-col items-center my-1">
                  <div className="w-0.5 h-4 bg-slate-400" />
                  <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-slate-400" />
                </div>
              )}
            </div>
          ))}
        </div>
      );
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm">
            AI
          </span>
          Problem Diagram
        </h3>

        {/* Diagram type toggle */}
        <div className="flex gap-2">
          <Button
            variant={diagramType === "flowchart" ? "default" : "outline"}
            size="sm"
            onClick={() => setDiagramType("flowchart")}
          >
            Flowchart
          </Button>
          <Button
            variant={diagramType === "mindmap" ? "default" : "outline"}
            size="sm"
            onClick={() => setDiagramType("mindmap")}
          >
            Mindmap
          </Button>
        </div>
      </div>

      {/* Input area */}
      <div className="mb-4">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Describe your problem or process to visualize...

Example: 'Users want to track their expenses but find existing apps too complex. They need a simple way to categorize spending and see monthly trends. Success means reducing time spent on budgeting from 30 minutes to 5 minutes per week.'"
          className="w-full h-32 px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Generate button */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-xs text-muted-foreground">
          AI will convert your description into a visual {diagramType}
        </p>
        <Button
          onClick={generateDiagram}
          disabled={isGenerating || !inputText.trim()}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Generate Diagram
            </>
          )}
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded text-sm">
          {error}
        </div>
      )}

      {/* Diagram display */}
      {diagram && (
        <div className="border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Generated {diagramType === "flowchart" ? "Flowchart" : "Mindmap"}</h4>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(diagram.mermaidCode);
                }}
              >
                Copy Mermaid
              </Button>
            </div>
          </div>

          {/* Visual diagram */}
          <div
            ref={canvasRef}
            className="min-h-[300px] bg-white dark:bg-slate-800 rounded border overflow-auto"
          >
            {renderSimpleDiagram()}
          </div>

          {/* Mermaid code preview */}
          <details className="mt-3">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              View Mermaid Code
            </summary>
            <pre className="mt-2 p-3 bg-slate-100 dark:bg-slate-800 rounded text-xs overflow-x-auto">
              {diagram.mermaidCode}
            </pre>
          </details>
        </div>
      )}

      {/* Placeholder when no diagram */}
      {!diagram && !isGenerating && (
        <div className="border rounded-lg p-8 bg-slate-50 dark:bg-slate-900/50 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
          </div>
          <p className="text-muted-foreground">
            Enter a problem description above to generate a visual diagram
          </p>
        </div>
      )}
    </Card>
  );
}
