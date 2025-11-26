import React, { useState } from 'react';
import { DocBlock, BlockType, Party } from '../types';
import { Button, Input, Label, Switch, Combobox, Textarea } from './ui-components';
import { X, Trash2, Plus, GripVertical, HelpCircle, Calculator, Video, CreditCard, DollarSign, List, Image as ImageIcon, Code as CodeIcon, ChevronRight, ChevronLeft, Settings } from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../services/currency';

interface PropertiesPanelProps {
    block: DocBlock | null;
    parties: Party[];
    onUpdate: (id: string, updates: Partial<DocBlock>) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ block, parties, onUpdate, onDelete, onClose }) => {
    const [newOption, setNewOption] = useState('');
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedColId, setExpandedColId] = useState<string | null>(null);

    // Render logic for collapsed state
    if (isCollapsed) {
        return (
            <div className="w-12 border-l bg-background flex flex-col items-center py-4 z-20 absolute right-0 h-full dark:border-zinc-800">
                <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(false)} title="Expand Properties">
                    <ChevronLeft size={16} />
                </Button>
                <div className="mt-4 flex flex-col gap-4 text-xs font-bold text-muted-foreground" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
                    <span>Properties</span>
                </div>
            </div>
        )
    }

    // EMPTY STATE (No Selection)
    if (!block) {
        return (
            <div className="w-80 border-l bg-background/95 backdrop-blur-md flex flex-col z-20 shadow-xl md:shadow-none absolute md:relative right-0 h-full dark:border-zinc-800 animate-in slide-in-from-right duration-300">
                <div className="h-16 border-b flex items-center justify-between px-4 bg-muted/5 dark:border-zinc-800">
                     <span className="font-semibold text-sm flex-1 truncate text-muted-foreground">Properties</span>
                     <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(true)} className="ml-auto"><ChevronRight size={16} /></Button>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground space-y-4">
                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center">
                        <Settings size={32} className="opacity-20" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-foreground">No Selection</h3>
                        <p className="text-xs">Click on any block in the canvas to edit its properties.</p>
                    </div>
                </div>
            </div>
        );
    }

    const handleAddOption = () => {
        if (!newOption.trim()) return;
        const currentOptions = block.options || [];
        onUpdate(block.id, { options: [...currentOptions, newOption.trim()] });
        setNewOption('');
    };

    const handleRemoveOption = (index: number) => {
        const newOptions = [...(block.options || [])];
        newOptions.splice(index, 1);
        onUpdate(block.id, { options: newOptions });
    };

    const handleAddRepeaterColumn = () => {
        const columns = block.repeaterFields || [];
        const newCol: DocBlock = {
            id: crypto.randomUUID(),
            type: BlockType.INPUT,
            label: `Column ${columns.length + 1}`,
            variableName: `col_${columns.length + 1}`
        };
        onUpdate(block.id, { repeaterFields: [...columns, newCol] });
    };

    const handleRemoveRepeaterColumn = (colId: string) => {
        const columns = block.repeaterFields || [];
        onUpdate(block.id, { repeaterFields: columns.filter(c => c.id !== colId) });
    };

    const updateRepeaterColumn = (colId: string, updates: Partial<DocBlock>) => {
        const columns = block.repeaterFields || [];
        onUpdate(block.id, { repeaterFields: columns.map(c => c.id === colId ? { ...c, ...updates } : c) });
    };

    const addRepeaterColumnOption = (colId: string, option: string) => {
        if (!option.trim()) return;
        const columns = block.repeaterFields || [];
        const col = columns.find(c => c.id === colId);
        if (col) {
            updateRepeaterColumn(colId, { options: [...(col.options || []), option.trim()] });
        }
    }
    
    const removeRepeaterColumnOption = (colId: string, index: number) => {
        const columns = block.repeaterFields || [];
        const col = columns.find(c => c.id === colId);
        if (col && col.options) {
             const newOpts = [...col.options];
             newOpts.splice(index, 1);
             updateRepeaterColumn(colId, { options: newOpts });
        }
    }


    return (
        <div className="w-80 border-l bg-background/95 backdrop-blur-md flex flex-col z-20 shadow-xl md:shadow-none absolute md:relative right-0 h-full dark:border-zinc-800 animate-in slide-in-from-right duration-300">
            <div className="h-16 border-b flex items-center justify-between px-4 bg-muted/5 dark:border-zinc-800">
                <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(true)} className="mr-2"><ChevronRight size={16} /></Button>
                <span className="font-semibold text-sm flex-1 truncate">Edit {block.type.replace('_', ' ')}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={onClose}><X size={16} /></Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Variable ID */}
                <div className="space-y-1 p-3 bg-muted/30 rounded-lg text-xs font-mono text-muted-foreground break-all border dark:border-zinc-800">
                    <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold">Variable Key</span>
                        <div title="Use this key in formulas or integrations" className="cursor-help">
                            <HelpCircle size={12} />
                        </div>
                    </div>
                    <div className="text-foreground">{block.variableName}</div>
                </div>

                {/* Basic Props */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Label</Label>
                        <Input value={block.label || ''} onChange={(e) => onUpdate(block.id, { label: e.target.value })} />
                    </div>
                    
                    {(block.type === BlockType.INPUT || block.type === BlockType.LONG_TEXT || block.type === BlockType.EMAIL || block.type === BlockType.NUMBER) && (
                         <div className="space-y-2">
                            <Label>Placeholder</Label>
                            <Input value={block.placeholder || ''} onChange={(e) => onUpdate(block.id, { placeholder: e.target.value })} />
                        </div>
                    )}
                </div>

                {/* Formula Config */}
                {block.type === BlockType.FORMULA && (
                    <div className="space-y-4 pt-4 border-t dark:border-zinc-800">
                        <Label className="flex items-center gap-2"><Calculator size={14}/> Formula Expression</Label>
                        <Input 
                            value={block.formula || ''}
                            onChange={(e) => onUpdate(block.id, { formula: e.target.value })}
                            placeholder="{{qty}} * {{price}}"
                            className="font-mono text-xs"
                        />
                        <p className="text-[10px] text-muted-foreground">Use {'{{variableName}}'} to reference other fields.</p>
                    </div>
                )}

                {/* Video Config */}
                {block.type === BlockType.VIDEO && (
                     <div className="space-y-4 pt-4 border-t dark:border-zinc-800">
                        <Label className="flex items-center gap-2"><Video size={14}/> Video URL</Label>
                        <Input 
                            value={block.videoUrl || ''}
                            onChange={(e) => onUpdate(block.id, { videoUrl: e.target.value })}
                            placeholder="https://youtube.com/watch?v=..."
                        />
                        <p className="text-[10px] text-muted-foreground">Supports YouTube, Vimeo, Loom.</p>
                    </div>
                )}

                {/* Repeater Config */}
                {block.type === BlockType.REPEATER && (
                    <div className="space-y-4 pt-4 border-t dark:border-zinc-800">
                        <Label className="flex items-center gap-2"><List size={14} /> Repeater Configuration</Label>
                        
                         <div className="flex items-center justify-between">
                             <Label className="text-xs font-normal">Enable Totals</Label>
                             {/* Mock logic for now */}
                             <Switch checked={false} onCheckedChange={() => {}} disabled title="Coming soon"/>
                         </div>

                        <div className="space-y-3">
                            {block.repeaterFields?.map((col, i) => (
                                <div key={col.id} className="p-3 bg-card border rounded-md space-y-2 dark:border-zinc-800">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-muted-foreground">Col {i+1}</span>
                                        <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => handleRemoveRepeaterColumn(col.id)}><X size={12}/></Button>
                                    </div>
                                    <Input 
                                        placeholder="Column Header" 
                                        value={col.label} 
                                        onChange={e => updateRepeaterColumn(col.id, { label: e.target.value })}
                                        className="h-8 text-xs font-bold"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                        <select 
                                            className="w-full h-8 text-xs bg-transparent border rounded px-2 dark:border-zinc-800 focus:ring-1"
                                            value={col.type}
                                            onChange={e => updateRepeaterColumn(col.id, { type: e.target.value as BlockType })}
                                        >
                                            <option value={BlockType.INPUT}>Text</option>
                                            <option value={BlockType.NUMBER}>Number</option>
                                            <option value={BlockType.EMAIL}>Email</option>
                                            <option value={BlockType.DATE}>Date</option>
                                            <option value={BlockType.SELECT}>Dropdown</option>
                                        </select>
                                        <div className="text-[10px] font-mono text-muted-foreground flex items-center bg-muted/20 px-1 rounded truncate">
                                            {col.variableName}
                                        </div>
                                    </div>
                                    
                                    {/* Sub Options for Select */}
                                    {col.type === BlockType.SELECT && (
                                        <div className="mt-2 pl-2 border-l-2 border-primary/20">
                                            <Button 
                                                variant="link" 
                                                size="xs" 
                                                className="h-auto p-0 text-[10px]"
                                                onClick={() => setExpandedColId(expandedColId === col.id ? null : col.id)}
                                            >
                                                {expandedColId === col.id ? 'Hide Options' : `Edit Options (${col.options?.length || 0})`}
                                            </Button>
                                            
                                            {expandedColId === col.id && (
                                                <div className="mt-2 space-y-2 animate-in fade-in zoom-in-95 duration-200">
                                                    {col.options?.map((opt, idx) => (
                                                        <div key={idx} className="flex gap-1">
                                                            <Input value={opt} className="h-6 text-[10px]" readOnly />
                                                            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeRepeaterColumnOption(col.id, idx)}><X size={10}/></Button>
                                                        </div>
                                                    ))}
                                                    <div className="flex gap-1">
                                                        <Input 
                                                            placeholder="New option" 
                                                            className="h-6 text-[10px]"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    addRepeaterColumnOption(col.id, e.currentTarget.value);
                                                                    e.currentTarget.value = '';
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <Button size="sm" variant="outline" className="w-full border-dashed" onClick={handleAddRepeaterColumn}>
                                <Plus size={14} className="mr-2"/> Add Column
                            </Button>
                        </div>
                    </div>
                )}

                {/* Image Config */}
                {block.type === BlockType.IMAGE && (
                     <div className="space-y-3 pt-4 border-t dark:border-zinc-800">
                        <Label className="flex items-center gap-2"><ImageIcon size={14} /> Image Source</Label>
                        <Input 
                            value={block.content || ''}
                            onChange={(e) => onUpdate(block.id, { content: e.target.value })}
                            placeholder="https://example.com/image.png"
                        />
                    </div>
                )}

                {/* HTML Config */}
                {block.type === BlockType.HTML && (
                     <div className="space-y-3 pt-4 border-t dark:border-zinc-800">
                        <Label className="flex items-center gap-2"><CodeIcon size={14} /> HTML Content</Label>
                        <Textarea 
                            className="font-mono text-xs min-h-[150px]"
                            value={block.content || ''}
                            onChange={(e) => onUpdate(block.id, { content: e.target.value })}
                            placeholder="<div>Your HTML here</div>"
                        />
                    </div>
                )}

                {/* Currency Config */}
                {block.type === BlockType.CURRENCY && (
                    <div className="space-y-4 pt-4 border-t dark:border-zinc-800">
                        <Label className="flex items-center gap-2"><DollarSign size={14} /> Currency Setup</Label>
                        
                        <div className="space-y-2">
                            <Label className="text-xs">Base Currency</Label>
                            <Combobox 
                                options={SUPPORTED_CURRENCIES.map(c => ({ label: `${c.code} - ${c.label}`, value: c.code }))}
                                value={block.currencySettings?.baseCurrency || 'USD'}
                                onChange={(val) => onUpdate(block.id, { currencySettings: { ...block.currencySettings, baseCurrency: val } as any })}
                            />
                        </div>

                         <div className="space-y-2">
                            <Label className="text-xs">Target Currency</Label>
                             <Combobox 
                                options={SUPPORTED_CURRENCIES.map(c => ({ label: `${c.code} - ${c.label}`, value: c.code }))}
                                value={block.currencySettings?.targetCurrency || 'EUR'}
                                onChange={(val) => onUpdate(block.id, { currencySettings: { ...block.currencySettings, targetCurrency: val } as any })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs">Amount</Label>
                             <Input 
                                type="number"
                                value={block.currencySettings?.amount || 1000}
                                onChange={(e) => onUpdate(block.id, { currencySettings: { ...block.currencySettings, amount: parseFloat(e.target.value) } as any })}
                            />
                        </div>
                    </div>
                )}

                {/* Options (Radio/Select/Checkbox) */}
                {(block.type === BlockType.SELECT || block.type === BlockType.RADIO || block.type === BlockType.CHECKBOX) && (
                    <div className="space-y-3 pt-4 border-t dark:border-zinc-800">
                        <Label>Options {block.type === BlockType.CHECKBOX && "(Multiple Selection)"}</Label>
                        <div className="space-y-2">
                            {block.options?.map((opt, i) => (
                                <div key={i} className="flex gap-2">
                                    <Input value={opt} onChange={(e) => {
                                        const newOpts = [...(block.options || [])];
                                        newOpts[i] = e.target.value;
                                        onUpdate(block.id, { options: newOpts });
                                    }} />
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(i)}><Trash2 size={14} /></Button>
                                </div>
                            ))}
                            <div className="flex gap-2">
                                <Input 
                                    value={newOption} 
                                    onChange={(e) => setNewOption(e.target.value)} 
                                    placeholder="Add option..." 
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                                />
                                <Button size="icon" variant="secondary" onClick={handleAddOption}><Plus size={16} /></Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Party */}
                <div className="space-y-3 pt-4 border-t dark:border-zinc-800">
                    <Label>Assigned To</Label>
                    <select 
                        className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm dark:border-zinc-800"
                        value={block.assignedToPartyId || ''}
                        onChange={(e) => onUpdate(block.id, { assignedToPartyId: e.target.value || undefined })}
                    >
                        <option value="">Everyone</option>
                        {parties.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex items-center justify-between pt-4 border-t dark:border-zinc-800">
                    <Label>Required</Label>
                    <Switch checked={block.required || false} onCheckedChange={(c) => onUpdate(block.id, { required: c })} />
                </div>

                <div className="pt-6 mt-auto">
                    <Button variant="destructive" className="w-full gap-2" onClick={() => onDelete(block.id)}>
                        <Trash2 size={16} /> Delete Block
                    </Button>
                </div>
            </div>
        </div>
    );
};