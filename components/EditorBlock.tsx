import React, { useRef, useEffect, useState } from 'react';
import { BlockType, DocBlock, FormValues, Party } from '../types';
import { 
    Trash2, GripVertical, List, Type, Hash, Mail, Calendar, CheckSquare, 
    CircleDot, Image as ImageIcon, FileSignature, AlignLeft, Minus, 
    UploadCloud, Code as CodeIcon, Braces, FileText, Calculator, CreditCard, Video, DollarSign
} from 'lucide-react';
import { Button, cn } from './ui-components';
import { ConditionalZone } from './editor/ConditionalZone';

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
  onInsertAfter: (id: string, type: BlockType) => void; 
  depth?: number;
}

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
  onInsertAfter,
  depth = 0
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [menuIndex, setMenuIndex] = useState(0);

  useEffect(() => {
    if (block.type === BlockType.TEXT && textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [block.content, block.type]);

  const assignedParty = parties.find(p => p.id === block.assignedToPartyId);
  const hasVariables = block.type === BlockType.TEXT && block.content && /{{[\w]+}}/g.test(block.content);

  const slashOptions = [
      { type: BlockType.TEXT, label: 'Text', icon: Type },
      { type: BlockType.INPUT, label: 'Short Answer', icon: FileText },
      { type: BlockType.LONG_TEXT, label: 'Paragraph', icon: AlignLeft },
      { type: BlockType.SECTION_BREAK, label: 'Divider', icon: Minus },
      { type: BlockType.SELECT, label: 'Dropdown', icon: List },
      { type: BlockType.CHECKBOX, label: 'Checkbox', icon: CheckSquare },
      { type: BlockType.DATE, label: 'Date', icon: Calendar },
      { type: BlockType.SIGNATURE, label: 'Signature', icon: FileSignature },
      { type: BlockType.FILE_UPLOAD, label: 'File Upload', icon: UploadCloud },
      { type: BlockType.REPEATER, label: 'Repeater Table', icon: List },
      { type: BlockType.FORMULA, label: 'Formula', icon: Calculator },
      { type: BlockType.PAYMENT, label: 'Payment', icon: CreditCard },
      { type: BlockType.VIDEO, label: 'Video Embed', icon: Video },
      { type: BlockType.HTML, label: 'HTML Code', icon: CodeIcon },
      { type: BlockType.IMAGE, label: 'Image', icon: ImageIcon },
  ].filter(opt => opt.label.toLowerCase().includes(slashFilter.toLowerCase()));
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (showSlashMenu) {
          if (e.key === 'ArrowDown') {
              e.preventDefault();
              setMenuIndex(prev => Math.min(prev + 1, slashOptions.length - 1));
          } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setMenuIndex(prev => Math.max(prev - 1, 0));
          } else if (e.key === 'Enter') {
              e.preventDefault();
              if (slashOptions[menuIndex]) {
                  onInsertAfter(block.id, slashOptions[menuIndex].type);
                  setShowSlashMenu(false);
                  setSlashFilter('');
                  const content = block.content || '';
                  const slashIndex = content.lastIndexOf('/');
                  if (slashIndex !== -1) {
                      onUpdate(block.id, { content: content.substring(0, slashIndex) });
                  }
              }
          } else if (e.key === 'Escape') setShowSlashMenu(false);
      }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      onUpdate(block.id, { content: val });
      const lastChar = val.slice(-1);
      if (lastChar === '/') {
          setShowSlashMenu(true);
          setSlashFilter('');
          setMenuIndex(0);
      } else if (showSlashMenu) {
          const slashIndex = val.lastIndexOf('/');
          if (slashIndex === -1) setShowSlashMenu(false);
          else setSlashFilter(val.slice(slashIndex + 1));
      }
  };

  const getIcon = () => {
       switch(block.type) {
          case BlockType.TEXT: return <Type size={14} />;
          case BlockType.INPUT: return <FileText size={14} />;
          case BlockType.LONG_TEXT: return <AlignLeft size={14} />;
          case BlockType.NUMBER: return <Hash size={14} />;
          case BlockType.EMAIL: return <Mail size={14} />;
          case BlockType.DATE: return <Calendar size={14} />;
          case BlockType.CHECKBOX: return <CheckSquare size={14} />;
          case BlockType.RADIO: return <CircleDot size={14} />;
          case BlockType.IMAGE: return <ImageIcon size={14} />;
          case BlockType.SIGNATURE: return <FileSignature size={14} />;
          case BlockType.REPEATER: return <List size={14} />;
          case BlockType.SECTION_BREAK: return <Minus size={14} />;
          case BlockType.FILE_UPLOAD: return <UploadCloud size={14} />;
          case BlockType.HTML: return <CodeIcon size={14} />;
          case BlockType.FORMULA: return <Calculator size={14} />;
          case BlockType.PAYMENT: return <CreditCard size={14} />;
          case BlockType.VIDEO: return <Video size={14} />;
          case BlockType.CURRENCY: return <DollarSign size={14} />;
          default: return <Type size={14} />;
      }
  }

  if (block.type === BlockType.CONDITIONAL) {
      return (
          <div className="mb-4">
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
                  onInsertAfter={onInsertAfter}
              />
          </div>
      )
  }

  // Visual Logic: Text blocks shouldn't look like 'cards' when selected, just get a subtle indicator
  const isText = block.type === BlockType.TEXT;

  const renderContent = () => {
    switch (block.type) {
      case BlockType.TEXT:
        return (
          <div className="relative">
            <textarea
              ref={textareaRef}
              className={cn(
                  "w-full bg-transparent border-none resize-none focus:ring-0 text-foreground p-0 text-sm leading-relaxed overflow-hidden whitespace-pre-wrap break-words",
                  !block.content && "text-muted-foreground italic"
              )}
              placeholder='Type "/" to insert blocks or "{{Var}}" for variables...'
              value={block.content || ''}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onClick={() => onSelect(block.id)}
            />
            {hasVariables && (
                 <div className="absolute top-0 right-0">
                     <div className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-1 opacity-70 hover:opacity-100 cursor-help"><Braces size={10} /> Vars</div>
                 </div>
            )}
            {showSlashMenu && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-popover text-popover-foreground border shadow-lg rounded-md z-[100] overflow-hidden dark:border-zinc-800">
                    <div className="p-1">
                        {slashOptions.map((opt, i) => (
                            <button
                                key={opt.type}
                                className={cn(
                                    "w-full text-left px-2 py-1.5 text-xs flex items-center gap-2 rounded-sm transition-colors",
                                    i === menuIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                                )}
                                onClick={() => {
                                    onInsertAfter(block.id, opt.type);
                                    setShowSlashMenu(false);
                                }}
                            >
                                <opt.icon size={12} />
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
          </div>
        );
        
      case BlockType.SECTION_BREAK:
        return (
            <div className="flex items-center gap-4 py-2 opacity-50">
                <div className="h-px bg-foreground/20 flex-1"></div>
                <span className="text-xs uppercase font-medium tracking-widest text-muted-foreground">Section Break</span>
                <div className="h-px bg-foreground/20 flex-1"></div>
            </div>
        );
      
      case BlockType.REPEATER:
        return (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/30 dark:bg-indigo-900/10 dark:border-indigo-800 p-4">
                <div className="flex items-center gap-2 mb-3 text-indigo-700 dark:text-indigo-400 text-sm font-medium">
                    <List size={14} />
                    <span className="font-semibold">{block.label || 'Data Table'}</span>
                    <span className="text-[10px] uppercase tracking-wide text-indigo-400 font-bold ml-auto">Repeater</span>
                </div>
                 <div className="pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                     <div className="text-xs text-muted-foreground mb-2">Columns defined:</div>
                     <div className="flex gap-2 flex-wrap">
                        {block.repeaterFields?.map(f => (
                            <div key={f.id} className="bg-background border px-2 py-1 rounded text-xs font-mono shadow-sm">
                                {f.label}
                            </div>
                        ))}
                        {(!block.repeaterFields || block.repeaterFields.length === 0) && <span className="text-xs italic opacity-50">No columns. Add in Properties.</span>}
                     </div>
                 </div>
            </div>
        )
      
      case BlockType.IMAGE:
          return (
              <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold uppercase"><ImageIcon size={12}/> Image Block</div>
                  <div className="h-24 bg-muted/20 border-2 border-dashed rounded flex items-center justify-center text-xs text-muted-foreground">
                      {block.content ? <img src={block.content} className="h-full object-contain" /> : "Image Placeholder (Set URL in Props)"}
                  </div>
              </div>
          )

      default:
        // Generic Input Render
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 bg-muted/50 border px-1.5 py-0.5 rounded select-none dark:bg-zinc-800 dark:border-zinc-700")}>
                    {getIcon()} 
                    {block.type.replace('_', ' ')}
                </span>
                <input 
                    type="text" 
                    value={block.label || ''} 
                    onChange={(e) => onUpdate(block.id, { label: e.target.value })}
                    placeholder="Enter Field Label"
                    className="flex-1 bg-transparent border-none text-sm font-semibold focus:ring-0 placeholder:text-muted-foreground/40 hover:bg-muted/30 dark:hover:bg-zinc-800 rounded px-1 transition-colors"
                />
            </div>
            
            {(block.type === BlockType.SELECT || block.type === BlockType.RADIO || block.type === BlockType.CHECKBOX) && (
                 <div className="text-xs text-muted-foreground pl-1 flex gap-1">
                    <span className="opacity-50">Options:</span> 
                    <span className="font-mono text-xs bg-muted/50 dark:bg-zinc-800 px-1 rounded truncate max-w-[200px]">{block.options?.length ? block.options.join(', ') : '(None)'}</span>
                 </div>
            )}
          </div>
        );
    }
  };

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('ring-2', 'ring-primary/20'); }}
      onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-primary/20'); }}
      onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.currentTarget.classList.remove('ring-2', 'ring-primary/20');
          onDrop(e, block.id);
      }}
      className={cn(
          "group relative flex items-start gap-3 mb-2 p-1 pl-2 transition-all cursor-text",
          // Only show border/background for non-text blocks to look like 'fields', while Text blocks look like 'document'
          !isText && "p-3 rounded-lg border bg-background/50",
          !isText && isSelected && "border-primary ring-1 ring-primary shadow-sm z-10 bg-background",
          // For Text blocks, show a very subtle indicator
          isText && isSelected && "bg-muted/10 -ml-1 pl-3 rounded-sm ring-1 ring-transparent", // Clean look, no box
          assignedParty && "border-l-4"
      )}
      style={{ 
          marginLeft: `${depth * 24}px`,
          borderLeftColor: assignedParty ? assignedParty.color : undefined
      }}
      onClick={(e) => {
          e.stopPropagation();
          onSelect(block.id);
      }}
    >
      <div 
        className={cn(
            "mt-1.5 text-muted-foreground/30 cursor-grab active:cursor-grabbing hover:text-foreground transition-colors flex flex-col items-center gap-1",
            // Only show grip on hover or selection to make it cleaner
            !isSelected && "opacity-0 group-hover:opacity-100"
        )}
        draggable
        onDragStart={(e) => onDragStart(e, block.id)}
      >
        <GripVertical size={16} />
        {assignedParty && (
            <div 
                className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-sm"
                style={{ backgroundColor: assignedParty.color }}
                title={`Assigned to ${assignedParty.name}`}
            >
                {assignedParty.initials}
            </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        {renderContent()}
      </div>

      <div className={cn(
          "flex items-center gap-1 transition-opacity",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      )}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}
          >
            <Trash2 size={14} />
          </Button>
      </div>
    </div>
  );
};