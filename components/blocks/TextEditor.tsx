import React, { useState, useEffect, useRef } from "react";
import { BlockType, EditorBlockProps } from "../../types";
import {
  GripVertical,
  Trash2,
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  Sparkles,
  Wand2,
} from "lucide-react";
import { cn, SlashMenu, BLOCK_META } from "../ui-components";
import { useBlockDrag } from "../../hooks/useBlockDrag";
import { useDocument } from "../../context/DocumentContext";
import { refineText } from "../../services/gemini";

// Tiptap Imports
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Placeholder } from "@tiptap/extensions";

// --- REUSABLE INLINE EDITOR (For Alert, Quote, etc.) ---
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
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder || "Type..." }),
    ],
    content: content || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== content) onUpdate(html);
    },
    editorProps: {
      attributes: {
        class: cn("focus:outline-none min-h-[1.5em]", editorClassName),
      },
    },
  });

  // Sync content if it changes externally
  useEffect(() => {
    if (editor && content !== undefined && editor.getHTML() !== content) {
      // Only update if significantly different to avoid cursor jump on minor formatting differences
      if (
        Math.abs(editor.getHTML().length - (content || "").length) > 5 ||
        !content
      ) {
        editor.commands.setContent(content || "");
      }
    }
  }, [content, editor]);

  return (
    <div className={cn("relative group/editor", className)}>
      <EditorContent editor={editor} />
    </div>
  );
};

// --- MAIN TEXT BLOCK EDITOR ---
export const TextEditor: React.FC<EditorBlockProps> = (props) => {
  const { block, onSelect, onUpdate, onDelete, isSelected, isTiptap } = props;
  const { addBlock } = useDocument();

  // Only init drag hooks if NOT Tiptap to avoid conflict
  const dragProps = useBlockDrag(block, props.onDragStart, props.onDrop);
  const { dropPosition, elementRef } = dragProps;

  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState("");
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);
  const [slashCoords, setSlashCoords] = useState({ top: 0, left: 0 });
  const [isRefining, setIsRefining] = useState(false);
  const [showMagicMenu, setShowMagicMenu] = useState(false);

  // Refs to avoid stale closures in Tiptap callbacks
  const menuStateRef = useRef({
    showSlashMenu: false,
    slashFilter: "",
    slashMenuIndex: 0,
  });
  useEffect(() => {
    menuStateRef.current = { showSlashMenu, slashFilter, slashMenuIndex };
  }, [showSlashMenu, slashFilter, slashMenuIndex]);

  const editorRef = useRef<any>(null);

  const handleSlashSelect = (type: string, view?: any) => {
    const editor = view?.dom?.editor || editorRef.current;
    if (!editor) return;

    // Logic to insert block
    if (["h1", "h2", "bulletList"].includes(type)) {
      // Clean up slash text
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - 20),
        from,
        "\n",
        "\0"
      );
      const match = textBefore.match(/\/([a-zA-Z0-9]*)$/);
      const tr = editor.state.tr;
      if (match) {
        tr.delete(from - match[0].length, from);
      }

      if (type === "h1")
        editor.view.dispatch(
          tr.setBlockType(from, from, editor.state.schema.nodes.heading, {
            level: 1,
          })
        );
      else if (type === "h2")
        editor.view.dispatch(
          tr.setBlockType(from, from, editor.state.schema.nodes.heading, {
            level: 2,
          })
        );
      else if (type === "bulletList") {
        // Skip complex list implementation for now
      } else editor.view.dispatch(tr);
    } else {
      // It's a custom block type
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - 20),
        from,
        "\n",
        "\0"
      );
      const match = textBefore.match(/\/([a-zA-Z0-9]*)$/);
      if (match) {
        const tr = editor.state.tr.delete(from - match[0].length, from);
        editor.view.dispatch(tr);
      }
      addBlock(type as BlockType, block.id, "after");
    }
    setShowSlashMenu(false);
  };

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Type '/' for commands..." }),
    ],
    content: block.content || "",
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (html !== block.content) {
        onUpdate(block.id, { content: html });
      }

      // Slash Command Logic
      const { state } = editor;
      const selection = state.selection;
      const textBefore = state.doc.textBetween(
        Math.max(0, selection.from - 20),
        selection.from,
        "\n",
        "\0"
      );
      const match = textBefore.match(/\/([a-zA-Z0-9]*)$/);

      if (match) {
        const coords = editor.view.coordsAtPos(selection.from);
        setShowSlashMenu(true);
        setSlashFilter(match[1]);
        setSlashCoords({
          top: coords.bottom + window.scrollY + 10,
          left: coords.left + window.scrollX,
        });
      } else {
        setShowSlashMenu(false);
      }
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        const { showSlashMenu, slashFilter, slashMenuIndex } =
          menuStateRef.current;

        if (showSlashMenu) {
          const maxIndex =
            BLOCK_META.filter((b) =>
              b.label.toLowerCase().includes(slashFilter.toLowerCase())
            ).length - 1;
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setSlashMenuIndex((prev) => Math.min(prev + 1, maxIndex));
            return true;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setSlashMenuIndex((prev) => Math.max(prev - 1, 0));
            return true;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            const filtered = BLOCK_META.filter((b) =>
              b.label.toLowerCase().includes(slashFilter.toLowerCase())
            );
            if (filtered[slashMenuIndex])
              handleSlashSelect(filtered[slashMenuIndex].type, view);
            return true;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setShowSlashMenu(false);
            return true;
          }
        }
        if (event.key === "Enter" && !event.shiftKey && !showSlashMenu) {
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            addBlock(BlockType.TEXT, block.id, "after");
            return true;
          }
        }
        return false;
      },
    },
  });

  // Store editor instance in ref for handlers
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const handleGenerate = async () => {
    if (!editor) return;
    setIsRefining(true);
    const selection = editor.state.selection;
    const text = editor.state.doc.textBetween(
      selection.from,
      selection.to,
      "\n"
    );

    if (text) {
      const refined = await refineText(text, "make_legalese");
      editor.commands.insertContent(refined);
    }
    setIsRefining(false);
    setShowMagicMenu(false);
  };

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

      {/* Drag Handle - Use data-drag-handle for Tiptap */}
      <div
        className={cn(
          "absolute -left-6 top-1 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground",
          isSelected ? "opacity-100" : ""
        )}
        // IMPORTANT: Do NOT stopPropagation if Tiptap needs to handle the drag event
        onMouseDown={(e) => {
          if (!isTiptap) e.stopPropagation();
        }}
        {...(isTiptap ? { "data-drag-handle": "" } : {})}
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
        {showMagicMenu && (
          <div className="absolute top-full left-0 z-50 bg-black text-white p-2 rounded-sm shadow-xl flex flex-col gap-1 w-48 mt-2 animate-in fade-in zoom-in-95">
            <div className="text-[9px] font-bold uppercase tracking-widest opacity-50 mb-1 px-2">
              AI Refinement
            </div>
            <button
              onClick={handleGenerate}
              disabled={isRefining}
              className="text-left text-xs px-2 py-1.5 hover:bg-white/20 rounded-sm flex items-center gap-2"
            >
              <Wand2 size={12} /> Make Legalese
            </button>
            <button
              onClick={() => {}}
              disabled
              className="text-left text-xs px-2 py-1.5 hover:bg-white/20 rounded-sm opacity-50 cursor-not-allowed"
            >
              Fix Grammar (Soon)
            </button>
          </div>
        )}

        <EditorContent editor={editor} className="outline-none" />

        <SlashMenu
          isOpen={showSlashMenu}
          filter={slashFilter}
          position={slashCoords}
          onSelect={(type) => handleSlashSelect(type, editor?.view)}
          onClose={() => setShowSlashMenu(false)}
          selectedIndex={slashMenuIndex}
        />
      </div>

      {isSelected && (
        <div className="absolute -right-8 top-0 flex flex-col gap-1">
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
