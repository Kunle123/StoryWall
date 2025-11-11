"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

interface HashtagInputProps {
  hashtags: string[];
  onChange: (hashtags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const HashtagInput = ({
  hashtags,
  onChange,
  placeholder = "Add hashtags...",
  className,
}: HashtagInputProps) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions when user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (inputValue.trim().length < 1) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/hashtags/suggestions?q=${encodeURIComponent(inputValue.trim())}`
        );
        if (response.ok) {
          const data = await response.json();
          // Filter out already added hashtags
          const filtered = (data.suggestions || []).filter(
            (tag: string) => !hashtags.includes(tag.toLowerCase())
          );
          setSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
        }
      } catch (error) {
        console.error("Failed to fetch hashtag suggestions:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [inputValue, hashtags]);

  const normalizeHashtag = (tag: string): string => {
    // Remove # if present, convert to lowercase, remove spaces and special chars
    return tag
      .replace(/^#+/, "")
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .trim();
  };

  const addHashtag = (tag: string) => {
    const normalized = normalizeHashtag(tag);
    if (normalized && normalized.length > 0 && !hashtags.includes(normalized)) {
      onChange([...hashtags, normalized]);
      setInputValue("");
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    onChange(hashtags.filter((tag) => tag !== tagToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        addHashtag(suggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        addHashtag(inputValue);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    } else if (e.key === "Backspace" && inputValue === "" && hashtags.length > 0) {
      // Remove last hashtag when backspace is pressed on empty input
      removeHashtag(hashtags[hashtags.length - 1]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    addHashtag(suggestion);
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={cn("relative", className)}>
      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[42px] items-center focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {/* Hash icon */}
        <Hash className="h-4 w-4 text-muted-foreground ml-1" />
        
        {/* Hashtag badges */}
        {hashtags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="flex items-center gap-1 pr-1"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeHashtag(tag)}
              className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {/* Input */}
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={hashtags.length === 0 ? placeholder : ""}
          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-1 min-w-[120px]"
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className={cn(
                "w-full text-left px-4 py-2 hover:bg-accent focus:bg-accent focus:outline-none",
                index === selectedIndex && "bg-accent"
              )}
            >
              <span className="text-sm">#{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

