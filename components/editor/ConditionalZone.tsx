
import React from 'react';
import { DocBlock, FormValues, BlockType } from '../../types';
import { Trash2, CornerDownRight, GripVertical } from 'lucide-react';
import { cn, Button } from '../ui-components';
import { EditorBlock } from '../EditorBlock';
import { useDocument } from '../../context/DocumentContext';

interface ConditionalZoneProps {
    block: DocBlock;
    formValues: FormValues;
    allBlocks: DocBlock[];
    isSelected: boolean;
    onUpdate: (id: string, updates: Partial<DocBlock>) => void;
    onDelete: (id: string) => void;
    onSelect: (id: string) => void;
    parties: any[];
    onDragStart: any;
    onDrop: any;
    depth?: number;
}

export const ConditionalZone: React.FC<ConditionalZoneProps> = ({
    block,
    allBlocks,
    isSelected,
    onUpdate,
    onDelete,
    onSelect,
    onDrop,
    onDragStart,
    parties,
    depth = 0
}) => {
    
    const { addBlock } = useDocument();

    // Find potential source variables
    const potentialSources = allBlocks.filter(b => 
        (b.type === BlockType.RADIO || b.type === BlockType.SELECT || b.type === BlockType.CHECKBOX) &&
        b.variableName &&
        b.id !== block.id
    );

    const selectedTriggerBlock = potentialSources.find(b => b.variableName === block.condition?.variableName);

    const handleDropInside = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.currentTarget.classList.remove('ring-2', 'ring-primary/50', 'bg-primary/5');

        // Check if it's a new block from toolbox
        const newType = e.dataTransfer.getData('application/hyprdoc-new') as BlockType;
        if (newType) {
            addBlock(newType, block.id, 'inside');
        }
    };

    return (
        <div 
            className={cn(
                "border-2 transition-all relative group/zone my-4 rounded-none",
                isSelected 
                    ? "border-amber-500 ring-0 bg-amber-50/10 dark:border-amber-500" 
                    : "border-dashed border-amber-400/50 hover:border-amber-400 bg-amber-50/5 dark:border-amber-700"
            )}
            style={{ marginLeft: `${depth * 12}px` }}
            onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.currentTarget.classList.add('ring-2', 'ring-primary/50', 'bg-primary/5'); }}
            onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-primary/50', 'bg-primary/5'); }}
            onDrop={handleDropInside}
        >
            {/* Drag Handle for the Zone itself */}
            <div 
                className="absolute -left-5 top-4 cursor-grab active:cursor-grabbing opacity-0 group-hover/zone:opacity-100 transition-opacity text-amber-500"
                draggable
                onDragStart={(e) => onDragStart(e, block.id)}
            >
                <GripVertical size={16} />
            </div>

            {/* Header Logic Editor */}
            <div className="p-2 border-b-2 border-amber-400/20 flex items-center gap-2 bg-amber-100/20 dark:bg-amber-900/20">
                <CornerDownRight size={16} className="text-amber-600 dark:text-amber-400" />
                <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400 tracking-wider font-mono">Logic:</span>
                
                <div className="flex-1 flex flex-wrap items-center gap-2 text-sm">
                    <span className="opacity-70 font-mono text-xs uppercase">IF</span>
                    <select
                        className="h-7 rounded-none border border-amber-200 bg-white text-xs font-medium px-2 focus:ring-0 dark:bg-black dark:border-amber-900 dark:text-white font-mono"
                        value={block.condition?.variableName || ''}
                        onChange={(e) => onUpdate(block.id, { condition: { ...block.condition!, variableName: e.target.value } })}
                    >
                        <option value="">(Select Field)</option>
                        {potentialSources.map(s => (
                            <option key={s.id} value={s.variableName}>{s.label || s.variableName}</option>
                        ))}
                    </select>
                    <span className="opacity-70 font-mono text-xs uppercase">EQUALS</span>
                    
                    {selectedTriggerBlock?.options && selectedTriggerBlock.options.length > 0 ? (
                        <select
                            className="h-7 rounded-none border border-amber-200 bg-white text-xs font-medium px-2 min-w-[100px] focus:ring-0 dark:bg-black dark:border-amber-900 dark:text-white font-mono"
                            value={block.condition?.equals || ''}
                            onChange={(e) => onUpdate(block.id, { condition: { ...block.condition!, equals: e.target.value } })}
                        >
                            <option value="">(Select Value)</option>
                            {selectedTriggerBlock.options.map((opt, i) => (
                                <option key={i} value={opt}>{opt}</option>
                            ))}
                        </select>
                    ) : (
                        <input 
                            className="h-7 rounded-none border border-amber-200 bg-white text-xs font-medium px-2 w-32 focus:outline-none dark:bg-black dark:border-amber-900 dark:text-white font-mono"
                            placeholder="Value..."
                            value={block.condition?.equals || ''}
                            onChange={(e) => onUpdate(block.id, { condition: { ...block.condition!, equals: e.target.value } })}
                        />
                    )}
                </div>
                
                <Button variant="ghost" size="icon" className="h-6 w-6 text-amber-700 hover:bg-amber-500 hover:text-white dark:text-amber-500" onClick={() => onDelete(block.id)}>
                    <Trash2 size={12} />
                </Button>
            </div>

            {/* Drop Zone Content */}
            <div className="p-4 min-h-[60px] bg-amber-50/5 relative">
                 {/* Hazard stripes for empty state */}
                {(!block.children || block.children.length === 0) && (
                    <div className="flex flex-col items-center justify-center py-6 text-amber-800/40 dark:text-amber-500/40 rounded-none hover:bg-amber-100/10 transition-colors absolute inset-2 border-2 border-dashed border-amber-500/20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(245,158,11,0.05)_10px,rgba(245,158,11,0.05)_20px)]">
                        <p className="text-xs font-mono font-bold uppercase mb-2">Zone Empty</p>
                        <div className="flex gap-2">
                             <Button size="xs" variant="outline" className="bg-white dark:bg-black border-amber-200 dark:border-amber-800 hover:bg-amber-50 text-amber-800 dark:text-amber-500 font-mono uppercase text-[10px]" onClick={() => addBlock(BlockType.INPUT, block.id, 'inside')}>+ Field</Button>
                             <Button size="xs" variant="outline" className="bg-white dark:bg-black border-amber-200 dark:border-amber-800 hover:bg-amber-50 text-amber-800 dark:text-amber-500 font-mono uppercase text-[10px]" onClick={() => addBlock(BlockType.TEXT, block.id, 'inside')}>+ Text</Button>
                        </div>
                    </div>
                )}
                
                {block.children && block.children.length > 0 && (
                    <div className="space-y-2 pl-2 border-l border-amber-200/50 dark:border-amber-800/50">
                        {block.children.map((child, i) => (
                            <EditorBlock 
                                key={child.id} 
                                block={child} 
                                index={i}
                                onUpdate={(id, u) => {
                                    const newChildren = block.children!.map(c => c.id === id ? { ...c, ...u } : c);
                                    onUpdate(block.id, { children: newChildren });
                                }}
                                onDelete={(id) => {
                                    const newChildren = block.children!.filter(c => c.id !== id);
                                    onUpdate(block.id, { children: newChildren });
                                }}
                                onSelect={onSelect}
                                onDrop={onDrop}
                                onDragStart={onDragStart}
                                isSelected={false}
                                allBlocks={allBlocks}
                                parties={parties}
                                formValues={{}}
                                depth={0} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
