
import React, { useState, useMemo } from 'react';
import { DocBlock, FormValues, BlockType, EditorBlockProps } from '../../types';
import { Trash2, Split, CheckCircle2, XCircle, Plus, ChevronDown } from 'lucide-react';
import { cn, Button } from '../ui-components';
import { EditorBlock } from '../EditorBlock';
import { useDocument } from '../../context/DocumentContext';

export const ConditionalZone: React.FC<EditorBlockProps> = ({
    block,
    allBlocks = [],
    isSelected,
    onUpdate,
    onDelete,
    onSelect,
    onDrop,
    onDragStart,
    parties,
}) => {
    const { addBlock } = useDocument();
    const [previewState, setPreviewState] = useState<'true' | 'false' | null>(null);

    const getAllVariables = (blocks: DocBlock[]): DocBlock[] => {
        let vars: DocBlock[] = [];
        blocks.forEach(b => {
            if (['input', 'number', 'select', 'radio', 'checkbox', 'email', 'date'].includes(b.type)) {
                vars.push(b);
            }
            if (b.children) vars = [...vars, ...getAllVariables(b.children)];
            if (b.elseChildren) vars = [...vars, ...getAllVariables(b.elseChildren)];
        });
        return vars;
    };

    const potentialSources = useMemo(() => {
        const flat = getAllVariables(allBlocks);
        return flat.filter(b => b.id !== block.id && b.variableName);
    }, [allBlocks, block.id]);

    const handleDropTrue = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        const newType = e.dataTransfer.getData('application/hyprdoc-new') as BlockType;
        if (newType) addBlock(newType, block.id, 'inside');
        else onDrop(e, block.id, 'inside');
    };

    const handleDropFalse = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        const newType = e.dataTransfer.getData('application/hyprdoc-new') as BlockType;
        if (newType) addBlock(newType, block.id, 'inside-false');
        else onDrop(e, block.id, 'inside-false');
    };

    const safeUpdateCondition = (key: string, value: string | number | boolean) => {
        const currentCondition = block.condition || { variableName: '', operator: 'equals', value: '' };
        onUpdate(block.id, { condition: { ...currentCondition, [key]: value } });
    };

    const hasElse = block.elseChildren !== undefined;

    return (
        <div 
            className={cn(
                "relative group/zone my-6 rounded-none transition-all",
                isSelected ? "ring-2 ring-primary ring-offset-2 z-20" : ""
            )}
            onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
        >
            <div 
                className="bg-black text-white dark:bg-zinc-800 p-3 flex flex-wrap items-center gap-3 border-2 border-black dark:border-zinc-700 cursor-grab active:cursor-grabbing shadow-sharp"
                draggable
                onDragStart={(e) => onDragStart(e, block.id)}
            >
                <div className="flex items-center gap-2 mr-2 border-r border-white/20 pr-3">
                    <Split size={16} className="text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest font-mono">Logic</span>
                </div>

                <div className="flex-1 flex flex-wrap items-center gap-2 text-sm font-mono">
                    <span className="text-zinc-400 text-xs uppercase font-bold">WHEN</span>
                    <div className="relative group/chip">
                        <select
                            className="appearance-none bg-zinc-800 border border-zinc-600 hover:border-white text-white rounded-none px-3 py-1 pr-8 text-xs font-bold cursor-pointer focus:outline-none focus:border-primary transition-colors min-w-[120px]"
                            value={block.condition?.variableName || ''}
                            onChange={(e) => safeUpdateCondition('variableName', e.target.value)}
                        >
                            <option value="" disabled>Select Field</option>
                            {potentialSources.map(s => (
                                <option key={s.id} value={s.variableName}>{s.label || s.variableName}</option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"><ChevronDown size={10} /></div>
                    </div>
                    <span className="text-zinc-400 text-xs uppercase font-bold">IS</span>
                    <div className="relative">
                        <select
                            className="appearance-none bg-transparent border-b border-zinc-600 hover:border-white text-white rounded-none px-1 py-1 pr-6 text-xs font-bold cursor-pointer focus:outline-none focus:border-primary text-center"
                            value={block.condition?.operator || 'equals'}
                            onChange={(e) => safeUpdateCondition('operator', e.target.value)}
                        >
                             <option value="equals">=</option>
                             <option value="not_equals">!=</option>
                             <option value="greater_than">&gt;</option>
                             <option value="less_than">&lt;</option>
                             <option value="contains">Contains</option>
                             <option value="is_set">Has Value</option>
                        </select>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"><ChevronDown size={10} /></div>
                    </div>

                    {!['is_set', 'is_empty'].includes(block.condition?.operator || '') && (
                        <input 
                            className="bg-primary text-white border border-transparent hover:brightness-110 rounded-none px-3 py-1 text-xs font-bold focus:outline-none shadow-sm w-32 placeholder:text-white/50"
                            placeholder="Value..."
                            value={block.condition?.value || ''}
                            onChange={(e) => safeUpdateCondition('value', e.target.value)}
                        />
                    )}
                </div>

                <div className="flex items-center gap-2 border-l border-white/20 pl-3 ml-2">
                     <button onClick={() => setPreviewState(previewState === 'true' ? null : 'true')} className={cn("p-1 rounded hover:bg-white/10", previewState === 'true' && "text-green-400")} title="Preview True"><CheckCircle2 size={14}/></button>
                     <button onClick={() => setPreviewState(previewState === 'false' ? null : 'false')} className={cn("p-1 rounded hover:bg-white/10", previewState === 'false' && "text-red-400")} title="Preview False"><XCircle size={14}/></button>
                     <button onClick={() => onDelete(block.id)} className="p-1 hover:bg-red-600 hover:text-white text-zinc-400 transition-colors"><Trash2 size={14}/></button>
                </div>
            </div>

            <div 
                className={cn("border-l-4 border-green-500/50 bg-green-50/10 dark:bg-green-900/10 min-h-[80px] p-4 transition-all relative", (previewState === 'false') && "opacity-20 grayscale")}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={handleDropTrue}
            >
                <div className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-widest text-green-600/50 dark:text-green-400/50 font-mono select-none">THEN SHOW THIS:</div>
                {(!block.children || block.children.length === 0) && <div className="border-2 border-dashed border-green-500/20 h-20 flex items-center justify-center text-green-600/40 text-xs font-mono uppercase tracking-wider">Drop Content Here</div>}
                <div className="space-y-4 mt-4">
                    {block.children?.map((child, i) => (
                        <EditorBlock key={child.id} block={child} index={i} onUpdate={onUpdate} onDelete={onDelete} onSelect={onSelect} onDrop={onDrop} onDragStart={onDragStart} isSelected={false} allBlocks={allBlocks} parties={parties} formValues={{}} />
                    ))}
                </div>
            </div>

            <div className="relative h-px bg-black/10 dark:bg-white/10 my-0">
                <div className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                     {!hasElse ? (
                         <Button size="xs" variant="outline" className="h-6 text-[10px] border-dashed border-zinc-400 text-zinc-500 hover:border-black hover:text-black hover:bg-white dark:hover:border-white dark:hover:text-white dark:hover:bg-black font-mono uppercase bg-muted/50 backdrop-blur-sm" onClick={() => onUpdate(block.id, { elseChildren: [] })}>
                             <Plus size={10} className="mr-1" /> Add Else
                         </Button>
                     ) : <span className="text-[9px] font-bold uppercase font-mono text-white bg-black dark:bg-white dark:text-black px-3 py-0.5 border border-black/10 dark:border-white/10 shadow-sm">ELSE</span>}
                </div>
            </div>

            {hasElse && (
                <div className={cn("border-l-4 border-red-500/50 bg-red-50/10 dark:bg-red-900/10 min-h-[80px] p-4 transition-all relative", (previewState === 'true') && "opacity-20 grayscale")}
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onDrop={handleDropFalse}
                >
                    <div className="absolute top-0 right-0 p-1"><button onClick={() => onUpdate(block.id, {})} className="text-red-300 hover:text-red-600"><Trash2 size={12}/></button></div>
                    <div className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-widest text-red-600/50 dark:text-red-400/50 font-mono select-none">OTHERWISE SHOW THIS:</div>
                    {(!block.elseChildren || block.elseChildren.length === 0) && <div className="border-2 border-dashed border-red-500/20 h-20 flex items-center justify-center text-red-600/40 text-xs font-mono uppercase tracking-wider">Drop Fallback Content Here</div>}
                    <div className="space-y-4 mt-4">
                        {block.elseChildren?.map((child, i) => (
                            <EditorBlock key={child.id} block={child} index={i} onUpdate={onUpdate} onDelete={onDelete} onSelect={onSelect} onDrop={onDrop} onDragStart={onDragStart} isSelected={false} allBlocks={allBlocks} parties={parties} formValues={{}} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
