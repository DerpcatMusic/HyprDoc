
import React from 'react';
import { DocBlock, FormValues, BlockType } from '../../types';
import { Settings, Trash2, Plus } from 'lucide-react';
import { cn, Button } from '../ui-components';
import { EditorBlock } from '../EditorBlock';

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
    onInsertAfter: any;
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
    ...rest
}) => {
    
    // Find potential source variables (Radio, Select, Checkbox) that appear BEFORE this block
    // Ideally we'd calculate order, but for simplicity let's just grab all valid inputs
    const potentialSources = allBlocks.filter(b => 
        (b.type === BlockType.RADIO || b.type === BlockType.SELECT || b.type === BlockType.CHECKBOX) &&
        b.variableName &&
        b.id !== block.id
    );

    // Identify the currently selected trigger block to see if we can offer specific options
    const selectedTriggerBlock = potentialSources.find(b => b.variableName === block.condition?.variableName);

    const handleDropInternal = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onDrop(e, block.id); 
    };

    return (
        <div 
            className={cn(
                "rounded-xl border-2 border-dashed transition-all p-4 bg-amber-50/50 border-amber-200 dark:bg-amber-950/10 dark:border-amber-900/50",
                isSelected ? "ring-2 ring-primary border-primary" : "hover:border-amber-400"
            )}
            onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-amber-100/50'); }}
            onDragLeave={(e) => { e.currentTarget.classList.remove('bg-amber-100/50'); }}
            onDrop={handleDropInternal}
        >
            {/* Header Logic Editor */}
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center mb-6 pb-4 border-b border-amber-200/50 dark:border-amber-900/50">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-500 font-bold uppercase text-xs tracking-wider">
                    <Settings size={14} /> Logic Rule
                </div>
                
                <div className="flex-1 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">When</span>
                    <select
                        className="h-8 rounded border border-amber-200 bg-white text-sm px-2 focus:ring-amber-500 dark:bg-zinc-900 dark:border-zinc-700"
                        value={block.condition?.variableName || ''}
                        onChange={(e) => onUpdate(block.id, { condition: { ...block.condition!, variableName: e.target.value } })}
                    >
                        <option value="">Select Field...</option>
                        {potentialSources.map(s => (
                            <option key={s.id} value={s.variableName}>{s.label || s.variableName}</option>
                        ))}
                    </select>
                    <span className="text-sm font-medium">Equals</span>
                    
                    {/* Dynamic Logic: If the trigger block has options, show a select. Else show input. */}
                    {selectedTriggerBlock?.options && selectedTriggerBlock.options.length > 0 ? (
                        <select
                            className="h-8 rounded border border-amber-200 bg-white text-sm px-2 w-32 focus:ring-amber-500 dark:bg-zinc-900 dark:border-zinc-700"
                            value={block.condition?.equals || ''}
                            onChange={(e) => onUpdate(block.id, { condition: { ...block.condition!, equals: e.target.value } })}
                        >
                            <option value="">Select Value...</option>
                            {selectedTriggerBlock.options.map((opt, i) => (
                                <option key={i} value={opt}>{opt}</option>
                            ))}
                        </select>
                    ) : (
                        <input 
                            className="h-8 rounded border border-amber-200 bg-white text-sm px-2 w-32 focus:outline-none focus:border-amber-500 dark:bg-zinc-900 dark:border-zinc-700"
                            placeholder="Value..."
                            value={block.condition?.equals || ''}
                            onChange={(e) => onUpdate(block.id, { condition: { ...block.condition!, equals: e.target.value } })}
                        />
                    )}
                </div>
                
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8" onClick={() => onDelete(block.id)}>
                    <Trash2 size={14} />
                </Button>
            </div>

            {/* Drop Zone Content */}
            <div className="min-h-[100px] space-y-2">
                {(!block.children || block.children.length === 0) ? (
                    <div className="h-24 flex flex-col items-center justify-center text-amber-900/40 dark:text-amber-500/40 border-2 border-dotted border-amber-200/50 rounded-lg">
                        <Plus size={24} className="mb-2" />
                        <p className="text-xs font-medium">Drag blocks here to show conditionally</p>
                    </div>
                ) : (
                    block.children.map(child => (
                        <EditorBlock 
                            key={child.id} 
                            block={child} 
                            // Propagate props
                            onUpdate={(id, u) => {
                                // We need to update the child inside the parent's array
                                const newChildren = block.children!.map(c => c.id === id ? { ...c, ...u } : c);
                                onUpdate(block.id, { children: newChildren });
                            }}
                            onDelete={(id) => {
                                const newChildren = block.children!.filter(c => c.id !== id);
                                onUpdate(block.id, { children: newChildren });
                            }}
                            onSelect={onSelect}
                            onDrop={onDrop}
                            isSelected={isSelected}
                            allBlocks={allBlocks}
                            {...rest}
                            depth={0} 
                        />
                    ))
                )}
            </div>
        </div>
    );
};
