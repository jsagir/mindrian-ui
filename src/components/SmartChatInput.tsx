"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { smartTextAreaHandler } from "@/lib/ai-service";

interface SmartChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  userRole?: string;
}

/**
 * Smart Chat Input with AI-powered autocomplete
 *
 * Provides Larry-style suggestions to help users articulate their problems better.
 * Features:
 * - Inline autocomplete suggestions
 * - Tab to accept suggestion
 * - Escape to dismiss
 * - Debounced API calls
 */
export default function SmartChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = "What's on your mind?",
  userRole = "entrepreneur exploring a business opportunity",
}: SmartChatInputProps) {
  const [suggestion, setSuggestion] = useState("");
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced suggestion fetching
  const fetchSuggestion = useCallback(async (text: string) => {
    if (text.length < 15 || disabled) {
      setSuggestion("");
      setShowSuggestion(false);
      return;
    }

    setIsLoadingSuggestion(true);
    try {
      const result = await smartTextAreaHandler({
        userInput: text,
        userRole,
      });

      if (result && result.length > 0) {
        setSuggestion(result);
        setShowSuggestion(true);
      } else {
        setSuggestion("");
        setShowSuggestion(false);
      }
    } catch (error) {
      console.error("Suggestion error:", error);
      setSuggestion("");
      setShowSuggestion(false);
    } finally {
      setIsLoadingSuggestion(false);
    }
  }, [userRole, disabled]);

  // Handle input changes with debouncing
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Hide current suggestion
    setShowSuggestion(false);

    // Debounce the suggestion fetch (800ms after user stops typing)
    debounceRef.current = setTimeout(() => {
      fetchSuggestion(newValue);
    }, 800);
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab to accept suggestion
    if (e.key === "Tab" && showSuggestion && suggestion) {
      e.preventDefault();
      onChange(value + suggestion);
      setSuggestion("");
      setShowSuggestion(false);
      return;
    }

    // Escape to dismiss suggestion
    if (e.key === "Escape" && showSuggestion) {
      e.preventDefault();
      setSuggestion("");
      setShowSuggestion(false);
      return;
    }

    // Enter to send (without shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          {/* Main textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full min-h-[52px] max-h-[200px] resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            rows={1}
          />

          {/* Suggestion overlay */}
          {showSuggestion && suggestion && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full min-h-[52px] px-3 py-2 text-sm">
                {/* Existing text (invisible, for positioning) */}
                <span className="invisible">{value}</span>
                {/* Suggestion text */}
                <span className="text-muted-foreground/60">{suggestion}</span>
              </div>
            </div>
          )}

          {/* Suggestion hint */}
          {showSuggestion && suggestion && (
            <div className="absolute right-2 bottom-2 flex items-center gap-1 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Tab</kbd>
              <span>to accept</span>
            </div>
          )}

          {/* Loading indicator */}
          {isLoadingSuggestion && (
            <div className="absolute right-2 top-2">
              <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Send button */}
        <Button
          onClick={onSend}
          disabled={!value.trim() || disabled}
          className="h-[52px] px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {disabled ? "..." : "Send"}
        </Button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-center text-muted-foreground mt-2">
        Press Enter to send, Shift+Enter for new line
        {showSuggestion && " | Tab to accept AI suggestion"}
      </p>
    </div>
  );
}
