
import React, { useState } from 'react';
import { DocBlock, BlockType, Party, Variable } from '../types';
import { Input, Label, Textarea, cn, Button, Badge } from './ui-components';
import { X, HelpCircle, DollarSign, ChevronRight, ChevronLeft, Settings, Image as ImageIcon, Video, Calculator, FileUp, Repeat, Plus, Braces, Trash2, Users, CheckCircle2, AlertOctagon, CalendarRange, ArrowRightLeft } from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../services/currency';
import { useDocument } from '../context/DocumentContext';

interface PropertiesPanelProps {
    block: DocBlock | null;
    parties: Party[];
    variables?: Variable[];
    onUpdate: (id: string, updates: Partial<DocBlock>) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
    onUpdateVariables?: (vars: Variable[]) => void;
}

const SectionHeader = ({ title, number }: { title: string, number: string }) => (
    <div className="flex items-center justify-between bg-black text-white dark:bg-white dark:text-black px-3 py-1.5 mb-4 border-b border-black dark:border-white">
        <span className="text-[10px] font-black font-mono uppercase tracking-widest">{title}</span>
        <span className="text-[9px] font-mono font-bold opacity-50">{number}</span>
    </div>
);

// Blocks that cannot be assigned to a party or marked as required
const NON_ASSIGNABLE_BLOCKS = [
    BlockType.TEXT,
    BlockType.SECTION_BREAK,
    BlockType.COLUMNS,
    BlockType.COLUMN,
    BlockType.SPACER,
    BlockType.ALERT,
    BlockType.QUOTE,
    BlockType.HTML,
    BlockType.CURRENCY,
    BlockType.FORMULA
];

const getAllNumericBlocks = (blocks: DocBlock[]): DocBlock[] => {
    let numeric: DocBlock[] = [];
    blocks.forEach(b => {
        if (b.type === BlockType.NUMBER) numeric.push(b);
        if (b.children) numeric = [...numeric, ...getAllNumericBlocks(b.children)];
        if (b.elseChildren) numeric = [...numeric, ...getAllNumericBlocks(b.elseChildren)];
    });
    return numeric;
};

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ block, parties, variables = [], onUpdate, onDelete, onClose, onUpdateVariables }) => {
    const [newOption, setNewOption] = useState('');
    const [newVarKey, setNewVarKey] = useState('');
    const [newVarVal, setNewVarVal] = useState('');
    const { doc, setDoc } = useDocument();

    const handleAddOption = () => {
        if (!block || !newOption.trim()) return;
        const currentOptions = block.options || [];
        onUpdate(block.id, { options: [...currentOptions, newOption.trim()] });
        setNewOption('');
    };

    const handleRemoveOption = (index: number) => {
        if (!block) return;
        const newOptions = [...(block.options || [])];
        newOptions.splice(index, 1);
        onUpdate(block.id, { options: newOptions });
    };

    const handleAddVariable = () => {
        if(!newVarKey || !onUpdateVariables) return;
        const newVar = { id: crypto.randomUUID(), key: newVarKey.replace(/\s+/g, ''), value: newVarVal, label: newVarKey };
        onUpdateVariables([...(doc.variables || []), newVar]);
        setNewVarKey('');
        setNewVarVal('');
    }

    const handleDeleteVariable = (id: string) => {
        if(!onUpdateVariables) return;
        onUpdateVariables((doc.variables || []).filter(v => v.id !== id));
    }

    // Recursively find all numeric blocks for Formula and Currency inputs
    const numericBlocks = getAllNumericBlocks(doc.blocks).filter(b => block && b.id !== block.id);

    return (
        <div 
            className={cn(
                "h-full z-40 transition-all duration-300 ease-in-out bg-white dark:bg-black border-l-2 border-black dark:border-white shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.1)] overflow-y-auto overflow-x-hidden flex flex-col",
                "w-[340px]"
            )}
        >
            {/* NO BLOCK SELECTED - SHOW GLOBAL VARS */}
            {!block && (
                <div className="flex flex-col h-full min-w-[340px]">
                     <div className="h-14 flex items-center justify-between px-4 border-b-2 border-black dark:border-white bg-white dark:bg-black">
                         <span className="font-bold font-mono text-xs uppercase tracking-widest flex items-center gap-2">
                             <Braces size={14} /> Global Variables
                         </span>
                         <button onClick={onClose} className="hover:bg-black hover:text-white p-1 transition-colors"><X size={16} /></button>
                     </div>
                    
                    <div className="p-0 space-y-8 flex-1 overflow-y-auto">
                        <div className="p-4 bg-muted/10 border-b border-black/10">
                             <div className="text-[10px] font-mono leading-relaxed opacity-70">
                                Define global placeholders like <b>{`{{ClientName}}`}</b>. Use them in any Text Block to auto-fill data.
                            </div>
                        </div>

                        <div className="px-4">
                            <SectionHeader title="System Variables" number="01" />
                            <div className="space-y-4">
                                {doc.variables?.map(v => (
                                    <div key={v.id} className="group p-3 border-2 border-black dark:border-white flex flex-col gap-2 relative hover:shadow-sharp transition-all bg-white dark:bg-black">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold font-mono text-xs text-primary">{`{{${v.key}}}`}</span>
                                            <button onClick={() => handleDeleteVariable(v.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive hover:text-white p-1"><Trash2 size={12}/></button>
                                        </div>
                                        <Input 
                                            className="h-7 text-xs bg-transparent border-0 border-b border-black/20 focus:border-black rounded-none px-0" 
                                            value={v.value} 
                                            onChange={(e) => {
                                                const newVars = doc.variables.map(vv => vv.id === v.id ? { ...vv, value: e.target.value } : vv);
                                                if(onUpdateVariables) onUpdateVariables(newVars);
                                            }} 
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="px-4 pb-8">
                            <SectionHeader title="New Definition" number="02" />
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <Input 
                                    className="h-8 text-xs font-mono" 
                                    placeholder="Key" 
                                    value={newVarKey}
                                    onChange={(e) => setNewVarKey(e.target.value)}
                                />
                                <Input 
                                    className="h-8 text-xs" 
                                    placeholder="Value" 
                                    value={newVarVal}
                                    onChange={(e) => setNewVarVal(e.target.value)}
                                />
                            </div>
                            <Button size="sm" onClick={handleAddVariable} disabled={!newVarKey} className="w-full">Create Variable</Button>
                        </div>
                    </div>
                </div>
            )}

            {block && (
                <div className="flex flex-col h-full min-w-[340px]">
                     {/* Header */}
                    <div className="h-14 flex items-center justify-between px-4 border-b-2 border-black dark:border-white bg-white dark:bg-black sticky top-0 z-20">
                         <div className="flex items-center gap-2">
                             <div className="w-6 h-6 bg-black text-white flex items-center justify-center font-bold text-[10px] font-mono">
                                 {block.type.substring(0,2).toUpperCase()}
                             </div>
                             <div className="flex flex-col">
                                 <span className="font-black font-mono text-xs uppercase tracking-widest leading-none">
                                    {block.type.replace('_', ' ')}
                                 </span>
                                 <span className="text-[9px] font-mono text-muted-foreground">ID: {block.id.slice(0,6)}</span>
                             </div>
                         </div>
                        <button 
                            className="h-8 w-8 flex items-center justify-center hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors border border-transparent hover:border-current" 
                            onClick={onClose}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        
                         {/* ASSIGNMENT & LOGIC SECTION - Hidden for Layout blocks */}
                        {!NON_ASSIGNABLE_BLOCKS.includes(block.type) && (
                        <div className="p-6 pb-2">
                            <SectionHeader title="Responsibility" number="00" />
                            
                            {/* Party Assignment */}
                            <div className="space-y-3 mb-6">
                                <Label className="text-xs">Assigned Party</Label>
                                <div className="grid grid-cols-1 gap-2">
                                    {parties.map(party => {
                                        const isAssigned = block.assignedToPartyId === party.id;
                                        return (
                                            <button
                                                key={party.id}
                                                onClick={() => {
                                                    if (isAssigned) {
                                                        onUpdate(block.id, {});
                                                    } else {
                                                        onUpdate(block.id, { assignedToPartyId: party.id });
                                                    }
                                                }}
                                                className={cn(
                                                    "flex items-center justify-between p-2 border-2 transition-all text-xs font-mono font-bold uppercase",
                                                    isAssigned 
                                                        ? "bg-white dark:bg-black shadow-sharp translate-x-1" 
                                                        : "bg-transparent border-transparent hover:border-black/10 text-muted-foreground grayscale"
                                                )}
                                                style={{ borderColor: isAssigned ? party.color : undefined }}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-none" style={{ backgroundColor: party.color }} />
                                                    <span style={{ color: isAssigned ? party.color : undefined }}>{party.name}</span>
                                                </div>
                                                {isAssigned && <CheckCircle2 size={14} style={{ color: party.color }} />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Required Toggle */}
                            <div className="flex items-center justify-between border-2 border-black dark:border-white p-3 bg-muted/5">
                                <div className="flex items-center gap-2">
                                    <AlertOctagon size={16} className={block.required ? "text-red-600" : "text-muted-foreground"} />
                                    <span className="text-xs font-bold font-mono uppercase">Mandatory Field</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => onUpdate(block.id, { required: !block.required })}
                                        className={cn(
                                            "w-10 h-5 border-2 border-black dark:border-white relative transition-all",
                                            block.required ? "bg-red-600" : "bg-transparent"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute top-0 bottom-0 w-1/2 bg-black dark:bg-white transition-all",
                                            block.required ? "right-0 bg-white" : "left-0"
                                        )} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        )}

                        <div className="p-6">
                            <SectionHeader title="Configuration" number="01" />

                             {/* Ref ID */}
                             <div className="mb-6 group">
                                <Label>Variable Reference ID</Label>
                                <div className="relative">
                                    <Input 
                                        className="font-mono text-xs pl-7 border-black/20 focus:border-black bg-transparent"
                                        value={block.variableName}
                                        onChange={(e) => onUpdate(block.id, { variableName: e.target.value.replace(/\s+/g, '_') })}
                                    />
                                    <span className="absolute left-2 top-2.5 text-muted-foreground font-mono text-[10px]">$</span>
                                </div>
                                <div className="text-[9px] text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    Unique identifier for logic and formulas.
                                </div>
                            </div>

                            {/* Basic Props */}
                            <div className="space-y-6">
                                {/* Generic Label */}
                                {block.type !== BlockType.TEXT && block.type !== BlockType.HTML && block.type !== BlockType.SECTION_BREAK && (
                                    <div className="space-y-2">
                                        <Label>Field Label</Label>
                                        <Input 
                                            className="font-sans font-medium" 
                                            value={block.label || ''} 
                                            onChange={(e) => onUpdate(block.id, { label: e.target.value })} 
                                        />
                                    </div>
                                )}

                                {/* REPEATER HINT */}
                                {block.type === BlockType.REPEATER && (
                                    <div className="p-4 border-l-4 border-black dark:border-white bg-muted/10 text-xs font-mono">
                                        <p>Drag other fields INSIDE this module to define the loop template.</p>
                                    </div>
                                )}
                                
                                {/* Placeholder */}
                                {(block.type === BlockType.INPUT || block.type === BlockType.LONG_TEXT || block.type === BlockType.EMAIL || block.type === BlockType.NUMBER) && (
                                    <div className="space-y-2">
                                        <Label>Placeholder</Label>
                                        <Input 
                                            className="font-sans text-muted-foreground" 
                                            value={block.placeholder || ''} 
                                            onChange={(e) => onUpdate(block.id, { placeholder: e.target.value })} 
                                        />
                                    </div>
                                )}

                                 {/* Numeric Constraints */}
                                {block.type === BlockType.NUMBER && (
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="space-y-1">
                                            <Label>Min</Label>
                                            <Input type="number" className="h-8 text-xs" value={block.min ?? ''} onChange={(e) => onUpdate(block.id, { min: parseFloat(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Max</Label>
                                            <Input type="number" className="h-8 text-xs" value={block.max ?? ''} onChange={(e) => onUpdate(block.id, { max: parseFloat(e.target.value) })} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Step</Label>
                                            <Input type="number" className="h-8 text-xs" value={block.step ?? ''} onChange={(e) => onUpdate(block.id, { step: parseFloat(e.target.value) })} />
                                        </div>
                                    </div>
                                )}

                                {/* Date Range Mode Toggle */}
                                {block.type === BlockType.DATE && (
                                    <div className="flex items-center justify-between pt-4 border-t border-dashed border-black/20 dark:border-white/20">
                                        <div className="flex items-center gap-2">
                                            <CalendarRange size={16} />
                                            <Label>Range Selection Mode</Label>
                                        </div>
                                        <button 
                                            role="switch"
                                            aria-checked={!!block.isDateRange}
                                            onClick={() => onUpdate(block.id, { isDateRange: !block.isDateRange })}
                                            className={cn(
                                                "w-10 h-6 border-2 border-black dark:border-white transition-colors relative",
                                                block.isDateRange ? "bg-primary" : "bg-transparent"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-0 bottom-0 w-1/2 bg-black dark:bg-white transition-transform",
                                                block.isDateRange ? "right-0" : "left-0"
                                            )} />
                                        </button>
                                    </div>
                                )}

                                 {/* Media Config */}
                                {block.type === BlockType.IMAGE && (
                                    <div className="space-y-4 pt-4 border-t border-dashed border-black/20 dark:border-white/20">
                                        <div className="space-y-2">
                                            <Label>Source URL</Label>
                                            <Input value={block.src || ''} onChange={(e) => onUpdate(block.id, { src: e.target.value })} placeholder="https://..." />
                                        </div>
                                    </div>
                                )}
                                
                                {block.type === BlockType.VIDEO && (
                                    <div className="space-y-4 pt-4 border-t border-dashed border-black/20 dark:border-white/20">
                                        <div className="space-y-2">
                                            <Label>Video URL</Label>
                                            <Input value={block.videoUrl || ''} onChange={(e) => onUpdate(block.id, { videoUrl: e.target.value })} placeholder="YouTube or Vimeo URL" />
                                        </div>
                                    </div>
                                )}

                                 {/* Currency Config */}
                                {block.type === BlockType.CURRENCY && (
                                    <div className="space-y-4 pt-4 border-t border-dashed border-black/20 dark:border-white/20">
                                        <SectionHeader title="Currency Exchange" number="FX" />
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label>From (Base)</Label>
                                                <select 
                                                    className="w-full text-xs h-8 border border-input bg-transparent"
                                                    value={block.currencySettings?.baseCurrency || 'USD'}
                                                    onChange={(e) => onUpdate(block.id, { 
                                                        currencySettings: { ...block.currencySettings!, baseCurrency: e.target.value } 
                                                    })}
                                                >
                                                    {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <Label>To (Default)</Label>
                                                <select 
                                                    className="w-full text-xs h-8 border border-input bg-transparent"
                                                    value={block.currencySettings?.targetCurrency || 'EUR'}
                                                    onChange={(e) => onUpdate(block.id, { 
                                                        currencySettings: { ...block.currencySettings!, targetCurrency: e.target.value } 
                                                    })}
                                                >
                                                    {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Amount Source</Label>
                                            <div className="flex bg-muted/20 p-1 border rounded-sm">
                                                <button
                                                    className={cn(
                                                        "flex-1 text-[10px] font-bold uppercase py-1 transition-colors",
                                                        block.currencySettings?.amountType !== 'field' ? "bg-black text-white dark:bg-white dark:text-black shadow-sm" : "text-muted-foreground hover:bg-black/5"
                                                    )}
                                                    onClick={() => onUpdate(block.id, { currencySettings: { ...block.currencySettings!, amountType: 'fixed' } })}
                                                >
                                                    Fixed Value
                                                </button>
                                                <button
                                                    className={cn(
                                                        "flex-1 text-[10px] font-bold uppercase py-1 transition-colors",
                                                        block.currencySettings?.amountType === 'field' ? "bg-black text-white dark:bg-white dark:text-black shadow-sm" : "text-muted-foreground hover:bg-black/5"
                                                    )}
                                                    onClick={() => onUpdate(block.id, { currencySettings: { ...block.currencySettings!, amountType: 'field' } })}
                                                >
                                                    From Field
                                                </button>
                                            </div>
                                        </div>

                                        {block.currencySettings?.amountType !== 'field' ? (
                                             <div className="space-y-2 animate-in fade-in">
                                                <Label>Fixed Amount</Label>
                                                <div className="relative">
                                                    <Input 
                                                        type="number" 
                                                        className="pl-8"
                                                        value={block.currencySettings?.amount ?? 0}
                                                        onChange={(e) => onUpdate(block.id, { currencySettings: { ...block.currencySettings!, amount: parseFloat(e.target.value) } })}
                                                    />
                                                    <DollarSign size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2 animate-in fade-in">
                                                <Label>Linked Number Field</Label>
                                                <select 
                                                    className="w-full text-xs h-8 border border-input bg-transparent"
                                                    value={block.currencySettings?.sourceFieldId || ''}
                                                    onChange={(e) => onUpdate(block.id, { currencySettings: { ...block.currencySettings!, sourceFieldId: e.target.value } })}
                                                >
                                                    <option value="" disabled>Select a number field...</option>
                                                    {numericBlocks.map(b => (
                                                        <option key={b.id} value={b.id}>
                                                            {b.label || 'Untitled'} ({b.variableName})
                                                        </option>
                                                    ))}
                                                </select>
                                                {numericBlocks.length === 0 && <p className="text-[10px] text-destructive bg-red-50 p-2 mt-1">No number fields available in document.</p>}
                                            </div>
                                        )}
                                    </div>
                                )}

                                 {/* Formula Config */}
                                {block.type === BlockType.FORMULA && (
                                    <div className="space-y-4 pt-4 border-t border-dashed border-black/20 dark:border-white/20">
                                        <div className="space-y-2">
                                            <Label>Expression</Label>
                                            <Input value={block.formula || ''} onChange={(e) => onUpdate(block.id, { formula: e.target.value })} placeholder="qty * price" className="font-mono bg-muted/10" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Available Variables</Label>
                                            <div className="flex flex-wrap gap-2">
                                                {numericBlocks.map(b => (
                                                    <Badge 
                                                        key={b.id} 
                                                        variant="outline" 
                                                        className="cursor-pointer hover:bg-black hover:text-white"
                                                        onClick={() => onUpdate(block.id, { formula: (block.formula || '') + ' ' + b.variableName + ' ' })}
                                                    >
                                                        {b.variableName}
                                                    </Badge>
                                                ))}
                                                {numericBlocks.length === 0 && <span className="text-[10px] italic opacity-50 font-mono">No numeric fields.</span>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Checkbox Config */}
                                {block.type === BlockType.CHECKBOX && block.options && block.options.length > 0 && (
                                    <div className="flex items-center justify-between pt-4 border-t border-dashed border-black/20 dark:border-white/20">
                                        <Label>Allow Multiple Selections</Label>
                                        <button 
                                            role="switch"
                                            aria-checked={block.allowMultiple !== false}
                                            onClick={() => onUpdate(block.id, { allowMultiple: block.allowMultiple === false ? true : false })}
                                            className={cn(
                                                "w-10 h-6 border-2 border-black dark:border-white transition-colors relative",
                                                block.allowMultiple !== false ? "bg-primary" : "bg-transparent"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-0 bottom-0 w-1/2 bg-black dark:bg-white transition-transform",
                                                block.allowMultiple !== false ? "right-0" : "left-0"
                                            )} />
                                        </button>
                                    </div>
                                )}
                            </div>

                             {/* Options Editor */}
                            {(block.type === BlockType.SELECT || block.type === BlockType.RADIO || block.type === BlockType.CHECKBOX) && (
                                <div className="space-y-4 pt-6 mt-6 border-t-2 border-black dark:border-white">
                                    <Label>Options List</Label>
                                    <div className="space-y-2">
                                        {block.options?.map((opt, i) => (
                                            <div key={i} className="flex items-center gap-2 group">
                                                <div className="flex-1 text-xs font-mono bg-muted/10 px-3 py-2 border border-black/10 dark:border-white/20">{opt}</div>
                                                <button className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveOption(i)}><X size={14} /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <Input 
                                            value={newOption} 
                                            onChange={(e) => setNewOption(e.target.value)} 
                                            placeholder="Add new option..." 
                                            className="text-xs"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                                        />
                                        <Button size="sm" onClick={handleAddOption}>Add</Button>
                                    </div>
                                </div>
                            )}

                            <div className="pt-12 pb-12">
                                <Button 
                                    variant="destructive"
                                    className="w-full flex items-center justify-center gap-2"
                                    onClick={() => onDelete(block.id)}
                                >
                                    <Trash2 size={14} /> Remove Module
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
