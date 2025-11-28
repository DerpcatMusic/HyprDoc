
import React, { useState } from 'react';
import { DocBlock, BlockType, Party } from '../types';
import { Input, Label, Textarea, cn, Button } from './ui-components';
import { X, HelpCircle, DollarSign, ChevronRight, ChevronLeft, Settings, Image as ImageIcon, Video, Calculator, FileUp, Repeat } from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '../services/currency';
import { useDocument } from '../context/DocumentContext';

interface PropertiesPanelProps {
    block: DocBlock | null;
    parties: Party[];
    onUpdate: (id: string, updates: Partial<DocBlock>) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ block, parties, onUpdate, onDelete, onClose }) => {
    const [newOption, setNewOption] = useState('');
    const { doc } = useDocument();

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

    const numericBlocks = doc.blocks.filter(b => b.type === BlockType.NUMBER && block && b.id !== block.id);

    return (
        <div 
            className={cn(
                "h-full z-40 transition-all duration-300 ease-in-out bg-white dark:bg-zinc-950 border-l-2 border-black dark:border-zinc-700 shadow-2xl overflow-hidden",
                block ? "w-80" : "w-0 border-l-0"
            )}
        >
            {block && (
                <div className="flex flex-col h-full min-w-[320px]">
                    <div className="h-12 border-b-2 border-black dark:border-zinc-700 flex items-center justify-between px-4 bg-muted/10 dark:bg-zinc-900">
                        <span className="font-bold font-mono text-xs uppercase flex-1 truncate text-foreground dark:text-white flex items-center gap-2">
                           <Settings size={14} /> {block.type.replace('_', ' ')}
                        </span>
                        <button 
                            className="h-6 w-6 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors" 
                            onClick={onClose}
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                         {/* Variable ID */}
                        <div className="space-y-1 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-none border border-zinc-200 dark:border-zinc-700 text-xs font-mono text-muted-foreground break-all">
                            <div className="flex justify-between items-center mb-1">
                                <span className="font-bold text-black dark:text-white">ID</span>
                                <div title="Use this key in formulas or integrations" className="cursor-help">
                                    <HelpCircle size={12} />
                                </div>
                            </div>
                            <div className="text-foreground dark:text-zinc-400 select-all">{block.variableName}</div>
                        </div>

                        {/* Basic Props */}
                        <div className="space-y-4">
                            {/* Generic Label - used by almost all types except purely visual ones */}
                            {block.type !== BlockType.TEXT && block.type !== BlockType.HTML && block.type !== BlockType.SECTION_BREAK && (
                                <div className="space-y-2">
                                    <Label>Label</Label>
                                    <Input 
                                        className="dark:bg-black dark:border-zinc-700 font-sans" 
                                        value={block.label || ''} 
                                        onChange={(e) => onUpdate(block.id, { label: e.target.value })} 
                                    />
                                </div>
                            )}

                            {/* REPEATER HINT */}
                            {block.type === BlockType.REPEATER && (
                                <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs rounded dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300">
                                    <div className="font-bold flex items-center gap-2 mb-1"><Repeat size={12}/> Repeater Group</div>
                                    <p className="opacity-80">Drag and drop other fields INSIDE this block in the editor to define the repeating row template.</p>
                                </div>
                            )}
                            
                            {/* Placeholder */}
                            {(block.type === BlockType.INPUT || block.type === BlockType.LONG_TEXT || block.type === BlockType.EMAIL || block.type === BlockType.NUMBER) && (
                                <div className="space-y-2">
                                    <Label>Placeholder</Label>
                                    <Input 
                                        className="dark:bg-black dark:border-zinc-700 font-sans" 
                                        value={block.placeholder || ''} 
                                        onChange={(e) => onUpdate(block.id, { placeholder: e.target.value })} 
                                    />
                                </div>
                            )}

                             {/* Numeric Constraints */}
                            {block.type === BlockType.NUMBER && (
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Min</Label>
                                        <Input type="number" className="h-7 text-xs" value={block.min ?? ''} onChange={(e) => onUpdate(block.id, { min: parseFloat(e.target.value) })} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Max</Label>
                                        <Input type="number" className="h-7 text-xs" value={block.max ?? ''} onChange={(e) => onUpdate(block.id, { max: parseFloat(e.target.value) })} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[10px]">Step</Label>
                                        <Input type="number" className="h-7 text-xs" value={block.step ?? ''} onChange={(e) => onUpdate(block.id, { step: parseFloat(e.target.value) })} />
                                    </div>
                                </div>
                            )}

                             {/* Media Config */}
                            {block.type === BlockType.IMAGE && (
                                <div className="space-y-4 pt-2 border-t border-dashed border-zinc-200">
                                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><ImageIcon size={12}/> Image Source</h4>
                                    <div className="space-y-2">
                                        <Label>Image URL</Label>
                                        <Input value={block.src || ''} onChange={(e) => onUpdate(block.id, { src: e.target.value })} placeholder="https://..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Alt Text</Label>
                                        <Input value={block.altText || ''} onChange={(e) => onUpdate(block.id, { altText: e.target.value })} placeholder="Description..." />
                                    </div>
                                </div>
                            )}
                            
                            {block.type === BlockType.VIDEO && (
                                <div className="space-y-4 pt-2 border-t border-dashed border-zinc-200">
                                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><Video size={12}/> Video Config</h4>
                                    <div className="space-y-2">
                                        <Label>Video URL</Label>
                                        <Input value={block.videoUrl || ''} onChange={(e) => onUpdate(block.id, { videoUrl: e.target.value })} placeholder="YouTube or Vimeo URL" />
                                    </div>
                                </div>
                            )}

                             {/* File Upload Config */}
                            {block.type === BlockType.FILE_UPLOAD && (
                                <div className="space-y-4 pt-2 border-t border-dashed border-zinc-200">
                                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><FileUp size={12}/> Constraints</h4>
                                    <div className="space-y-2">
                                        <Label>Accepted Types</Label>
                                        <Input value={block.acceptedFileTypes || ''} onChange={(e) => onUpdate(block.id, { acceptedFileTypes: e.target.value })} placeholder=".pdf, .jpg, image/*" />
                                        <p className="text-[10px] text-muted-foreground">Comma separated (e.g. .pdf, .docx)</p>
                                    </div>
                                </div>
                            )}

                            {/* HTML Content */}
                            {block.type === BlockType.HTML && (
                                <div className="space-y-2">
                                    <Label>Raw HTML Content</Label>
                                    <Textarea 
                                        className="font-mono text-xs min-h-[200px]" 
                                        value={block.content || ''} 
                                        onChange={(e) => onUpdate(block.id, { content: e.target.value })} 
                                        placeholder="<div>...</div>"
                                    />
                                </div>
                            )}

                             {/* Formula Config */}
                            {block.type === BlockType.FORMULA && (
                                <div className="space-y-4 pt-2 border-t border-dashed border-zinc-200">
                                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><Calculator size={12}/> Logic</h4>
                                    <div className="space-y-2">
                                        <Label>Expression</Label>
                                        <Input value={block.formula || ''} onChange={(e) => onUpdate(block.id, { formula: e.target.value })} placeholder="{{qty}} * {{price}}" className="font-mono" />
                                        <div className="bg-zinc-50 p-2 text-[10px] text-muted-foreground rounded border">
                                            Use <span className="font-mono text-black">{'{{variableName}}'}</span> to reference other fields.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Checkbox Config */}
                            {block.type === BlockType.CHECKBOX && block.options && block.options.length > 0 && (
                                <div className="flex items-center justify-between pt-2 border-t border-black/10 dark:border-zinc-800 mt-2">
                                    <Label>Allow Multiple</Label>
                                    <button 
                                        role="switch"
                                        aria-checked={block.allowMultiple !== false}
                                        onClick={() => onUpdate(block.id, { allowMultiple: block.allowMultiple === false ? true : false })}
                                        className={cn(
                                            "w-10 h-5 border-2 border-black dark:border-zinc-500 transition-colors relative",
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
                            <div className="space-y-3 pt-4 border-t-2 border-black/10 dark:border-zinc-800">
                                <Label>Options</Label>
                                <div className="space-y-2">
                                    {block.options?.map((opt, i) => (
                                        <div key={i} className="flex items-center gap-2 group">
                                            <div className="flex-1 text-xs font-mono bg-white dark:bg-black px-2 py-1.5 border border-black/10 dark:border-zinc-700">{opt}</div>
                                            <button className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleRemoveOption(i)}><X size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Input 
                                        value={newOption} 
                                        onChange={(e) => setNewOption(e.target.value)} 
                                        placeholder="Add option..." 
                                        className="dark:bg-black dark:border-zinc-700"
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddOption()}
                                    />
                                    <button className="bg-black text-white hover:bg-primary hover:text-black px-3 text-xs font-bold font-mono uppercase border-2 border-transparent hover:border-black dark:bg-white dark:text-black dark:hover:bg-primary" onClick={handleAddOption}>Add</button>
                                </div>
                            </div>
                        )}

                         {/* Currency Settings */}
                        {block.type === BlockType.CURRENCY && (
                            <div className="space-y-4 pt-4 border-t-2 border-black/10 dark:border-zinc-800">
                                <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2 font-mono">
                                    <DollarSign size={12} /> Conversion Logic
                                </h4>
                                
                                <div className="grid grid-cols-2 gap-0 border-2 border-black dark:border-zinc-700">
                                    <button 
                                        className={cn("text-[10px] font-bold uppercase py-1.5 transition-all", block.currencySettings?.amountType === 'fixed' ? 'bg-primary text-black' : 'bg-transparent hover:bg-black/5 dark:text-white')}
                                        onClick={() => onUpdate(block.id, { currencySettings: { ...block.currencySettings!, amountType: 'fixed' } })}
                                    >
                                        Fixed
                                    </button>
                                    <button 
                                        className={cn("text-[10px] font-bold uppercase py-1.5 border-l-2 border-black dark:border-zinc-700 transition-all", block.currencySettings?.amountType === 'field' ? 'bg-primary text-black' : 'bg-transparent hover:bg-black/5 dark:text-white')}
                                        onClick={() => onUpdate(block.id, { currencySettings: { ...block.currencySettings!, amountType: 'field' } })}
                                    >
                                        From Field
                                    </button>
                                </div>

                                {block.currencySettings?.amountType === 'fixed' ? (
                                    <div className="space-y-2">
                                        <Label>Base Amount</Label>
                                        <Input 
                                            type="number" 
                                            value={block.currencySettings.amount || 0} 
                                            className="dark:bg-black dark:border-zinc-700"
                                            onChange={(e) => onUpdate(block.id, { currencySettings: { ...block.currencySettings!, amount: parseFloat(e.target.value) } })}
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <Label>Source Field</Label>
                                        <select 
                                            className="w-full h-9 rounded-none border-2 border-black bg-transparent px-3 py-1 text-xs font-mono focus:ring-0 dark:border-zinc-700 dark:bg-black dark:text-white"
                                            value={block.currencySettings?.sourceFieldId || ''}
                                            onChange={(e) => onUpdate(block.id, { currencySettings: { ...block.currencySettings!, sourceFieldId: e.target.value } })}
                                        >
                                            <option value="">Select Field...</option>
                                            {numericBlocks.map(b => (
                                                <option key={b.id} value={b.id}>{b.label || b.variableName}</option>
                                            ))}
                                        </select>
                                        {numericBlocks.length === 0 && <p className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">No number fields available.</p>}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Base Currency</Label>
                                    <select 
                                        className="w-full h-9 rounded-none border-2 border-black bg-transparent px-3 py-1 text-xs font-mono focus:ring-0 dark:border-zinc-700 dark:bg-black dark:text-white"
                                        value={block.currencySettings?.baseCurrency || 'USD'}
                                        onChange={(e) => onUpdate(block.id, { currencySettings: { ...block.currencySettings!, baseCurrency: e.target.value } })}
                                    >
                                        {SUPPORTED_CURRENCIES.map(c => (
                                            <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Target Currency</Label>
                                    <select 
                                        className="w-full h-9 rounded-none border-2 border-black bg-transparent px-3 py-1 text-xs font-mono focus:ring-0 dark:border-zinc-700 dark:bg-black dark:text-white"
                                        value={block.currencySettings?.targetCurrency || 'EUR'}
                                        onChange={(e) => onUpdate(block.id, { currencySettings: { ...block.currencySettings!, targetCurrency: e.target.value } })}
                                    >
                                        {SUPPORTED_CURRENCIES.map(c => (
                                            <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="pt-6 border-t-2 border-black/10 dark:border-zinc-800">
                            <button 
                                className="w-full py-3 text-xs font-bold uppercase text-red-600 border-2 border-red-200 hover:bg-red-50 hover:border-red-600 transition-colors dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20 font-mono"
                                onClick={() => onDelete(block.id)}
                            >
                                Delete Block
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
