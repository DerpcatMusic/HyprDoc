import React, { useRef, useEffect, useState } from 'react';
import { BlockType, DocBlock, FormValues, Party } from '../types';
import { 
    Trash2, GripVertical, Settings, List, 
    Type, Hash, Mail, Calendar, CheckSquare, 
    CircleDot, Image as ImageIcon, FileSignature, 
    AlignLeft, Minus, MoreHorizontal, UserCircle, Plus
} from 'lucide-react';
import { Button, Input, Label, cn, Textarea } from './ui-components';

interface EditorBlockProps {
  block: DocBlock;
  formValues: FormValues;
  isSelected: boolean;
  parties: Party[];
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<DocBlock>) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onInsertAfter: (id: string, type: BlockType) => void; // New prop for slash commands
  depth?: number;
}

export const EditorBlock: React.FC<EditorBlockProps> = ({
  block,
  isSelected,
  parties,
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

  // Auto-resize textarea
  useEffect(() => {
    if (block.type === BlockType.TEXT && textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [block.content, block.type]);

  const assignedParty = parties.find(p => p.id === block.assignedToPartyId);

  // Slash Command Menu Options
  const slashOptions = [
      { type: BlockType.TEXT, label: 'Text', icon: Type },
      { type: BlockType.INPUT, label: 'Short Answer', icon: Type },
      { type: BlockType.LONG_TEXT, label: 'Paragraph', icon: AlignLeft },
      { type: BlockType.SECTION_BREAK, label: 'Divider', icon: Minus },
      { type: BlockType.SELECT, label: 'Dropdown', icon: List },
      { type: BlockType.CHECKBOX, label: 'Checkbox', icon: CheckSquare },
      { type: BlockType.DATE, label: 'Date', icon: Calendar },
      { type: BlockType.SIGNATURE, label: 'Signature', icon: FileSignature },
      { type: BlockType.REPEATER, label: 'Repeater Table', icon: List },
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
                  // Remove the slash command text from content
                  const content = block.content || '';
                  const slashIndex = content.lastIndexOf('/');
                  if (slashIndex !== -1) {
                      onUpdate(block.id, { content: content.substring(0, slashIndex) });
                  }
              }
          } else if (e.key === 'Escape') {
              setShowSlashMenu(false);
          }
      }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      onUpdate(block.id, { content: val });

      // Detect Slash
      const lastChar = val.slice(-1);
      if (lastChar === '/') {
          setShowSlashMenu(true);
          setSlashFilter('');
          setMenuIndex(0);
      } else if (showSlashMenu) {
          // If menu is open, capture text after slash
          const slashIndex = val.lastIndexOf('/');
          if (slashIndex === -1) {
              setShowSlashMenu(false);
          } else {
              setSlashFilter(val.slice(slashIndex + 1));
          }
      }
  };

  const getIcon = () => {
      switch(block.type) {
          case BlockType.TEXT: return <Type size={14} />;
          case BlockType.INPUT: return <Type size={14} className="border border-current rounded p-[1px]" />;
          case BlockType.LONG_TEXT: return <AlignLeft size={14} />;
          case BlockType.NUMBER: return <Hash size={14} />;
          case BlockType.EMAIL: return <Mail size={14} />;
          case BlockType.DATE: return <Calendar size={14} />;
          case BlockType.CHECKBOX: return <CheckSquare size={14} />;
          case BlockType.RADIO: return <CircleDot size={14} />;
          case BlockType.IMAGE: return <ImageIcon size={14} />;
          case BlockType.SIGNATURE: return <FileSignature size={14} />;
          case BlockType.CONDITIONAL: return <Settings size={14} />;
          case BlockType.REPEATER: return <List size={14} />;
          case BlockType.SECTION_BREAK: return <Minus size={14} />;
          default: return <Type size={14} />;
      }
  }

  const renderContent = () => {
    switch (block.type) {
      case BlockType.TEXT:
        return (
          <div className="relative">
            <textarea
              ref={textareaRef}
              className={cn(
                  "w-full bg-transparent border-none resize-none focus:ring-0 text-foreground p-0 text-sm leading-relaxed overflow-hidden",
                  !block.content && "text-muted-foreground italic"
              )}
              placeholder='Type "/" to insert blocks...'
              value={block.content || ''}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onClick={() => onSelect(block.id)}
            />
            {showSlashMenu && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-popover text-popover-foreground border shadow-lg rounded-md z-50 overflow-hidden">
                    <div className="p-1">
                        {slashOptions.length === 0 ? (
                             <div className="px-2 py-1.5 text-xs text-muted-foreground">No matches</div>
                        ) : (
                            slashOptions.map((opt, i) => (
                                <button
                                    key={opt.type}
                                    className={cn(
                                        "w-full text-left px-2 py-1.5 text-xs flex items-center gap-2 rounded-sm",
                                        i === menuIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                                    )}
                                    onClick={() => {
                                        onInsertAfter(block.id, opt.type);
                                        setShowSlashMenu(false);
                                        const content = block.content || '';
                                        const slashIndex = content.lastIndexOf('/');
                                        if (slashIndex !== -1) {
                                            onUpdate(block.id, { content: content.substring(0, slashIndex) });
                                        }
                                    }}
                                >
                                    <opt.icon size={12} />
                                    {opt.label}
                                </button>
                            ))
                        )}
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

      case BlockType.INPUT:
      case BlockType.LONG_TEXT:
      case BlockType.NUMBER:
      case BlockType.EMAIL:
      case BlockType.DATE:
      case BlockType.CHECKBOX:
      case BlockType.RADIO:
      case BlockType.IMAGE:
      case BlockType.SIGNATURE:
      case BlockType.SELECT:
        return (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 bg-muted/50 border px-1.5 py-0.5 rounded select-none dark:bg-zinc-800 dark:border-zinc-700")}>
                    {getIcon()} 
                    {block.type === BlockType.INPUT ? 'Short Answer' : 
                     block.type === BlockType.LONG_TEXT ? 'Paragraph' : 
                     block.type}
                </span>
                <input 
                    type="text" 
                    value={block.label || ''} 
                    onChange={(e) => onUpdate(block.id, { label: e.target.value })}
                    placeholder="Enter Field Question/Label"
                    className="flex-1 bg-transparent border-none text-sm font-semibold focus:ring-0 placeholder:text-muted-foreground/40 hover:bg-muted/30 dark:hover:bg-zinc-800 rounded px-1 transition-colors"
                />
            </div>
            
            {(block.type === BlockType.SELECT || block.type === BlockType.RADIO) && (
                 <div className="text-xs text-muted-foreground pl-1 flex gap-1">
                    <span className="opacity-50">Options:</span> 
                    <span className="font-mono text-xs bg-muted/50 dark:bg-zinc-800 px-1 rounded truncate max-w-[200px]">{(block.options || []).join(', ')}</span>
                 </div>
            )}
            
             <div className="flex gap-2 items-center pl-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <span className="text-[10px] text-muted-foreground/60 font-mono select-none">ID:</span>
                <input 
                    type="text" 
                    value={block.variableName || ''} 
                    onChange={(e) => onUpdate(block.id, { variableName: e.target.value })}
                    placeholder="variableName"
                    className="flex-1 text-[10px] text-muted-foreground font-mono bg-transparent border-none p-0 focus:ring-0 h-auto"
                />
            </div>
          </div>
        );

      case BlockType.CONDITIONAL:
          return (
              <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/40 dark:bg-amber-900/10 dark:border-amber-800 p-3">
                  <div className="flex items-center gap-2 mb-2 text-amber-700 dark:text-amber-500 text-xs font-semibold uppercase tracking-wide">
                    <Settings size={12} />
                    <span>Logic Group</span>
                  </div>
                  <div className="text-sm text-amber-900 dark:text-amber-400 mb-2 px-1">
                      Show when <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded border border-amber-200 dark:border-amber-800">{block.condition?.variableName || '...'}</code> equals <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded border border-amber-200 dark:border-amber-800">"{block.condition?.equals || '...'}"</code>
                  </div>
                  <div className="pl-3 border-l-2 border-amber-200 dark:border-amber-800 ml-1">
                     <div className="text-xs text-muted-foreground italic py-2 flex items-center gap-2">
                         <MoreHorizontal size={14} />
                         {block.children?.length ? `${block.children.length} nested blocks (See preview)` : 'Drag blocks here or toggle logic in panel'}
                     </div>
                  </div>
              </div>
          )
      case BlockType.REPEATER:
        return (
            <div className="rounded-lg border border-indigo-200 bg-indigo-50/30 dark:bg-indigo-900/10 dark:border-indigo-800 p-4">
                <div className="flex items-center gap-2 mb-3 text-indigo-700 dark:text-indigo-400 text-sm font-medium">
                    <List size={14} />
                    <input 
                      type="text" 
                      value={block.label || ''} 
                      onChange={(e) => onUpdate(block.id, { label: e.target.value })}
                      placeholder="List Name"
                      className="bg-transparent border-b border-indigo-200 dark:border-indigo-800 focus:border-indigo-500 outline-none w-auto min-w-[150px] text-sm"
                    />
                    <span className="text-[10px] uppercase tracking-wide text-indigo-400 font-bold ml-auto">Dynamic Table</span>
                </div>
                 <div className="pl-4 border-l-2 border-indigo-200 dark:border-indigo-800">
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {block.repeaterFields && block.repeaterFields.length > 0 ? (
                             block.repeaterFields.map(f => (
                                <div key={f.id} className="bg-white/50 dark:bg-zinc-800/50 border px-2 py-1.5 rounded text-xs text-muted-foreground font-medium shadow-sm flex items-center justify-between">
                                  <span>{f.label}</span>
                                  <span className="text-[9px] opacity-50 uppercase bg-indigo-100 dark:bg-indigo-900/50 px-1 rounded">{f.type}</span>
                                </div>
                             ))
                        ) : (
                          <div className="text-xs text-muted-foreground italic">No columns defined</div>
                        )}
                        <div className="border border-dashed border-indigo-300 dark:border-indigo-700 rounded flex items-center justify-center p-1.5 opacity-50">
                            <Plus size={12} className="text-indigo-500" />
                        </div>
                     </div>
                 </div>
            </div>
        )
      default:
        return <div>Unknown Block</div>;
    }
  };

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, block.id)}
      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-primary/20'); }}
      onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-primary/20'); }}
      onDrop={(e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('ring-2', 'ring-primary/20');
          onDrop(e, block.id);
      }}
      className={cn(
          "group relative flex items-start gap-3 mb-2 p-3 rounded-lg border transition-all cursor-default bg-background/50 hover:bg-background",
          isSelected ? "border-primary ring-1 ring-primary shadow-md z-10 bg-background" : "border-transparent hover:border-border",
          block.type === BlockType.TEXT && !isSelected ? "hover:bg-muted/30" : "",
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
      <div className={cn(
          "mt-1.5 text-muted-foreground/30 cursor-grab active:cursor-grabbing hover:text-foreground transition-colors flex flex-col items-center gap-1",
          block.type === BlockType.TEXT && !isSelected ? "opacity-0 group-hover:opacity-100" : "opacity-100"
      )}>
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