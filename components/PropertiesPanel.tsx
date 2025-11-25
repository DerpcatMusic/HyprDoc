
import React, { useState } from 'react';
import { DocBlock, BlockType, Party } from '../types';
import { Button, Input, Label, Switch, cn, Textarea } from './ui-components';
import { X, Trash2, Plus, GripVertical, HelpCircle, Calculator, Video, CreditCard } from 'lucide-react';

interface PropertiesPanelProps {
    block: DocBlock | null;
    parties: Party[];
    onUpdate: (id: string, updates: Partial<DocBlock>) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ block, parties, onUpdate, onDelete, onClose }) => {
    const [newOption, setNewOption] = useState('');

    if (!block) {
        return (
            <div className="w-80 border-l bg-background p-6 flex flex-col items-center justify-center text-center text-muted-foreground z-20 dark:border-zinc-800">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                    <GripVertical size={24} className="opacity-50" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">Properties</h3>
                <p className="text-sm">Select a block on the canvas to edit its settings.</p>
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
        const currentOptions = block.options || [];
        const newOptions = [...currentOptions];
        newOptions.splice(index, 1);
        onUpdate(block.id, { options: newOptions });
    };

    const getHelpText = (type: BlockType) => {
        switch (type) {
            case BlockType.INPUT: return "Collect short text answers like names or titles.";
            case BlockType.SIGNATURE: return "A legally binding e-signature field.";
            case BlockType.REPEATER: return "Allows the signer to add multiple rows of data.";
            case BlockType.CONDITIONAL: return "Show or hide content based on other field values.";
            case BlockType.FILE_UPLOAD: return "Request documents or attachments from the signer.";
            case BlockType.FORMULA: return "Calculate values automatically. Use {{variable}} syntax.";
            case BlockType.PAYMENT: return "Accept credit card payments directly in the document.";
            default: return "Configure the properties for this block.";
        }
    };

    return (
        <div className="w-80 border-l bg-background/80 backdrop-blur-md flex flex-col z-20 shadow-xl md:shadow-none absolute md:relative right-0 h-full dark:border-zinc-800 animate-in slide-in-from-right duration-300">
            <div className="h-16 border-b flex items-center justify-between px-6 bg-muted/5 dark:border-zinc-800">
                <span className="font-semibold text-sm">Edit {block.type === BlockType.INPUT ? 'Field' : block.type}</span>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}><X size={16} /></Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* ID / Variable Name */}
                <div className="space-y-3 p-3 bg-muted/30 rounded-lg text-xs font-mono text-muted-foreground break-all">
                    <div className="flex justify-between items-center">
                        <span>Variable ID</span>
                        <span title="Used for logic and integrations" className="cursor-help">
                            <HelpCircle size={12} />
                        </span>
                    </div>
                    <div className="font-bold text-foreground">{block.variableName}</div>
                </div>

                {/* Common Props */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Label / Question</Label>
                        <Input 
                            value={block.label || ''} 
                            onChange={(e) => onUpdate(block.id, { label: e.target.value })} 
                            placeholder="e.g. What is your name?"
                        />
                    </div>
                    
                    {(block.type === BlockType.INPUT || block.type === BlockType.LONG_TEXT || block.type === BlockType.EMAIL) && (
                         <div className="space-y-2">
                            <Label>Placeholder</Label>
                            <Input 
                                value={block.placeholder || ''} 
                                onChange={(e) => onUpdate(block.id, { placeholder: e.target.value })} 
                                placeholder="e.g. John Doe"
                            />
                        </div>
                    )}
                </div>

                {/* Formula Settings */}
                {block.type === BlockType.FORMULA && (
                    <div className="space-y-3 pt-4 border-t dark:border-zinc-800">
                        <Label className="flex items-center gap-2"><Calculator size={14} /> Equation</Label>
                        <Textarea 
                            className="font-mono text-xs"
                            value={block.formula || ''}
                            onChange={(e) => onUpdate(block.id, { formula: e.target.value })}
                            placeholder="{{price}} * {{quantity}}"
                        />
                        <p className="text-[10px] text-muted-foreground">Use <code>{'{{variable_name}}'}</code> to reference other fields.</p>
                    </div>
                )}

                {/* Video Settings */}
                {block.type === BlockType.VIDEO && (
                    <div className="space-y-3 pt-4 border-t dark:border-zinc-800">
                        <Label className="flex items-center gap-2"><Video size={14} /> Video URL</Label>
                        <Input 
                            value={block.videoUrl || ''}
                            onChange={(e) => onUpdate(block.id, { videoUrl: e.target.value })}
                            placeholder="https://youtube.com/..."
                        />
                    </div>
                )}

                {/* Payment Settings */}
                {block.type === BlockType.PAYMENT && (
                     <div className="space-y-3 pt-4 border-t dark:border-zinc-800">
                        <Label className="flex items-center gap-2"><CreditCard size={14} /> Payment Config</Label>
                        <div className="flex flex-col gap-2">
                            <select 
                                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                                value={block.paymentSettings?.amountType || 'fixed'}
                                onChange={(e) => onUpdate(block.id, { paymentSettings: { ...block.paymentSettings!, amountType: e.target.value as any } })}
                            >
                                <option value="fixed">Fixed Amount</option>
                                <option value="variable">Dynamic (Formula)</option>
                            </select>

                            {block.paymentSettings?.amountType === 'fixed' ? (
                                <div className="relative">
                                     <span className="absolute left-3 top-2 text-muted-foreground text-sm">$</span>
                                     <Input 
                                        type="number"
                                        className="pl-6"
                                        value={block.paymentSettings?.amount || 0}
                                        onChange={(e) => onUpdate(block.id, { paymentSettings: { ...block.paymentSettings!, amount: parseFloat(e.target.value) } })}
                                     />
                                </div>
                            ) : (
                                <Input 
                                    placeholder="Variable name (e.g. total_cost)"
                                    value={block.paymentSettings?.variableName || ''}
                                    onChange={(e) => onUpdate(block.id, { paymentSettings: { ...block.paymentSettings!, variableName: e.target.value } })}
                                />
                            )}
                        </div>
                     </div>
                )}

                {/* Options Editor for Select/Radio */}
                {(block.type === BlockType.SELECT || block.type === BlockType.RADIO || block.type === BlockType.CHECKBOX) && (
                    <div className="space-y-3 pt-4 border-t dark:border-zinc-800">
                        <Label>Options</Label>
                        <div className="space-y-2">
                            {block.options?.map((opt, i) => (
                                <div key={i} className="flex gap-2">
                                    <Input value={opt} onChange={(e) => {
                                        const newOpts = [...(block.options || [])];
                                        newOpts[i] = e.target.value;
                                        onUpdate(block.id, { options: newOpts });
                                    }} />
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveOption(i)} className="text-muted-foreground hover:text-destructive">
                                        <Trash2 size={14} />
                                    </Button>
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

                {/* Party Assignment */}
                <div className="space-y-3 pt-4 border-t dark:border-zinc-800">
                    <Label>Assigned Party</Label>
                    <select 
                        className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                        value={block.assignedToPartyId || ''}
                        onChange={(e) => onUpdate(block.id, { assignedToPartyId: e.target.value || undefined })}
                    >
                        <option value="">Everyone / Unassigned</option>
                        {parties.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                {/* Toggles */}
                <div className="space-y-4 pt-4 border-t dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                        <Label>Required Field</Label>
                        <Switch checked={block.required || false} onCheckedChange={(c) => onUpdate(block.id, { required: c })} />
                    </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-xs dark:bg-blue-900/20 dark:text-blue-300">
                    <p className="font-bold mb-1 flex items-center gap-1"><HelpCircle size={12}/> Info</p>
                    {getHelpText(block.type)}
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
