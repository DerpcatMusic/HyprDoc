import React, { useState } from "react";
import { useEditorState } from "@tiptap/react";
import { Toggle, Popover } from "./ui-components";
import {
  ChevronDown,
  RotateCcw,
  RotateCw,
  Bold,
  Italic,
  Strikethrough,
  List,
  Quote,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  CheckSquare,
  Underline as UnderlineIcon,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Grid,
} from "lucide-react";

interface EditorToolbarProps {
  editor: any;
}

const EditorToolbarEnhanced: React.FC<EditorToolbarProps> = ({ editor }) => {
  const [showHeadingPopover, setShowHeadingPopover] = useState(false);
  const [showMarkerPopover, setShowMarkerPopover] = useState(false);
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [lastHighlightColor, setLastHighlightColor] = useState("#fef08a");

  // Subscribe to specific editor state changes for immediate updates
  const editorState = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor) return null;
      return {
        isBold: editor.isActive("bold"),
        isItalic: editor.isActive("italic"),
        isUnderline: editor.isActive("underline"),
        isStrike: editor.isActive("strike"),
        isHighlight: editor.isActive("highlight"),
        isSubscript: editor.isActive("subscript"),
        isSuperscript: editor.isActive("superscript"),
        isLink: editor.isActive("link"),
        isBulletList: editor.isActive("bulletList"),
        isTaskList: editor.isActive("taskList"),
        isBlockquote: editor.isActive("blockquote"),
        textAlign: editor.isActive({ textAlign: "left" })
          ? "left"
          : editor.isActive({ textAlign: "center" })
            ? "center"
            : editor.isActive({ textAlign: "right" })
              ? "right"
              : "justify",
        headingLevel: editor.isActive("heading", { level: 1 })
          ? 1
          : editor.isActive("heading", { level: 2 })
            ? 2
            : 0,
        wordCount: editor.storage.characterCount?.words() || 0,
      };
    },
  });

  if (!editor || !editorState) return null;

  const setHighlightColor = (color: string) => {
    editor.chain().focus().setHighlight({ color }).run();
    setLastHighlightColor(color);
    setShowMarkerPopover(false);
  };

  // Enhanced marker click behavior - apply default color on click, right-click for popover
  const handleMarkerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editorState.isHighlight) {
      // If already highlighted, remove highlight
      editor.chain().focus().unsetHighlight().run();
    } else {
      // If not highlighted, apply last used color
      editor.chain().focus().setHighlight({ color: lastHighlightColor }).run();
    }
  };

  const handleMarkerRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMarkerPopover(!showMarkerPopover);
  };

  return (
    <div className="w-full h-10 border-b-2 border-black dark:border-white bg-white dark:bg-black flex items-center px-2 gap-1 overflow-x-auto whitespace-nowrap z-20 sticky top-0 shadow-sm">
      {/* History */}
      <div className="flex items-center gap-0.5 border-r border-black/10 dark:border-white/10 pr-1 mr-1">
        <Toggle
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="w-7 h-7"
        >
          <RotateCcw size={14} />
        </Toggle>
        <Toggle
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="w-7 h-7"
        >
          <RotateCw size={14} />
        </Toggle>
      </div>

      {/* Text Styles */}
      <div className="flex items-center gap-0.5 border-r border-black/10 dark:border-white/10 pr-1 mr-1">
        <Popover
          open={showHeadingPopover}
          onOpenChange={setShowHeadingPopover}
          trigger={
            <Toggle className="w-max px-2 gap-1 h-7">
              {editorState.headingLevel === 1
                ? "Heading 1"
                : editorState.headingLevel === 2
                  ? "Heading 2"
                  : "Paragraph"}
              <ChevronDown size={10} />
            </Toggle>
          }
          content={
            <div className="flex flex-col gap-1 p-1 min-w-[120px]">
              <button
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  setShowHeadingPopover(false);
                }}
                className="text-left px-2 py-1 hover:bg-muted text-xs"
              >
                Paragraph
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                  setShowHeadingPopover(false);
                }}
                className="text-left px-2 py-1 hover:bg-muted text-xs font-bold text-xl"
              >
                Heading 1
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                  setShowHeadingPopover(false);
                }}
                className="text-left px-2 py-1 hover:bg-muted text-xs font-bold text-lg"
              >
                Heading 2
              </button>
              <button
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                  setShowHeadingPopover(false);
                }}
                className="text-left px-2 py-1 hover:bg-muted text-xs font-bold text-base"
              >
                Heading 3
              </button>
            </div>
          }
        />
      </div>

      {/* Basic Formatting */}
      <div className="flex items-center gap-0.5 border-r border-black/10 dark:border-white/10 pr-1 mr-1">
        <Toggle
          pressed={editorState.isBold}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="w-7 h-7"
        >
          <Bold size={14} />
        </Toggle>
        <Toggle
          pressed={editorState.isItalic}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="w-7 h-7"
        >
          <Italic size={14} />
        </Toggle>
        <Toggle
          pressed={editorState.isUnderline}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="w-7 h-7"
        >
          <UnderlineIcon size={14} />
        </Toggle>
        <Toggle
          pressed={editorState.isStrike}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className="w-7 h-7"
        >
          <Strikethrough size={14} />
        </Toggle>

        {/* Enhanced Marker / Highlight with improved click behavior */}
        <Popover
          open={showMarkerPopover}
          onOpenChange={setShowMarkerPopover}
          trigger={
            <Toggle
              pressed={editorState.isHighlight}
              onClick={handleMarkerClick}
              onContextMenu={handleMarkerRightClick}
              className="w-7 h-7 relative group"
            >
              <Highlighter size={14} />
              <div
                className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full border border-black/20"
                style={{ backgroundColor: lastHighlightColor }}
              />
            </Toggle>
          }
          content={
            <div className="p-2 grid grid-cols-5 gap-1 w-40">
              {[
                "#fef08a",
                "#bbf7d0",
                "#bfdbfe",
                "#fbcfe8",
                "#ddd6fe",
                "#000000",
                "#ef4444",
                "#f97316",
                "#84cc16",
                "#06b6d4",
              ].map((color) => (
                <button
                  key={color}
                  onClick={() => setHighlightColor(color)}
                  className="w-6 h-6 rounded-sm border border-black/10 hover:scale-110 transition-transform shadow-sm"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
              <button
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  setShowMarkerPopover(false);
                }}
                className="col-span-5 text-[9px] text-center border mt-1 hover:bg-red-50 text-red-600"
              >
                Clear
              </button>
            </div>
          }
        />
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-0.5 border-r border-black/10 dark:border-white/10 pr-1 mr-1">
        <Toggle
          pressed={editorState.textAlign === "left"}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          className="w-7 h-7"
        >
          <AlignLeft size={14} />
        </Toggle>
        <Toggle
          pressed={editorState.textAlign === "center"}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          className="w-7 h-7"
        >
          <AlignCenter size={14} />
        </Toggle>
        <Toggle
          pressed={editorState.textAlign === "right"}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          className="w-7 h-7"
        >
          <AlignRight size={14} />
        </Toggle>
      </div>

      {/* Lists & Indent */}
      <div className="flex items-center gap-0.5 border-r border-black/10 dark:border-white/10 pr-1 mr-1">
        <Toggle
          pressed={editorState.isBulletList}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="w-7 h-7"
        >
          <List size={14} />
        </Toggle>
        <Toggle
          pressed={editorState.isTaskList}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className="w-7 h-7"
        >
          <CheckSquare size={14} />
        </Toggle>
        <Toggle
          pressed={editorState.isBlockquote}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className="w-7 h-7"
        >
          <Quote size={14} />
        </Toggle>
      </div>

      {/* Insert */}
      <div className="flex items-center gap-0.5">
        {/* Enhanced Link button with Popover instead of window.prompt */}
        <Popover
          open={showLinkPopover}
          onOpenChange={setShowLinkPopover}
          trigger={
            <Toggle
              pressed={editorState.isLink}
              onClick={() => {
                if (editorState.isLink) {
                  editor.chain().focus().unsetLink().run();
                } else {
                  setShowLinkPopover(true);
                }
              }}
              className="w-7 h-7"
            >
              <LinkIcon size={14} />
            </Toggle>
          }
          content={
            <div className="p-2 flex gap-2 w-64">
              <input
                type="url"
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="flex-1 px-2 py-1 border text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && linkUrl) {
                    editor.chain().focus().setLink({ href: linkUrl }).run();
                    setLinkUrl("");
                    setShowLinkPopover(false);
                  }
                }}
              />
              <button
                onClick={() => {
                  if (linkUrl) {
                    editor.chain().focus().setLink({ href: linkUrl }).run();
                    setLinkUrl("");
                    setShowLinkPopover(false);
                  }
                }}
                className="px-2 py-1 bg-black text-white text-xs"
              >
                Add
              </button>
            </div>
          }
        />

        <Toggle
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          className="w-7 h-7"
        >
          <Grid size={14} />
        </Toggle>
      </div>

      {/* Stats */}
      <div className="ml-auto flex items-center px-2 text-[9px] font-mono text-muted-foreground border-l border-black/10 pl-2">
        {editorState.wordCount} words
      </div>
    </div>
  );
};

export default EditorToolbarEnhanced;
