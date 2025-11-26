
import React, { useState, useEffect, useMemo } from 'react';
import { BlockType, DocBlock, FormValues, Party, DocumentSettings, Variable, Term } from '../types';
import { Plus, Trash, AlertCircle, RefreshCw, UploadCloud, X, CreditCard, Lock, Video, Eye, Eraser } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button, Input, Card, Label, Switch, DatePickerTrigger, cn, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, Checkbox, Tooltip, TooltipTrigger, TooltipContent } from './ui-components';
import { SignatureWidget } from './SignatureWidget';
import { computeDiff } from '../services/diff';
import { fetchExchangeRate } from '../services/currency';
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

const PartyWrapper: React.FC<{ children: React.ReactNode; assignedTo?: Party; locked?: boolean; lockedBy?: string }> = ({ children, assignedTo, locked, lockedBy }) => {
    if (!assignedTo) return <div className="my-6 relative group">{children}</div>;
    
    return (
        <div className={cn("my-6 relative pl-3 border-l-4 rounded-l-sm transition-all group", locked && "opacity-50 pointer-events-none grayscale")} style={{ borderLeftColor: assignedTo.color }}>
            {children}
            <div className="absolute -left-1 top-0 -translate-x-full pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div 
                    className="text-[9px] font-bold uppercase tracking-widest text-right whitespace-nowrap bg-background border px-1 rounded shadow-sm"
                    style={{ color: assignedTo.color, borderColor: assignedTo.color }}
                >
                    {assignedTo.name}
                </div>
            </div>
            {locked && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="bg-background/90 border border-muted p-2 rounded-md shadow-sm flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                        <Lock size={12} /> Waiting for {lockedBy}
                    </div>
                </div>
            )}
        </div>
    )
};

export const Viewer: React.FC<ViewerProps> = ({ blocks, snapshot, parties = [], variables = [], terms = [], isPreview = false, settings }) => {
  const [formValues, setFormValues] = useState<FormValues>({});
  const [currencyRates, setCurrencyRates] = useState<Record<string, number>>({});
  const [activeTerm, setActiveTerm] = useState<Term | null>(null);
  const [changesAccepted, setChangesAccepted] = useState(false);
  
  const [simulatedPartyId, setSimulatedPartyId] = useState<string>(parties[0]?.id || 'p1');

  const diffs = useMemo(() => computeDiff(blocks, snapshot), [blocks, snapshot]);
  const hasChanges = Object.keys(diffs).length > 0 && Object.values(diffs).some(v => v !== 'unchanged');

  const masterGlossary = useMemo(() => {
      const userTerms = terms || [];
      const systemTerms = LEGAL_DICTIONARY_DB.map(t => ({
          id: `sys_${t.term}`, 
          term: t.term, 
          definition: t.definition, 
          source: 'system' as const, 
          color: '#3b82f6'
      })).filter(sys => !userTerms.some(ut => ut.term.toLowerCase() === sys.term.toLowerCase()));
      
      return [...userTerms, ...systemTerms];
  }, [terms]);

  useEffect(() => {
      blocks.forEach(block => {
          if (block.type === BlockType.CURRENCY && block.currencySettings) {
              const { baseCurrency, targetCurrency } = block.currencySettings;
              const key = `${baseCurrency}-${targetCurrency}`;
              if (!currencyRates[key]) {
                  fetchExchangeRate(baseCurrency, targetCurrency).then(rate => {
                      if (rate) setCurrencyRates(prev => ({ ...prev, [key]: rate }));
                  });
              }
          }
      });
  }, [blocks]);

  const handleChange = (key: string, value: any) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const evaluateFormula = (formula: string): number | string => {
      try {
          const parsed = formula.replace(/{{([^}]+)}}/g, (_, key) => {
              const val = formValues[key];
              return !isNaN(parseFloat(val)) ? val : '0';
          });
          if (/[^0-9+\-*/().\s]/.test(parsed)) return "Error";
          // eslint-disable-next-line no-new-func
          return new Function('return ' + parsed)();
      } catch (e) {
          return "Err";
      }
  };

  const getPartyStatus = (partyId: string) => {
      const partyBlocks = blocks.filter(b => b.assignedToPartyId === partyId && b.required);
      const isComplete = partyBlocks.every(b => {
          const val = formValues[b.variableName || ''];
          return val !== undefined && val !== '' && val !== null;
      });
      return isComplete;
  };

  const isBlockLocked = (blockAssignedTo: string | undefined): { locked: boolean; lockedBy?: string } => {
      if (!blockAssignedTo) return { locked: false };
      if (!settings?.signingOrder || settings.signingOrder === 'parallel') return { locked: false };
      
      const myIndex = parties.findIndex(p => p.id === simulatedPartyId);
      if (blockAssignedTo === simulatedPartyId) {
           for (let i = 0; i < myIndex; i++) {
               if (!getPartyStatus(parties[i].id)) {
                   return { locked: true, lockedBy: parties[i].name };
               }
           }
      }
      return { locked: false };
  };

  const renderTextWithGlossary = (content: string) => {
      if (!content) return null;
      let processed = content.replace(/{{([^}]+)}}/g, (_, key) => {
          const variable = variables.find(v => v.key === key);
          if (variable) return variable.value;
          if (formValues[key]) return formValues[key];
          return `{{${key}}}`; 
      });

      return (
          <ReactMarkdown
              components={{
                  p: ({node, children}) => {
                       return (
                           <p className="mb-2 break-words whitespace-pre-wrap max-w-full">
                               {React.Children.map(children, child => {
                                   if (typeof child === 'string') {
                                       const sortedTerms = [...masterGlossary].sort((a,b) => b.term.length - a.term.length);
                                       if (sortedTerms.length === 0) return child;
                                       const pattern = new RegExp(`\\b(${sortedTerms.map(t => t.term).join('|')})\\b`, 'gi');
                                       const parts = child.split(pattern);
                                       return parts.map((part, i) => {
                                           const match = sortedTerms.find(t => t.term.toLowerCase() === part.toLowerCase());
                                           if (match) {
                                               return (
                                                   <Tooltip key={i}>
                                                       <TooltipTrigger className="border-b transition-colors hover:bg-opacity-20 decoration-primary/50">
                                                            <span 
                                                                className="cursor-help"
                                                                style={{ borderBottomColor: match.color, backgroundColor: match.color ? `${match.color}10` : undefined }}
                                                                onClick={(e) => { e.stopPropagation(); setActiveTerm(match); }}
                                                            >
                                                                {part}
                                                            </span>
                                                       </TooltipTrigger>
                                                       <TooltipContent>
                                                           <div className="font-bold mb-1">{match.term}</div>
                                                           <div className="max-w-[200px] whitespace-normal opacity-90">{match.definition}</div>
                                                       </TooltipContent>
                                                   </Tooltip>
                                               )
                                           }
                                           return part;
                                       });
                                   }
                                   return child;
                               })}
                           </p>
                       )
                  }
              }}
          >
              {processed}
          </ReactMarkdown>
      )
  };

  const renderRepeater = (block: DocBlock) => {
      const rows: any[] = formValues[block.variableName!] || [];
      const columns = block.repeaterFields || [];

      const addRow = () => {
          const newRow: any = { _id: crypto.randomUUID() }; 
          columns.forEach(c => newRow[c.variableName!] = '');
          handleChange(block.variableName!, [...rows, newRow]);
      };

      const removeRow = (index: number) => {
          const newRows = [...rows];
          newRows.splice(index, 1);
          handleChange(block.variableName!, newRows);
      };

      const updateRow = (rowIndex: number, colKey: string, val: any) => {
          const newRows = [...rows];
          newRows[rowIndex] = { ...newRows[rowIndex], [colKey]: val };
          handleChange(block.variableName!, newRows);
      };

      return (
          <div className="space-y-2 overflow-hidden w-full">
              <Label>{block.label}</Label>
              <div className="border rounded-lg overflow-x-auto dark:border-zinc-800 bg-card">
                  <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-left">
                          <tr>
                              {columns.map(c => <th key={c.id} className="p-3 font-medium text-muted-foreground whitespace-nowrap">{c.label}</th>)}
                              <th className="w-10"></th>
                          </tr>
                      </thead>
                      <tbody>
                          {rows.map((row, i) => (
                              <tr key={row._id || i} className="border-t dark:border-zinc-800 hover:bg-muted/10">
                                  {columns.map(col => (
                                      <td key={col.id} className="p-2 min-w-[120px]">
                                          {col.type === BlockType.SELECT ? (
                                              <select 
                                                className="w-full bg-transparent border rounded-sm focus:ring-1 focus:ring-primary p-1 h-8 text-xs dark:border-zinc-800 dark:bg-zinc-900"
                                                value={row[col.variableName!]}
                                                onChange={e => updateRow(i, col.variableName!, e.target.value)}
                                              >
                                                  <option value="">Select...</option>
                                                  {col.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                              </select>
                                          ) : col.type === BlockType.DATE ? (
                                              <DatePickerTrigger 
                                                  value={row[col.variableName!] || ''}
                                                  onChange={val => updateRow(i, col.variableName!, val)}
                                              />
                                          ) : (
                                              <Input 
                                                className="h-8 border-transparent hover:border-input focus:border-input bg-transparent shadow-none px-2"
                                                value={row[col.variableName!] || ''}
                                                onChange={e => updateRow(i, col.variableName!, e.target.value)}
                                                type={col.type === BlockType.NUMBER ? 'number' : col.type === BlockType.EMAIL ? 'email' : 'text'}
                                                placeholder={col.placeholder || "..."}
                                              />
                                          )}
                                      </td>
                                  ))}
                                  <td className="p-2 text-right">
                                      <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeRow(i)}>
                                          <Trash size={12} />
                                      </Button>
                                  </td>
                              </tr>
                          ))}
                          {rows.length === 0 && <tr><td colSpan={columns.length + 1} className="p-6 text-center text-muted-foreground italic text-xs">No items added yet. Click below to add a row.</td></tr>}
                      </tbody>
                  </table>
              </div>
              <Button size="sm" variant="outline" className="w-full border-dashed" onClick={addRow}><Plus size={14} className="mr-2"/> Add Row</Button>
          </div>
      )
  };

  const renderContent = (block: DocBlock) => {
    const value = formValues[block.variableName || ''] || '';

    switch (block.type) {
        case BlockType.TEXT:
            return <div className="prose prose-sm dark:prose-invert max-w-full text-foreground break-words">{renderTextWithGlossary(block.content || '')}</div>;
        
        case BlockType.INPUT:
        case BlockType.EMAIL:
            return <div className="space-y-2"><Label>{block.label}</Label><Input value={value} onChange={e => handleChange(block.variableName!, e.target.value)} placeholder={block.placeholder} type={block.type === BlockType.EMAIL ? 'email' : 'text'} /></div>;
        
        case BlockType.NUMBER:
            return <div className="space-y-2"><Label>{block.label}</Label><Input type="number" value={value} onChange={e => handleChange(block.variableName!, e.target.value)} /></div>;
        
        case BlockType.FORMULA:
            const result = block.formula ? evaluateFormula(block.formula) : 0;
            return (
                <div className="space-y-1">
                     <Label>{block.label}</Label>
                     <div className="h-10 px-3 flex items-center bg-muted/20 border rounded-md font-mono text-lg font-bold">
                         {result}
                     </div>
                     <p className="text-[10px] text-muted-foreground font-mono">{block.formula}</p>
                </div>
            )

        case BlockType.CHECKBOX:
            if (block.options && block.options.length > 0) {
                 const selected: string[] = Array.isArray(value) ? value : [];
                 const toggle = (opt: string) => {
                     if (selected.includes(opt)) handleChange(block.variableName!, selected.filter(s => s !== opt));
                     else handleChange(block.variableName!, [...selected, opt]);
                 };
                 return (
                     <div className="space-y-3">
                         <Label>{block.label}</Label>
                         <div className="grid gap-2">
                             {block.options.map(opt => (
                                 <div key={opt} className="flex items-center space-x-2">
                                     <Checkbox checked={selected.includes(opt)} onCheckedChange={() => toggle(opt)} id={`${block.id}-${opt}`} />
                                     <label htmlFor={`${block.id}-${opt}`} className="text-sm cursor-pointer select-none">{opt}</label>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )
            }
            return (
                <div className="flex items-center space-x-3 my-2 border p-3 rounded-lg bg-card/50">
                    <Checkbox 
                        checked={!!value} 
                        onCheckedChange={c => handleChange(block.variableName!, c)} 
                        id={block.id}
                        className="h-5 w-5"
                    />
                    <label htmlFor={block.id} className="text-sm font-medium cursor-pointer select-none flex-1">
                        {block.label}
                    </label>
                </div>
            );

        case BlockType.FILE_UPLOAD:
            return (
                <div className="space-y-2">
                    <Label>{block.label}</Label>
                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center bg-muted/5 transition-colors hover:bg-muted/10 dark:border-zinc-800 relative overflow-hidden group">
                        {value ? (
                            <div className="flex items-center gap-2 text-sm bg-background border px-3 py-1.5 rounded-full z-10 shadow-sm">
                                <span className="truncate max-w-[200px]">{value.name || 'File Selected'}</span>
                                <button onClick={() => handleChange(block.variableName!, null)} className="hover:text-destructive"><X size={14}/></button>
                            </div>
                        ) : (
                            <>
                                <UploadCloud className="h-8 w-8 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                                <p className="text-xs text-muted-foreground mb-2">Drag & drop or click to upload</p>
                                <Input 
                                    type="file" 
                                    className="hidden" 
                                    id={`file-${block.id}`} 
                                    onChange={(e) => {
                                        if (e.target.files?.[0]) handleChange(block.variableName!, e.target.files[0]);
                                    }} 
                                />
                                <Button size="sm" variant="secondary" onClick={() => document.getElementById(`file-${block.id}`)?.click()}>Choose File</Button>
                            </>
                        )}
                    </div>
                </div>
            )

        case BlockType.IMAGE:
            return block.content ? (
                <div className="my-4 rounded-lg overflow-hidden border dark:border-zinc-800 bg-muted/10 flex items-center justify-center">
                    <img src={block.content} alt="Embedded" className="max-w-full h-auto" />
                </div>
            ) : null;

        case BlockType.VIDEO:
             let embedUrl = block.videoUrl;
             if (embedUrl?.includes('youtube.com') || embedUrl?.includes('youtu.be')) {
                 const id = embedUrl.split('v=')[1] || embedUrl.split('/').pop();
                 embedUrl = `https://www.youtube.com/embed/${id}`;
             } else if (embedUrl?.includes('vimeo.com')) {
                 const id = embedUrl.split('/').pop();
                 embedUrl = `https://player.vimeo.com/video/${id}`;
             }

             return embedUrl ? (
                 <div className="my-4 aspect-video rounded-lg overflow-hidden bg-black shadow-lg">
                     <iframe src={embedUrl} className="w-full h-full" frameBorder="0" allowFullScreen></iframe>
                 </div>
             ) : (
                 <div className="my-4 h-48 bg-black/5 flex items-center justify-center rounded-lg border border-dashed dark:bg-black/20">
                     <div className="text-center text-muted-foreground">
                         <Video size={24} className="mx-auto mb-2 opacity-50"/>
                         <span className="text-xs">Video Placeholder</span>
                     </div>
                 </div>
             )

        case BlockType.HTML:
            return block.content ? (
                <div className="my-4" dangerouslySetInnerHTML={{ __html: block.content }} />
            ) : null;

        case BlockType.REPEATER:
            return renderRepeater(block);

        case BlockType.CURRENCY:
             const { baseCurrency = 'USD', targetCurrency = 'EUR', amount = 1000 } = block.currencySettings || {};
             const rate = currencyRates[`${baseCurrency}-${targetCurrency}`];
             const converted = rate ? (amount * rate).toFixed(2) : '...';
             return (
                <div className="my-6 p-4 bg-zinc-50 dark:bg-zinc-900 border rounded-lg flex items-center justify-between shadow-sm">
                    <div>
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Estimated Value</Label>
                        <div className="text-2xl font-bold font-mono mt-1 flex items-baseline gap-2">
                            <span>{amount.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{baseCurrency}</span></span>
                            <span className="text-muted-foreground">≈</span>
                            <span>{rate ? parseFloat(converted).toLocaleString() : '...'} <span className="text-sm font-normal text-muted-foreground">{targetCurrency}</span></span>
                        </div>
                    </div>
                </div>
            );

        case BlockType.SIGNATURE:
            return (
                <div className="pt-6 border-t dark:border-zinc-800">
                    <Label className="text-base mb-4 block font-semibold">Signature {block.required && '*'}</Label>
                    {value ? (
                        <div className="relative group/sig inline-block">
                            <div className="border-2 border-primary/20 p-4 bg-white rounded-lg inline-flex flex-col items-center shadow-sm">
                                <img src={value} className="h-24 object-contain mix-blend-multiply" alt="Signature" />
                                <div className="mt-1 text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                                    Signed
                                </div>
                            </div>
                            {/* Improved Clear Logic: Show unless in rigid preview mode without edit capability */}
                            {!isPreview && (
                                <Button 
                                    size="xs" 
                                    variant="secondary" 
                                    className="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-md opacity-0 group-hover/sig:opacity-100 transition-all bg-destructive text-destructive-foreground hover:bg-destructive/90 p-0 flex items-center justify-center z-20" 
                                    onClick={(e) => { e.preventDefault(); handleChange(block.variableName!, ''); }}
                                    title="Clear Signature"
                                >
                                    <Eraser size={14} />
                                </Button>
                            )}
                        </div>
                    ) : (
                        isPreview && block.assignedToPartyId && block.assignedToPartyId !== simulatedPartyId ? (
                            <div className="h-32 border-2 border-dashed rounded-lg bg-muted/10 flex items-center justify-center text-muted-foreground">
                                <span className="text-sm font-medium">Waiting for Signature</span>
                            </div>
                        ) : (
                            <SignatureWidget onSign={(d) => handleChange(block.variableName!, d)} />
                        )
                    )}
                </div>
            );

        case BlockType.SELECT:
             return (
                <div className="space-y-2">
                    <Label>{block.label}</Label>
                    <select 
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950/50" 
                        value={value} 
                        onChange={e => handleChange(block.variableName!, e.target.value)}
                    >
                        <option value="">Select option...</option>
                        {block.options?.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>
             );

        case BlockType.RADIO:
            return (
                <div className="space-y-3">
                    <Label>{block.label}</Label>
                    <div className="space-y-2">
                        {block.options?.map(o => (
                            <label key={o} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-muted/30 transition-colors">
                                <input type="radio" name={block.variableName} checked={value === o} onChange={() => handleChange(block.variableName!, o)} className="accent-primary h-4 w-4"/>
                                <span className="text-sm">{o}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )

        default:
            return null;
    }
  }

  // Handle conditional rendering recursively
  const renderBlocks = (blocksToRender: DocBlock[]): React.ReactNode => {
      return blocksToRender.map(block => {
          // Check conditionals
          if (block.condition) {
              const { variableName, equals } = block.condition;
              if (variableName && formValues[variableName] !== equals) {
                  return null; 
              }
          }

          const assignedParty = parties.find(p => p.id === block.assignedToPartyId);
          const { locked, lockedBy } = isBlockLocked(block.assignedToPartyId);
          
          if (block.children && block.children.length > 0 && block.type === BlockType.CONDITIONAL) {
              return <React.Fragment key={block.id}>{renderBlocks(block.children)}</React.Fragment>;
          }

          return (
              <PartyWrapper 
                  key={block.id} 
                  assignedTo={assignedParty}
                  locked={locked && isPreview}
                  lockedBy={lockedBy}
              >
                  {renderContent(block)}
              </PartyWrapper>
          );
      });
  };

  if (hasChanges && !changesAccepted && !isPreview) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
              <Card className="max-w-lg w-full p-8 space-y-6 shadow-xl border-l-4 border-l-yellow-500">
                  <div className="flex items-center gap-3 text-yellow-600">
                      <AlertCircle size={32} />
                      <h2 className="text-xl font-bold">Document Updated</h2>
                  </div>
                  <p className="text-muted-foreground">The owner has made changes since you last viewed this document.</p>
                  <Button className="w-full" onClick={() => setChangesAccepted(true)}>View Changes</Button>
              </Card>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-muted/20 dark:bg-zinc-950 text-foreground font-sans pb-20 transition-colors duration-300 overflow-x-hidden" style={{ fontFamily: settings?.fontFamily }}>
         {isPreview && (
             <div className="sticky top-[0px] z-50 bg-indigo-900 text-white px-6 py-2 flex justify-between items-center shadow-md">
                 <div className="flex items-center gap-2 text-xs font-medium">
                     <Eye size={14} /> Simulation Mode
                 </div>
                 <div className="flex items-center gap-2">
                     <span className="text-xs opacity-70">View As:</span>
                     <select 
                        className="bg-indigo-800 border-none text-xs rounded px-2 py-1 focus:ring-0 cursor-pointer"
                        value={simulatedPartyId}
                        onChange={(e) => setSimulatedPartyId(e.target.value)}
                     >
                         {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                     </select>
                 </div>
             </div>
         )}

         <div 
             className="max-w-4xl mx-auto bg-card shadow-xl min-h-screen border-x border-border/50 dark:border-zinc-800 relative mt-6 animate-in slide-in-from-bottom-4 duration-500 box-border"
             style={{
                 paddingTop: settings?.margins?.top || 80,
                 paddingBottom: settings?.margins?.bottom || 80,
                 paddingLeft: settings?.margins?.left || 80,
                 paddingRight: settings?.margins?.right || 80,
             }}
         >
            {settings?.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-12 w-auto mb-12" />}
            
            <div className="mb-16 space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl break-words">{blocks.find(b => b.type === 'text')?.content?.split('\n')[0].replace('# ', '') || 'Document'}</h1>
                <div className="h-1 w-20 bg-primary/20 rounded-full" style={{ backgroundColor: settings?.brandColor }}></div>
            </div>
            
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                {renderBlocks(blocks)}
            </form>

            <Dialog open={!!activeTerm} onOpenChange={(o) => !o && setActiveTerm(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle style={{ color: activeTerm?.color }}>{activeTerm?.term}</DialogTitle>
                    </DialogHeader>
                    <div className="text-sm text-muted-foreground">{activeTerm?.definition}</div>
                </DialogContent>
            </Dialog>
        </div>
    </div>
  );
};
