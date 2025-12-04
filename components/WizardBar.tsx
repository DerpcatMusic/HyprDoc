import React, { useMemo, useEffect, useState } from "react";
import { DocBlock, FormValues } from "../types";
import { Button, Input, cn } from "./ui-components";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CornerDownLeft,
  FastForward,
  Navigation,
} from "lucide-react";

interface WizardBarProps {
  allBlocks: DocBlock[];
  formValues: FormValues;
  onChange: (id: string, value: any) => void;
  activePartyId: string;
  onFocus: (id: string) => void;
  isCompleted: boolean;
  activeFieldId: string | null;
}

export const WizardBar: React.FC<WizardBarProps> = ({
  allBlocks,
  formValues,
  onChange,
  activePartyId,
  onFocus,
  isCompleted,
  activeFieldId,
}) => {
  // Calculate required fields logic
  const { nextField, progress, totalRequired, completedRequired } =
    useMemo(() => {
      const requiredFields = allBlocks.filter(
        (b) =>
          b.required &&
          ![
            "text",
            "alert",
            "spacer",
            "column",
            "columns",
            "section_break",
          ].includes(b.type) &&
          (!b.assignedToPartyId || b.assignedToPartyId === activePartyId)
      );

      const completed = requiredFields.filter((b) => {
        const val = formValues[b.id];
        const hasValue = val !== undefined && val !== "" && val !== null;

        if (!hasValue) return false;

        // Check minimum length for text inputs
        if ((b.type === "input" || b.type === "long_text") && b.minLength) {
          if (typeof val === "string" && val.length < b.minLength) {
            return false;
          }
        }

        return true;
      });

      // Find next empty required field (or incomplete)
      const next = requiredFields.find((b) => {
        const val = formValues[b.id];
        const hasValue = val !== undefined && val !== "" && val !== null;

        if (!hasValue) return true;

        if ((b.type === "input" || b.type === "long_text") && b.minLength) {
          if (typeof val === "string" && val.length < b.minLength) {
            return true;
          }
        }

        return false;
      });

      return {
        nextField: next,
        progress:
          requiredFields.length > 0
            ? (completed.length / requiredFields.length) * 100
            : 100,
        totalRequired: requiredFields.length,
        completedRequired: completed.length,
      };
    }, [allBlocks, formValues, activePartyId]);

  // Handle Enter key in the wizard input
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextField) {
        // The value is already synced via onChange, just move focus
        onFocus(nextField.id);
      }
    }
  };

  if (isCompleted) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 pointer-events-none">
      <div className="max-w-2xl mx-auto bg-black dark:bg-zinc-900 text-white shadow-2xl border-2 border-white/20 pointer-events-auto flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Progress Strip */}
        <div className="h-1 bg-white/10 w-full">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center p-3 gap-4">
          {/* Context Area */}
          <div className="flex-1 flex flex-col justify-center min-w-0">
            {nextField ? (
              <>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                    <Navigation size={10} /> FIELD {completedRequired + 1} OF{" "}
                    {totalRequired}
                  </span>
                  <span className="text-[9px] text-white/50 font-mono uppercase">
                    Enter to Next
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold truncate whitespace-nowrap opacity-70">
                    {nextField.label || "Input"}:
                  </span>

                  {/* The "Command Center" Input - Mirrors the actual field */}
                  {["input", "email", "number"].includes(nextField.type) ? (
                    <input
                      autoFocus
                      className="bg-transparent border-none outline-none text-white font-mono flex-1 placeholder:text-white/20 h-6"
                      placeholder={`Type ${nextField.label}...`}
                      value={(formValues[nextField.id] as string) || ""}
                      onChange={(e) => onChange(nextField.id, e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => onFocus(nextField.id)}
                    />
                  ) : (
                    <div
                      className="text-xs text-white/50 italic flex-1 cursor-pointer hover:text-white"
                      onClick={() => onFocus(nextField.id)}
                    >
                      (Interact with document to fill)
                    </div>
                  )}
                </div>
                {nextField.minLength && (
                  <div className="text-[9px] text-red-400 mt-1">
                    Min Length: {nextField.minLength} chars
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3 text-green-400">
                <CheckCircle2 size={24} />
                <div>
                  <div className="font-bold uppercase tracking-wide text-xs">
                    All Fields Complete
                  </div>
                  <div className="text-[10px] opacity-70">
                    You can now finalize the document.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <Button
            size="icon"
            className={cn(
              "h-12 w-12 rounded-none shrink-0 border-2",
              nextField
                ? "bg-white text-black hover:bg-primary border-transparent"
                : "bg-green-500 text-black border-green-400 animate-pulse"
            )}
            onClick={() => {
              if (nextField) onFocus(nextField.id);
            }}
          >
            {nextField ? (
              <CornerDownLeft size={20} />
            ) : (
              <CheckCircle2 size={24} />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
