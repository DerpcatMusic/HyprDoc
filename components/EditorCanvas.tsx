
import React, { useState, useRef, useEffect } from 'react';
import { DocBlock, Party, BlockType, DocumentSettings, Variable } from '../types';
import { Button, cn, Dialog, DialogContent, DialogHeader, DialogTitle, SlashMenu, BLOCK_META, Toggle, Popover, getContrastColor } from './ui-components';
import { FileText, Grid, Save, Cog, Users, ChevronDown, Play, RotateCcw, RotateCw, Bold, Italic, Strikethrough, Heading1, Heading2, List, Quote, Code, Highlighter, AlignLeft, AlignCenter, AlignRight, AlignJustify, Link as LinkIcon, Image as ImageIcon, CheckSquare, Underline, Subscript, Superscript, Type, Palette } from 'lucide-react';
import { useDocument } from '../context/DocumentContext';
import { SettingsView } from './views/SettingsView';
import { PartiesList } from './PartiesList';

// Tiptap Imports
import { useEditor, EditorContent, Extension } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import UnderlineExtension from '@tiptap/extension-underline';
import SubscriptExtension from '@tiptap/extension-subscript';
import SuperscriptExtension from '@tiptap/extension-superscript';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Typography from '@tiptap/extension-typography';
import CharacterCount from '@tiptap/extension-character-count';

import { BlockNodeExtension } from './tiptap/BlockNode';

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

// Custom Keymap for Smart Ctrl+A
const SmartSelectAll = Extension.create({
    name: 'smartSelectAll',
    addKeyboardShortcuts() {
        return {
            'Mod-a': ({ editor }) => {
                const { state } = editor;
                const { selection, doc } = state;
                const { from, to } = selection;
                
                // If entire doc selected, let default handle it (which effectively does nothing or re-selects)
                if (from === 0 && to === doc.content.size) return false;

                // Check current node
                const $from = selection.$from;
                const parent = $from.parent;
                const parentStart = $from.start(1) - 1; // Adjust for node wrapping
                const parentEnd = $from.end(1) + 1;

                // Check if current selection covers the whole parent node content
                // Simplified: If selection size matches parent content size
                const parentContentSize = parent.content.size;
                const selectionSize = to - from;

                if (selectionSize === parentContentSize && selectionSize > 0) {
                     // If already selected current node, allow bubble up to Select All
                    return false; 
                }

                // Select current node text
                // We use commands.setTextSelection to limit scope
                editor.commands.selectParentNode();
                return true;
            }
        }
    }
});

const EditorToolbar = ({ editor }: { editor: any }) => {
    const [showHeadingPopover, setShowHeadingPopover] = useState(false);
    const [showMarkerPopover, setShowMarkerPopover] = useState(false);

    if (!editor) return null;

    const setHighlightColor = (color: string) => {
        // We use setHighlight instead of toggleHighlight to ensure the color is applied even if we switch from another color
        editor.chain().focus()
            .setHighlight({ color })
            .run();
        setShowMarkerPopover(false);
    };

    return (
        <div className="w-full h-10 border-b-2 border-black dark:border-white bg-white dark:bg-black flex items-center px-2 gap-1 overflow-x-auto whitespace-nowrap z-20 sticky top-0 shadow-sm">
             {/* History */}
             <div className="flex items-center gap-0.5 border-r border-black/10 dark:border-white/10 pr-1 mr-1">
                <Toggle onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className="w-7 h-7"><RotateCcw size={14} /></Toggle>
                <Toggle onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className="w-7 h-7"><RotateCw size={14} /></Toggle>
             </div>

             {/* Text Styles */}
             <div className="flex items-center gap-0.5 border-r border-black/10 dark:border-white/10 pr-1 mr-1">
                <Popover 
                    open={showHeadingPopover} 
                    onOpenChange={setShowHeadingPopover}
                    trigger={
                        <Toggle className="w-max px-2 gap-1 h-7">
                            {editor.isActive('heading', { level: 1 }) ? 'Heading 1' : editor.isActive('heading', { level: 2 }) ? 'Heading 2' : 'Paragraph'}
                            <ChevronDown size={10} />
                        </Toggle>
                    }
                    content={
                        <div className="flex flex-col gap-1 p-1 min-w-[120px]">
                             <button onClick={() => { editor.chain().focus().setParagraph().run(); setShowHeadingPopover(false); }} className="text-left px-2 py-1 hover:bg-muted text-xs">Paragraph</button>
                             <button onClick={() => { editor.chain().focus().toggleHeading({ level: 1 }).run(); setShowHeadingPopover(false); }} className="text-left px-2 py-1 hover:bg-muted text-xs font-bold text-xl">Heading 1</button>
                             <button onClick={() => { editor.chain().focus().toggleHeading({ level: 2 }).run(); setShowHeadingPopover(false); }} className="text-left px-2 py-1 hover:bg-muted text-xs font-bold text-lg">Heading 2</button>
                             <button onClick={() => { editor.chain().focus().toggleHeading({ level: 3 }).run(); setShowHeadingPopover(false); }} className="text-left px-2 py-1 hover:bg-muted text-xs font-bold text-base">Heading 3</button>
                        </div>
                    }
                />
             </div>

             {/* Basic Formatting */}
             <div className="flex items-center gap-0.5 border-r border-black/10 dark:border-white/10 pr-1 mr-1">
                <Toggle pressed={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} className="w-7 h-7"><Bold size={14} /></Toggle>
                <Toggle pressed={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} className="w-7 h-7"><Italic size={14} /></Toggle>
                <Toggle pressed={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} className="w-7 h-7"><Underline size={14} /></Toggle>
                <Toggle pressed={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} className="w-7 h-7"><Strikethrough size={14} /></Toggle>
                
                {/* Marker / Highlight with Color Picker */}
                <Popover 
                    open={showMarkerPopover}
                    onOpenChange={setShowMarkerPopover}
                    trigger={
                         <Toggle pressed={editor.isActive('highlight')} className="w-7 h-7 relative group">
                             <Highlighter size={14} />
                             <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-yellow-400 border border-black/20" />
                         </Toggle>
                    }
                    content={
                        <div className="p-2 grid grid-cols-5 gap-1 w-40">
                            {['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8', '#ddd6fe', '#000000', '#ef4444', '#f97316', '#84cc16', '#06b6d4'].map(color => (
                                <button 
                                    key={color} 
                                    onClick={() => setHighlightColor(color)}
                                    className="w-6 h-6 rounded-sm border border-black/10 hover:scale-110 transition-transform shadow-sm"
                                    style={{ backgroundColor: color }}
                                    title={color}
                                />
                            ))}
                            <button onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowMarkerPopover(false); }} className="col-span-5 text-[9px] text-center border mt-1 hover:bg-red-50 text-red-600">Clear</button>
                        </div>
                    }
                />
             </div>

             {/* Alignment */}
             <div className="flex items-center gap-0.5 border-r border-black/10 dark:border-white/10 pr-1 mr-1">
                <Toggle pressed={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} className="w-7 h-7"><AlignLeft size={14} /></Toggle>
                <Toggle pressed={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} className="w-7 h-7"><AlignCenter size={14} /></Toggle>
                <Toggle pressed={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} className="w-7 h-7"><AlignRight size={14} /></Toggle>
             </div>

             {/* Lists & Indent */}
             <div className="flex items-center gap-0.5 border-r border-black/10 dark:border-white/10 pr-1 mr-1">
                <Toggle pressed={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} className="w-7 h-7"><List size={14} /></Toggle>
                <Toggle pressed={editor.isActive('taskList')} onClick={() => editor.chain().focus().toggleTaskList().run()} className="w-7 h-7"><CheckSquare size={14} /></Toggle>
                <Toggle pressed={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} className="w-7 h-7"><Quote size={14} /></Toggle>
             </div>
             
             {/* Insert */}
             <div className="flex items-center gap-0.5">
                 <Toggle onClick={() => {
                     const url = window.prompt('URL');
                     if (url) editor.chain().focus().setLink({ href: url }).run();
                 }} pressed={editor.isActive('link')} className="w-7 h-7"><LinkIcon size={14} /></Toggle>
                 
                 <Toggle onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="w-7 h-7"><Grid size={14} /></Toggle>
             </div>
             
             {/* Stats */}
             <div className="ml-auto flex items-center px-2 text-[9px] font-mono text-muted-foreground border-l border-black/10 pl-2">
                 {editor.storage.characterCount.words()} words
             </div>
        </div>
    );
};

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
    docTitle, docSettings, blocks, parties, selectedBlockId,
    onTitleChange, onPreview, onSend,
    onSelectBlock, onUpdateBlock, onDeleteBlock, onAddBlock, onUpdateParty,
    onDropBlock, onUpdateVariables
}) => {
    const { doc, saveStatus, saveNow, addParty, removeParty, undo, redo, canUndo, canRedo, setDoc, updateSettings, updateParties } = useDocument();
    
    const [showMargins, setShowMargins] = useState(false); 
    const [showDocSettings, setShowDocSettings] = useState(false);
    const [showPartiesPopover, setShowPartiesPopover] = useState(false);
    const partiesButtonRef = useRef<HTMLButtonElement>(null);

    // Slash Menu State
    const [slashMenuState, setSlashMenuState] = useState({
        isOpen: false,
        filter: '',
        coords: { top: 0, left: 0 },
        index: 0
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

        return blocks.map(b => {
            if (b.type === BlockType.TEXT) {
                return b.content || '<p></p>';
            }
            const blockJson = JSON.stringify(b).replace(/"/g, '&quot;');
            return `<hypr-block data-block="${blockJson}"></hypr-block>`;
        }).join('');
    };

    const [initialContent] = useState(getInitialContent());

    const editorRef = useRef<any>(null);

    const handleSlashSelect = (type: string, view?: any) => {
        const editor = editorRef.current;
        if (!editor) return;
        
        const { state } = editor;
        const { from } = state.selection;
        
        // Delete the slash command text
        const textBefore = state.doc.textBetween(Math.max(0, from - 20), from, '\n', '\0');
        const match = textBefore.match(/(?:^|\s)\/([a-zA-Z0-9]*)$/);
        
        if (match) {
            const matchLength = match[0].length;
            const deleteStart = match[0].startsWith(' ') ? from - matchLength + 1 : from - matchLength;
            editor.commands.deleteRange({ from: deleteStart, to: from });
        }

        // Insert Block or Format
        if (['h1', 'h2', 'bulletList'].includes(type)) {
             if (type === 'h1') editor.commands.toggleHeading({ level: 1 });
             else if (type === 'h2') editor.commands.toggleHeading({ level: 2 });
             else if (type === 'bulletList') editor.commands.toggleBulletList();
        } else {
            // Insert Custom HyprBlock
            const newBlock: DocBlock = {
                id: crypto.randomUUID(),
                type: type as BlockType,
                label: type.toUpperCase(),
                variableName: `var_${Date.now()}`,
                options: ['select','radio','checkbox'].includes(type as any) ? ['Option 1'] : undefined,
                content: type === BlockType.ALERT ? 'Important Info' : undefined
            };
            
            editor.chain().focus().insertContent({
                type: 'hyprBlock',
                attrs: { block: newBlock }
            }).run();
            
            // Auto select new block
            onSelectBlock(newBlock.id);
        }
        
        setSlashMenuState(prev => ({ ...prev, isOpen: false }));
    };

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                bulletList: { keepMarks: true, keepAttributes: false },
                orderedList: { keepMarks: true, keepAttributes: false },
            }),
            Placeholder.configure({ placeholder: "Type '/' for commands..." }),
            Highlight.configure({ multicolor: true }), // Enable multicolor support
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            UnderlineExtension,
            SubscriptExtension,
            SuperscriptExtension,
            TaskList,
            TaskItem.configure({ nested: true }),
            Link.configure({ openOnClick: false }),
            Table.configure({ resizable: true }),
            TableRow,
            TableHeader,
            TableCell,
            TextStyle,
            Color,
            Typography, // Enhanced Typography
            CharacterCount, // Stats
            BlockNodeExtension,
            SmartSelectAll, // Custom Ctrl+A Logic
        ],
        content: initialContent,
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert max-w-none focus:outline-none min-h-[500px] outline-none',
            },
            handleDrop: (view, event, slice, moved) => {
                const type = event.dataTransfer?.getData('application/hyprdoc-new') as BlockType;
                if (type) {
                    const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                    if (coordinates) {
                        const newBlock: DocBlock = {
                            id: crypto.randomUUID(),
                            type: type,
                            label: type.toUpperCase(),
                            variableName: `var_${Date.now()}`,
                        };
                        view.dispatch(view.state.tr.insert(coordinates.pos, 
                            view.state.schema.nodes.hyprBlock.create({ block: newBlock })
                        ));
                        return true;
                    }
                }
                return false;
            },
            handleKeyDown: (view, event) => {
                // Use ref to get current state
                const { isOpen, filter, index } = slashMenuStateRef.current;
                
                if (isOpen) {
                    const filtered = BLOCK_META.filter(b => b.label.toLowerCase().includes(filter.toLowerCase()));
                    const maxIndex = Math.max(0, filtered.length - 1);
                    
                    if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        setSlashMenuState(prev => ({ ...prev, index: Math.min(prev.index + 1, maxIndex) }));
                        return true;
                    }
                    if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        setSlashMenuState(prev => ({ ...prev, index: Math.max(prev.index - 1, 0) }));
                        return true;
                    }
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        if (filtered[index]) {
                            handleSlashSelect(filtered[index].type, view);
                        }
                        return true;
                    }
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        setSlashMenuState(prev => ({ ...prev, isOpen: false }));
                        return true;
                    }
                }
                return false;
            }
        },
        onSelectionUpdate: ({ editor }) => {
            const { node } = editor.state.selection as any;
            if (node && node.type.name === 'hyprBlock') {
                onSelectBlock(node.attrs.block.id);
            }
        },
        onUpdate: ({ editor }) => {
            // Slash Command Detection
            const { state } = editor;
            const selection = state.selection;
            const $from = selection.$from;
            
            // Get text before cursor in current node
            const textBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - 20), $from.parentOffset, '\0', '\0');
            const match = textBefore.match(/(?:^|\s)\/([a-zA-Z0-9]*)$/);
            
            if (match) {
                const coords = editor.view.coordsAtPos(selection.from);
                setSlashMenuState({
                    isOpen: true,
                    filter: match[1],
                    coords: { top: coords.bottom, left: coords.left },
                    index: 0
                });
            } else {
                setSlashMenuState(prev => ({ ...prev, isOpen: false }));
            }
        }
    });
    
    // Keep editor instance available for handlers
    useEffect(() => {
        editorRef.current = editor;
    }, [editor]);

    useEffect(() => {
        if (editor) {
            editor.storage.hyprGlobals = { parties, docSettings };
        }
    }, [editor, parties, docSettings]);

    useEffect(() => {
        if (!editor || !selectedBlockId) return;
        let pos = -1;
        editor.state.doc.descendants((node, position) => {
            if (node.type.name === 'hyprBlock' && node.attrs.block.id === selectedBlockId) {
                pos = position;
                return false; 
            }
        });

        if (pos !== -1) {
            const node = editor.state.doc.nodeAt(pos);
            const currentBlockData = node?.attrs.block;
            const updatedBlockData = blocks.find(b => b.id === selectedBlockId);

            if (updatedBlockData && JSON.stringify(currentBlockData) !== JSON.stringify(updatedBlockData)) {
                editor.commands.updateAttributes('hyprBlock', { block: updatedBlockData });
            }
        }
    }, [blocks, editor, selectedBlockId]);
    
    // SYNC CONTENT HTML & BLOCKS BACK TO CONTEXT
    useEffect(() => {
        if (!editor) return;
        const syncContent = () => {
            const html = editor.getHTML();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const newBlocksRegistry: DocBlock[] = [];
            
            doc.body.querySelectorAll('hypr-block').forEach((el) => {
                const data = el.getAttribute('data-block');
                if (data) {
                    try {
                        const block = JSON.parse(data);
                        newBlocksRegistry.push(block);
                    } catch(e) {}
                }
            });

            setDoc(prev => ({ 
                ...prev, 
                contentHtml: html,
                blocks: newBlocksRegistry.length > 0 ? newBlocksRegistry : prev.blocks 
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
            setDoc(prev => ({ 
                ...prev, 
                contentHtml: html 
            }));
        }
        // Small delay to ensure state propagates if React batching interferes
        setTimeout(onPreview, 10);
    };

    return (
        <div className="flex-1 flex flex-col bg-muted/10 relative z-0 h-full overflow-hidden">
              {/* Header */}
              <div className="h-14 flex-shrink-0 bg-background border-b-2 border-black dark:border-white flex items-center justify-between px-4 z-30">
                  <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-black dark:bg-white flex items-center justify-center border border-black dark:border-white">
                            <FileText size={16} className="text-white dark:text-black" />
                          </div>
                          <div className="flex flex-col">
                              <span className="text-[9px] font-mono font-bold uppercase text-muted-foreground leading-none mb-1 tracking-widest">Doc Reference</span>
                              <input 
                                value={docTitle} 
                                onChange={(e) => onTitleChange(e.target.value)}
                                className="text-sm font-bold bg-transparent outline-none w-48 font-mono tracking-tight uppercase border-b-2 border-transparent focus:border-primary transition-colors hover:border-black/20"
                              />
                          </div>
                      </div>

                      <div className="h-8 w-px bg-black/10 dark:bg-white/10 mx-2" />

                      <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" className="h-8 px-2 gap-2 border-2 border-transparent hover:border-black" onClick={saveNow} title="Force Save">
                                <Save size={14} /> {saveStatus === 'saving' ? 'Saving...' : 'Saved'}
                            </Button>
                            
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 border-2 border-transparent hover:border-black" onClick={() => setShowDocSettings(true)}>
                                <Cog size={16} />
                            </Button>

                            <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-2" />

                          <button 
                            className={cn("h-8 px-3 flex items-center gap-2 text-[10px] font-bold uppercase font-mono border-2 transition-colors", showMargins ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" : "bg-transparent border-transparent hover:border-black/20")}
                            onClick={() => setShowMargins(!showMargins)}
                          >
                            <Grid size={14} /> Grid
                          </button>
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-4 relative">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold uppercase text-muted-foreground mr-1 hidden lg:inline">Signers:</span>
                        <div className="flex items-center bg-muted/10 border border-black/10 rounded-sm pl-1 pr-1">
                            <div className="flex -space-x-1 mr-2">
                                {parties.map(p => (
                                    <div key={p.id} className="w-6 h-6 border border-black flex items-center justify-center text-[9px] font-bold font-mono text-white shadow-sm" style={{ backgroundColor: p.color }}>
                                        {p.initials}
                                    </div>
                                ))}
                            </div>
                            <button 
                                ref={partiesButtonRef}
                                onClick={() => setShowPartiesPopover(!showPartiesPopover)}
                                className={cn("h-6 px-1 flex items-center gap-1 hover:bg-black hover:text-white transition-colors text-[10px] font-bold uppercase", showPartiesPopover ? "bg-black text-white" : "")}
                            >
                                <Users size={12} /> <ChevronDown size={10} />
                            </button>
                        </div>
                      </div>

                      {showPartiesPopover && (
                        <div className="absolute top-full right-0 mt-2 z-50 parties-popover">
                            <PartiesList parties={parties} onUpdate={onUpdateParty} onAdd={() => addParty({ id: crypto.randomUUID(), name: 'New Signer', color: '#000', initials: 'NS' })} onRemove={removeParty} />
                        </div>
                      )}

                      <div className="h-8 w-px bg-black/10 dark:bg-white/10" />
                      <Button onClick={handlePreviewWithSync} size="sm" className="font-mono h-8 border-black shadow-sharp hover:shadow-sharp-hover bg-primary border-primary text-white"><Play size={12} className="mr-2"/> PREVIEW</Button>
                      <Button onClick={onSend} size="sm" variant="outline" className="font-mono h-8 border-black hover:bg-black hover:text-white">SEND</Button>
                  </div>
              </div>

              {/* Tiptap Canvas */}
              <div className="flex-1 flex flex-col overflow-hidden relative bg-grid-pattern cursor-text" onClick={() => editor?.chain().focus().run()}>
                  
                  {/* FIXED TOOLBAR */}
                  <EditorToolbar editor={editor} />
                  
                  <div className="flex-1 overflow-y-auto p-8 pb-32">
                        <div 
                            className="max-w-[850px] mx-auto bg-white dark:bg-black min-h-[1100px] border-2 border-black dark:border-white shadow-sharp dark:shadow-sharp-dark relative transition-all p-16"
                            dir={docSettings?.direction || 'ltr'}
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
                                
                                {/* Slash Menu Portal */}
                                <SlashMenu 
                                    isOpen={slashMenuState.isOpen}
                                    filter={slashMenuState.filter}
                                    position={slashMenuState.coords}
                                    onSelect={(type) => handleSlashSelect(type, editor?.view)}
                                    onClose={() => setSlashMenuState(p => ({...p, isOpen: false}))} 
                                    selectedIndex={slashMenuState.index}
                                />
                        </div>
                        <div className="h-[200px]" />
                  </div>
              </div>

            <Dialog open={showDocSettings} onOpenChange={setShowDocSettings}>
                <DialogContent className="max-w-4xl h-[600px] p-0 flex flex-col overflow-hidden">
                    <DialogHeader className="p-6 pb-2 shrink-0"><DialogTitle>Document Configuration</DialogTitle></DialogHeader>
                    <SettingsView mode="document" settings={docSettings} onUpdate={updateSettings} parties={parties} onUpdateParties={updateParties} isModal={true} />
                </DialogContent>
            </Dialog>
        </div>
    )
};
