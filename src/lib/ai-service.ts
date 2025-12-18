/**
 * Mindrian AI Service
 *
 * Connects Syncfusion AI components to the Agno backend.
 * Provides unified AI capabilities for:
 * - Smart TextArea autocomplete (Larry-style suggestions)
 * - Smart Paste (extract opportunity data from clipboard)
 * - Text-to-Diagram (visualize problem spaces)
 * - AI Chart insights
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://mindrian-api.onrender.com";

export interface AIServiceSettings {
  userInput: string;
  context?: string;
  userRole?: string;
}

export interface SmartPasteResult {
  title?: string;
  description?: string;
  problem_statement?: string;
  target_audience?: string;
  tags?: string[];
  priority?: string;
}

export interface DiagramNode {
  id: string;
  label: string;
  type: "start" | "process" | "decision" | "end";
}

export interface DiagramConnection {
  source: string;
  target: string;
  label?: string;
}

export interface DiagramResult {
  nodes: DiagramNode[];
  connections: DiagramConnection[];
  mermaidCode: string;
}

/**
 * AI Suggestion Handler for Smart TextArea
 * Provides Larry-style completions that help users articulate their problems
 */
export async function smartTextAreaHandler(settings: AIServiceSettings): Promise<string> {
  const { userInput, userRole = "entrepreneur exploring a business opportunity" } = settings;

  // Don't suggest for very short inputs
  if (userInput.length < 10) {
    return "";
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/ai/autocomplete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: userInput,
        role: userRole,
        style: "larry", // Larry's clarifying style
      }),
    });

    if (!response.ok) {
      // Fallback to local suggestions
      return getLocalSuggestion(userInput);
    }

    const data = await response.json();
    return data.suggestion || "";
  } catch (error) {
    console.error("Smart TextArea AI error:", error);
    return getLocalSuggestion(userInput);
  }
}

/**
 * Local fallback suggestions when API is unavailable
 * Based on Larry's problem clarification patterns
 */
function getLocalSuggestion(input: string): string {
  const lowerInput = input.toLowerCase();

  // Problem statement patterns
  if (lowerInput.includes("i want to") || lowerInput.includes("i need to")) {
    return " solve this problem because...";
  }
  if (lowerInput.includes("the problem is")) {
    return " and it affects...";
  }
  if (lowerInput.includes("my target") || lowerInput.includes("my audience")) {
    return " who currently struggle with...";
  }
  if (lowerInput.includes("success would")) {
    return " look like achieving...";
  }
  if (lowerInput.includes("i think")) {
    return ", but I'm not sure about...";
  }
  if (lowerInput.includes("customers")) {
    return " are currently solving this by...";
  }

  return "";
}

/**
 * Smart Paste Handler
 * Extracts structured opportunity data from pasted text
 */
export async function smartPasteHandler(clipboardText: string): Promise<SmartPasteResult> {
  try {
    const response = await fetch(`${API_URL}/api/v1/ai/extract-opportunity`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: clipboardText,
      }),
    });

    if (!response.ok) {
      return extractLocalOpportunity(clipboardText);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Smart Paste AI error:", error);
    return extractLocalOpportunity(clipboardText);
  }
}

/**
 * Local extraction fallback
 */
function extractLocalOpportunity(text: string): SmartPasteResult {
  const lines = text.split("\n").filter(l => l.trim());

  // Try to extract structure from the text
  const result: SmartPasteResult = {};

  // First non-empty line is likely the title
  if (lines.length > 0) {
    result.title = lines[0].substring(0, 100);
  }

  // Look for common patterns
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("problem:") || lower.includes("challenge:")) {
      result.problem_statement = line.split(":").slice(1).join(":").trim();
    }
    if (lower.includes("target:") || lower.includes("audience:") || lower.includes("users:")) {
      result.target_audience = line.split(":").slice(1).join(":").trim();
    }
    if (lower.includes("description:") || lower.includes("about:")) {
      result.description = line.split(":").slice(1).join(":").trim();
    }
  }

  // If no description, use remaining text
  if (!result.description && lines.length > 1) {
    result.description = lines.slice(1, 4).join(" ");
  }

  // Extract potential tags from keywords
  const keywords = ["AI", "SaaS", "B2B", "B2C", "Mobile", "Web", "Health", "Finance", "Education"];
  result.tags = keywords.filter(kw => text.toLowerCase().includes(kw.toLowerCase()));

  return result;
}

/**
 * Text to Diagram Handler
 * Converts problem descriptions into visual diagrams
 */
export async function textToDiagramHandler(text: string, diagramType: "flowchart" | "mindmap" = "flowchart"): Promise<DiagramResult> {
  try {
    const response = await fetch(`${API_URL}/api/v1/ai/text-to-diagram`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        type: diagramType,
      }),
    });

    if (!response.ok) {
      return generateLocalDiagram(text, diagramType);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Text to Diagram AI error:", error);
    return generateLocalDiagram(text, diagramType);
  }
}

/**
 * Generate a simple diagram locally
 */
function generateLocalDiagram(text: string, type: "flowchart" | "mindmap"): DiagramResult {
  // Extract key phrases
  const sentences = text.split(/[.!?]/).filter(s => s.trim().length > 10);

  if (type === "mindmap") {
    // Create a simple mind map structure
    const nodes: DiagramNode[] = [
      { id: "center", label: "Problem Space", type: "start" }
    ];
    const connections: DiagramConnection[] = [];

    sentences.slice(0, 5).forEach((sentence, i) => {
      const nodeId = `node_${i}`;
      nodes.push({
        id: nodeId,
        label: sentence.trim().substring(0, 50),
        type: "process"
      });
      connections.push({
        source: "center",
        target: nodeId
      });
    });

    return {
      nodes,
      connections,
      mermaidCode: generateMermaidMindmap(nodes)
    };
  } else {
    // Create a simple flowchart
    const nodes: DiagramNode[] = [
      { id: "start", label: "Start", type: "start" }
    ];
    const connections: DiagramConnection[] = [];

    let prevId = "start";
    sentences.slice(0, 4).forEach((sentence, i) => {
      const nodeId = `step_${i}`;
      nodes.push({
        id: nodeId,
        label: sentence.trim().substring(0, 40),
        type: "process"
      });
      connections.push({
        source: prevId,
        target: nodeId
      });
      prevId = nodeId;
    });

    nodes.push({ id: "end", label: "End", type: "end" });
    connections.push({ source: prevId, target: "end" });

    return {
      nodes,
      connections,
      mermaidCode: generateMermaidFlowchart(nodes, connections)
    };
  }
}

function generateMermaidMindmap(nodes: DiagramNode[]): string {
  let mermaid = "mindmap\n  root((Problem Space))\n";
  nodes.slice(1).forEach(node => {
    mermaid += `    ${node.label}\n`;
  });
  return mermaid;
}

function generateMermaidFlowchart(nodes: DiagramNode[], connections: DiagramConnection[]): string {
  let mermaid = "flowchart TD\n";
  nodes.forEach(node => {
    const shape = node.type === "start" || node.type === "end" ? `((${node.label}))` : `[${node.label}]`;
    mermaid += `  ${node.id}${shape}\n`;
  });
  connections.forEach(conn => {
    mermaid += `  ${conn.source} --> ${conn.target}\n`;
  });
  return mermaid;
}

/**
 * AI Chart Insights Handler
 * Generates insights from opportunity data
 */
export async function chartInsightsHandler(opportunities: any[]): Promise<string[]> {
  try {
    const response = await fetch(`${API_URL}/api/v1/ai/chart-insights`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunities }),
    });

    if (!response.ok) {
      return generateLocalInsights(opportunities);
    }

    const data = await response.json();
    return data.insights || [];
  } catch (error) {
    console.error("Chart Insights AI error:", error);
    return generateLocalInsights(opportunities);
  }
}

function generateLocalInsights(opportunities: any[]): string[] {
  const insights: string[] = [];

  if (opportunities.length === 0) {
    return ["No opportunities to analyze yet."];
  }

  // Calculate averages and patterns
  const avgScore = opportunities.reduce((sum, o) => sum + (o.csio_score || 0), 0) / opportunities.length;
  const validated = opportunities.filter(o => o.status === "validated").length;
  const exploring = opportunities.filter(o => o.status === "exploring").length;

  insights.push(`Average CSIO score is ${(avgScore * 100).toFixed(0)}% - ${avgScore >= 0.7 ? "strong opportunities" : "room for improvement"}`);

  if (validated > 0) {
    insights.push(`${validated} opportunities validated - ${((validated / opportunities.length) * 100).toFixed(0)}% conversion rate`);
  }

  if (exploring > validated) {
    insights.push(`${exploring} opportunities still exploring - consider deep dives to validate`);
  }

  // Find highest scoring
  const highest = opportunities.reduce((max, o) => (o.csio_score || 0) > (max.csio_score || 0) ? o : max, opportunities[0]);
  if (highest && highest.csio_score >= 0.8) {
    insights.push(`"${highest.name}" shows highest potential at ${(highest.csio_score * 100).toFixed(0)}%`);
  }

  return insights;
}

/**
 * Anomaly Detection for DataGrid
 * Identifies unusual patterns in opportunities
 */
export async function detectAnomalies(opportunities: any[]): Promise<any[]> {
  // Calculate statistics
  const scores = opportunities.map(o => o.csio_score || 0);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const stdDev = Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length);

  // Find anomalies (outside 2 standard deviations)
  return opportunities.filter(o => {
    const score = o.csio_score || 0;
    return Math.abs(score - mean) > 2 * stdDev;
  }).map(o => ({
    ...o,
    anomalyType: (o.csio_score || 0) > mean ? "high_performer" : "needs_attention"
  }));
}

export default {
  smartTextAreaHandler,
  smartPasteHandler,
  textToDiagramHandler,
  chartInsightsHandler,
  detectAnomalies,
};
