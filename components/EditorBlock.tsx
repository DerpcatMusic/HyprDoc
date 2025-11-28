
import React, { useRef, useEffect, useState } from 'react';
import { BlockType, DocBlock, FormValues, Party } from '../types';
import { 
    Trash2, GripVertical, List, Type, Hash, Mail, Calendar, CheckSquare, 
    CircleDot, Image as ImageIcon, FileSignature, AlignLeft, Minus, 
    UploadCloud, Code as CodeIcon, Braces, FileText, Calculator, CreditCard, Video, DollarSign,
    Settings2, User, MoreHorizontal, Edit2, Columns, LayoutTemplate, FileUp, Repeat, Wand2, Loader2
} from 'lucide-react';
import { Button, cn, SlashMenu } from './ui-components';
import { ConditionalZone } from './editor/ConditionalZone';
import { useDocument } from '../context/DocumentContext';
import { refineText } from '../services/gemini';

interface EditorBlockProps {
  block: DocBlock;
  formValues: FormValues;
  isSelected: boolean;
  parties: Party[];
  allBlocks?: DocBlock[]; 
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<DocBlock>) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string, position?: 'left'|'right'|'top'|'bottom'|'inside') => void;
  depth?: number;
  index?: number;
}

const getBlockCategoryClass = (type: BlockType) => {
    switch(type) {
        case BlockType.TEXT: return "bg-zinc-50/50 border-zinc-200 dark:bg-zinc-900/50 dark:border-zinc-800";
        case BlockType.CHECKBOX:
        case BlockType.RADIO:
        case BlockType.SELECT:
        case BlockType.DATE:
        case BlockType.EMAIL:
        case BlockType.NUMBER: return "bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30";
        case BlockType.FORMULA:
        case BlockType.PAYMENT:
        case BlockType.CURRENCY: return "bg-purple-50/50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-900/30";
        case BlockType.SIGNATURE:
        case BlockType.FILE_UPLOAD:
        case BlockType.IMAGE:
        case BlockType.VIDEO:
        case BlockType.SECTION_BREAK: return "bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30";
        case BlockType.CONDITIONAL:
        case BlockType.REPEATER: return "bg-rose-50/50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/30";
        default: return "bg-white border-gray-200 dark:bg-zinc-900 dark:border-zinc-700";
    }
};

export const EditorBlock: React.FC<EditorBlockProps> = ({
  block, isSelected, parties, allBlocks = [], onSelect, onUpdate, onDelete, onDragStart, onDrop, depth = 0
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const blockRef = useRef<HTMLDivElement>(null);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });
  const [slashMenuIndex, setSlashMenuIndex] = useState(0);
  
  // AI State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiMenu, setShowAiMenu] = useState(false);

  const { addBlock, ungroupRow } = useDocument();

  // Auto-resize
  useEffect(() => {
    if (block.type === BlockType.TEXT && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = (textareaRef.current.scrollHeight + 2) + "px";
    }
  }, [block.content, isEditingText]);

  // Focus Text
  useEffect(() => {
    if (isSelected && block.type === BlockType.TEXT) {
        setIsEditingText(true);
        if (document.activeElement !== textareaRef.current) {
            // Small delay ensures selection settles before focus
            setTimeout(() => textareaRef.current?.focus(), 10);
        }
    } else {
        setIsEditingText(false);
        setShowSlashMenu(false);
        setShowAiMenu(false);
    }
  }, [isSelected, block.type]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (block.type === BlockType.COLUMN) return;
    if (!blockRef.current) return;
    const rect = blockRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Thresholds: 20% for sides
    if (x < rect.width * 0.2) setDropPosition('left');
    else if (x > rect.width * 0.8) setDropPosition('right');
    else if (y < rect.height * 0.5) setDropPosition('top');
    else setDropPosition('bottom');
  };

  const handleDropInternal = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (block.type === BlockType.COLUMN || block.type === BlockType.REPEATER) {
        const newType = e.dataTransfer.getData('application/hyprdoc-new') as BlockType;
        if (newType) addBlock(newType, block.id, 'inside');
        else {
             const existingId = e.dataTransfer.getData('application/hyprdoc-block-id');
             if(existingId) onDrop(e, block.id, 'inside');
        }
    } else if (dropPosition) {
        onDrop(e, block.id, dropPosition);
    }
    setDropPosition(null);
  };

  const handleColumnResize = (e: React.MouseEvent, index: number) => {
      e.preventDefault(); e.stopPropagation();
      const startX = e.clientX;
      const parentWidth = blockRef.current?.offsetWidth || 1;
      const leftCol = block.children![index];
      const rightCol = block.children![index + 1];
      const startLeft = leftCol.width || 50;
      const startRight = rightCol.width || 50;

      const onMove = (mv: MouseEvent) => {
          const delta = ((mv.clientX - startX) / parentWidth) * 100;
          onUpdate(leftCol.id, { width: Math.max(5, startLeft + delta) });
          onUpdate(rightCol.id, { width: Math.max(5, startRight - delta) });
      };
      const onUp = () => {
          window.removeEventListener('mousemove', onMove);
          window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
  };

  const handleSlashSelect = (actionId: string) => {
      // Map slash commands to BlockTypes
      let typeToAdd: BlockType | null = null;
      switch(actionId) {
          case 'text': typeToAdd = BlockType.TEXT; break;
          case 'h1': 
              onUpdate(block.id, { content: '# ' + (block.content || '').replace('/', '') }); 
              setShowSlashMenu(false);
              return;
          case 'h2': 
              onUpdate(block.id, { content: '## ' + (block.content || '').replace('/', '') }); 
              setShowSlashMenu(false);
              return;
          case 'input': typeToAdd = BlockType.INPUT; break;
          case 'number': typeToAdd = BlockType.NUMBER; break;
          case 'signature': typeToAdd = BlockType.SIGNATURE; break;
          case 'date': typeToAdd = BlockType.DATE; break;
          case 'section_break': typeToAdd = BlockType.SECTION_BREAK; break;
      }

      if (typeToAdd) {
          // If current block is empty text, replace it. Otherwise add after.
          if (block.type === BlockType.TEXT && (!block.content || block.content === '/')) {
              addBlock(typeToAdd, block.id, 'after');
              onDelete(block.id);
          } else {
              // Remove the slash from content before adding new block
              const newContent = (block.content || '').replace('/', '');
              onUpdate(block.id, { content: newContent });
              addBlock(typeToAdd, block.id, 'after');
          }
      }
      setShowSlashMenu(false);
  };

  const handleAiAction = async (action: 'fix_grammar' | 'make_legalese' | 'shorten' | 'expand') => {
      if (!block.content) return;
      setIsAiLoading(true);
      setShowAiMenu(false);
      try {
          const newText = await refineText(block.content, action);
          onUpdate(block.id, { content: newText });
      } catch(e) {
          console.error(e);
      } finally {
          setIsAiLoading(false);
      }
  };

  const renderContent = () => {
      if (block.type === BlockType.TEXT) {
          if (isEditingText || isSelected) {
              return (
                <div className="relative w-full">
                    {/* Magic Wand Toolbar */}
                    {isSelected && block.content && block.content.length > 5 && (
                         <div className="absolute -top-10 left-0 z-50 flex items-center gap-1 bg-white dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 shadow-sm p-1 animate-in slide-in-from-bottom-2 fade-in">
                             <Button 
                                size="xs" 
                                variant="ghost" 
                                className="h-6 text-indigo-600 dark:text-indigo-400 gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                onClick={() => setShowAiMenu(!showAiMenu)}
                             >
                                 {isAiLoading ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                 AI Edit
                             </Button>
                             {showAiMenu && (
                                 <div className="absolute top-full left-0 mt-2 w-40 bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-700 shadow-xl flex flex-col p-1 z-[60]">
                                     <button className="text-left px-2 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => handleAiAction('fix_grammar')}>Fix Grammar</button>
                                     <button className="text-left px-2 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => handleAiAction('make_legalese')}>Make Legalese</button>
                                     <button className="text-left px-2 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => handleAiAction('shorten')}>Shorten</button>
                                     <button className="text-left px-2 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => handleAiAction('expand')}>Expand</button>
                                 </div>
                             )}
                         </div>
                    )}

                    <textarea
                        ref={textareaRef}
                        value={block.content || ''}
                        onChange={(e) => {
                            onUpdate(block.id, { content: e.target.value });
                            if (e.target.value.endsWith('/')) {
                                setShowSlashMenu(true);
                                const rect = e.target.getBoundingClientRect();
                                // Position relative to viewport but constrained by container
                                setSlashMenuPos({ top: rect.bottom + 5, left: rect.left });
                            } else {
                                setShowSlashMenu(false);
                            }
                        }}
                        onKeyDown={(e) => {
                             if (e.key === 'ArrowDown' && showSlashMenu) {
                                e.preventDefault();
                                setSlashMenuIndex(prev => (prev + 1) % 8);
                                return;
                            }
                            if (e.key === 'ArrowUp' && showSlashMenu) {
                                e.preventDefault();
                                setSlashMenuIndex(prev => (prev - 1 + 8) % 8);
                                return;
                            }
                            if (e.key === 'Enter' && showSlashMenu) {
                                e.preventDefault();
                                const items = ['h1', 'h2', 'text', 'input', 'number', 'signature', 'date', 'section_break'];
                                handleSlashSelect(items[slashMenuIndex]);
                                return;
                            }
                            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addBlock(BlockType.TEXT, block.id, 'after'); }
                            if (e.key === 'Backspace' && !block.content) { e.preventDefault(); onDelete(block.id); }
                            if (e.key === 'Escape') setShowSlashMenu(false);
                        }}
                        className="w-full bg-transparent border-none resize-none focus:ring-0 px-1 py-1 text-sm font-sans outline-none dark:text-white"
                        placeholder="Type '/' for commands..."
                    />
                    <SlashMenu 
                        isOpen={showSlashMenu} 
                        position={slashMenuPos} 
                        onSelect={handleSlashSelect} 
                        onClose={() => setShowSlashMenu(false)}
                        selectedIndex={slashMenuIndex}
                    />
                </div>
              );
          }
          return <div className="w-full px-1 py-1 text-sm whitespace-pre-wrap dark:text-zinc-100 min-h-[24px]">{block.content || <span className="opacity-30">Type '/' to insert block...</span>}</div>;
      }
      
      if (block.type === BlockType.CONDITIONAL) {
          return (
              <ConditionalZone 
                  block={block} 
                  allBlocks={allBlocks}
                  formValues={{}}
                  isSelected={isSelected}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onSelect={onSelect}
                  onDrop={onDrop}
                  parties={parties}
                  onDragStart={onDragStart}
                  depth={0}
              />
          );
      }

      // Standard Block Visuals
      const Icon = {
          [BlockType.INPUT]: FileText,
          [BlockType.SIGNATURE]: FileSignature,
          [BlockType.DATE]: Calendar,
          [BlockType.IMAGE]: ImageIcon,
          [BlockType.VIDEO]: Video,
          [BlockType.FILE_UPLOAD]: FileUp,
          [BlockType.FORMULA]: Calculator,
          [BlockType.CHECKBOX]: CheckSquare,
          [BlockType.RADIO]: CircleDot,
          [BlockType.SELECT]: List,
          [BlockType.SECTION_BREAK]: Minus,
          [BlockType.LONG_TEXT]: AlignLeft,
          [BlockType.NUMBER]: Hash,
          [BlockType.EMAIL]: Mail,
          [BlockType.REPEATER]: Repeat,
      }[block.type] || FileText;

      return (
          <div className="flex flex-col w-full pointer-events-none">
               <div className="flex items-center justify-between mb-2 border-b-2 border-black/5 dark:border-white/10 pb-1">
                    <span className="text-[10px] font-bold uppercase flex items-center gap-1.5 opacity-70">
                        <Icon size={12} /> {block.type.replace('_', ' ')} {block.required && '*'}
                    </span>
               </div>
               {block.type === BlockType.IMAGE && block.src && (
                   <img src={block.src} className="h-12 w-auto object-cover opacity-50 mb-1" alt="preview" />
               )}
               {block.type === BlockType.SECTION_BREAK && (
                   <div className="border-t-2 border-dashed border-zinc-300 w-full my-2" />
               )}
               <div className="text-sm font-bold truncate p-1.5 border bg-white/50 dark:bg-black/20">
                    {block.label || (block.type === BlockType.SECTION_BREAK ? "Divider" : "Untitled Field")}
               </div>
          </div>
      );
  };

  // COLUMNS Special Rendering
  if (block.type === BlockType.COLUMNS) {
      return (
          <div 
            ref={blockRef}
            className={cn("relative group mb-4 transition-all", isSelected && "ring-2 ring-indigo-500/20")}
            onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
            draggable
            onDragStart={(e) => onDragStart(e, block.id)}
          >
               {isSelected && (
                  <div className="absolute -top-7 right-0 flex border-2 border-black bg-white dark:bg-zinc-800 z-50 scale-90 origin-right">
                        <button className="px-2 py-0.5 hover:bg-primary text-xs font-bold uppercase" onClick={(e) => { e.stopPropagation(); ungroupRow(block.id); }}>Ungroup</button>
                        <button className="px-2 py-0.5 hover:bg-red-500 hover:text-white" onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}><Trash2 size={12} /></button>
                  </div>
              )}
              <div className="flex w-full relative min-h-[50px]">
                  {block.children?.map((col, i) => (
                      <React.Fragment key={col.id}>
                          <EditorBlock 
                            block={col} index={i} isSelected={false} allBlocks={allBlocks} parties={parties} formValues={{}}
                            onSelect={onSelect} onUpdate={onUpdate} onDelete={onDelete} onDragStart={onDragStart} onDrop={onDrop}
                          />
                          {i < (block.children?.length || 0) - 1 && (
                            <div className="w-4 -ml-2 hover:bg-indigo-500/10 cursor-col-resize z-10 absolute top-0 bottom-0 group/res" style={{ left: `${col.width}%` }} onMouseDown={(e) => handleColumnResize(e, i)}>
                                <div className="w-[1px] h-full bg-transparent group-hover/res:bg-indigo-50 mx-auto"/>
                            </div>
                          )}
                      </React.Fragment>
                  ))}
              </div>
          </div>
      );
  }

  // COLUMN Special Rendering
  if (block.type === BlockType.COLUMN) {
      return (
          <div 
            style={{ width: `${block.width}%` }} 
            className="flex flex-col gap-2 min-h-[50px] px-2 relative transition-none"
            onDragOver={handleDragOver} onDragLeave={() => setDropPosition(null)} onDrop={handleDropInternal}
          >
              {(!block.children || block.children.length === 0) && (
                   <div className="flex-1 border-2 border-dashed border-zinc-200 dark:border-zinc-800 m-1 bg-zinc-50/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-[9px] uppercase opacity-30">Column</span>
                   </div>
              )}
              {block.children?.map((child, i) => (
                  <EditorBlock 
                    key={child.id} block={child} index={i} isSelected={false} allBlocks={allBlocks} parties={parties} formValues={{}}
                    onSelect={onSelect} onUpdate={onUpdate} onDelete={onDelete} onDragStart={onDragStart} onDrop={onDrop}
                  />
              ))}
          </div>
      );
  }

  // REPEATER Special Rendering
  if (block.type === BlockType.REPEATER) {
      return (
          <div 
             ref={blockRef}
             className={cn("relative group mb-4 transition-all border-2 border-dashed border-indigo-300 dark:border-indigo-800 p-4 bg-indigo-50/20", isSelected && "ring-2 ring-indigo-500/20")}
             onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
             draggable
             onDragStart={(e) => onDragStart(e, block.id)}
             onDragOver={handleDragOver}
             onDragLeave={() => setDropPosition(null)}
             onDrop={handleDropInternal}
          >
               {isSelected && (
                  <div className="absolute -top-7 right-0 flex border-2 border-black bg-white dark:bg-zinc-800 z-50 scale-90 origin-right">
                        <div className="px-2 py-0.5 bg-indigo-600 text-white text-xs font-bold uppercase flex items-center gap-1"><Repeat size={10}/> Repeater</div>
                        <button className="px-2 py-0.5 hover:bg-red-500 hover:text-white" onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}><Trash2 size={12} /></button>
                  </div>
              )}
              <div className="mb-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <Repeat size={14} /> {block.label || "Repeater Group"}
              </div>
              <div className="space-y-4">
                   {(!block.children || block.children.length === 0) && (
                       <div className="p-6 text-center text-indigo-400/50 text-xs uppercase font-mono border-2 border-dashed border-indigo-200/50">
                           Drop fields here to create a list template
                       </div>
                   )}
                   {block.children?.map((child, i) => (
                       <EditorBlock 
                           key={child.id} block={child} index={i} isSelected={false} allBlocks={allBlocks} parties={parties} formValues={{}}
                           onSelect={onSelect} onUpdate={onUpdate} onDelete={onDelete} onDragStart={onDragStart} onDrop={onDrop}
                       />
                   ))}
              </div>
          </div>
      )
  }

  // STANDARD WRAPPER
  const categoryClass = block.type !== BlockType.TEXT ? getBlockCategoryClass(block.type) : '';

  return (
    <div 
      ref={blockRef}
      className={cn("relative group mb-4 transition-none", isSelected && "z-20")}
      onDragOver={handleDragOver}
      onDragLeave={() => setDropPosition(null)}
      onDrop={handleDropInternal}
      onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
    >
        {/* Drop Indicators */}
        {dropPosition === 'top' && <div className="absolute -top-2 left-0 right-0 h-1 bg-primary z-50 pointer-events-none" />}
        {dropPosition === 'bottom' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary z-50 pointer-events-none" />}
        {dropPosition === 'left' && <div className="absolute top-0 bottom-0 left-0 w-1 bg-primary z-50 pointer-events-none" />}
        {dropPosition === 'right' && <div className="absolute top-0 bottom-0 right-0 w-1 bg-primary z-50 pointer-events-none" />}

        {/* Toolbar */}
        {isSelected && block.type !== BlockType.TEXT && (
            <div className="absolute -top-7 right-0 flex border-2 border-black bg-white dark:bg-zinc-800 z-50 scale-90 origin-right shadow-sm">
                 <button className="px-2 py-0.5 hover:bg-primary text-xs font-bold uppercase" onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}>
                    <Trash2 size={12} />
                 </button>
            </div>
        )}

        <div className={cn(
            "relative transition-none flex flex-col justify-center",
            block.type !== BlockType.TEXT ? "min-h-[60px] border-2 p-4" : "min-h-[24px] p-1",
            !isSelected && categoryClass
        )}
        style={block.type !== BlockType.TEXT ? {
            borderColor: isSelected ? 'var(--primary)' : undefined,
            borderStyle: isSelected ? 'solid' : 'dashed'
        } : {}}
        >   
            <div 
                className="absolute -left-6 top-0 bottom-0 w-6 cursor-grab active:cursor-grabbing flex items-center justify-center opacity-0 group-hover:opacity-100"
                draggable
                onDragStart={(e) => onDragStart(e, block.id)}
            >
                <GripVertical size={16} className="text-zinc-400 hover:text-primary" />
            </div>

            {renderContent()}
        </div>
    </div>
  );
};
