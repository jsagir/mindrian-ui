"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Sort,
  Filter,
  Page,
  Toolbar,
  Search,
  QueryCellInfoEventArgs,
} from "@syncfusion/ej2-react-grids";
import { detectAnomalies } from "@/lib/ai-service";

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

interface AnomalyInfo {
  id: string;
  anomalyType: "high_performer" | "needs_attention";
}

const statusColors: Record<string, string> = {
  exploring: "bg-blue-100 text-blue-700",
  validated: "bg-green-100 text-green-700",
  parked: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-100 text-gray-700",
};

interface OpportunityGridProps {
  data: Opportunity[];
  showAnomalyHighlighting?: boolean;
}

export default function OpportunityGrid({ data, showAnomalyHighlighting = true }: OpportunityGridProps) {
  const [anomalies, setAnomalies] = useState<AnomalyInfo[]>([]);
  const gridRef = useRef<GridComponent | null>(null);

  // Detect anomalies when data changes
  useEffect(() => {
    if (showAnomalyHighlighting && data.length > 0) {
      detectAnomalies(data).then((result) => {
        setAnomalies(
          result.map((item: any) => ({
            id: item.id,
            anomalyType: item.anomalyType,
          }))
        );
      });
    }
  }, [data, showAnomalyHighlighting]);

  const getClarityColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  // Check if an opportunity is an anomaly
  const getAnomalyInfo = (id: string): AnomalyInfo | undefined => {
    return anomalies.find((a) => a.id === id);
  };

  // Row styling based on anomaly detection
  const rowDataBound = (args: any) => {
    if (!showAnomalyHighlighting || !args.data) return;

    const anomaly = getAnomalyInfo(args.data.id);
    if (anomaly) {
      if (anomaly.anomalyType === "high_performer") {
        args.row.classList.add("bg-green-50", "dark:bg-green-900/20");
        args.row.style.borderLeft = "3px solid #22c55e";
      } else {
        args.row.classList.add("bg-yellow-50", "dark:bg-yellow-900/20");
        args.row.style.borderLeft = "3px solid #eab308";
      }
    }
  };

  const statusTemplate = (props: Opportunity) => (
    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[props.status]}`}>
      {props.status}
    </span>
  );

  const clarityTemplate = (props: Opportunity) => {
    const score = props.csio_score ?? 0;
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${
              score >= 0.8
                ? "bg-green-500"
                : score >= 0.5
                ? "bg-yellow-500"
                : "bg-red-500"
            }`}
            style={{ width: `${score * 100}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${getClarityColor(score)}`}>
          {Math.round(score * 100)}%
        </span>
      </div>
    );
  };

  const tagsTemplate = (props: Opportunity) => (
    <div className="flex flex-wrap gap-1">
      {props.tags.slice(0, 2).map((tag) => (
        <span
          key={tag}
          className="text-xs px-2 py-0.5 bg-slate-100 rounded text-slate-600"
        >
          {tag}
        </span>
      ))}
      {props.tags.length > 2 && (
        <span className="text-xs text-slate-400">+{props.tags.length - 2}</span>
      )}
    </div>
  );

  const actionsTemplate = (props: Opportunity) => (
    <Link href={`/opportunities/${props.id}`}>
      <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
        Deep Dive →
      </Button>
    </Link>
  );

  // AI Insight indicator column
  const aiInsightTemplate = (props: Opportunity) => {
    const anomaly = getAnomalyInfo(props.id);
    if (!anomaly) return null;

    return (
      <div className="flex items-center justify-center">
        <span
          className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
            anomaly.anomalyType === "high_performer"
              ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300"
          }`}
          title={
            anomaly.anomalyType === "high_performer"
              ? "Exceptional performer - significantly above average"
              : "Needs attention - significantly below average"
          }
        >
          <span className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[8px]">
            AI
          </span>
          {anomaly.anomalyType === "high_performer" ? "Star" : "Review"}
        </span>
      </div>
    );
  };

  return (
    <div>
      {/* Anomaly Legend */}
      {showAnomalyHighlighting && anomalies.length > 0 && (
        <div className="flex items-center gap-4 mb-3 p-2 bg-slate-50 dark:bg-slate-800/50 rounded text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[8px]">
              AI
            </span>
            <span className="font-medium">AI Detected:</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-l-2 border-green-500 bg-green-50"></span>
            <span>High Performers ({anomalies.filter(a => a.anomalyType === "high_performer").length})</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded border-l-2 border-yellow-500 bg-yellow-50"></span>
            <span>Needs Attention ({anomalies.filter(a => a.anomalyType === "needs_attention").length})</span>
          </span>
        </div>
      )}

      <GridComponent
        ref={gridRef}
        dataSource={data}
        allowPaging={true}
        allowSorting={true}
        allowFiltering={true}
        filterSettings={{ type: "Excel" }}
        pageSettings={{ pageSize: 10 }}
        toolbar={["Search"]}
        height="400"
        rowDataBound={rowDataBound}
      >
        <ColumnsDirective>
          {showAnomalyHighlighting && (
            <ColumnDirective
              headerText="AI"
              width="80"
              template={aiInsightTemplate}
              textAlign="Center"
            />
          )}
          <ColumnDirective
            field="name"
            headerText="Opportunity"
            width="200"
            textAlign="Left"
          />
          <ColumnDirective
            field="description"
            headerText="Description"
            width="220"
            textAlign="Left"
          />
          <ColumnDirective
            field="status"
            headerText="Status"
            width="100"
            template={statusTemplate}
            textAlign="Center"
          />
          <ColumnDirective
            field="priority"
            headerText="Priority"
            width="90"
            textAlign="Center"
          />
          <ColumnDirective
            field="csio_score"
            headerText="CSIO"
            width="120"
            template={clarityTemplate}
            textAlign="Center"
          />
          <ColumnDirective
            field="tags"
            headerText="Tags"
            width="150"
            template={tagsTemplate}
            textAlign="Left"
          />
          <ColumnDirective
            headerText="Action"
            width="100"
            template={actionsTemplate}
            textAlign="Center"
          />
        </ColumnsDirective>
        <Inject services={[Sort, Filter, Page, Toolbar, Search]} />
      </GridComponent>
    </div>
  );
}
