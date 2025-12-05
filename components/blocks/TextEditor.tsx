import React from "react";
import { EditorBlockProps } from "../../types";
import { GripVertical, Trash2, Wand2 } from "lucide-react";
import { cn } from "../ui-components";
import { useBlockDrag } from "../../hooks/useBlockDrag";
import { NodeViewContent } from "@tiptap/react";

// --- REUSABLE INLINE EDITOR (Deprecated/Legacy) ---
// Kept for compatibility if used elsewhere, but should be phased out.
export const InlineTiptapEditor = ({
  content,
  onUpdate,
  placeholder,
  className,
  editorClassName,
}: {
  content: string;
  onUpdate: (html: string) => void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
}) => {
  return (
    <div className={cn("p-2 border border-red-500", className)}>
      Legacy Inline Editor - Please Refactor
    </div>
  );
};

// --- MAIN TEXT BLOCK EDITOR ---
export const TextEditor: React.FC<EditorBlockProps> = (props) => {
  const { block, onSelect, onDelete, isSelected, isTiptap } = props;

  // Drag hooks - mainly for the handle
  const dragProps = useBlockDrag(block, props.onDragStart, props.onDrop);
  const { dropPosition, elementRef } = dragProps;

  // Props for the container depending on mode
  const containerProps = isTiptap
    ? {}
    : {
        draggable: true,
        onDragStart: dragProps.handleDragStartInternal,
        onDragEnd: props.onDragEnd,
        onDragOver: dragProps.handleDragOver,
        onDrop: dragProps.handleDropInternal,
        onDragLeave: dragProps.handleDragLeave,
      };

  return (
    <div
      ref={elementRef}
      className={cn(
        "relative group mb-3 transition-all",
        isSelected ? "z-20" : ""
      )}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(block.id);
      }}
      {...containerProps}
    >
      {dropPosition && !isTiptap && (
        <div
          className={cn(
            "absolute left-0 right-0 h-1 bg-primary z-50 pointer-events-none shadow-[0_0_10px_rgba(var(--primary),0.5)]",
            dropPosition === "before" ? "-top-2" : "-bottom-2"
          )}
        />
      )}

      {/* Drag Handle */}
      <div
        className={cn(
          "absolute -left-6 top-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground",
          isSelected ? "opacity-100" : ""
        )}
        contentEditable={false}
        onMouseDown={(e) => {
          // If Tiptap handles drag, we might not need to stop propagation,
          // but for a specific handle, we often do.
          // With Tiptap NodeView, 'data-drag-handle' is the key.
        }}
        data-drag-handle
      >
        <GripVertical size={16} />
      </div>

      {/* Content */}
      <div
        className={cn(
          "min-h-[2.5em] relative border border-transparent rounded-sm",
          isSelected
            ? "ring-2 ring-primary ring-offset-2"
            : "hover:border-black/10 dark:hover:border-white/10"
        )}
      >
        {/* The Magic: NodeViewContent renders the children of this node */}
        <NodeViewContent className="outline-none" />
      </div>

      {isSelected && (
        <div
          className="absolute -right-8 top-0 flex flex-col gap-1"
          contentEditable={false}
        >
          <button
            className="p-1.5 bg-white border shadow-sm hover:text-red-500 rounded-sm"
            onClick={() => onDelete(block.id)}
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
