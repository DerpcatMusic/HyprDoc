
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BlockType, DocBlock, FormValues, Party, DocumentSettings, Variable, Term } from '../types';
import { Plus, Trash, AlertCircle, RefreshCw, UploadCloud, X, CreditCard, Lock, Video, Eye, Eraser, ArrowRight, CheckCircle2, Navigation, ChevronRight, ChevronLeft, Flag, AlertTriangle, Phone, Image as ImageIcon, ArrowDown, FileText, Repeat, Trash2, Calculator } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button, Input, Card, Label, Switch, DatePickerTrigger, cn, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, Checkbox, Tooltip, TooltipTrigger, TooltipContent, Textarea } from './ui-components';
import { SignatureWidget } from './SignatureWidget';
import { computeDiff } from '../services/diff';
import { fetchExchangeRate, SUPPORTED_CURRENCIES } from '../services/currency';
import { LEGAL_DICTIONARY_DB } from '../services/glossary';
import { SafeFormula } from '../services/formula';

interface ViewerProps {
  blocks: DocBlock[];
  snapshot?: DocBlock[];
  parties?: Party[];
  variables?: Variable[];
  terms?: Term[];
  isPreview?: boolean;
  settings?: DocumentSettings;
  docHash?: string; // Passed from parent
}

const PartyWrapper: React.FC<{ children: React.ReactNode; assignedTo?: Party; locked?: boolean; lockedBy?: string; id?: string }> = ({ children, assignedTo, locked, lockedBy, id }) => {
    if (!assignedTo) return <div id={id} className="my-3 relative group">{children}</div>;
    
    return (
        <div id={id} className={cn("my-3 relative pl-4 border-l-4 transition-all group scroll-mt-32 rounded-none", locked && "opacity-40 pointer-events-none grayscale")} style={{ borderLeftColor: assignedTo.color }}>
            {children}
            {locked && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="bg-background/90 dark:bg-zinc-900/90 border border-muted p-2 rounded-none shadow-sm flex items-center gap-2 text-xs font-semibold text-muted-foreground backdrop-blur-sm uppercase tracking-wider font-mono">
                        <Lock size={12} /> Waiting for {lockedBy}
                    </div>
                </div>
            )}
        </div>
    )
};

const GlossaryTerm = React.memo(({ term, definition }: { term: string, definition: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <span 
            className="relative inline-block"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <span className="inline-block bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-1 rounded-none border-b-2 border-yellow-300 cursor-help hover:bg-yellow-200 transition-colors no-underline decoration-0">
                {term}
            </span>
            {isOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-popover-foreground bg-popover border-2 border-black dark:border-white rounded-none shadow-hypr z-[1000] font-mono dark:bg-zinc-900 dark:text-white">
                    <p className="font-bold mb-1 uppercase tracking-wider text-[10px] text-muted-foreground font-mono">Definition</p>
                    <p className="font-semibold mb-1 text-sm">"{term}"</p>
                    <p className="text-xs leading-relaxed">{definition}</p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black dark:border-t-white"></div>
                </div>
            )}
        </span>
    )
});

// --- CURRENCY WIDGET COMPONENT ---
const CurrencyWidget = ({ block, formValues, userPrefs, onPrefChange }: { block: DocBlock, formValues: FormValues, userPrefs: Record<string, string>, onPrefChange: (id: string, val: string) => void }) => {
      const [rate, setRate] = useState<number | null>(null);
      const [loading, setLoading] = useState(false);

      const baseAmount = useMemo(() => {
          if (block.currencySettings?.amountType === 'field' && block.currencySettings.sourceFieldId) {
                const sourceVal = formValues[block.currencySettings.sourceFieldId];
                return typeof sourceVal === 'number' ? sourceVal : parseFloat(sourceVal) || 0;
          }
          return block.currencySettings?.amount || 0;
      }, [block.currencySettings, formValues]);

      const targetCurrency = userPrefs[block.id] || block.currencySettings?.targetCurrency || 'EUR';
      const baseCurrency = block.currencySettings?.baseCurrency || 'USD';

      useEffect(() => {
          if (baseCurrency === targetCurrency) {
              setRate(1);
              return;
          }
          let mounted = true;
          setLoading(true);
          fetchExchangeRate(baseCurrency, targetCurrency).then(r => {
              if (mounted) {
                  setRate(r);
                  setLoading(false);
              }
          });
          return () => { mounted = false; };
      }, [baseCurrency, targetCurrency]);

      if (!block.currencySettings) return <div className="text-red-500 text-xs">Invalid Config</div>;

      const convertedAmount = rate !== null ? baseAmount * rate : 0;

      return (
            <div className="flex items-center gap-4 p-3 bg-muted/20 rounded-none border-2 border-black dark:border-zinc-700">
                <div className="flex-1">
                    <div className="text-2xl font-bold tracking-tighter font-mono">
                        {loading ? '...' : new Intl.NumberFormat('en-US', { style: 'currency', currency: targetCurrency }).format(convertedAmount)}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                        {loading ? 'Fetching live rates...' : `1 ${baseCurrency} = ${rate?.toFixed(4)} ${targetCurrency}`}
                    </div>
                </div>
                <div>
                    <select 
                        className="h-8 rounded-none border border-input bg-background px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-black dark:border-zinc-700"
                        value={targetCurrency}
                        onChange={(e) => onPrefChange(block.id, e.target.value)}
                    >
                        {SUPPORTED_CURRENCIES.map(c => (
                            <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                        ))}
                    </select>
                </div>
            </div>
      );
};

export const Viewer: React.FC<ViewerProps> = ({ blocks, snapshot, parties = [], variables = [], terms = [], isPreview = false, settings, docHash }) => {
  const [formValues, setFormValues] = useState<FormValues>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [userCurrencyPreferences, setUserCurrencyPreferences] = useState<Record<string, string>>({});
  const [simulatedPartyId, setSimulatedPartyId] = useState<string>(parties[0]?.id || 'p1');
  
  // Wizard State
  const [activeFieldIndex, setActiveFieldIndex] = useState<number>(-1);
  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // --- Glossary Logic ---
  const glossaryMap = useMemo(() => {
      const map = new Map<string, string>();
      LEGAL_DICTIONARY_DB.forEach(t => map.set(t.term.toLowerCase(), t.definition));
      terms.forEach(t => map.set(t.term.toLowerCase(), t.definition));
      return map;
  }, [terms]);

  const sortedGlossaryTerms = useMemo(() => {
       return Array.from(glossaryMap.keys()).sort((a: string, b: string) => b.length - a.length);
  }, [glossaryMap]);

  const glossaryRegex = useMemo(() => {
      if (sortedGlossaryTerms.length === 0) return null;
      return new RegExp(`\\b(${sortedGlossaryTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
  }, [sortedGlossaryTerms]);

  const MarkdownComponents = useMemo(() => ({
    p: ({node, ...props}: any) => {
        const content = props.children;
        if (typeof content === 'string' && glossaryRegex) {
                const parts = content.split(glossaryRegex);
                return (
                    <p className="mb-2">
                    {parts.map((part: string, i: number) => {
                        const lowerPart = part.toLowerCase();
                        if (glossaryMap.has(lowerPart)) {
                            return (
                                <GlossaryTerm key={i} term={part} definition={glossaryMap.get(lowerPart)!} />
                            );
                        }
                        return part;
                    })}
                    </p>
                );
        }
        return <p className="mb-2">{content}</p>;
    }
  }), [glossaryRegex, glossaryMap]);

  const renderTextWithGlossary = (text: string) => {
      if (!text) return null;
      return (
        <ReactMarkdown components={MarkdownComponents}>
            {text}
        </ReactMarkdown>
      );
  };

  // --- Formula Logic (Safe) ---
  const calculateBlockResult = (formula: string, prefix: string = '') => {
      // Create a context mapping variableNames to current values
      // We must handle scoping (repeater prefix)
      const context: Record<string, any> = {};
      
      blocks.forEach(b => {
          if (b.variableName) {
              const scopedKey = prefix + b.id;
              const globalKey = b.id;
              // Prefer scoped value if exists
              const val = formValues[scopedKey] !== undefined ? formValues[scopedKey] : formValues[globalKey];
              context[b.variableName] = val;
          }
      });
      
      // Also add 'flat' variable names for simple cases
      Object.keys(formValues).forEach(key => {
          // Try to map back ID to variableName if needed, but for now we rely on the block loop above
      });

      return SafeFormula.evaluate(formula, context);
  };

  const handleInputChange = (blockId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [blockId]: value }));
    if (validationErrors[blockId]) {
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[blockId];
            return newErrors;
        });
    }
  };
  
  const progress = useMemo(() => {
      const totalRequired = blocks.filter(b => b.required).length;
      if (totalRequired === 0) return 100;
      const filledRequired = blocks.filter(b => b.required && formValues[b.id]).length;
      return Math.round((filledRequired / totalRequired) * 100);
  }, [blocks, formValues]);

  const handleNextField = () => {
      const nextField = blocks.find((b, i) => i > activeFieldIndex && b.required && !formValues[b.id]);
      if (nextField) {
          const index = blocks.findIndex(b => b.id === nextField.id);
          setActiveFieldIndex(index);
          fieldRefs.current[nextField.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
           const firstEmpty = blocks.find(b => b.required && !formValues[b.id]);
           if (firstEmpty) {
                const index = blocks.findIndex(b => b.id === firstEmpty.id);
                setActiveFieldIndex(index);
                fieldRefs.current[firstEmpty.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
           }
      }
  };
  
  // Render Block with Recursive ID Prefixing for Repeaters
  const renderBlock = (block: DocBlock, index: number, idPrefix: string = '') => {
     const uniqueId = idPrefix + block.id;
     const isLocked = block.assignedToPartyId && block.assignedToPartyId !== simulatedPartyId;
     const assignedParty = parties.find(p => p.id === block.assignedToPartyId);
     const isActive = index === activeFieldIndex;

     let content;
     switch (block.type) {
         case BlockType.TEXT:
             content = (
                 <div className="prose dark:prose-invert max-w-none text-sm font-serif leading-7">
                     {renderTextWithGlossary(block.content || '')}
                 </div>
             );
             break;

         case BlockType.COLUMNS:
             content = (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {block.children?.map((col, colIndex) => (
                         <div key={col.id} className="flex flex-col gap-4">
                             {col.children?.map((childBlock, childIndex) => (
                                 <div key={childBlock.id}>{renderBlock(childBlock, -1, idPrefix)}</div>
                             ))}
                         </div>
                     ))}
                 </div>
             );
             break;

         case BlockType.COLUMN:
             return null; // Handled by COLUMNS

         case BlockType.REPEATER:
             const rowCount = (formValues[uniqueId] as number) || 1;
             content = (
                <div className="space-y-4 border-l-4 border-indigo-500/20 pl-4 py-2">
                    <Label className="text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2">
                        <Repeat size={14} /> {block.label || "Repeating Group"}
                    </Label>
                    
                    {Array.from({ length: rowCount }).map((_, rIndex) => (
                        <div key={rIndex} className="p-4 border-2 border-dashed border-indigo-200 dark:border-indigo-900 rounded-lg relative bg-indigo-50/20">
                            <div className="absolute top-2 right-2 text-[10px] font-mono text-indigo-400 font-bold uppercase">Item {rIndex + 1}</div>
                            {block.children?.map(child => (
                                <div key={child.id} className="mb-3 last:mb-0">
                                    {renderBlock(child, -1, `${uniqueId}_${rIndex}_`)}
                                </div>
                            ))}
                            {rowCount > 1 && (
                                <button 
                                    className="text-red-500 hover:text-red-700 text-xs mt-2 flex items-center gap-1"
                                    onClick={() => handleInputChange(uniqueId, rowCount - 1)}
                                >
                                    <Trash2 size={12}/> Remove Item
                                </button>
                            )}
                        </div>
                    ))}
                    
                    <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleInputChange(uniqueId, rowCount + 1)}
                        className="w-full border-dashed"
                    >
                        <Plus size={14} className="mr-2"/> Add Item
                    </Button>
                </div>
             );
             break;

         case BlockType.CONDITIONAL:
             // Evaluate Condition
             if (!block.condition || !block.children) return null;
             const { variableName, operator, value: triggerValue } = block.condition;
             
             // Find source block to check value
             const sourceBlock = blocks.find(b => b.variableName === variableName);
             if (!sourceBlock) return null; // Can't find trigger

             // Check scoped value first (if inside repeater), then global
             const scopedKey = idPrefix + sourceBlock.id;
             const globalKey = sourceBlock.id;
             const currentValue = formValues[scopedKey] !== undefined ? formValues[scopedKey] : formValues[globalKey];

             let isMatch = false;

             // Logic Engine
             switch (operator) {
                 case 'equals': isMatch = String(currentValue) == triggerValue; break;
                 case 'not_equals': isMatch = String(currentValue) != triggerValue; break;
                 case 'contains': isMatch = String(currentValue).includes(triggerValue); break;
                 case 'greater_than': isMatch = parseFloat(currentValue) > parseFloat(triggerValue); break;
                 case 'less_than': isMatch = parseFloat(currentValue) < parseFloat(triggerValue); break;
                 default: isMatch = String(currentValue) == triggerValue;
             }

             if (!isMatch) return null; // Don't render

             content = (
                 <div className="pl-4 border-l-2 border-rose-500/20 my-2 animate-in fade-in slide-in-from-top-2">
                     {block.children.map((child, i) => renderBlock(child, -1, idPrefix))}
                 </div>
             );
             break;

         case BlockType.INPUT:
             content = (
                 <Input 
                    value={formValues[uniqueId] || ''} 
                    onChange={(e) => handleInputChange(uniqueId, e.target.value)}
                    placeholder={block.placeholder || `Enter ${block.label?.toLowerCase()}...`}
                    disabled={isLocked}
                    className={cn(isActive && "ring-2 ring-primary ring-offset-2")}
                 />
             );
             break;
         
         case BlockType.LONG_TEXT:
             content = (
                 <Textarea 
                    value={formValues[uniqueId] || ''} 
                    onChange={(e) => handleInputChange(uniqueId, e.target.value)}
                    placeholder={block.placeholder || `Enter details...`}
                    disabled={isLocked}
                    className={cn(isActive && "ring-2 ring-primary ring-offset-2", "min-h-[100px]")}
                 />
             );
             break;

         case BlockType.NUMBER:
             content = (
                 <Input 
                    type="number"
                    value={formValues[uniqueId] || ''} 
                    onChange={(e) => handleInputChange(uniqueId, e.target.value)}
                    placeholder={block.placeholder || "0.00"}
                    min={block.min}
                    max={block.max}
                    step={block.step}
                    disabled={isLocked}
                    className={cn(isActive && "ring-2 ring-primary ring-offset-2")}
                 />
             );
             break;

         case BlockType.EMAIL:
             content = (
                 <Input 
                    value={formValues[uniqueId] || ''} 
                    onChange={(e) => handleInputChange(uniqueId, e.target.value)}
                    placeholder="user@example.com"
                    disabled={isLocked}
                    className={cn(isActive && "ring-2 ring-primary ring-offset-2")}
                    type="email"
                    onBlur={(e) => {
                        if (e.target.value) {
                             const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value);
                             if (!isValid) setValidationErrors(p => ({...p, [uniqueId]: "Invalid email format"}));
                        }
                    }}
                 />
             );
             break;

         case BlockType.SELECT:
             content = (
                 <select
                    className={cn(
                        "flex h-10 w-full rounded-none border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono dark:bg-zinc-900 dark:border-zinc-700",
                        isActive && "ring-2 ring-primary ring-offset-2"
                    )}
                    value={formValues[uniqueId] || ''}
                    onChange={(e) => handleInputChange(uniqueId, e.target.value)}
                    disabled={isLocked}
                 >
                     <option value="" disabled>Select an option...</option>
                     {block.options?.map((opt, i) => (
                         <option key={i} value={opt}>{opt}</option>
                     ))}
                 </select>
             );
             break;

         case BlockType.RADIO:
             content = (
                 <div className="space-y-2">
                     {block.options?.map((opt, i) => (
                         <div key={i} className="flex items-center gap-2">
                             <input 
                                type="radio"
                                id={`${uniqueId}-${i}`}
                                name={uniqueId}
                                value={opt}
                                checked={formValues[uniqueId] === opt}
                                onChange={() => handleInputChange(uniqueId, opt)}
                                disabled={isLocked}
                                className="h-4 w-4 border-gray-300 text-primary focus:ring-primary dark:bg-zinc-900 dark:border-zinc-700"
                             />
                             <Label htmlFor={`${uniqueId}-${i}`} className="font-normal cursor-pointer">{opt}</Label>
                         </div>
                     ))}
                 </div>
             );
             break;

         case BlockType.DATE:
             content = (
                 <div className="flex gap-2">
                    <div className="relative flex-1">
                         <input 
                             type="date" 
                             className={cn(
                                 "flex h-10 w-full rounded-none border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono uppercase dark:bg-zinc-900 dark:border-zinc-700",
                                 isActive && "ring-2 ring-primary ring-offset-2"
                             )}
                             value={formValues[uniqueId] || ''}
                             onChange={(e) => handleInputChange(uniqueId, e.target.value)}
                             disabled={isLocked}
                         />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleInputChange(uniqueId, new Date().toISOString().split('T')[0])} disabled={isLocked}>Today</Button>
                 </div>
             );
             break;

         case BlockType.CHECKBOX:
             if (block.options && block.options.length > 0) {
                 content = (
                     <div className="space-y-2">
                         {block.options.map((opt, i) => {
                             const isChecked = (formValues[uniqueId] || []).includes(opt);
                             return (
                                 <div key={i} className="flex items-center gap-2">
                                     <Checkbox 
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                            let currentVals = (formValues[uniqueId] || []) as string[];
                                            if (block.allowMultiple === false) {
                                                handleInputChange(uniqueId, checked ? [opt] : []);
                                            } else {
                                                if (checked) handleInputChange(uniqueId, [...currentVals, opt]);
                                                else handleInputChange(uniqueId, currentVals.filter(v => v !== opt));
                                            }
                                        }}
                                        disabled={isLocked}
                                     />
                                     <Label className="font-normal cursor-pointer" onClick={() => {
                                         if(isLocked) return;
                                          let currentVals = (formValues[uniqueId] || []) as string[];
                                           if (block.allowMultiple === false) {
                                                handleInputChange(uniqueId, !currentVals.includes(opt) ? [opt] : []);
                                            } else {
                                                if (!currentVals.includes(opt)) handleInputChange(uniqueId, [...currentVals, opt]);
                                                else handleInputChange(uniqueId, currentVals.filter(v => v !== opt));
                                            }
                                     }}>{opt}</Label>
                                 </div>
                             )
                         })}
                     </div>
                 )
             } else {
                 content = (
                     <div className="flex items-center gap-2 p-2 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-none hover:bg-accent/50 transition-colors">
                         <Checkbox 
                            checked={!!formValues[uniqueId]} 
                            onCheckedChange={(c) => handleInputChange(uniqueId, c)}
                            disabled={isLocked}
                         />
                         <Label className="cursor-pointer" onClick={() => !isLocked && handleInputChange(uniqueId, !formValues[uniqueId])}>
                             {block.label || "I agree"}
                         </Label>
                     </div>
                 )
             }
             break;
        
        case BlockType.SIGNATURE:
            content = (
                <div className={cn(isLocked ? "pointer-events-none opacity-50" : "")}>
                    <SignatureWidget 
                        initialValue={formValues[uniqueId]}
                        onSign={(val) => handleInputChange(uniqueId, val)}
                        signatureId={block.signatureId}
                        signedAt={block.signedAt}
                    />
                </div>
            );
            break;

        case BlockType.IMAGE:
            content = (
                <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                    {block.src ? (
                        <img 
                            src={block.src} 
                            alt={block.altText || "Document Image"} 
                            className="w-full h-auto object-cover max-h-[500px]"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-900 text-muted-foreground">
                            <ImageIcon size={32} className="mb-2 opacity-50" />
                            <p className="text-xs">No image source configured</p>
                        </div>
                    )}
                </div>
            );
            break;

        case BlockType.VIDEO:
            content = (
                <div className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 aspect-video bg-black relative">
                    {block.videoUrl ? (
                        <iframe 
                            src={block.videoUrl.replace('watch?v=', 'embed/')} 
                            className="w-full h-full"
                            allowFullScreen
                            title="Video Player"
                        />
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50">
                            <Video size={32} className="mb-2" />
                            <p className="text-xs">No video URL configured</p>
                        </div>
                    )}
                </div>
            );
            break;

        case BlockType.FILE_UPLOAD:
             content = (
                <div className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-6 rounded-lg text-center hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer relative">
                    <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        accept={block.acceptedFileTypes}
                        onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) handleInputChange(uniqueId, file.name); // Mock upload
                        }}
                        disabled={isLocked}
                    />
                    <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">{formValues[uniqueId] ? `Selected: ${formValues[uniqueId]}` : "Click to upload file"}</p>
                    <p className="text-xs text-muted-foreground mt-1">{block.acceptedFileTypes || "Any file type"}</p>
                </div>
             );
             break;

         case BlockType.SECTION_BREAK:
             content = (
                <div className="py-4">
                     <hr className="border-t-2 border-zinc-200 dark:border-zinc-700" />
                </div>
             );
             break;
        
        case BlockType.HTML:
             content = (
                <div 
                    className="prose dark:prose-invert max-w-none text-sm p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded"
                    dangerouslySetInnerHTML={{ __html: block.content || '<p>Empty HTML Block</p>' }}
                />
             );
             break;

        case BlockType.FORMULA:
             const result = calculateBlockResult(block.formula || '', idPrefix);
             content = (
                <div className="flex items-center justify-between p-3 bg-zinc-100 dark:bg-zinc-800 border-l-4 border-purple-500 rounded-r shadow-sm">
                    <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2"><Calculator size={12}/> Calculated Result</span>
                    <span className="text-lg font-mono font-bold">{typeof result === 'number' ? result.toLocaleString() : result}</span>
                </div>
             );
             break;

        case BlockType.CURRENCY:
            content = <CurrencyWidget block={block} formValues={formValues} userPrefs={userCurrencyPreferences} onPrefChange={(id, v) => setUserCurrencyPreferences(p => ({...p, [id]: v}))} />;
            break;

        case BlockType.PAYMENT:
             content = (
                 <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded shadow-sm text-center">
                     <p className="text-sm font-medium mb-2">Payment Request</p>
                     <div className="text-2xl font-bold mb-4">
                         {new Intl.NumberFormat('en-US', { style: 'currency', currency: block.paymentSettings?.currency || 'USD' }).format(block.paymentSettings?.amount || 0)}
                     </div>
                     <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-mono">
                         <CreditCard size={16} className="mr-2" /> Pay Now
                     </Button>
                 </div>
             );
             break;

         default:
             content = <div className="text-red-500 text-xs p-2 border border-red-200 bg-red-50">Unsupported block type: {block.type}</div>;
     }

     return (
        <PartyWrapper id={uniqueId} assignedTo={assignedParty} locked={isLocked} lockedBy={assignedParty?.name}>
             <div 
                ref={(el) => { fieldRefs.current[uniqueId] = el; }}
                className={cn(
                    "mb-4 transition-all duration-500",
                    isActive && "scale-[1.02]"
                )}
             >
                {block.label && block.type !== BlockType.CHECKBOX && block.type !== BlockType.COLUMNS && block.type !== BlockType.CONDITIONAL && block.type !== BlockType.SECTION_BREAK && block.type !== BlockType.REPEATER && (
                    <Label className="mb-1.5 block text-muted-foreground flex justify-between text-xs uppercase font-bold tracking-wider">
                        {block.label} 
                        {block.required && <span className="text-red-500 ml-1">*</span>}
                        {validationErrors[uniqueId] && <span className="text-red-500 text-[10px] normal-case ml-auto">{validationErrors[uniqueId]}</span>}
                    </Label>
                )}
                {content}
             </div>
        </PartyWrapper>
     )
  };

  return (
    <div className="max-w-5xl mx-auto p-8 pb-32 relative min-h-screen bg-muted/10 bg-grid-pattern pt-24">
        {isPreview && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-full max-w-[850px] px-4">
                <Card className="p-2 bg-white dark:bg-black border-2 border-black dark:border-white shadow-sm inline-block pointer-events-auto">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black font-mono uppercase tracking-wide text-black dark:text-white">Viewing as:</span>
                        <div className="flex gap-1">
                            {parties.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSimulatedPartyId(p.id)}
                                    className={cn(
                                        "px-2 py-0.5 text-[10px] font-bold font-mono uppercase border border-black dark:border-white transition-all",
                                        simulatedPartyId === p.id 
                                            ? "bg-primary text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)] -translate-y-[1px]" 
                                            : "bg-transparent hover:bg-black/5 dark:hover:bg-white/10 dark:text-white"
                                    )}
                                >
                                    {p.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        )}

        <div className="max-w-[850px] mx-auto bg-white dark:bg-black border-2 border-black dark:border-zinc-800 shadow-hypr dark:shadow-hypr-dark relative transition-all p-16 min-h-[1100px]">
             {/* Security Badge */}
             <div className="absolute top-4 right-4 flex items-center gap-2">
                 <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-2 py-1 flex items-center gap-2" title="SHA-256 Document Hash">
                     <Lock size={10} className="text-green-600" />
                     <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{docHash ? docHash.substring(0, 16) + '...' : 'CALCULATING...'}</span>
                 </div>
             </div>

            <div className="mb-12 text-center border-b-2 border-black/10 dark:border-white/10 pb-6">
                {settings?.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-12 mx-auto mb-4 object-contain" />}
                <h1 className="text-3xl font-black tracking-tight mb-2 font-mono uppercase text-foreground dark:text-white">{blocks[0]?.content ? '' : 'Untitled Document'}</h1>
                 <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground font-mono">
                    {parties.map(p => (
                        <span key={p.id} className="flex items-center gap-1.5">
                            <span className="w-2 h-2 border border-black dark:border-white" style={{ backgroundColor: p.color }}/>
                            {p.name}
                        </span>
                    ))}
                </div>
            </div>

            <div className="space-y-6">
                {blocks.map((block, i) => renderBlock(block, i))}
            </div>
        </div>

        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
            <div className="bg-black dark:bg-zinc-900 text-white p-3 border-2 border-white/20 shadow-2xl flex items-center justify-between gap-4 pr-4 pl-5">
                 <div className="flex flex-col flex-1">
                     <span className="text-[9px] font-bold font-mono uppercase tracking-widest mb-1 text-primary">Progress</span>
                     <div className="h-1.5 w-full bg-white/20 overflow-hidden">
                         <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
                     </div>
                 </div>
                 
                 <div className="flex items-center gap-2">
                     {activeFieldIndex === -1 ? (
                         <Button 
                            size="sm" 
                            className="bg-primary text-black hover:bg-white font-bold font-mono h-8"
                            onClick={handleNextField}
                         >
                             START <ArrowRight size={14} className="ml-1.5" />
                         </Button>
                     ) : (
                         <>
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                className="text-white hover:bg-white/20 w-8 h-8 rounded-none"
                                onClick={() => {
                                    const prev = activeFieldIndex - 1;
                                    if (prev >= 0) {
                                        setActiveFieldIndex(prev);
                                        fieldRefs.current[blocks[prev].id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                    }
                                }}
                            >
                                <ChevronLeft size={16} />
                            </Button>
                            <Button 
                                size="sm" 
                                className={cn(
                                    "font-mono font-bold h-8 rounded-none border-white",
                                    progress === 100 ? "bg-green-500 hover:bg-green-600 text-white" : "bg-primary text-black hover:bg-white"
                                )}
                                onClick={handleNextField}
                            >
                                {progress === 100 ? "FINISH" : "NEXT"} 
                                {progress === 100 ? <CheckCircle2 size={14} className="ml-1.5"/> : <ChevronRight size={14} className="ml-1.5" />}
                            </Button>
                         </>
                     )}
                 </div>
            </div>
        </div>
    </div>
  );
};
