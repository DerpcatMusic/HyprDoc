
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BlockType, DocBlock, FormValues, Party, DocumentSettings, Variable, Term } from '../types';
import { Plus, Trash, AlertCircle, RefreshCw, UploadCloud, X, CreditCard, Lock, Video, Eye, Eraser, ArrowRight, CheckCircle2, Navigation, ChevronRight, ChevronLeft, Flag, AlertTriangle, Phone, Image as ImageIcon, ArrowDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button, Input, Card, Label, Switch, DatePickerTrigger, cn, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, Checkbox, Tooltip, TooltipTrigger, TooltipContent } from './ui-components';
import { SignatureWidget } from './SignatureWidget';
import { computeDiff } from '../services/diff';
import { fetchExchangeRate, SUPPORTED_CURRENCIES } from '../services/currency';
import { LEGAL_DICTIONARY_DB } from '../services/glossary';

interface ViewerProps {
  blocks: DocBlock[];
  snapshot?: DocBlock[];
  parties?: Party[];
  variables?: Variable[];
  terms?: Term[];
  isPreview?: boolean;
  settings?: DocumentSettings;
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

// Component for specific glossary term to handle hover state individually
const GlossaryTerm = ({ term, definition }: { term: string, definition: string }) => {
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
}

export const Viewer: React.FC<ViewerProps> = ({ blocks, snapshot, parties = [], variables = [], terms = [], isPreview = false, settings }) => {
  const [formValues, setFormValues] = useState<FormValues>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({});
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
       return Array.from(glossaryMap.keys()).sort((a, b) => b.length - a.length);
  }, [glossaryMap]);

  const renderTextWithGlossary = (text: string) => {
      if (!text) return null;
      
      // Markdown Components to handle glossary in markdown context
      const MarkdownComponents = {
        p: ({node, ...props}) => {
            // We process the children text for glossary terms if it's a string
            const content = props.children;
            if (typeof content === 'string' && sortedGlossaryTerms.length > 0) {
                 const pattern = new RegExp(`\\b(${sortedGlossaryTerms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
                 const parts = content.split(pattern);
                 return (
                     <p className="mb-2">
                        {parts.map((part, i) => {
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
      }

      return (
        <ReactMarkdown components={MarkdownComponents}>
            {text}
        </ReactMarkdown>
      );
  };

  // --- Smart Currency Logic ---
  const getCurrencyValue = (block: DocBlock) => {
      if (block.type !== BlockType.CURRENCY || !block.currencySettings) return null;
      
      let baseAmount = 0;
      if (block.currencySettings.amountType === 'field' && block.currencySettings.sourceFieldId) {
          const sourceVal = formValues[block.currencySettings.sourceFieldId];
          baseAmount = typeof sourceVal === 'number' ? sourceVal : parseFloat(sourceVal) || 0;
      } else {
          baseAmount = block.currencySettings.amount || 0;
      }

      const targetCurrency = userCurrencyPreferences[block.id] || block.currencySettings.targetCurrency;
      const baseCurrency = block.currencySettings.baseCurrency;
      
      // Check if rate exists
      const rateKey = `${baseCurrency}-${targetCurrency}`;
      const rate = currencyRates[rateKey];

      // Fetch rate if missing
      useEffect(() => {
          if (rate === undefined && baseCurrency && targetCurrency) {
              fetchExchangeRate(baseCurrency, targetCurrency).then(r => {
                  if(r !== null) setCurrencyRates(prev => ({ ...prev, [rateKey]: r }));
              });
          }
      }, [baseCurrency, targetCurrency, rateKey]);

      if (rate === undefined) return { amount: baseAmount, loading: true, targetCurrency };
      
      return {
          amount: baseAmount * rate,
          loading: false,
          targetCurrency,
          baseCurrency,
          rate
      };
  };

  const handleInputChange = (blockId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [blockId]: value }));
    // Clear error if exists
    if (validationErrors[blockId]) {
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[blockId];
            return newErrors;
        });
    }
  };
  
  // --- Wizard Navigation ---
  const requiredFields = useMemo(() => blocks.filter(b => b.required && !formValues[b.id]), [blocks, formValues]);
  const progress = useMemo(() => {
      const totalRequired = blocks.filter(b => b.required).length;
      if (totalRequired === 0) return 100;
      const filledRequired = blocks.filter(b => b.required && formValues[b.id]).length;
      return Math.round((filledRequired / totalRequired) * 100);
  }, [blocks, formValues]);

  const handleNextField = () => {
      // Find next empty required field
      const nextField = blocks.find((b, i) => i > activeFieldIndex && b.required && !formValues[b.id]);
      if (nextField) {
          const index = blocks.findIndex(b => b.id === nextField.id);
          setActiveFieldIndex(index);
          fieldRefs.current[nextField.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
          // If no subsequent empty required fields, check from beginning
           const firstEmpty = blocks.find(b => b.required && !formValues[b.id]);
           if (firstEmpty) {
                const index = blocks.findIndex(b => b.id === firstEmpty.id);
                setActiveFieldIndex(index);
                fieldRefs.current[firstEmpty.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
           }
      }
  };
  
  const renderBlock = (block: DocBlock, index: number) => {
     const isLocked = block.assignedToPartyId && block.assignedToPartyId !== simulatedPartyId;
     const assignedParty = parties.find(p => p.id === block.assignedToPartyId);
     const isActive = index === activeFieldIndex;

     // --- Render Field Content ---
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
                                 // We pass -1 as index to avoid wizard highlighting for internal blocks for now
                                 // Or could calculate a global index if flattened.
                                 <div key={childBlock.id}>{renderBlock(childBlock, -1)}</div>
                             ))}
                         </div>
                     ))}
                 </div>
             );
             break;
         case BlockType.COLUMN:
             // Should not be rendered directly, but handled by COLUMNS
             return null;
         case BlockType.INPUT:
             content = (
                 <Input 
                    value={formValues[block.id] || ''} 
                    onChange={(e) => handleInputChange(block.id, e.target.value)}
                    placeholder={block.placeholder || `Enter ${block.label?.toLowerCase()}...`}
                    disabled={isLocked}
                    className={cn(isActive && "ring-2 ring-primary ring-offset-2")}
                 />
             );
             break;
         case BlockType.NUMBER:
             content = (
                 <Input 
                    value={formValues[block.id] ? new Intl.NumberFormat('en-US').format(formValues[block.id].replace(/,/g, '')) : ''} 
                    onChange={(e) => {
                        // Remove non-numeric chars except dot
                        const raw = e.target.value.replace(/[^0-9.]/g, '');
                        handleInputChange(block.id, raw);
                    }}
                    placeholder={block.placeholder || "0.00"}
                    disabled={isLocked}
                    className={cn(isActive && "ring-2 ring-primary ring-offset-2")}
                    inputMode="decimal"
                 />
             );
             break;
         case BlockType.EMAIL:
             content = (
                 <Input 
                    value={formValues[block.id] || ''} 
                    onChange={(e) => handleInputChange(block.id, e.target.value)}
                    placeholder="user@example.com"
                    disabled={isLocked}
                    className={cn(isActive && "ring-2 ring-primary ring-offset-2")}
                    type="email"
                    onBlur={(e) => {
                        if (e.target.value) {
                             const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.target.value);
                             if (!isValid) setValidationErrors(p => ({...p, [block.id]: "Invalid email format"}));
                        }
                    }}
                 />
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
                             value={formValues[block.id] || ''}
                             onChange={(e) => handleInputChange(block.id, e.target.value)}
                             disabled={isLocked}
                         />
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleInputChange(block.id, new Date().toISOString().split('T')[0])} disabled={isLocked}>Today</Button>
                 </div>
             );
             break;
         case BlockType.CHECKBOX:
             if (block.options && block.options.length > 0) {
                 // Multi-select Group
                 content = (
                     <div className="space-y-2">
                         {block.options.map((opt, i) => {
                             const isChecked = (formValues[block.id] || []).includes(opt);
                             return (
                                 <div key={i} className="flex items-center gap-2">
                                     <Checkbox 
                                        checked={isChecked}
                                        onCheckedChange={(checked) => {
                                            let currentVals = (formValues[block.id] || []) as string[];
                                            if (block.allowMultiple === false) {
                                                // Radio behavior
                                                handleInputChange(block.id, checked ? [opt] : []);
                                            } else {
                                                // Multi select behavior
                                                if (checked) handleInputChange(block.id, [...currentVals, opt]);
                                                else handleInputChange(block.id, currentVals.filter(v => v !== opt));
                                            }
                                        }}
                                        disabled={isLocked}
                                     />
                                     <Label className="font-normal cursor-pointer" onClick={() => {
                                         if(isLocked) return;
                                          // Toggle logic duplicatd for label click convenience
                                          let currentVals = (formValues[block.id] || []) as string[];
                                           if (block.allowMultiple === false) {
                                                handleInputChange(block.id, !currentVals.includes(opt) ? [opt] : []);
                                            } else {
                                                if (!currentVals.includes(opt)) handleInputChange(block.id, [...currentVals, opt]);
                                                else handleInputChange(block.id, currentVals.filter(v => v !== opt));
                                            }
                                     }}>{opt}</Label>
                                 </div>
                             )
                         })}
                     </div>
                 )
             } else {
                 // Single Boolean
                 content = (
                     <div className="flex items-center gap-2 p-2 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-none hover:bg-accent/50 transition-colors">
                         <Checkbox 
                            checked={!!formValues[block.id]} 
                            onCheckedChange={(c) => handleInputChange(block.id, c)}
                            disabled={isLocked}
                         />
                         <Label className="cursor-pointer" onClick={() => !isLocked && handleInputChange(block.id, !formValues[block.id])}>
                             {block.label || "I agree"}
                         </Label>
                     </div>
                 )
             }
             break;
        case BlockType.SIGNATURE:
            content = (
                <SignatureWidget 
                    initialValue={formValues[block.id]}
                    onSign={(val) => handleInputChange(block.id, val)}
                    signatureId={block.signatureId} // In real app, this comes from server if already signed
                    signedAt={block.signedAt}
                />
            );
            break;
        case BlockType.CURRENCY:
            const currencyData = getCurrencyValue(block);
            if (!currencyData) {
                 content = <div className="text-red-500 text-xs">Invalid Currency Config</div>;
            } else {
                const { amount, loading, targetCurrency, rate } = currencyData;
                content = (
                    <div className="flex items-center gap-4 p-3 bg-muted/20 rounded-none border-2 border-black dark:border-zinc-700">
                        <div className="flex-1">
                            <div className="text-2xl font-bold tracking-tighter font-mono">
                                {loading ? '...' : new Intl.NumberFormat('en-US', { style: 'currency', currency: targetCurrency }).format(amount)}
                            </div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                                {loading ? 'Fetching live rates...' : `1 ${block.currencySettings?.baseCurrency} = ${rate?.toFixed(4)} ${targetCurrency}`}
                            </div>
                        </div>
                        <div>
                            <select 
                                className="h-8 rounded-none border border-input bg-background px-2 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-black dark:border-zinc-700"
                                value={targetCurrency}
                                onChange={(e) => setUserCurrencyPreferences(prev => ({ ...prev, [block.id]: e.target.value }))}
                            >
                                {SUPPORTED_CURRENCIES.map(c => (
                                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                );
            }
            break;
         default:
             content = <div className="text-red-500 text-xs">Unsupported block type: {block.type}</div>;
     }

     return (
        <PartyWrapper id={block.id} assignedTo={assignedParty} locked={isLocked} lockedBy={assignedParty?.name}>
             <div 
                ref={(el) => { fieldRefs.current[block.id] = el; }}
                className={cn(
                    "mb-4 transition-all duration-500",
                    isActive && "scale-[1.02]"
                )}
             >
                {block.label && block.type !== BlockType.CHECKBOX && block.type !== BlockType.COLUMNS && (
                    <Label className="mb-1.5 block text-muted-foreground flex justify-between text-xs uppercase font-bold tracking-wider">
                        {block.label} 
                        {block.required && <span className="text-red-500 ml-1">*</span>}
                        {validationErrors[block.id] && <span className="text-red-500 text-[10px] normal-case ml-auto">{validationErrors[block.id]}</span>}
                    </Label>
                )}
                {content}
             </div>
        </PartyWrapper>
     )
  };

  // Render a visually distinct "Page" container similar to EditorCanvas
  return (
    <div className="max-w-5xl mx-auto p-8 pb-32 relative min-h-screen bg-muted/10 bg-grid-pattern pt-24"> {/* Added pt-24 to prevent overlap with fixed nav */}
        
        {/* Simulator Controls (Overlay) - Fixed Position to prevent overlap */}
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

        {/* Document Page View */}
        <div className="max-w-[850px] mx-auto bg-white dark:bg-black border-2 border-black dark:border-zinc-800 shadow-hypr dark:shadow-hypr-dark relative transition-all p-16 min-h-[1100px]">
            
            {/* Document Header Inside Page */}
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

            {/* Blocks Renderer */}
            <div className="space-y-6">
                {blocks.map((block, i) => renderBlock(block, i))}
            </div>
        </div>

        {/* Wizard Bar */}
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
