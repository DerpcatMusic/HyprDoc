
import React, { useRef, useEffect, useState } from 'react';
import { BlockType, DocBlock, FormValues, Party } from '../types';
import { 
    Trash2, GripVertical, List, Type, Hash, Mail, Calendar, CheckSquare, 
    CircleDot, Image as ImageIcon, FileSignature, AlignLeft, Minus, 
    UploadCloud, Code as CodeIcon, Braces, FileText, Calculator, CreditCard, Video, DollarSign,
    Settings2, User, MoreHorizontal, Edit2, Columns
} from 'lucide-react';
import { Button, cn } from './ui-components';
import { ConditionalZone } from './editor/ConditionalZone';
import { useDocument } from '../context/DocumentContext';

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
  onDrop: (e: React.DragEvent, id: string) => void;
  depth?: number;
  index?: number;
}

// Helpers for category colors
const getBlockCategoryClass = (type: BlockType) => {
    switch(type) {
        case BlockType.TEXT: 
        case BlockType.INPUT:
        case BlockType.LONG_TEXT:
             return "bg-zinc-50/50 border-zinc-200 dark:bg-zinc-900/50 dark:border-zinc-800"; // Primitive
        
        case BlockType.CHECKBOX:
        case BlockType.RADIO:
        case BlockType.SELECT:
        case BlockType.DATE:
        case BlockType.EMAIL:
        case BlockType.NUMBER:
             return "bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30"; // Input

        case BlockType.FORMULA:
        case BlockType.PAYMENT:
        case BlockType.CURRENCY:
             return "bg-purple-50/50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-900/30"; // Smart
        
        case BlockType.SIGNATURE:
        case BlockType.FILE_UPLOAD:
        case BlockType.IMAGE:
        case BlockType.VIDEO:
        case BlockType.SECTION_BREAK:
             return "bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30"; // Media

        case BlockType.CONDITIONAL:
        case BlockType.REPEATER:
             return "bg-rose-50/50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/30"; // Logic

        case BlockType.COLUMNS:
        case BlockType.COLUMN:
            return "bg-indigo-50/50 border-indigo-200 dark:bg-indigo-900/10 dark:border-indigo-900/30"; // Layout
        
        default:
             return "bg-white border-gray-200 dark:bg-zinc-900 dark:border-zinc-700";
    }
};

export const EditorBlock: React.FC<EditorBlockProps> = ({
  block,
  isSelected,
  parties,
  allBlocks = [],
  onSelect,
  onUpdate,
  onDelete,
  onDragStart,
  onDrop,
  depth = 0
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const { addBlock } = useDocument();

  useEffect(() => {
    if (block.type === BlockType.TEXT && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = (textareaRef.current.scrollHeight + 2) + "px";
    }
  }, [block.content, block.type, isEditingText]);

  // Focus textarea when selected if it's a text block
  useEffect(() => {
    if (isSelected && block.type === BlockType.TEXT) {
        setIsEditingText(true);
        // Small timeout to allow render
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                // Set cursor to end
                textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
            }
        }, 10);
    } else {
        setIsEditingText(false);
    }
  }, [isSelected, block.type]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragOver && block.type !== BlockType.COLUMN) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDragOver) setIsDragOver(false);
  };

  const handleDropInternal = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    // If dropping into a column, handle specific logic in the Column render
    if (block.type === BlockType.COLUMN) {
        const newType = e.dataTransfer.getData('application/hyprdoc-new') as BlockType;
        if (newType) {
             addBlock(newType, block.id, 'inside');
        }
        return;
    }

    onDrop(e, block.id);
  };

  const assignedParty = parties.find(p => p.id === block.assignedToPartyId) || parties[0]; 
  const isText = block.type === BlockType.TEXT;
  const isConditional = block.type === BlockType.CONDITIONAL;
  const isColumns = block.type === BlockType.COLUMNS;
  const isColumn = block.type === BlockType.COLUMN;

  const getIcon = () => {
      switch (block.type) {
          case BlockType.TEXT: return Type;
          case BlockType.INPUT: return FileText;
          case BlockType.SIGNATURE: return FileSignature;
          case BlockType.DATE: return Calendar;
          case BlockType.CHECKBOX: return CheckSquare;
          case BlockType.RADIO: return CircleDot;
          case BlockType.SELECT: return List;
          case BlockType.EMAIL: return Mail;
          case BlockType.NUMBER: return Hash;
          case BlockType.IMAGE: return ImageIcon;
          case BlockType.FILE_UPLOAD: return UploadCloud;
          case BlockType.PAYMENT: return CreditCard;
          case BlockType.CURRENCY: return DollarSign;
          case BlockType.VIDEO: return Video;
          case BlockType.COLUMNS: return Columns;
          default: return Type;
      }
  };

  const Icon = getIcon();

  if (isConditional) {
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
              depth={depth}
          />
      )
  }

  // Columns Renderer
  if (isColumns) {
      return (
          <div 
            className={cn(
                "relative group mb-4 border-2 border-dashed border-indigo-200/50 dark:border-indigo-900/50 hover:border-indigo-400 transition-all p-2 bg-indigo-50/10",
                isSelected && "border-indigo-500 dark:border-indigo-500"
            )}
            onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
            draggable
            onDragStart={(e) => onDragStart(e, block.id)}
          >
               {/* Drag Handle for Columns */}
                <div 
                    className="absolute -left-6 top-0 bottom-0 w-6 cursor-grab active:cursor-grabbing flex items-center justify-center opacity-0 group-hover:opacity-100 transition-none z-10 text-indigo-500"
                    draggable
                    onDragStart={(e) => onDragStart(e, block.id)}
                >
                    <GripVertical size={16} />
                </div>

                <div className="flex items-center gap-2 mb-2 px-1">
                    <Columns size={14} className="text-indigo-500" />
                    <span className="text-[10px] font-bold uppercase text-indigo-500 tracking-wider font-mono">Split Layout</span>
                    <div className="ml-auto">
                        <Button variant="ghost" size="icon" className="h-5 w-5 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900" onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}>
                            <Trash2 size={12} />
                        </Button>
                    </div>
                </div>

              <div className="grid grid-cols-2 gap-4">
                  {block.children?.map((col, i) => (
                      <EditorBlock 
                          key={col.id}
                          block={col}
                          index={i}
                          isSelected={false}
                          allBlocks={allBlocks}
                          parties={parties}
                          formValues={{}}
                          onSelect={onSelect}
                          onUpdate={(id, u) => {
                              // Recursively find and update in the columns structure
                              const newChildren = block.children!.map(c => {
                                  if (c.id === id) return { ...c, ...u };
                                  // If deeper nesting existed we'd need more recursion, but for 1-level columns this works
                                  // Actually, the children of the column are what we update usually
                                  if (c.children) {
                                      const updatedGrandChildren = c.children.map(gc => gc.id === id ? { ...gc, ...u } : gc);
                                      return { ...c, children: updatedGrandChildren };
                                  }
                                  return c;
                              });
                              onUpdate(block.id, { children: newChildren });
                          }}
                          onDelete={(id) => {
                             // Find if the ID is a column or a child of a column
                             const newChildren = block.children!.map(c => ({
                                 ...c,
                                 children: c.children?.filter(gc => gc.id !== id)
                             }));
                             onUpdate(block.id, { children: newChildren });
                          }}
                          onDragStart={onDragStart}
                          onDrop={onDrop}
                      />
                  ))}
              </div>
          </div>
      )
  }

  // Inner Column Renderer
  if (isColumn) {
      return (
          <div 
            className="min-h-[100px] border-2 border-dashed border-indigo-200/30 dark:border-indigo-900/30 bg-white/50 dark:bg-zinc-900/20 p-2 flex flex-col gap-2"
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('bg-indigo-50', 'dark:bg-indigo-900/20', 'border-indigo-400'); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.remove('bg-indigo-50', 'dark:bg-indigo-900/20', 'border-indigo-400'); }}
            onDrop={handleDropInternal}
          >
              {(!block.children || block.children.length === 0) && (
                   <div className="flex-1 flex flex-col items-center justify-center text-indigo-300 dark:text-indigo-700 pointer-events-none">
                       <span className="text-[10px] font-mono uppercase">Empty Column</span>
                   </div>
              )}
              {block.children?.map((child, i) => (
                  <EditorBlock 
                    key={child.id}
                    block={child}
                    index={i}
                    isSelected={false} // Inner blocks managed by parent canvas mostly, but selection logic could bubble
                    allBlocks={allBlocks}
                    parties={parties}
                    formValues={{}}
                    onSelect={onSelect}
                    onUpdate={(id, u) => onUpdate(id, u)} // Bubble up
                    onDelete={(id) => onDelete(id)} // Bubble up
                    onDragStart={onDragStart}
                    onDrop={onDrop}
                  />
              ))}
          </div>
      )
  }

  const renderContent = () => {
      if (isText) {
          if (isEditingText || isSelected) {
            return (
                <textarea
                    ref={textareaRef}
                    value={block.content || ''}
                    onChange={(e) => {
                        onUpdate(block.id, { content: e.target.value });
                        e.target.style.height = "auto";
                        e.target.style.height = (e.target.scrollHeight + 2) + "px";
                    }}
                    onBlur={() => setIsEditingText(false)}
                    autoFocus
                    className="w-full bg-transparent border-none resize-none focus:ring-0 px-1 py-1 text-sm font-sans leading-relaxed placeholder:text-muted-foreground/50 overflow-hidden min-h-[24px] outline-none dark:text-white"
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Type '/' for commands..."
                />
            );
          } else {
              return (
                  <div 
                    className="w-full px-1 py-1 text-sm font-sans leading-relaxed whitespace-pre-wrap cursor-text min-h-[24px] dark:text-zinc-100"
                    onClick={(e) => { e.stopPropagation(); onSelect(block.id); setIsEditingText(true); }}
                  >
                      {block.content || <span className="text-muted-foreground/50 italic">Click to type...</span>}
                  </div>
              )
          }
      }

      // Field Area Visualization
      return (
          <div className="flex flex-col w-full justify-center pointer-events-none">
             {/* Top Label Area */}
             <div className="flex items-center justify-between mb-2 border-b-2 border-black/5 dark:border-white/10 pb-1">
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 font-mono", block.required ? "text-destructive" : "text-muted-foreground")}>
                      <Icon size={12} className="text-black dark:text-white opacity-70" />
                      {block.type.replace('_', ' ')}
                      {block.required && '*'}
                  </span>
                  {assignedParty && (
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-zinc-800 border border-black/20 dark:border-zinc-600 shadow-sm">
                          <div className="w-2 h-2 border border-black dark:border-white" style={{ backgroundColor: assignedParty.color }} />
                          <span className="text-[9px] font-mono font-bold uppercase text-black dark:text-white">{assignedParty.name}</span>
                      </div>
                  )}
             </div>
             
             {/* Main Content / Value Preview */}
             <div className="text-sm font-bold truncate opacity-90 font-mono bg-white/80 dark:bg-zinc-900/80 p-1.5 border border-black/5 dark:border-white/5 shadow-sm text-foreground dark:text-white">
                {block.type === BlockType.DATE ? (
                    <div className="flex items-center gap-2 opacity-60">
                        <Calendar size={14} />
                        <span>{block.placeholder || 'Date Selection'}</span>
                    </div>
                ) : (
                    block.label || `LABEL_FOR_${block.type.toUpperCase()}`
                )}
             </div>
             
             {/* Options Preview (if applicable) */}
             {(block.type === BlockType.SELECT || block.type === BlockType.RADIO || block.type === BlockType.CHECKBOX) && block.options && block.options.length > 0 && (
                 <div className="flex flex-wrap gap-1 mt-1.5">
                    {block.options.slice(0, 3).map((opt, i) => (
                        <span key={i} className="text-[9px] border border-black/20 dark:border-white/20 px-1 py-0.5 bg-white dark:bg-zinc-800 font-mono text-black dark:text-white">{opt}</span>
                    ))}
                    {block.options.length > 3 && <span className="text-[9px] text-muted-foreground font-mono">+{block.options.length - 3}</span>}
                 </div>
             )}
          </div>
      );
  };

  const categoryClass = !isText ? getBlockCategoryClass(block.type) : '';
  
  return (
    <div 
      data-flip-id={block.id}
      className={cn(
          "relative group mb-4 transition-none pb-2", 
          isSelected && "z-20"
      )}
      style={{ marginLeft: `${depth * 24}px` }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDropInternal}
      onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
    >
        {/* Drop Indicator Line */}
        {isDragOver && (
             <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary z-50 shadow-sm border-y border-black/20 animate-pulse pointer-events-none" />
        )}

        {/* Floating Action Toolbar */}
        {isSelected && !isText && (
            <div className="absolute -top-9 right-0 flex items-center gap-0 border-2 border-black dark:border-zinc-600 bg-white dark:bg-zinc-800 shadow-hypr dark:shadow-hypr-dark z-50">
                 
                 {/* Party Selector Dropdown */}
                 <div className="relative group/party h-full border-r-2 border-black dark:border-zinc-600">
                    <button className="flex items-center gap-2 hover:bg-primary hover:text-white px-2 py-1 text-xs font-bold font-mono uppercase h-full text-black dark:text-white" title="Assign to Party">
                        <div className="w-2 h-2 border border-black dark:border-white" style={{ backgroundColor: assignedParty?.color }} />
                        <span className="max-w-[80px] truncate">{assignedParty?.name}</span>
                    </button>
                    <div className="absolute top-full right-0 mt-0 w-40 bg-white dark:bg-zinc-900 border-2 border-black dark:border-zinc-600 hidden group-hover/party:block shadow-hypr dark:shadow-hypr-dark">
                        {parties.map(p => (
                            <div 
                                key={p.id} 
                                className="flex items-center gap-2 px-3 py-2 hover:bg-primary hover:text-white cursor-pointer text-xs font-mono border-b-2 border-black dark:border-zinc-700 last:border-0 font-bold uppercase text-black dark:text-white"
                                onClick={(e) => { e.stopPropagation(); onUpdate(block.id, { assignedToPartyId: p.id }); }}
                            >
                                <div className="w-2 h-2 border border-black dark:border-white" style={{ backgroundColor: p.color }} />
                                {p.name}
                            </div>
                        ))}
                    </div>
                 </div>

                 {/* Required Toggle */}
                 <button 
                    className={cn("px-2 py-1 hover:bg-primary hover:text-white h-full text-xs font-bold font-mono uppercase border-r-2 border-black dark:border-zinc-600", block.required ? "text-red-600 bg-red-50 dark:bg-red-900/20" : "text-black dark:text-white")}
                    onClick={(e) => { e.stopPropagation(); onUpdate(block.id, { required: !block.required }); }}
                    title="Toggle Required"
                 >
                    {block.required ? 'REQ' : 'OPT'}
                 </button>

                 {/* Delete */}
                 <button 
                    className="p-1.5 hover:bg-red-500 hover:text-white text-black dark:text-white h-full flex items-center justify-center transition-colors"
                    onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
                    title="Delete Field"
                 >
                     <Trash2 size={12} />
                 </button>
            </div>
        )}

        {/* Block Visuals */}
        <div 
            className={cn(
                "relative transition-none flex flex-col justify-center",
                !isText ? "min-h-[80px] border-2" : "min-h-[24px]",
                !isSelected && !isText && categoryClass
            )}
            style={!isText ? {
                borderColor: isSelected ? (document.documentElement.classList.contains('dark') ? '#52525b' : 'black') : undefined,
                backgroundColor: isSelected ? (document.documentElement.classList.contains('dark') ? '#27272a' : '#f4f4f5') : undefined,
                borderStyle: isSelected ? 'solid' : 'dashed',
                borderWidth: '2px',
                boxShadow: isSelected ? (document.documentElement.classList.contains('dark') ? '4px 4px 0px 0px rgba(0,0,0,0.5)' : '4px 4px 0px 0px rgba(0,0,0,1)') : 'none'
            } : {}}
        >   
            {/* Left Drag Handle */}
            <div 
                className="absolute -left-6 top-0 bottom-0 w-6 cursor-grab active:cursor-grabbing flex items-center justify-center opacity-0 group-hover:opacity-100 transition-none z-10"
                draggable
                onDragStart={(e) => onDragStart(e, block.id)}
                title="Drag to reorder"
            >
                <GripVertical size={16} className="text-black dark:text-zinc-400 hover:text-primary" />
            </div>

            {/* Content Container */}
            <div className={cn("w-full relative z-0", !isText ? "p-4" : "p-1")}>
                {renderContent()}
            </div>
            
            {/* Corner Accent for Industrial Feel (Visible when selected) */}
            {!isText && isSelected && (
                <>
                    <div className="absolute -top-[2px] -left-[2px] w-1.5 h-1.5 bg-primary border border-black dark:border-white" />
                    <div className="absolute -top-[2px] -right-[2px] w-1.5 h-1.5 bg-primary border border-black dark:border-white" />
                    <div className="absolute -bottom-[2px] -left-[2px] w-1.5 h-1.5 bg-primary border border-black dark:border-white" />
                    <div className="absolute -bottom-[2px] -right-[2px] w-1.5 h-1.5 bg-primary border border-black dark:border-white" />
                </>
            )}
        </div>
    </div>
  );
};
