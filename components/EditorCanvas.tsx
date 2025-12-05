import React, { useState, useRef, useEffect } from "react";
import {
  DocBlock,
  Party,
  BlockType,
  DocumentSettings,
  Variable,
} from "../types";
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  SlashMenu,
  BLOCK_META,
  Toggle,
  Popover,
  getContrastColor,
} from "./ui-components";
import {
  FileText,
  Grid,
  Save,
  Cog,
  Users,
  ChevronDown,
  Play,
  RotateCcw,
  RotateCw,
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  Quote,
  Code,
  Highlighter,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckSquare,
  Underline as UnderlineIcon,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Type,
  Palette,
} from "lucide-react";
import { useDocument } from "../context/DocumentContext";
import { SettingsView } from "./views/SettingsView";
import { PartiesList } from "./PartiesList";

// Tiptap Imports
import {
  useEditor,
  EditorContent,
  Extension,
  useEditorState,
} from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { CharacterCount } from "@tiptap/extensions";
import {
  Table,
  TableRow,
  TableCell,
  TableHeader,
} from "@tiptap/extension-table";
import Color from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";

import { BlockNodeExtension } from "./tiptap/BlockNode";
import EditorToolbarEnhanced from "./EditorToolbarEnhanced";
import SmartSelectAllExtension from "./SmartSelectAllExtension";

interface EditorCanvasProps {
  docTitle: string;
  docSettings?: DocumentSettings;
  blocks: DocBlock[];
  parties: Party[];
  variables?: Variable[];
  selectedBlockId: string | null;
  onTitleChange: (t: string) => void;
  onPreview: () => void;
  onSend: () => void;
  onSelectBlock: (id: string) => void;
  onUpdateBlock: (id: string, u: Partial<DocBlock>) => void;
  onDeleteBlock: (id: string) => void;
  onAddBlock: (type: BlockType) => void;
  onDropBlock: (e: React.DragEvent, targetId: string, position: any) => void;
  onUpdateParty: (index: number, p: Party) => void;
  onUpdateVariables: (vars: Variable[]) => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
  docTitle,
  docSettings,
  blocks,
  parties,
  selectedBlockId,
  onTitleChange,
  onPreview,
  onSend,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  onAddBlock,
  onUpdateParty,
  onDropBlock,
  onUpdateVariables,
}) => {
  const {
    doc,
    saveStatus,
    saveNow,
    addParty,
    removeParty,
    undo,
    redo,
    canUndo,
    canRedo,
    setDoc,
    updateSettings,
    updateParties,
  } = useDocument();

  const [showMargins, setShowMargins] = useState(false);
  const [showDocSettings, setShowDocSettings] = useState(false);
  const [showPartiesPopover, setShowPartiesPopover] = useState(false);
  const partiesButtonRef = useRef<HTMLButtonElement>(null);

  // Slash Menu State
  const [slashMenuState, setSlashMenuState] = useState({
    isOpen: false,
    filter: "",
    coords: { top: 0, left: 0 },
    index: 0,
  });

  // Ref to avoid stale closures in handleKeyDown
  const slashMenuStateRef = useRef(slashMenuState);
  useEffect(() => {
    slashMenuStateRef.current = slashMenuState;
  }, [slashMenuState]);

  const getInitialContent = () => {
    // If we have saved HTML content, use it. Otherwise, reconstruct from blocks (legacy support)
    if (doc.contentHtml) {
      return doc.contentHtml;
    }

    return blocks
      .map((b) => {
        if (b.type === BlockType.TEXT) {
          return b.content || "<p></p>";
        }
        const blockJson = JSON.stringify(b).replace(/"/g, "&quot;");
        return `<hypr-block data-block="${blockJson}"></hypr-block>`;
      })
      .join("");
  };

  const [initialContent] = useState(getInitialContent());

  const editorRef = useRef<any>(null);

  const handleSlashSelect = (type: string, view?: any) => {
    const editor = editorRef.current;
    if (!editor) return;

    const { state } = editor;
    const { from } = state.selection;

    // Delete the slash command text
    const textBefore = state.doc.textBetween(
      Math.max(0, from - 20),
      from,
      "\n",
      "\0"
    );
    const match = textBefore.match(/(?:^|\s)\/([a-zA-Z0-9]*)$/);

    if (match) {
      const matchLength = match[0].length;
      const deleteStart = match[0].startsWith(" ")
        ? from - matchLength + 1
        : from - matchLength;
      editor.commands.deleteRange({ from: deleteStart, to: from });
    }

    // Insert Block or Format
    if (["h1", "h2", "bulletList"].includes(type)) {
      if (type === "h1") editor.commands.toggleHeading({ level: 1 });
      else if (type === "h2") editor.commands.toggleHeading({ level: 2 });
      else if (type === "bulletList") editor.commands.toggleBulletList();
    } else {
      // Insert Custom HyprBlock
      const newBlock: DocBlock = {
        id: crypto.randomUUID(),
        type: type as BlockType,
        label: type.toUpperCase(),
        variableName: `var_${Date.now()}`,
        options: ["select", "radio", "checkbox"].includes(type as any)
          ? ["Option 1"]
          : undefined,
        content: type === BlockType.ALERT ? "Important Info" : undefined,
      };

      editor
        .chain()
        .focus()
        .insertContent({
          type: "hyprBlock",
          attrs: { block: newBlock },
        })
        .run();

      // Auto select new block
      onSelectBlock(newBlock.id);
    }

    setSlashMenuState((prev) => ({ ...prev, isOpen: false }));
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
        // @ts-ignore - Prevent duplicate extension error if StarterKit includes these
        link: false,
        // @ts-ignore
        underline: false,
      }),
      Placeholder.configure({ placeholder: "Type '/' for commands..." }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      Subscript,
      Superscript,
      Link.configure({ openOnClick: false }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      Color,
      Typography,
      CharacterCount,
      BlockNodeExtension,
      SmartSelectAllExtension,
    ],
    content: initialContent,
    immediatelyRender: true,
    shouldRerenderOnTransaction: false, // Critical performance optimization
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none focus:outline-none min-h-[500px] outline-none",
      },
      handleDrop: (view, event, slice, moved) => {
        const type = event.dataTransfer?.getData(
          "application/hyprdoc-new"
        ) as BlockType;
        if (type) {
          const coordinates = view.posAtCoords({
            left: event.clientX,
            top: event.clientY,
          });
          if (coordinates) {
            const newBlock: DocBlock = {
              id: crypto.randomUUID(),
              type: type,
              label: type.toUpperCase(),
              variableName: `var_${Date.now()}`,
            };
            view.dispatch(
              view.state.tr.insert(
                coordinates.pos,
                view.state.schema.nodes.hyprBlock.create({ block: newBlock })
              )
            );
            return true;
          }
        }
        return false;
      },
      handleKeyDown: (view, event) => {
        // Use ref to get current state
        const { isOpen, filter, index } = slashMenuStateRef.current;

        if (isOpen) {
          const filtered = BLOCK_META.filter((b) =>
            b.label.toLowerCase().includes(filter.toLowerCase())
          );
          const maxIndex = Math.max(0, filtered.length - 1);

          if (event.key === "ArrowDown") {
            event.preventDefault();
            setSlashMenuState((prev) => ({
              ...prev,
              index: Math.min(prev.index + 1, maxIndex),
            }));
            return true;
          }
          if (event.key === "ArrowUp") {
            event.preventDefault();
            setSlashMenuState((prev) => ({
              ...prev,
              index: Math.max(prev.index - 1, 0),
            }));
            return true;
          }
          if (event.key === "Enter") {
            event.preventDefault();
            if (filtered[index]) {
              handleSlashSelect(filtered[index].type, view);
            }
            return true;
          }
          if (event.key === "Escape") {
            event.preventDefault();
            setSlashMenuState((prev) => ({ ...prev, isOpen: false }));
            return true;
          }
        }
        return false;
      },
    },
    onSelectionUpdate: ({ editor }) => {
      const { node } = editor.state.selection as any;
      if (node && node.type.name === "hyprBlock") {
        onSelectBlock(node.attrs.block.id);
      }
    },
    onUpdate: ({ editor }) => {
      // Slash Command Detection
      const { state } = editor;
      const selection = state.selection;
      const $from = selection.$from;

      // Get text before cursor in current node
      const textBefore = $from.parent.textBetween(
        Math.max(0, $from.parentOffset - 20),
        $from.parentOffset,
        "\0",
        "\0"
      );
      const match = textBefore.match(/(?:^|\s)\/([a-zA-Z0-9]*)$/);

      if (match) {
        const coords = editor.view.coordsAtPos(selection.from);
        setSlashMenuState({
          isOpen: true,
          filter: match[1],
          coords: { top: coords.bottom, left: coords.left },
          index: 0,
        });
      } else {
        setSlashMenuState((prev) => ({ ...prev, isOpen: false }));
      }
    },
  });

  // Keep editor instance available for handlers
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (editor) {
      // Custom storage for global data
      (editor.storage as any).hyprGlobals = { parties, docSettings };
    }
  }, [editor, parties, docSettings]);

  useEffect(() => {
    if (!editor || !selectedBlockId) return;
    let pos = -1;
    editor.state.doc.descendants((node, position) => {
      if (
        node.type.name === "hyprBlock" &&
        node.attrs.block.id === selectedBlockId
      ) {
        pos = position;
        return false;
      }
    });

    if (pos !== -1) {
      const node = editor.state.doc.nodeAt(pos);
      const currentBlockData = node?.attrs.block;
      const updatedBlockData = blocks.find((b) => b.id === selectedBlockId);

      if (
        updatedBlockData &&
        JSON.stringify(currentBlockData) !== JSON.stringify(updatedBlockData)
      ) {
        editor.commands.updateAttributes("hyprBlock", {
          block: updatedBlockData,
        });
      }
    }
  }, [blocks, editor, selectedBlockId]);

  // SYNC CONTENT HTML & BLOCKS BACK TO CONTEXT
  const syncTriggerCount = useRef(0);
  useEffect(() => {
    if (!editor) return;

    syncTriggerCount.current++;
    const currentCount = syncTriggerCount.current;

    console.log(`🔄 CONTENT SYNC TRIGGERED #${currentCount}:`, {
      htmlLength: editor.getHTML().length,
      timestamp: new Date().toISOString(),
    });

    const syncContent = () => {
      const html = editor.getHTML();
      console.log(`📝 SYNCING CONTENT #${currentCount}:`, {
        htmlLength: html.length,
        hasBlocks: html.includes("hypr-block"),
      });

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const newBlocksRegistry: DocBlock[] = [];

      doc.body.querySelectorAll("hypr-block").forEach((el) => {
        const data = el.getAttribute("data-block");
        if (data) {
          try {
            const block = JSON.parse(data);
            newBlocksRegistry.push(block);
          } catch (e) {}
        }
      });

      console.log(`🔄 UPDATING DOC STATE #${currentCount}:`, {
        blockCount: newBlocksRegistry.length,
        hasNewBlocks: newBlocksRegistry.length > 0,
      });

      setDoc((prev) => ({
        ...prev,
        contentHtml: html,
        blocks: newBlocksRegistry.length > 0 ? newBlocksRegistry : prev.blocks,
      }));
    };

    const timer = setTimeout(syncContent, 1000);
    return () => clearTimeout(timer);
  }, [editor && editor.getHTML()]);

  // Handle Manual Preview with State Sync
  const handlePreviewWithSync = () => {
    if (editor) {
      // Force immediate sync so preview is up to date
      const html = editor.getHTML();
      setDoc((prev) => ({
        ...prev,
        contentHtml: html,
      }));
    }
    // Small delay to ensure state propagates if React batching interferes
    setTimeout(onPreview, 10);
  };

  return (
    <div className="flex-1 flex flex-col bg-background relative z-0 h-full overflow-hidden">
      {/* Header */}
      <div className="h-14 flex-shrink-0 bg-background border-b-2 border-black dark:border-white flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-black dark:bg-white flex items-center justify-center border border-black dark:border-white">
              <FileText size={16} className="text-white dark:text-black" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-mono font-bold uppercase text-muted-foreground leading-none mb-1 tracking-widest">
                Doc Reference
              </span>
              <input
                value={docTitle}
                onChange={(e) => onTitleChange(e.target.value)}
                className="text-sm font-bold bg-transparent outline-none w-48 font-mono tracking-tight uppercase border-b-2 border-transparent focus:border-primary transition-colors hover:border-black/20"
              />
            </div>
          </div>

          <div className="h-8 w-px bg-black/10 dark:bg-white/10 mx-2" />

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 gap-2 border-2 border-transparent hover:border-black"
              onClick={saveNow}
              title="Force Save"
            >
              <Save size={14} />{" "}
              {saveStatus === "saving" ? "Saving..." : "Saved"}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              className="h-8 w-8 p-0 border-2 border-transparent hover:border-black"
              onClick={() => setShowDocSettings(true)}
            >
              <Cog size={16} />
            </Button>

            <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-2" />

            <button
              className={cn(
                "h-8 px-3 flex items-center gap-2 text-[10px] font-bold uppercase font-mono border-2 transition-colors",
                showMargins
                  ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white"
                  : "bg-transparent border-transparent hover:border-black/20"
              )}
              onClick={() => setShowMargins(!showMargins)}
            >
              <Grid size={14} /> Grid
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 relative">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono font-bold uppercase text-muted-foreground mr-1 hidden lg:inline">
              Signers:
            </span>
            <div className="flex items-center bg-muted/10 border border-black/10 rounded-sm pl-1 pr-1">
              <div className="flex -space-x-1 mr-2">
                {parties.map((p) => (
                  <div
                    key={p.id}
                    className="w-6 h-6 border border-black flex items-center justify-center text-[9px] font-bold font-mono text-white shadow-sm"
                    style={{ backgroundColor: p.color }}
                  >
                    {p.initials}
                  </div>
                ))}
              </div>
              <button
                ref={partiesButtonRef}
                onClick={() => setShowPartiesPopover(!showPartiesPopover)}
                className={cn(
                  "h-6 px-1 flex items-center gap-1 hover:bg-black hover:text-white transition-colors text-[10px] font-bold uppercase",
                  showPartiesPopover ? "bg-black text-white" : ""
                )}
              >
                <Users size={12} /> <ChevronDown size={10} />
              </button>
            </div>
          </div>

          {showPartiesPopover && (
            <div className="absolute top-full right-0 mt-2 z-50 parties-popover">
              <PartiesList
                parties={parties}
                onUpdate={onUpdateParty}
                onAdd={() =>
                  addParty({
                    id: crypto.randomUUID(),
                    name: "New Signer",
                    color: "#000",
                    initials: "NS",
                  })
                }
                onRemove={removeParty}
              />
            </div>
          )}

          <div className="h-8 w-px bg-black/10 dark:bg-white/10" />
          <Button
            onClick={handlePreviewWithSync}
            size="sm"
            className="font-mono h-8 border-black shadow-sharp hover:shadow-sharp-hover bg-primary border-primary text-white"
          >
            <Play size={12} className="mr-2" /> PREVIEW
          </Button>
          <Button
            onClick={onSend}
            size="sm"
            variant="outline"
            className="font-mono h-8 border-black hover:bg-black hover:text-white"
          >
            SEND
          </Button>
        </div>
      </div>

      {/* Tiptap Canvas */}
      <div
        className="flex-1 flex flex-col overflow-hidden relative bg-background bg-grid-pattern cursor-text"
        onClick={() => editor?.chain().focus().run()}
      >
        {/* FIXED TOOLBAR */}
        <EditorToolbarEnhanced editor={editor} />

        <div className="flex-1 overflow-y-auto p-8 pb-32">
          <div
            className="max-w-[850px] mx-auto bg-white dark:bg-black min-h-[1100px] border-2 border-black dark:border-white shadow-sharp dark:shadow-sharp-dark relative transition-all p-16"
            dir={docSettings?.direction || "ltr"}
            style={{
              fontFamily: docSettings?.fontFamily,
              paddingTop: docSettings?.margins?.top,
              paddingBottom: docSettings?.margins?.bottom,
              paddingLeft: docSettings?.margins?.left,
              paddingRight: docSettings?.margins?.right,
            }}
          >
            {showMargins && (
              <div className="absolute inset-0 z-50 pointer-events-none border border-dashed border-tech-orange opacity-50"></div>
            )}

            <EditorContent editor={editor} />

            {/* BubbleMenu for text selection formatting */}
            {editor && (
              <BubbleMenu editor={editor}>
                <div className="flex items-center gap-0.5 bg-black dark:bg-white text-white dark:text-black p-1 rounded shadow-lg border border-black/20">
                  <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={cn(
                      "p-1.5 rounded hover:bg-white/20 dark:hover:bg-black/20 transition-colors",
                      editor.isActive("bold") && "bg-white/30 dark:bg-black/30"
                    )}
                    title="Bold (Ctrl+B)"
                  >
                    <Bold size={14} />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={cn(
                      "p-1.5 rounded hover:bg-white/20 dark:hover:bg-black/20 transition-colors",
                      editor.isActive("italic") &&
                        "bg-white/30 dark:bg-black/30"
                    )}
                    title="Italic (Ctrl+I)"
                  >
                    <Italic size={14} />
                  </button>
                  <button
                    onClick={() =>
                      editor.chain().focus().toggleUnderline().run()
                    }
                    className={cn(
                      "p-1.5 rounded hover:bg-white/20 dark:hover:bg-black/20 transition-colors",
                      editor.isActive("underline") &&
                        "bg-white/30 dark:bg-black/30"
                    )}
                    title="Underline (Ctrl+U)"
                  >
                    <UnderlineIcon size={14} />
                  </button>
                  <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={cn(
                      "p-1.5 rounded hover:bg-white/20 dark:hover:bg-black/20 transition-colors",
                      editor.isActive("strike") &&
                        "bg-white/30 dark:bg-black/30"
                    )}
                    title="Strikethrough"
                  >
                    <Strikethrough size={14} />
                  </button>
                  <div className="w-px h-4 bg-white/20 dark:bg-black/20 mx-0.5" />
                  <button
                    onClick={() =>
                      editor.chain().focus().toggleSubscript().run()
                    }
                    className={cn(
                      "p-1.5 rounded hover:bg-white/20 dark:hover:bg-black/20 transition-colors",
                      editor.isActive("subscript") &&
                        "bg-white/30 dark:bg-black/30"
                    )}
                    title="Subscript"
                  >
                    <SubscriptIcon size={14} />
                  </button>
                  <button
                    onClick={() =>
                      editor.chain().focus().toggleSuperscript().run()
                    }
                    className={cn(
                      "p-1.5 rounded hover:bg-white/20 dark:hover:bg-black/20 transition-colors",
                      editor.isActive("superscript") &&
                        "bg-white/30 dark:bg-black/30"
                    )}
                    title="Superscript"
                  >
                    <SuperscriptIcon size={14} />
                  </button>
                  <div className="w-px h-4 bg-white/20 dark:bg-black/20 mx-0.5" />
                  <button
                    onClick={() =>
                      editor
                        .chain()
                        .focus()
                        .toggleHighlight({ color: "#fef08a" })
                        .run()
                    }
                    className={cn(
                      "p-1.5 rounded hover:bg-white/20 dark:hover:bg-black/20 transition-colors",
                      editor.isActive("highlight") &&
                        "bg-white/30 dark:bg-black/30"
                    )}
                    title="Highlight"
                  >
                    <Highlighter size={14} />
                  </button>
                </div>
              </BubbleMenu>
            )}

            {/* Slash Menu Portal */}
            <SlashMenu
              isOpen={slashMenuState.isOpen}
              filter={slashMenuState.filter}
              position={slashMenuState.coords}
              onSelect={(type) => handleSlashSelect(type, editor?.view)}
              onClose={() =>
                setSlashMenuState((p) => ({ ...p, isOpen: false }))
              }
              selectedIndex={slashMenuState.index}
            />
          </div>
          <div className="h-[200px]" />
        </div>
      </div>

      <Dialog open={showDocSettings} onOpenChange={setShowDocSettings}>
        <DialogContent className="max-w-4xl h-[600px] p-0 flex flex-col overflow-hidden">
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle>Document Configuration</DialogTitle>
          </DialogHeader>
          <SettingsView
            mode="document"
            settings={docSettings}
            onUpdate={updateSettings}
            parties={parties}
            onUpdateParties={updateParties}
            isModal={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
