
import React, { useState, useEffect } from 'react';
import { BlockType, DocBlock, FormValues, Party, DocumentSettings, Variable } from '../types';
import { ChevronDown, Plus, Trash, Check, Calendar as CalendarIcon, Upload, AlertCircle, FileIcon, ArrowRight, ArrowLeft, CreditCard, Lock, PlayCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button, Input, Card, Label, Switch, DatePickerTrigger, Textarea, cn, ProgressBar } from './ui-components';
import { SignaturePad } from './SignaturePad';
import { computeDiff } from '../services/diff';

interface ViewerProps {
  blocks: DocBlock[];
  snapshot?: DocBlock[];
  parties?: Party[];
  variables?: Variable[];
  isPreview?: boolean;
  settings?: DocumentSettings;
}

const PartyWrapper: React.FC<{ children: React.ReactNode; assignedTo?: Party }> = ({ children, assignedTo }) => {
    if (!assignedTo) return <div className="my-6">{children}</div>;
    return (
        <div className="my-6 relative pl-3 border-l-4 rounded-l-sm transition-colors" style={{ borderLeftColor: assignedTo.color }}>
            {children}
            <div className="absolute -left-1 top-0 -translate-x-full pr-2 opacity-50 hover:opacity-100 transition-opacity">
                    <div 
                    className="text-[9px] font-bold uppercase tracking-widest text-right whitespace-nowrap"
                    style={{ color: assignedTo.color }}
                    >
                    {assignedTo.name}
                    </div>
            </div>
        </div>
    )
};

export const Viewer: React.FC<ViewerProps> = ({ blocks, snapshot, parties = [], variables = [], isPreview = false, settings }) => {
  const [formValues, setFormValues] = useState<FormValues>({});
  const [viewMode, setViewMode] = useState<'document' | 'wizard'>('document');
  const [wizardStep, setWizardStep] = useState(0);
  const [changesAccepted, setChangesAccepted] = useState(false);

  // Compute Diff
  const diffs = React.useMemo(() => computeDiff(blocks, snapshot), [blocks, snapshot]);
  const hasChanges = Object.keys(diffs).length > 0 && Object.values(diffs).some(v => v !== 'unchanged');

  const handleChange = (key: string, value: any) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const substituteVariables = (text: string) => {
      if (!text) return '';
      let processed = text;
      variables.forEach(v => {
          if (v.key) {
             const regex = new RegExp(`{{${v.key}}}`, 'g');
             processed = processed.replace(regex, v.value || `[${v.key}]`);
          }
      });
      return processed;
  };

  // Safe formula evaluation
  const evaluateFormula = (formula: string) => {
      if (!formula) return 0;
      let expr = formula;
      // Replace variables {{var}} with values from formValues
      const matches = expr.match(/{{[\w]+}}/g);
      if (matches) {
          matches.forEach(m => {
              const key = m.replace('{{', '').replace('}}', '');
              const val = parseFloat(formValues[key] || '0');
              expr = expr.replace(m, isNaN(val) ? '0' : val.toString());
          });
      }
      try {
          // Sanitized eval: only allow basic math characters
          if (/[^0-9+\-*/().\s]/.test(expr)) return 'Error';
          // eslint-disable-next-line no-new-func
          return new Function('return ' + expr)();
      } catch (e) {
          return 'Error';
      }
  };

  const renderBlock = (block: DocBlock, isWizard = false) => {
    // 1. Check Conditionals
    if (block.type === BlockType.CONDITIONAL && block.condition) {
      const parentValue = formValues[block.condition.variableName];
      if (parentValue !== block.condition.equals) {
        return null;
      }
      return (
        <div key={block.id} className={cn("animate-in fade-in slide-in-from-top-2 duration-300", !isWizard && "my-6 pl-4 md:pl-6 border-l-2 border-primary/20")}>
           {block.children?.map(child => renderBlock(child, isWizard))}
        </div>
      );
    }

    const value = formValues[block.variableName || ''] || '';
    const assignedTo = parties.find(p => p.id === block.assignedToPartyId);
    const Wrapper = isWizard ? React.Fragment : PartyWrapper;
    const wrapperProps = isWizard ? {} : { assignedTo, key: block.id };
    
    // DIFF STYLING
    const diffStatus = diffs[block.id];
    const isAdded = diffStatus === 'added';
    const isModified = diffStatus === 'modified';
    
    const blockContent = (
      <div className={cn(
          "relative transition-all",
          isAdded && "bg-green-50/50 p-2 rounded-lg border border-green-200 dark:bg-green-900/10 dark:border-green-800",
          isModified && "bg-yellow-50/50 p-2 rounded-lg border border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800"
      )}>
        {/* Visual Indicators for Changes */}
        {isAdded && !isWizard && (
            <div className="absolute -right-2 top-0 translate-x-full pr-2 text-[9px] font-bold text-green-600 uppercase tracking-wider flex items-center gap-1">
                <Plus size={10} /> New
            </div>
        )}
        {isModified && !isWizard && (
            <div className="absolute -right-2 top-0 translate-x-full pr-2 text-[9px] font-bold text-yellow-600 uppercase tracking-wider flex items-center gap-1">
                <AlertCircle size={10} /> Updated
            </div>
        )}

        {/* ... Block Rendering Logic ... */}
        {(() => {
            switch (block.type) {
                case BlockType.TEXT:
                    return <div className="prose prose-neutral dark:prose-invert prose-sm md:prose-base max-w-none my-6 text-foreground"><ReactMarkdown>{substituteVariables(block.content || '')}</ReactMarkdown></div>;
                case BlockType.INPUT:
                case BlockType.EMAIL:
                case BlockType.NUMBER:
                    return <div className="space-y-2"><Label>{block.label}</Label><Input value={value} onChange={e => handleChange(block.variableName!, e.target.value)} placeholder={block.placeholder} /></div>;
                case BlockType.SECTION_BREAK:
                    return <div className="my-8 py-4 border-t border-border/60">{block.label && <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{block.label}</h3>}</div>;
                case BlockType.SIGNATURE:
                    return (
                        <div className="pt-6 border-t dark:border-zinc-800">
                             <Label className="text-base mb-4 block font-semibold">Signature {block.required && '*'}</Label>
                             {value ? <img src={value} className="h-24 mix-blend-multiply dark:invert" /> : <SignaturePad onSign={(d) => handleChange(block.variableName!, d)} />}
                        </div>
                    );
                case BlockType.FORMULA: {
                    const result = evaluateFormula(block.formula || '0');
                    return (
                        <div className="my-4 p-4 bg-muted/20 rounded border border-muted flex justify-between items-center">
                            <Label className="text-sm font-medium text-muted-foreground">{block.label || 'Total'}</Label>
                            <span className="text-xl font-mono font-bold">{typeof result === 'number' ? result.toLocaleString() : result}</span>
                        </div>
                    );
                }
                case BlockType.PAYMENT: {
                    let amount = block.paymentSettings?.amount || 0;
                    if (block.paymentSettings?.amountType === 'variable' && block.paymentSettings.variableName) {
                        amount = evaluateFormula(`{{${block.paymentSettings.variableName}}}`) as number || 0;
                    }
                    return (
                        <div className="my-6 max-w-sm">
                            <Label className="mb-2 block">{block.label || 'Payment Required'}</Label>
                            <Card className="p-4 border-zinc-200 shadow-sm bg-white dark:bg-zinc-900 dark:border-zinc-800">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="font-semibold flex items-center gap-2"><CreditCard size={16}/> Card Details</span>
                                    <div className="flex gap-1">
                                        <div className="w-8 h-5 bg-blue-600 rounded"></div>
                                        <div className="w-8 h-5 bg-orange-500 rounded"></div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Input placeholder="0000 0000 0000 0000" className="font-mono"/>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input placeholder="MM/YY" className="font-mono"/>
                                        <Input placeholder="CVC" className="font-mono"/>
                                    </div>
                                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20 shadow-lg" onClick={() => alert('Payment Simulation Success')}>
                                        Pay ${amount.toLocaleString()} <Lock size={12} className="ml-2 opacity-70"/>
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    );
                }
                case BlockType.VIDEO:
                    if (!block.videoUrl) return null;
                    let embedUrl = block.videoUrl;
                    if (embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')) {
                        const vidId = embedUrl.split('v=')[1] || embedUrl.split('/').pop();
                        embedUrl = `https://www.youtube.com/embed/${vidId}`;
                    } else if (embedUrl.includes('loom.com')) {
                        embedUrl = embedUrl.replace('/share/', '/embed/');
                    }
                    return (
                        <div className="my-6 rounded-lg overflow-hidden border shadow-sm aspect-video bg-black">
                            <iframe src={embedUrl} className="w-full h-full" frameBorder="0" allowFullScreen></iframe>
                        </div>
                    )

                case BlockType.CHECKBOX:
                    return <div className="flex items-center space-x-2 my-2"><Switch checked={!!value} onCheckedChange={c => handleChange(block.variableName!, c)} /><Label>{block.label}</Label></div>;
                case BlockType.RADIO:
                case BlockType.SELECT:
                    return (
                         <div className="space-y-2">
                            <Label>{block.label}</Label>
                            {block.type === BlockType.SELECT ? (
                                <div className="relative">
                                    <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none" value={value} onChange={e => handleChange(block.variableName!, e.target.value)}>
                                        <option value="">Select option...</option>
                                        {block.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-3 h-4 w-4 opacity-50 pointer-events-none"/>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {block.options?.map(o => (
                                        <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
                                            <input type="radio" name={block.variableName} value={o} checked={value === o} onChange={() => handleChange(block.variableName!, o)} className="accent-primary h-4 w-4"/>
                                            {o}
                                        </label>
                                    ))}
                                </div>
                            )}
                         </div>
                    );
                case BlockType.DATE:
                    return <div className="space-y-2"><Label>{block.label}</Label><DatePickerTrigger value={value} onChange={v => handleChange(block.variableName!, v)} label="Select date"/></div>;
                default: return null;
            }
        })()}
      </div>
    );

    return <Wrapper {...wrapperProps}>{blockContent}</Wrapper>;
  };

  // --- Change Acceptance Modal ---
  if (hasChanges && !changesAccepted && !isPreview) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
              <Card className="max-w-lg w-full p-8 space-y-6 shadow-xl border-l-4 border-l-yellow-500">
                  <div className="flex items-center gap-3 text-yellow-600">
                      <AlertCircle size={32} />
                      <h2 className="text-xl font-bold">Document Updated</h2>
                  </div>
                  <p className="text-muted-foreground">
                      Since you last viewed this document, the owner has made changes. 
                      Changes are highlighted in <span className="text-green-600 font-bold">Green</span> (New) 
                      and <span className="text-yellow-600 font-bold">Yellow</span> (Modified).
                  </p>
                  <Button className="w-full" onClick={() => setChangesAccepted(true)}>
                      I Understand, Show Me Changes
                  </Button>
              </Card>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-muted/20 dark:bg-zinc-950 text-foreground font-sans selection:bg-primary/10" style={{ fontFamily: settings?.fontFamily }}>
         <div className="max-w-4xl mx-auto bg-card shadow-xl min-h-screen p-8 md:p-20 border-x border-border/50 dark:border-zinc-800 relative">
            
            {/* Branding Header */}
            {settings?.logoUrl && (
                <div className="mb-12 flex justify-center md:justify-start">
                    <img src={settings.logoUrl} alt="Company Logo" className="h-12 w-auto object-contain" />
                </div>
            )}

            <div className="mb-16 space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">{blocks.find(b => b.type === 'text')?.content?.split('\n')[0].replace('# ', '') || 'Document'}</h1>
                <div className="h-1 w-20 bg-primary/20 rounded-full" style={{ backgroundColor: settings?.brandColor }}></div>
            </div>
            
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                {blocks.map(b => renderBlock(b))}
                
                {!isPreview && (
                    <div className="mt-20 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 dark:border-zinc-800">
                        <Button 
                            size="lg"
                            className="w-full md:w-auto text-base px-10 h-12 shadow-lg shadow-primary/20"
                            style={{ backgroundColor: settings?.brandColor }}
                        >
                            Finalize Document
                        </Button>
                    </div>
                )}
            </form>
        </div>
    </div>
  );
};
