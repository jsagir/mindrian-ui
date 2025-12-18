"use client";

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
} from "@syncfusion/ej2-react-grids";

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

const statusColors: Record<string, string> = {
  exploring: "bg-blue-100 text-blue-700",
  validated: "bg-green-100 text-green-700",
  parked: "bg-yellow-100 text-yellow-700",
  archived: "bg-gray-100 text-gray-700",
};

interface OpportunityGridProps {
  data: Opportunity[];
}

export default function OpportunityGrid({ data }: OpportunityGridProps) {
  const getClarityColor = (score: number) => {
    if (score >= 0.8) return "text-green-600";
    if (score >= 0.5) return "text-yellow-600";
    return "text-red-600";
  };

  const statusTemplate = (props: Opportunity) => (
    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[props.status]}`}>
      {props.status}
    </span>
  );

  const clarityTemplate = (props: Opportunity) => (
    <div className="flex items-center gap-2">
      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${
            props.clarity_score >= 0.8
              ? "bg-green-500"
              : props.clarity_score >= 0.5
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
          style={{ width: `${props.clarity_score * 100}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${getClarityColor(props.clarity_score)}`}>
        {Math.round(props.clarity_score * 100)}%
      </span>
    </div>
  );

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

  return (
    <GridComponent
      dataSource={data}
      allowPaging={true}
      allowSorting={true}
      allowFiltering={true}
      filterSettings={{ type: "Excel" }}
      pageSettings={{ pageSize: 10 }}
      toolbar={["Search"]}
      height="400"
    >
      <ColumnsDirective>
        <ColumnDirective
          field="title"
          headerText="Opportunity"
          width="200"
          textAlign="Left"
        />
        <ColumnDirective
          field="problem_what"
          headerText="Problem"
          width="250"
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
          field="clarity_score"
          headerText="Clarity"
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
  );
}
