
import React, { useState, useEffect } from 'react';
import { BlockType, EditorBlockProps } from '../../types';
import { 
    GripVertical, Trash2, Bold, Italic, Strikethrough, Heading1, Heading2, List, Sparkles, Wand2
} from 'lucide-react';
import { cn, SlashMenu, BLOCK_META } from '../ui-components';
import { useBlockDrag } from '../../hooks/useBlockDrag';
import { useDocument } from '../../context/DocumentContext';
import { refineText } from '../../services/gemini';

// Tiptap Imports
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';

export const TextEditor: React.FC<EditorBlockProps> = (props) => {
    const { block, onSelect, onUpdate, onDelete, isSelected } = props;
    const { addBlock } = useDocument();
    const { dropPosition, elementRef, handleDragStartInternal, handleDragOver, handleDropInternal } = useBlockDrag(block, props.onDragStart, props.onDrop);
    const [showSlashMenu, setShowSlashMenu] = useState(false);
    const [slashFilter, setSlashFilter] = useState('');
    const [slashMenuIndex, setSlashMenuIndex] = useState(0);
    const [slashCoords, setSlashCoords] = useState({ top: 0, left: 0 });
    const [isRefining, setIsRefining] = useState(false);
    const [showMagicMenu, setShowMagicMenu] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({ placeholder: "Type '/' for commands..." }),
        ],
        content: block.content || '',
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            if (html !== block.content) {
                onUpdate(block.id, { content: html });
            }

            // Slash Command Logic
            const { state } = editor;
            const selection = state.selection;
            const textBefore = state.doc.textBetween(Math.max(0, selection.from - 20), selection.from, '\n', '\0');
            const match = textBefore.match(/\/([a-zA-Z0-9]*)$/);

            if (match) {
                const coords = editor.view.coordsAtPos(selection.from);
                setShowSlashMenu(true);
                setSlashFilter(match[1]);
                setSlashCoords({ top: coords.bottom + window.scrollY + 10, left: coords.left + window.scrollX });
            } else {
                setShowSlashMenu(false);
            }
        },
        editorProps: {
            handleKeyDown: (view, event) => {
                if (showSlashMenu) {
                    const maxIndex = BLOCK_META.filter(b => b.label.toLowerCase().includes(slashFilter.toLowerCase())).length - 1;
                    if (event.key === 'ArrowDown') {
                        setSlashMenuIndex(prev => Math.min(prev + 1, maxIndex));
                        return true;
                    }
                    if (event.key === 'ArrowUp') {
                        setSlashMenuIndex(prev => Math.max(prev - 1, 0));
                        return true;
                    }
                    if (event.key === 'Enter') {
                        const filtered = BLOCK_META.filter(b => b.label.toLowerCase().includes(slashFilter.toLowerCase()));
                        if (filtered[slashMenuIndex]) handleSlashSelect(filtered[slashMenuIndex].type);
                        return true;
                    }
                    if (event.key === 'Escape') {
                        setShowSlashMenu(false);
                        return true;
                    }
                }
                // Enter to create new block if at end (and not in list)
                if (event.key === 'Enter' && !event.shiftKey && !showSlashMenu) {
                     if (event.ctrlKey || event.metaKey) {
                        addBlock(BlockType.TEXT, block.id, 'after');
                        return true;
                     }
                }
                return false;
            }
        }
    });

    // Sync content if it changes externally (e.g. AI update)
    useEffect(() => {
        if (editor && block.content && editor.getHTML() !== block.content) {
             // Only update if significantly different to avoid cursor jump
             if (Math.abs(editor.getHTML().length - block.content.length) > 5) {
                editor.commands.setContent(block.content);
             }
        }
    }, [block.content, editor]);

    const handleSlashSelect = (actionId: string) => {
        if (!editor) return;
        
        // Delete the slash command text
        const { state } = editor;
        const { from } = state.selection;
        const start = from - (slashFilter.length + 1);
        editor.commands.deleteRange({ from: start, to: from });
        
        setShowSlashMenu(false);

        if (actionId === 'h1') { editor.chain().focus().toggleHeading({ level: 1 }).run(); return; }
        if (actionId === 'h2') { editor.chain().focus().toggleHeading({ level: 2 }).run(); return; }
        if (actionId === 'bulletList') { editor.chain().focus().toggleBulletList().run(); return; }
        
        // Convert block or add new
        if (block.type === BlockType.TEXT && !block.content) {
             onUpdate(block.id, { type: actionId as BlockType });
        } else {
             addBlock(actionId as BlockType, block.id, 'after');
        }
    };

    const handleAIRefine = async (instruction: 'fix_grammar' | 'make_legalese' | 'shorten' | 'expand') => {
        if (!editor) return;
        const selection = editor.state.selection;
        const textToRefine = selection.empty ? editor.getText() : editor.state.doc.textBetween(selection.from, selection.to, ' ');
        
        if (!textToRefine) return;

        setIsRefining(true);
        const refined = await refineText(textToRefine, instruction);
        setIsRefining(false);
        setShowMagicMenu(false);

        if (refined) {
            if (selection.empty) {
                editor.commands.setContent(refined);
            } else {
                editor.commands.insertContent(refined);
            }
        }
    };

    const DropIndicator = ({ position }: { position: string | null }) => {
        if (position === 'before') return <div className="absolute -top-2 left-0 right-0 h-1 bg-primary z-50 pointer-events-none shadow-[0_0_10px_rgba(var(--primary),0.5)]" />;
        if (position === 'after') return <div className="absolute -bottom-2 left-0 right-0 h-1 bg-primary z-50 pointer-events-none shadow-[0_0_10px_rgba(var(--primary),0.5)]" />;
        return null;
    }

    return (
        <div ref={elementRef} 
             className={cn("relative group mb-1", isSelected ? "z-10" : "z-0")}
             onClick={(e) => { e.stopPropagation(); onSelect(block.id); editor?.commands.focus(); }}
             onDragOver={handleDragOver} onDrop={handleDropInternal}
        >
            <DropIndicator position={dropPosition} />

             <div className={cn("absolute -left-10 top-0.5 flex items-center gap-1 opacity-0 transition-opacity", (isSelected) ? "opacity-100" : "group-hover:opacity-100")}>
                 <div className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground" draggable onDragStart={handleDragStartInternal} onDragEnd={props.onDragEnd}><GripVertical size={14} /></div>
                 <button onClick={() => onDelete(block.id)} className="p-1 text-muted-foreground hover:text-red-500"><Trash2 size={14} /></button>
             </div>
             
             {/* TIPTAP EDITOR */}
             <div className={cn("prose dark:prose-invert max-w-none text-sm font-serif leading-7 min-h-[24px]", isSelected ? "" : "opacity-90")}>
                {editor && (
                    <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="flex items-center gap-1 p-1 bg-black text-white rounded-sm shadow-xl border border-white/20">
                        <button onClick={() => editor.chain().focus().toggleBold().run()} className={cn("p-1 hover:bg-white/20 rounded", editor.isActive('bold') ? 'bg-white/30 text-white' : '')}><Bold size={12}/></button>
                        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={cn("p-1 hover:bg-white/20 rounded", editor.isActive('italic') ? 'bg-white/30 text-white' : '')}><Italic size={12}/></button>
                        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={cn("p-1 hover:bg-white/20 rounded", editor.isActive('strike') ? 'bg-white/30 text-white' : '')}><Strikethrough size={12}/></button>
                        <div className="w-px h-3 bg-white/20 mx-1" />
                        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={cn("p-1 hover:bg-white/20 rounded", editor.isActive('heading', { level: 1 }) ? 'bg-white/30' : '')}><Heading1 size={12}/></button>
                        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={cn("p-1 hover:bg-white/20 rounded", editor.isActive('heading', { level: 2 }) ? 'bg-white/30' : '')}><Heading2 size={12}/></button>
                        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={cn("p-1 hover:bg-white/20 rounded", editor.isActive('bulletList') ? 'bg-white/30' : '')}><List size={12}/></button>
                        
                        <div className="w-px h-3 bg-white/20 mx-1" />
                        
                        {/* AI MENU */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowMagicMenu(!showMagicMenu)} 
                                className={cn("p-1 hover:bg-indigo-600 rounded flex items-center gap-1 text-indigo-300 hover:text-white transition-colors", isRefining && "animate-pulse")}
                                title="AI Assistant"
                            >
                                <Sparkles size={12} />
                            </button>
                            
                            {showMagicMenu && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 bg-black border border-white/20 shadow-xl flex flex-col p-1 z-50 animate-in fade-in zoom-in-95">
                                    <button onClick={() => handleAIRefine('fix_grammar')} className="text-[10px] text-left px-2 py-1.5 hover:bg-white/20 rounded text-white font-mono">Fix Grammar</button>
                                    <button onClick={() => handleAIRefine('make_legalese')} className="text-[10px] text-left px-2 py-1.5 hover:bg-white/20 rounded text-white font-mono">Legalese</button>
                                    <button onClick={() => handleAIRefine('shorten')} className="text-[10px] text-left px-2 py-1.5 hover:bg-white/20 rounded text-white font-mono">Shorten</button>
                                    <button onClick={() => handleAIRefine('expand')} className="text-[10px] text-left px-2 py-1.5 hover:bg-white/20 rounded text-white font-mono">Expand</button>
                                </div>
                            )}
                        </div>
                    </BubbleMenu>
                )}
                <EditorContent editor={editor} />
             </div>

            <SlashMenu 
              isOpen={showSlashMenu} 
              filter={slashFilter}
              position={slashCoords} 
              onSelect={handleSlashSelect} 
              onClose={() => setShowSlashMenu(false)} 
              selectedIndex={slashMenuIndex} 
            />
        </div>
    );
};
