"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { smartPasteHandler, SmartPasteResult } from "@/lib/ai-service";

interface SmartPasteFormProps {
  onOpportunityCreated: (data: SmartPasteResult) => void;
  onCancel: () => void;
}

/**
 * Smart Paste Form for Banking Opportunities
 *
 * Allows users to paste research notes, competitor info, or any text
 * and AI extracts structured opportunity data.
 */
export default function SmartPasteForm({ onOpportunityCreated, onCancel }: SmartPasteFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<SmartPasteResult | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Form fields for editing
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [priority, setPriority] = useState("medium");
  const [tagInput, setTagInput] = useState("");

  const handlePaste = async (e: React.ClipboardEvent) => {
    const clipboardText = e.clipboardData.getData("text");
    if (!clipboardText.trim()) return;

    setIsProcessing(true);
    try {
      const result = await smartPasteHandler(clipboardText);
      setExtractedData(result);

      // Populate form fields
      setTitle(result.title || "");
      setDescription(result.description || "");
      setProblemStatement(result.problem_statement || "");
      setTargetAudience(result.target_audience || "");
      setTags(result.tags || []);
      setPriority(result.priority || "medium");
      setEditMode(true);
    } catch (error) {
      console.error("Smart paste error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSmartPasteClick = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        alert("Clipboard is empty. Copy some text first!");
        return;
      }

      setIsProcessing(true);
      const result = await smartPasteHandler(text);
      setExtractedData(result);

      setTitle(result.title || "");
      setDescription(result.description || "");
      setProblemStatement(result.problem_statement || "");
      setTargetAudience(result.target_audience || "");
      setTags(result.tags || []);
      setPriority(result.priority || "medium");
      setEditMode(true);
    } catch (error) {
      console.error("Clipboard access error:", error);
      alert("Cannot access clipboard. Please paste directly into the text area.");
    } finally {
      setIsProcessing(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = () => {
    onOpportunityCreated({
      title,
      description,
      problem_statement: problemStatement,
      target_audience: targetAudience,
      tags,
      priority,
    });
  };

  if (!editMode) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Smart Paste - Create Opportunity</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Paste research notes, competitor analysis, or any text describing an opportunity.
          AI will extract structured data automatically.
        </p>

        {/* Paste area */}
        <div
          className="border-2 border-dashed border-muted rounded-lg p-8 text-center hover:border-blue-400 transition-colors cursor-pointer"
          onPaste={handlePaste}
        >
          {isProcessing ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">Extracting opportunity data...</p>
            </div>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">Paste here or click Smart Paste</p>
              <p className="text-sm text-muted-foreground mb-4">
                Ctrl+V to paste, or click the button below
              </p>
              <Button onClick={handleSmartPasteClick} className="bg-gradient-to-r from-blue-600 to-purple-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Smart Paste from Clipboard
              </Button>
            </>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
        </div>
      </Card>
    );
  }

  // Edit mode - show extracted/editable form
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Review & Edit Opportunity</h3>
        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
          AI Extracted
        </span>
      </div>

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
            placeholder="Opportunity title"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm min-h-[80px]"
            placeholder="Brief description of the opportunity"
          />
        </div>

        {/* Problem Statement */}
        <div>
          <label className="block text-sm font-medium mb-1">Problem Statement</label>
          <textarea
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm min-h-[60px]"
            placeholder="What problem does this solve?"
          />
        </div>

        {/* Target Audience */}
        <div>
          <label className="block text-sm font-medium mb-1">Target Audience</label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
            placeholder="Who is this for?"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-blue-900"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              className="flex-1 px-3 py-2 border rounded-md text-sm"
              placeholder="Add a tag"
            />
            <Button variant="outline" size="sm" onClick={addTag}>Add</Button>
          </div>
        </div>

        {/* Priority */}
        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-6">
        <Button variant="outline" onClick={() => setEditMode(false)}>
          Back
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          Create Opportunity
        </Button>
      </div>
    </Card>
  );
}
