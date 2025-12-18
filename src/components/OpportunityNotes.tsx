"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Block {
  id: string;
  type: "text" | "heading" | "bullet" | "quote" | "code" | "ai-insight";
  content: string;
}

interface OpportunityNotesProps {
  opportunityId: string;
  initialBlocks?: Block[];
  onSave?: (blocks: Block[]) => void;
}

/**
 * Block Editor for Opportunity Notes
 *
 * Rich text editing for capturing insights during deep dives.
 * Features:
 * - Block-based editing (Notion-style)
 * - Multiple block types (text, heading, bullets, quotes, code)
 * - AI-generated insight blocks (highlighted)
 * - Keyboard shortcuts for block creation
 */
export default function OpportunityNotes({
  opportunityId,
  initialBlocks = [],
  onSave,
}: OpportunityNotesProps) {
  const [blocks, setBlocks] = useState<Block[]>(
    initialBlocks.length > 0
      ? initialBlocks
      : [{ id: "1", type: "text", content: "" }]
  );
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const inputRefs = useRef<Map<string, HTMLTextAreaElement | HTMLInputElement>>(new Map());

  useEffect(() => {
    if (initialBlocks.length > 0) {
      setBlocks(initialBlocks);
    }
  }, [initialBlocks]);

  const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addBlock = (afterId: string, type: Block["type"] = "text") => {
    const newBlock: Block = { id: generateId(), type, content: "" };
    const index = blocks.findIndex((b) => b.id === afterId);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
    setShowBlockMenu(false);

    // Focus the new block
    setTimeout(() => {
      const ref = inputRefs.current.get(newBlock.id);
      ref?.focus();
    }, 50);
  };

  const updateBlock = (id: string, content: string) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, content } : b)));
  };

  const changeBlockType = (id: string, type: Block["type"]) => {
    setBlocks(blocks.map((b) => (b.id === id ? { ...b, type } : b)));
    setShowBlockMenu(false);
  };

  const deleteBlock = (id: string) => {
    if (blocks.length <= 1) return;
    const index = blocks.findIndex((b) => b.id === id);
    const newBlocks = blocks.filter((b) => b.id !== id);
    setBlocks(newBlocks);

    // Focus previous block
    if (index > 0) {
      setTimeout(() => {
        const prevBlock = newBlocks[index - 1];
        const ref = inputRefs.current.get(prevBlock.id);
        ref?.focus();
      }, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, block: Block) => {
    // Enter: Create new block
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addBlock(block.id);
    }

    // Backspace on empty block: Delete and focus previous
    if (e.key === "Backspace" && block.content === "" && blocks.length > 1) {
      e.preventDefault();
      deleteBlock(block.id);
    }

    // / at start: Show block menu
    if (e.key === "/" && block.content === "") {
      e.preventDefault();
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setMenuPosition({ x: rect.left, y: rect.bottom + 8 });
      setShowBlockMenu(true);
      setActiveBlockId(block.id);
    }
  };

  const handleSave = () => {
    onSave?.(blocks);
  };

  const addAIInsight = (insight: string) => {
    const newBlock: Block = {
      id: generateId(),
      type: "ai-insight",
      content: insight,
    };
    setBlocks([...blocks, newBlock]);
  };

  const renderBlockContent = (block: Block) => {
    const commonProps = {
      ref: (el: HTMLTextAreaElement | HTMLInputElement | null) => {
        if (el) inputRefs.current.set(block.id, el);
      },
      value: block.content,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
        updateBlock(block.id, e.target.value),
      onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) =>
        handleKeyDown(e, block),
      onFocus: () => setActiveBlockId(block.id),
      className: "w-full bg-transparent border-none outline-none resize-none",
    };

    switch (block.type) {
      case "heading":
        return (
          <input
            {...commonProps}
            placeholder="Heading..."
            className={`${commonProps.className} text-xl font-bold`}
          />
        );

      case "bullet":
        return (
          <div className="flex items-start gap-2">
            <span className="text-muted-foreground mt-0.5">•</span>
            <textarea
              {...commonProps}
              placeholder="List item..."
              rows={1}
              className={`${commonProps.className} min-h-[24px]`}
            />
          </div>
        );

      case "quote":
        return (
          <div className="border-l-4 border-blue-500 pl-3">
            <textarea
              {...commonProps}
              placeholder="Quote..."
              rows={1}
              className={`${commonProps.className} italic min-h-[24px]`}
            />
          </div>
        );

      case "code":
        return (
          <div className="bg-slate-100 dark:bg-slate-800 rounded p-2 font-mono text-sm">
            <textarea
              {...commonProps}
              placeholder="Code..."
              rows={2}
              className={`${commonProps.className} min-h-[48px]`}
            />
          </div>
        );

      case "ai-insight":
        return (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs">
                AI
              </span>
              <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                AI Insight
              </span>
            </div>
            <textarea
              {...commonProps}
              rows={2}
              className={`${commonProps.className} min-h-[48px]`}
            />
          </div>
        );

      default:
        return (
          <textarea
            {...commonProps}
            placeholder="Type '/' for commands, or start writing..."
            rows={1}
            className={`${commonProps.className} min-h-[24px]`}
          />
        );
    }
  };

  const blockMenuItems = [
    { type: "text" as const, label: "Text", icon: "Aa" },
    { type: "heading" as const, label: "Heading", icon: "H1" },
    { type: "bullet" as const, label: "Bullet List", icon: "•" },
    { type: "quote" as const, label: "Quote", icon: '"' },
    { type: "code" as const, label: "Code", icon: "</>" },
    { type: "ai-insight" as const, label: "AI Insight", icon: "AI" },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Notes</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => addAIInsight("Add your AI-generated insight here...")}
          >
            <span className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[10px] mr-2">
              AI
            </span>
            Add Insight
          </Button>
          <Button size="sm" onClick={handleSave}>
            Save Notes
          </Button>
        </div>
      </div>

      {/* Blocks */}
      <div className="space-y-2">
        {blocks.map((block) => (
          <div
            key={block.id}
            className={`group relative px-3 py-2 rounded transition-colors ${
              activeBlockId === block.id
                ? "bg-slate-50 dark:bg-slate-800/50"
                : "hover:bg-slate-50 dark:hover:bg-slate-800/30"
            }`}
          >
            {/* Block handle */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => {
                  const rect = document
                    .getElementById(`block-${block.id}`)
                    ?.getBoundingClientRect();
                  if (rect) {
                    setMenuPosition({ x: rect.left - 100, y: rect.top });
                    setShowBlockMenu(true);
                    setActiveBlockId(block.id);
                  }
                }}
                className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                ⋮⋮
              </button>
            </div>

            {/* Block content */}
            <div id={`block-${block.id}`}>{renderBlockContent(block)}</div>
          </div>
        ))}
      </div>

      {/* Block type menu */}
      {showBlockMenu && activeBlockId && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowBlockMenu(false)}
          />

          {/* Menu */}
          <div
            className="fixed z-50 bg-white dark:bg-slate-900 border rounded-lg shadow-lg py-1 min-w-[180px]"
            style={{ left: menuPosition.x, top: menuPosition.y }}
          >
            <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground border-b">
              Block Type
            </div>
            {blockMenuItems.map((item) => (
              <button
                key={item.type}
                onClick={() => changeBlockType(activeBlockId, item.type)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
              >
                <span
                  className={`w-6 h-6 flex items-center justify-center rounded text-xs font-medium ${
                    item.type === "ai-insight"
                      ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Helper text */}
      <p className="text-xs text-center text-muted-foreground mt-4">
        Press Enter for new block | Type '/' for block types | Shift+Enter for line break
      </p>
    </Card>
  );
}
