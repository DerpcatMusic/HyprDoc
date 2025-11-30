
import React from 'react';
import { BlockType, EditorBlockProps } from '../types';
import { 
    Trash2, Repeat, GripVertical, CheckCircle2, AlertCircle,
    Plus, PanelLeft, LayoutTemplate, MoveVertical, AlertTriangle, Quote, Info, XOctagon,
    Minus, Image as ImageIcon, FileUp, FileText, User, Columns as ColumnsIcon, ChevronDown, Calendar, Video
} from 'lucide-react';
import { cn, BLOCK_META } from './ui-components';
import { ConditionalZone } from './editor/ConditionalZone';
import { useDocument } from '../context/DocumentContext';
import { useBlockDrag } from '../hooks/useBlockDrag';

// Import Modular Blocks
import { TextEditor } from './blocks/TextEditor';
import { PaymentEditor } from './blocks/PaymentEditor';

// --- Sub-Components (Smaller ones kept locally for now) ---

const DropIndicator = ({ position }: { position: string | null }) => {
    if (position === 'before') return <div className="absolute -top-2 left-0 right-0 h-1 bg-primary z-50 pointer-events-none shadow-[0_0_10px_rgba(var(--primary),0.5)]" />;
    if (position === 'after') return <div className="absolute -bottom-2 left-0 right-0 h-1 bg-primary z-50 pointer-events-none shadow-[0_0_10px_rgba(var(--primary),0.5)]" />;
    return null;
}

const SelectedHeader = ({ label, onDelete }: { label: string, onDelete: () => void }) => (
    <div className="absolute -top-3 right-0 flex border-2 border-black dark:border-white bg-white dark:bg-black shadow-sharp z-50 h-6">
        <div className="px-2 flex items-center bg-black dark:bg-white text-white dark:text-black text-[9px] font-bold font-mono uppercase">{label}</div>
        <button className="px-2 hover:bg-red-600 hover:text-white dark:text-white transition-colors" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 size={12} /></button>
    </div>
)

const ColumnsEditor: React.FC<EditorBlockProps> = (props) => {
    const { block, onUpdate, onDelete, onSelect, isSelected } = props;
    const { ungroupBlock } = useDocument();
    const { handleDragStartInternal } = useBlockDrag(block, props.onDragStart, props.onDrop);
    
    const childCount = block.children?.length || 0;

    const addColumn = () => {
        if (childCount >= 4) return;
        const newCol = { id: crypto.randomUUID(), type: BlockType.COLUMN, width: 50, children: [] };
        onUpdate(block.id, { children: [...(block.children || []), newCol] });
    };

    const removeColumn = () => {
        if (childCount <= 1) return;
        const newChildren = [...(block.children || [])];
        newChildren.pop();
        onUpdate(block.id, { children: newChildren });
    };

    return (
        <div 
             className={cn("w-full relative mb-6 group border-2 border-transparent transition-all", isSelected ? "border-primary/50 bg-primary/5 p-2 rounded-sm" : "hover:border-black/10 p-2")}
             onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
             draggable 
             onDragStart={handleDragStartInternal} 
             onDragEnd={props.onDragEnd} 
             onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }} // Prevent drop on container itself
        >
            {/* Columns Header */}
            <div className="flex items-center justify-between mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 cursor-grab active:cursor-grabbing" onMouseDown={(e) => e.stopPropagation()}>
                    <span className="bg-black text-white text-[9px] font-bold uppercase px-1.5 py-0.5 flex items-center gap-1">
                        <ColumnsIcon size={10} /> Columns
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); ungroupBlock(block.id); }} className="text-[9px] font-mono hover:text-red-500 uppercase flex items-center gap-1 border border-black/10 px-1 bg-white">
                        <LayoutTemplate size={10} /> Ungroup
                    </button>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={(e) => { e.stopPropagation(); removeColumn(); }} disabled={childCount <= 2} className="w-5 h-5 flex items-center justify-center border border-black/20 bg-white hover:bg-black hover:text-white disabled:opacity-30 transition-colors"><Minus size={10} /></button>
                    <span className="text-[9px] font-mono font-bold w-4 text-center">{childCount}</span>
                    <button onClick={(e) => { e.stopPropagation(); addColumn(); }} disabled={childCount >= 4} className="w-5 h-5 flex items-center justify-center border border-black/20 bg-white hover:bg-black hover:text-white disabled:opacity-30 transition-colors"><Plus size={10} /></button>
                    <div className="w-px h-3 bg-black/20 mx-1" />
                    <button onClick={() => onDelete(block.id)} className="p-1 hover:text-red-600"><Trash2 size={12}/></button>
                </div>
            </div>

            <div className="flex w-full gap-4">
                {block.children?.map((col, i) => (
                    <EditorBlock key={col.id} {...props} block={col} index={i} isSelected={false} />
                ))}
            </div>
        </div>
    );
};

const ColumnDropZone: React.FC<EditorBlockProps> = (props) => {
    const { block } = props;
    const { dropPosition, elementRef, handleDropInternal, handleDragOver, handleDragLeave } = useBlockDrag(block, props.onDragStart, props.onDrop);

    return (
        <div 
            ref={elementRef} 
            className={cn(
                "flex-1 flex flex-col gap-3 relative min-h-[100px] p-2 border border-dashed border-black/10 bg-white dark:bg-black/20 transition-colors",
                dropPosition === 'inside' ? "bg-primary/5 border-primary" : ""
            )}
            onDragOver={handleDragOver} 
            onDragLeave={handleDragLeave}
            onDrop={handleDropInternal}
        >
             {(!block.children?.length) && (
                 <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50 pointer-events-none">
                     <PanelLeft size={16} className="mb-1" />
                     <span className="text-[9px] font-mono uppercase tracking-widest">Empty Column</span>
                 </div>
             )}
             {block.children?.map((child, i) => (
                 <EditorBlock key={child.id} {...props} block={child} index={i} isSelected={false} />
             ))}
             {dropPosition === 'inside' && (
                 <div className="absolute inset-0 border-2 border-primary bg-primary/5 pointer-events-none z-50 flex items-center justify-center">
                     <span className="text-[10px] font-bold text-primary bg-white px-2 py-1">Drop Here</span>
                 </div>
             )}
        </div>
    );
};

const SpacerEditor: React.FC<EditorBlockProps> = (props) => {
    const { block, onSelect, onUpdate, onDelete, isSelected } = props;
    const { elementRef, handleDragStartInternal, handleDragOver, handleDropInternal } = useBlockDrag(block, props.onDragStart, props.onDrop);

    return (
        <div ref={elementRef} 
             onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
             draggable onDragStart={handleDragStartInternal} onDragEnd={props.onDragEnd} onDragOver={handleDragOver} onDrop={handleDropInternal}
             className={cn("group relative flex items-center justify-center cursor-ns-resize", isSelected ? "border border-primary border-dashed" : "hover:bg-muted/10")}
             style={{ height: Math.max(10, block.height || 32) }}
        >
            <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-white border border-black/10 p-1 rounded-sm opacity-0 group-hover:opacity-100 shadow-sm cursor-pointer z-10"
                 onMouseDown={(e) => {
                     e.stopPropagation();
                     const startY = e.clientY;
                     const startH = block.height || 32;
                     const handleMouseMove = (ev: MouseEvent) => {
                         const diff = ev.clientY - startY;
                         onUpdate(block.id, { height: Math.max(10, startH + diff) });
                     };
                     const handleMouseUp = () => {
                         window.removeEventListener('mousemove', handleMouseMove);
                         window.removeEventListener('mouseup', handleMouseUp);
                     };
                     window.addEventListener('mousemove', handleMouseMove);
                     window.addEventListener('mouseup', handleMouseUp);
                 }}
            >
                <MoveVertical size={12} />
            </div>
            <span className="text-[9px] text-muted-foreground opacity-0 group-hover:opacity-100 select-none">{block.height || 32}px</span>
            {isSelected && <SelectedHeader label="SPACER" onDelete={() => onDelete(block.id)} />}
        </div>
    );
};

const AlertEditor: React.FC<EditorBlockProps> = (props) => {
    const { block, onSelect, onUpdate, onDelete, isSelected } = props;
    const { elementRef, handleDragStartInternal, handleDragOver, handleDropInternal } = useBlockDrag(block, props.onDragStart, props.onDrop);
    
    const variant = block.variant || 'info';
    const styles = {
        info: 'bg-blue-50 border-blue-200 text-blue-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        success: 'bg-green-50 border-green-200 text-green-800'
    };
    const icons = { info: Info, warning: AlertTriangle, error: XOctagon, success: CheckCircle2 };
    const Icon = icons[variant];

    return (
        <div ref={elementRef} className={cn("relative group mb-3", isSelected && "z-20")}
             onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
             draggable onDragStart={handleDragStartInternal} onDragEnd={props.onDragEnd} onDragOver={handleDragOver} onDrop={handleDropInternal}>
             
             {isSelected && <SelectedHeader label="ALERT" onDelete={() => onDelete(block.id)} />}
             
             <div className={cn("p-4 border-l-4 flex gap-3 items-start", styles[variant], isSelected ? "ring-2 ring-primary ring-offset-2" : "")}>
                 <Icon size={18} className="mt-0.5 shrink-0" />
                 <div className="flex-1">
                     <textarea 
                        className="w-full bg-transparent border-none resize-none focus:ring-0 p-0 text-sm font-medium outline-none"
                        value={block.content || ''}
                        onChange={(e) => onUpdate(block.id, { content: e.target.value })}
                        placeholder="Type alert message..."
                     />
                 </div>
                 <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     {['info', 'warning', 'error', 'success'].map(v => (
                         <button key={v} onClick={() => onUpdate(block.id, { variant: v as any })} className={cn("w-3 h-3 rounded-full border", v===variant ? "border-black scale-125" : "border-transparent opacity-50")} style={{ backgroundColor: v==='info'?'blue':v==='warning'?'orange':v==='error'?'red':'green' }} />
                     ))}
                 </div>
             </div>
        </div>
    );
};

const QuoteEditor: React.FC<EditorBlockProps> = (props) => {
    const { block, onSelect, onUpdate, onDelete, isSelected } = props;
    const { elementRef, handleDragStartInternal, handleDragOver, handleDropInternal } = useBlockDrag(block, props.onDragStart, props.onDrop);

    return (
        <div ref={elementRef} className={cn("relative group mb-3 pl-4 border-l-4 border-black/20 dark:border-white/20", isSelected && "border-primary")}
             onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
             draggable onDragStart={handleDragStartInternal} onDragEnd={props.onDragEnd} onDragOver={handleDragOver} onDrop={handleDropInternal}>
             
             <div className="relative">
                 <Quote size={24} className="absolute -top-2 -left-2 text-muted-foreground/20 -z-10 transform -scale-x-100" />
                 <textarea 
                    className="w-full bg-transparent border-none resize-none focus:ring-0 p-0 text-xl font-serif italic text-muted-foreground outline-none min-h-[60px]"
                    value={block.content || ''}
                    onChange={(e) => onUpdate(block.id, { content: e.target.value })}
                    placeholder="Enter quote..."
                 />
             </div>
             
             {isSelected && (
                <div className="absolute top-0 right-0">
                     <button className="p-1 hover:bg-red-600 hover:text-white text-muted-foreground transition-colors" onClick={(e) => { e.stopPropagation(); onDelete(block.id); }}><Trash2 size={12} /></button>
                </div>
             )}
        </div>
    );
};

const RepeaterEditor: React.FC<EditorBlockProps> = (props) => {
    const { block, onSelect, isSelected } = props;
    const { dropPosition, elementRef, handleDragStartInternal, handleDragOver, handleDropInternal, handleDragLeave } = useBlockDrag(block, props.onDragStart, props.onDrop);

    return (
        <div ref={elementRef} className={cn("relative mb-6 border-2 bg-white dark:bg-black p-4", isSelected ? "border-primary shadow-lg" : "border-black border-dashed")}
             onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
             draggable onDragStart={handleDragStartInternal} onDragEnd={props.onDragEnd} 
             onDragOver={handleDragOver} 
             onDragLeave={handleDragLeave}
             onDrop={handleDropInternal}>
              <div className="flex items-center gap-2 mb-2 font-mono text-xs font-bold uppercase border-b pb-2"><Repeat size={14}/> {block.label || "Repeating Group"}</div>
              <div className="min-h-[60px] space-y-4">
                   {(!block.children?.length) && <div className="text-center text-[10px] text-muted-foreground uppercase py-4">Drop content here</div>}
                   {block.children?.map((child, i) => (
                       <EditorBlock key={child.id} {...props} block={child} index={i} isSelected={false} />
                   ))}
              </div>
              {dropPosition === 'inside' && <div className="absolute inset-0 bg-primary/10 border-2 border-primary pointer-events-none" />}
        </div>
    );
};

const StandardEditor: React.FC<EditorBlockProps> = (props) => {
    const { block, onSelect, onUpdate, onDelete, isSelected, parties } = props;
    const { dropPosition, elementRef, handleDragStartInternal, handleDragOver, handleDropInternal } = useBlockDrag(block, props.onDragStart, props.onDrop);

    const Icon = BLOCK_META.find(b => b.type === block.type)?.icon || FileText;
    const isLayoutBlock = [BlockType.SECTION_BREAK, BlockType.SPACER, BlockType.ALERT, BlockType.QUOTE, BlockType.HTML].includes(block.type);
    const assignedParty = parties.find(p => p.id === block.assignedToPartyId);

    const handlePartyToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        const currentIndex = parties.findIndex(p => p.id === block.assignedToPartyId);
        const nextParty = currentIndex === -1 ? parties[0] : parties[currentIndex + 1];
        if (nextParty?.id) {
            onUpdate(block.id, { assignedToPartyId: nextParty.id });
        } else {
            onUpdate(block.id, {});
        }
    };

    const handleRequiredToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        onUpdate(block.id, { required: !block.required });
    };

    return (
        <div ref={elementRef} className={cn("relative group mb-3 transition-all", isSelected && "z-20 scale-[1.01]")}
             onDragOver={handleDragOver} onDrop={handleDropInternal} onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}>
            
            <DropIndicator position={dropPosition} />
            
            {isSelected && <SelectedHeader label={block.type} onDelete={() => onDelete(block.id)} />}

            <div className={cn("relative border-2 transition-all bg-white dark:bg-black p-0 overflow-hidden", isSelected ? "border-primary shadow-sharp-hover ring-1 ring-primary" : "border-black/10 dark:border-white/20 hover:border-black/40")}>
                {assignedParty && !isLayoutBlock && (
                    <div className="absolute top-0 bottom-0 left-0 w-1 z-10" style={{ backgroundColor: assignedParty.color }} />
                )}

                <div className="flex items-center justify-between px-3 py-2 bg-muted/5 border-b border-black/5 cursor-grab active:cursor-grabbing select-none"
                    draggable onDragStart={handleDragStartInternal} onDragEnd={props.onDragEnd}>
                    <div className="flex items-center gap-3 pl-1">
                        <GripVertical size={12} className="text-muted-foreground/30" />
                        <Icon size={14} className="text-muted-foreground" />
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">{block.label || block.type}</span>
                    </div>
                    
                    {!isLayoutBlock && (
                    <div className="flex items-center gap-2">
                        <button onClick={handlePartyToggle} className={cn("h-5 px-2 text-[9px] font-bold uppercase border flex items-center gap-1 transition-all", assignedParty ? "bg-white border-transparent shadow-sm" : "bg-transparent border-transparent text-muted-foreground/50 hover:bg-muted")} title={assignedParty ? `Assigned to ${assignedParty.name}` : "Click to assign party"}>
                            {assignedParty ? <><div className="w-2 h-2 rounded-full" style={{ backgroundColor: assignedParty.color }} />{assignedParty.initials}</> : <div className="flex items-center gap-1"><User size={10} /> Assign</div>}
                        </button>
                        <button onClick={handleRequiredToggle} className={cn("h-5 px-2 text-[9px] font-bold uppercase border transition-all flex items-center gap-1", block.required ? "bg-red-50 text-red-600 border-red-200" : "text-muted-foreground/50 border-transparent hover:bg-muted")} title="Toggle Required">
                            {block.required ? <AlertCircle size={10} /> : <div className="w-2 h-2 rounded-full border border-current opacity-50" />}
                            {block.required ? "REQ" : "OPT"}
                        </button>
                    </div>
                    )}
                </div>

                <div className="p-3 pl-4">
                     {/* Visual Previews */}
                     {block.label && <div className="text-[10px] font-bold font-mono uppercase tracking-wider text-muted-foreground mb-1.5">{block.label}</div>}

                     {/* Images */}
                     {block.type === BlockType.IMAGE && (
                         block.src ? (
                             <img src={block.src} className="w-full h-32 object-contain bg-muted/10" alt="Preview" />
                         ) : (
                             <div className="h-20 bg-muted/10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                 <ImageIcon size={20} className="opacity-50"/> <span>Image Placeholder</span>
                             </div>
                         )
                     )}

                     {/* Video */}
                     {block.type === BlockType.VIDEO && (
                         <div className="h-20 bg-black/5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                             <Video size={20} className="opacity-50"/> <span>{block.videoUrl || "Video Embed"}</span>
                         </div>
                     )}

                     {/* Signature */}
                     {block.type === BlockType.SIGNATURE && (
                         <div className="h-12 bg-muted/5 border-2 border-dashed border-black/10 flex items-end justify-between px-2 pb-1 text-[10px] text-muted-foreground font-mono">
                             <span>x ____________________</span>
                             <span>SIGNATURE</span>
                         </div>
                     )}

                     {/* Inputs */}
                     {['input', 'number', 'email', 'long_text'].includes(block.type) && (
                         <div className={cn("bg-muted/10 border-b-2 border-black/10 w-full flex items-center px-2 text-xs text-muted-foreground", block.type === 'long_text' ? "h-16 items-start py-2" : "h-8")}>
                            {block.placeholder || (block.type === 'long_text' ? "Type long answer..." : "Type answer...")}
                         </div>
                     )}

                     {/* Date */}
                     {block.type === BlockType.DATE && (
                         <div className="h-8 bg-muted/10 border-b-2 border-black/10 w-full flex items-center px-2 justify-between">
                             <span className="text-xs text-muted-foreground">{block.isDateRange ? "Start Date - End Date" : "DD / MM / YYYY"}</span>
                             <Calendar size={14} className="opacity-50" />
                         </div>
                     )}

                     {/* Checkbox & Radio */}
                     {(block.type === BlockType.CHECKBOX || block.type === BlockType.RADIO) && (
                         <div className="flex flex-col gap-2">
                             {(block.options && block.options.length > 0 ? block.options : ['Option 1', 'Option 2']).map((opt, i) => (
                                 <div key={i} className="flex items-center gap-2">
                                     {block.type === BlockType.CHECKBOX ? (
                                         <div className="w-4 h-4 border-2 border-black/20 rounded-none bg-white dark:bg-black" />
                                     ) : (
                                         <div className="w-4 h-4 border-2 border-black/20 rounded-full bg-white dark:bg-black" />
                                     )}
                                     <span className="text-xs font-mono text-muted-foreground">{opt}</span>
                                 </div>
                             ))}
                         </div>
                     )}

                     {/* Select */}
                     {block.type === BlockType.SELECT && (
                         <div className="h-9 border-2 border-black/10 bg-white dark:bg-black w-full flex items-center justify-between px-3">
                             <span className="text-xs text-muted-foreground italic">{(block.options && block.options[0]) || "Select option..."}</span>
                             <ChevronDown size={14} className="opacity-50" />
                         </div>
                     )}

                     {/* Section Break */}
                     {block.type === BlockType.SECTION_BREAK && <hr className="border-t-2 border-black/10 my-2" />}

                     {/* File Upload */}
                     {block.type === BlockType.FILE_UPLOAD && (
                         <div className="h-12 bg-muted/5 border-2 border-dashed border-black/10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                             <FileUp size={16} className="opacity-50"/> <span>Upload File</span>
                         </div>
                     )}

                     {/* Formula */}
                     {block.type === BlockType.FORMULA && (
                         <div className="h-8 bg-indigo-50/50 border border-indigo-100 flex items-center px-2 text-xs font-mono text-indigo-800">
                             ƒx = {block.formula || "Calculate..."}
                         </div>
                     )}
                 </div>
            </div>
        </div>
    );
};

// --- Main Component ---

export const EditorBlock: React.FC<EditorBlockProps> = (props) => {
    const { block } = props;

    switch (block.type) {
        case BlockType.COLUMNS: return <ColumnsEditor {...props} />;
        case BlockType.COLUMN: return <ColumnDropZone {...props} />;
        case BlockType.SPACER: return <SpacerEditor {...props} />;
        case BlockType.ALERT: return <AlertEditor {...props} />;
        case BlockType.QUOTE: return <QuoteEditor {...props} />;
        case BlockType.REPEATER: return <RepeaterEditor {...props} />;
        case BlockType.TEXT: return <TextEditor {...props} />;
        case BlockType.PAYMENT: return <PaymentEditor {...props} />;
        case BlockType.CONDITIONAL: return <ConditionalZone {...props} />;
        default: return <StandardEditor {...props} />;
    }
};
