
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BlockType, DocBlock, FormValues, Party, DocumentSettings, Variable, Term } from '../types';
import { Plus, Trash, AlertCircle, RefreshCw, UploadCloud, X, CreditCard, Lock, Video, Eye, Eraser, ArrowRight, CheckCircle2, Navigation, ChevronRight, ChevronLeft, Flag, AlertTriangle, Phone, Image as ImageIcon, ArrowDown, FileText, Repeat, Trash2, Calculator, ArrowRightLeft, Quote, Info, XOctagon, Landmark, QrCode, ShieldCheck, FileUp, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button, Input, Card, Label, Switch, cn, Badge, Checkbox, Textarea } from './ui-components';
import { SignatureWidget } from './SignatureWidget';
import { fetchExchangeRate, SUPPORTED_CURRENCIES } from '../services/currency';
import { LEGAL_DICTIONARY_DB } from '../services/glossary';
import { SafeFormula } from '../services/formula';
import { PaymentService, formatCurrency } from '../services/payments';
import { SupabaseService } from '../services/supabase';

interface ViewerProps {
  blocks: DocBlock[];
  snapshot?: DocBlock[];
  parties?: Party[];
  variables?: Variable[];
  terms?: Term[];
  isPreview?: boolean;
  settings?: DocumentSettings;
  docHash?: string; // Passed from parent
  onSigningComplete?: (docId: string) => void;
  status?: 'draft' | 'sent' | 'completed' | 'archived'; // Add status prop
  verifiedIdentifier?: string; // NEW: from 2FA
}

// --- Helper Components ---

const PartyWrapper: React.FC<{ children: React.ReactNode; assignedTo?: Party; locked?: boolean; lockedBy?: string; id?: string }> = ({ children, assignedTo, locked, lockedBy, id }) => {
    if (!assignedTo) return <div id={id} className="my-3 relative group">{children}</div>;
    return (
        <div id={id} className="my-3 relative pl-4 border-l-4 transition-all group scroll-mt-32 rounded-none" style={{ borderLeftColor: assignedTo.color }}>
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
          if (baseCurrency === targetCurrency) { setRate(1); return; }
          let mounted = true; setLoading(true);
          fetchExchangeRate(baseCurrency, targetCurrency).then(r => { if (mounted) { setRate(r); setLoading(false); } });
          return () => { mounted = false; };
      }, [baseCurrency, targetCurrency]);

      if (!block.currencySettings) return <div className="text-red-500 text-xs">Invalid Config</div>;
      const convertedAmount = rate !== null ? baseAmount * rate : 0;

      return (
            <div className="flex items-center gap-4 p-3 bg-muted/20 rounded-none border-2 border-black dark:border-zinc-700">
                <div className="flex-1">
                    <div className="text-2xl font-bold tracking-tighter font-mono">{loading ? '...' : new Intl.NumberFormat('en-US', { style: 'currency', currency: targetCurrency }).format(convertedAmount)}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{loading ? 'Fetching live rates...' : `1 ${baseCurrency} = ${rate?.toFixed(4)} ${targetCurrency}`}</div>
                </div>
                <div>
                    <select className="h-8 rounded-none border border-input bg-background px-2 py-1 text-xs shadow-sm dark:bg-black dark:border-zinc-700" value={targetCurrency} onChange={(e) => onPrefChange(block.id, e.target.value)}>
                        {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                    </select>
                </div>
            </div>
      );
};

const PaymentWidget = ({ block, formValues, globalVariables, docHash, docSettings }: { block: DocBlock, formValues: FormValues, globalVariables: Variable[], docHash?: string, docSettings?: DocumentSettings }) => {
    const settings = block.paymentSettings;
    const globalGateways = docSettings?.paymentGateways;
    const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
    const [qrCodeData, setQrCodeData] = useState<string | null>(null);
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

    const effectiveProviders = useMemo(() => {
        if (!settings) return [];
        if (settings.enabledProviders && settings.enabledProviders.length > 0) return settings.enabledProviders;
        if (settings.provider) return [settings.provider];
        return ['stripe']; 
    }, [settings]);

    useEffect(() => {
        if (effectiveProviders.length === 1 && !selectedProvider) {
            setSelectedProvider(effectiveProviders[0]);
        }
    }, [effectiveProviders, selectedProvider]);

    const amount = useMemo(() => {
        return PaymentService.calculateAmount(settings, formValues, globalVariables);
    }, [settings, formValues, globalVariables]);

    const handlePay = async () => {
        setStatus('processing');
        if (!selectedProvider || selectedProvider === 'stripe') {
            const result = await PaymentService.processStripePayment(amount, settings?.currency || 'USD');
            setStatus(result.success ? 'success' : 'error');
        } else if (selectedProvider === 'bit') {
            const phoneNumber = globalGateways?.bit?.phoneNumber || '';
            const result = await PaymentService.processBitPayment(phoneNumber, amount);
            setStatus(result.success ? 'success' : 'error');
        } else if (selectedProvider === 'gocardless') {
            const result = await PaymentService.processGoCardlessMandate({ accountHolder: 'John Doe', sortCode: '200000', accountNumber: '12345678' });
            setStatus(result.success ? 'success' : 'error');
        } else if (selectedProvider === 'paypal') {
            const result = await PaymentService.initPayPalCheckout();
            setStatus(result.success ? 'success' : 'error');
        } else if (selectedProvider === 'wise') {
            setStatus('success');
        }
    };

    useEffect(() => {
        if (selectedProvider === 'bit' && globalGateways?.bit?.phoneNumber) {
             setQrCodeData(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=BIT_PAY:${globalGateways.bit.phoneNumber}:${amount}`);
        }
    }, [selectedProvider, globalGateways, amount]);

    if (!settings) return null;

    if (status === 'success') {
        return (
            <div className="p-6 bg-green-50 border-2 border-green-200 text-green-800 flex flex-col items-center justify-center gap-2">
                <CheckCircle2 size={32} />
                <span className="font-bold uppercase tracking-wider">Payment Complete</span>
                <span className="font-mono text-sm">{formatCurrency(amount, settings.currency || 'USD')} paid via {selectedProvider}.</span>
            </div>
        );
    }
    
    return (
        <div className="border-2 border-black dark:border-zinc-700 bg-card p-4 rounded-none shadow-sm">
             <div className="flex justify-between items-end mb-4 border-b pb-4 dark:border-zinc-700">
                 <div>
                     <div className="text-[10px] font-bold uppercase text-muted-foreground font-mono">Amount Due</div>
                     <div className="text-2xl font-black font-mono tracking-tight">{formatCurrency(amount, settings.currency || 'USD')}</div>
                 </div>
                 <Button size="sm" onClick={handlePay} disabled={status === 'processing'}>Pay Now</Button>
             </div>
        </div>
    );
};

// --- Block Renderer Sub-Component ---

interface BlockRendererProps {
    block: DocBlock;
    index: number;
    idPrefix?: string;
    formValues: FormValues;
    handleInputChange: (id: string, val: any) => void;
    parties: Party[];
    simulatedPartyId: string;
    activeFieldIndex: number;
    renderTextWithGlossary: (t: string) => React.ReactNode;
    allBlocksFlat: DocBlock[];
    renderRecursive: (b: DocBlock, i: number, prefix: string) => React.ReactNode;
    userCurrencyPreferences: Record<string, string>;
    setUserCurrencyPreferences: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    validationErrors: Record<string, string>;
    globalVariables: Variable[];
    docHash?: string;
    docSettings?: DocumentSettings;
    onSignBlock: (blockId: string, url: string) => void;
    documentCompleted: boolean; 
}

const BlockRenderer: React.FC<BlockRendererProps> = (props) => {
    const { block, index, idPrefix = '', formValues, handleInputChange, parties, simulatedPartyId, activeFieldIndex, renderTextWithGlossary, allBlocksFlat, renderRecursive, userCurrencyPreferences, setUserCurrencyPreferences, validationErrors, globalVariables, docHash, docSettings, onSignBlock, documentCompleted } = props;
    
    const uniqueId = idPrefix + block.id;
    const isLayoutBlock = [BlockType.SPACER, BlockType.ALERT, BlockType.QUOTE, BlockType.SECTION_BREAK, BlockType.COLUMNS, BlockType.COLUMN, BlockType.TEXT, BlockType.HTML].includes(block.type);
    const assignedParty = isLayoutBlock ? undefined : parties.find(p => p.id === block.assignedToPartyId);
    
    // Lock if: Assigned to other, OR document is globally completed
    const isLocked = documentCompleted || (assignedParty && assignedParty.id !== simulatedPartyId);
    const isActive = index === activeFieldIndex;

    // Structural Blocks
    if (block.type === BlockType.TEXT) return (
        <PartyWrapper id={uniqueId}>
            <div 
                className="prose dark:prose-invert max-w-none text-sm font-serif leading-7 ProseMirror"
                dangerouslySetInnerHTML={{ __html: block.content || '' }}
            />
        </PartyWrapper>
    );
    
    if (block.type === BlockType.COLUMNS) return (
        <PartyWrapper id={uniqueId}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {block.children?.map(col => (
                    <div key={col.id} className="flex flex-col gap-4">{col.children?.map((child, ci) => renderRecursive(child, -1, idPrefix))}</div>
                ))}
            </div>
        </PartyWrapper>
    );

    if (block.type === BlockType.REPEATER) {
        const rowCount = (formValues[uniqueId] as number) || 1;
        return (
            <PartyWrapper id={uniqueId}>
                 <div className="space-y-4 border-l-4 border-indigo-500/20 pl-4 py-2">
                    <Label className="text-indigo-600 dark:text-indigo-400 flex items-center gap-2 mb-2"><Repeat size={14} /> {block.label || "Repeating Group"}</Label>
                    {Array.from({ length: rowCount }).map((_, rIndex) => (
                        <div key={rIndex} className="p-4 border-2 border-dashed border-indigo-200 dark:border-indigo-900 rounded-lg relative bg-indigo-50/20">
                            <div className="absolute top-2 right-2 text-[10px] font-mono text-indigo-400 font-bold uppercase">Item {rIndex + 1}</div>
                            {block.children?.map(child => <div key={child.id} className="mb-3 last:mb-0">{renderRecursive(child, -1, `${uniqueId}_${rIndex}_`)}</div>)}
                            {rowCount > 1 && !isLocked && <button className="text-red-500 hover:text-red-700 text-xs mt-2 flex items-center gap-1" onClick={() => handleInputChange(uniqueId, rowCount - 1)}><Trash2 size={12}/> Remove Item</button>}
                        </div>
                    ))}
                    {!isLocked && <Button size="sm" variant="outline" onClick={() => handleInputChange(uniqueId, rowCount + 1)} className="w-full border-dashed"><Plus size={14} className="mr-2"/> Add Item</Button>}
                </div>
            </PartyWrapper>
        );
    }

    if (block.type === BlockType.CONDITIONAL) {
        if (!block.condition || !block.children) return null;
        const { variableName, operator, value: triggerValue } = block.condition;
        const sourceBlock = allBlocksFlat.find(b => b.variableName === variableName);
        if (!sourceBlock) return null;

        const scopedKey = idPrefix + sourceBlock.id;
        const globalKey = sourceBlock.id;
        const currentValue = formValues[scopedKey] !== undefined ? formValues[scopedKey] : formValues[globalKey];

        const curStr = String(currentValue ?? '');
        const trigStr = String(triggerValue ?? '');
        let isMatch = false;
        switch (operator) {
            case 'equals': isMatch = curStr == trigStr; break;
            case 'not_equals': isMatch = curStr != trigStr; break;
            case 'contains': isMatch = curStr.toLowerCase().includes(trigStr.toLowerCase()); break;
            case 'is_set': isMatch = currentValue !== undefined && currentValue !== '' && currentValue !== null; break;
            default: isMatch = curStr == trigStr;
        }

        if (isMatch) return <div className="pl-4 border-l-2 border-rose-500/20 my-2 animate-in fade-in">{block.children.map(child => renderRecursive(child, -1, idPrefix))}</div>;
        if (block.elseChildren) return <div className="pl-4 border-l-2 border-rose-500/20 my-2 animate-in fade-in">{block.elseChildren.map(child => renderRecursive(child, -1, idPrefix))}</div>;
        return null;
    }

    let content;
    switch(block.type) {
        // Layout Elements
        case BlockType.SPACER: content = <div style={{ height: block.height || 32 }} />; break;
        case BlockType.QUOTE: content = <blockquote className="pl-4 border-l-4 border-black/20 italic text-xl text-muted-foreground font-serif my-4">{block.content}</blockquote>; break;
        case BlockType.ALERT: 
            const colors = { info: 'bg-blue-50 text-blue-800', warning: 'bg-amber-50 text-amber-800', error: 'bg-red-50 text-red-800', success: 'bg-green-50 text-green-800' };
            content = <div className={cn("p-4 border-l-4 rounded-r-sm flex gap-3 my-4", colors[block.variant || 'info'])}>{block.content}</div>; 
            break;
        case BlockType.SECTION_BREAK: content = <hr className="border-t-2 border-black/10 my-4" />; break;

        // --- Native HTML5 Inputs ---
        case BlockType.INPUT: 
            content = (
                <Input 
                    type="text" 
                    value={formValues[uniqueId] || ''} 
                    onChange={(e) => handleInputChange(uniqueId, e.target.value)} 
                    placeholder={block.placeholder} 
                    disabled={isLocked} 
                    autoComplete="off"
                    required={block.required}
                    className={cn(isActive && "ring-2 ring-primary ring-offset-2")}
                />
            ); 
            break;
        case BlockType.EMAIL:
             content = (
                <Input 
                    type="email" 
                    inputMode="email"
                    autoComplete="email"
                    value={formValues[uniqueId] || ''} 
                    onChange={(e) => handleInputChange(uniqueId, e.target.value)} 
                    placeholder={block.placeholder || "name@example.com"} 
                    disabled={isLocked} 
                    required={block.required}
                    className={cn(isActive && "ring-2 ring-primary ring-offset-2")}
                />
             ); 
             break;
        case BlockType.LONG_TEXT:
             content = (
                <Textarea 
                    value={formValues[uniqueId] || ''} 
                    onChange={(e) => handleInputChange(uniqueId, e.target.value)} 
                    placeholder={block.placeholder} 
                    disabled={isLocked} 
                    spellCheck={true}
                    required={block.required}
                    className={cn(isActive && "ring-2 ring-primary ring-offset-2")}
                />
             ); 
             break;
        case BlockType.NUMBER: 
            content = (
                <Input 
                    type="number" 
                    inputMode="decimal"
                    min={block.min} 
                    max={block.max} 
                    step={block.step} 
                    value={formValues[uniqueId] ?? ''} 
                    onChange={(e) => handleInputChange(uniqueId, e.target.value)} 
                    placeholder={block.placeholder || "0"} 
                    disabled={isLocked} 
                    required={block.required}
                    className={cn(isActive && "ring-2 ring-primary ring-offset-2")}
                    onWheel={(e) => e.currentTarget.blur()}
                />
            ); 
            break;
        case BlockType.DATE:
             content = (
                <Input 
                    type="date"
                    value={formValues[uniqueId] || ''} 
                    onChange={(e) => handleInputChange(uniqueId, e.target.value)} 
                    disabled={isLocked} 
                    required={block.required}
                    className={cn(isActive && "ring-2 ring-primary ring-offset-2")}
                />
             );
             break;
        case BlockType.FILE_UPLOAD:
            content = (
                <div className="flex flex-col gap-2">
                    <div className="relative border-2 border-dashed border-black/10 hover:border-black/30 bg-muted/5 transition-colors p-4 flex flex-col items-center justify-center text-center">
                        <FileUp className="w-6 h-6 text-muted-foreground mb-2 opacity-50" />
                        <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">{formValues[uniqueId] ? 'File Selected' : 'Choose File'}</span>
                        <input 
                            type="file"
                            disabled={isLocked}
                            required={block.required}
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if(file) handleInputChange(uniqueId, file.name);
                            }}
                            accept={block.acceptedFileTypes}
                            className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                        />
                    </div>
                    {formValues[uniqueId] && (
                        <div className="text-[10px] font-mono flex items-center gap-1 text-primary">
                            <CheckCircle2 size={10} /> {formValues[uniqueId]}
                        </div>
                    )}
                </div>
            );
            break;
        
        // --- Selection ---
        case BlockType.SELECT:
             content = (
                <div className="relative">
                    <select 
                        className="flex h-10 w-full border-2 border-black/10 bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-900 dark:border-white/20 dark:text-white appearance-none rounded-none"
                        value={formValues[uniqueId] || ''} 
                        onChange={(e) => handleInputChange(uniqueId, e.target.value)} 
                        disabled={isLocked}
                        required={block.required}
                    >
                        <option value="" disabled>Select option...</option>
                        {block.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                        <ChevronDown size={14} />
                    </div>
                </div>
             );
             break;
        case BlockType.CHECKBOX:
             content = (
                 <div className="flex items-center gap-3 p-3 border-2 border-black/5 hover:border-black/20 transition-all bg-white dark:bg-black/20">
                     <input 
                        type="checkbox"
                        id={uniqueId}
                        checked={!!formValues[uniqueId]} 
                        onChange={(e) => handleInputChange(uniqueId, e.target.checked)} 
                        disabled={isLocked}
                        required={block.required}
                        className="w-5 h-5 border-2 border-black rounded-none text-primary focus:ring-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 accent-black dark:accent-white"
                     />
                     <label htmlFor={uniqueId} className="text-xs font-mono font-bold cursor-pointer select-none flex-1 text-foreground uppercase tracking-wide">{block.label || "Confirm"}</label>
                 </div>
             );
             break;
        case BlockType.RADIO:
            content = (
                <div className="flex flex-col gap-2">
                    {block.options?.map((opt, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 hover:bg-black/5 transition-colors">
                            <input 
                                type="radio" 
                                name={uniqueId} 
                                id={`${uniqueId}_${i}`} 
                                value={opt} 
                                checked={formValues[uniqueId] === opt} 
                                onChange={(e) => handleInputChange(uniqueId, e.target.value)}
                                disabled={isLocked}
                                required={block.required}
                                className="w-4 h-4 border-2 border-black text-primary cursor-pointer accent-black dark:accent-white focus:ring-0"
                            />
                            <Label htmlFor={`${uniqueId}_${i}`} className="mb-0 cursor-pointer normal-case text-sm font-sans font-medium text-foreground">{opt}</Label>
                        </div>
                    ))}
                </div>
            );
            break;

        // --- Complex Blocks ---
        case BlockType.SIGNATURE:
            content = (
                <div className={cn(isLocked && "opacity-70")}>
                    <SignatureWidget 
                        initialValue={block.content || formValues[uniqueId]} 
                        onSign={(val) => onSignBlock(block.id, val)} 
                        signatureId={block.signatureId} 
                        signedAt={block.signedAt}
                        disabled={isLocked} 
                    />
                </div>
            );
            break;
        case BlockType.CURRENCY:
            content = <CurrencyWidget block={block} formValues={formValues} userPrefs={userCurrencyPreferences} onPrefChange={(id, v) => setUserCurrencyPreferences(p => ({...p, [id]: v}))} />;
            break;
        case BlockType.PAYMENT:
            content = <PaymentWidget block={block} formValues={formValues} globalVariables={globalVariables} docHash={docHash} docSettings={docSettings} />;
            break;
        case BlockType.IMAGE:
             content = block.src ? <img src={block.src} alt="Embedded" className="w-full max-h-[400px] object-contain border-2 border-black/10" /> : <div className="p-8 border-2 border-dashed border-black/10 text-center text-muted-foreground uppercase font-mono text-xs">Image Placeholder</div>;
             break;
        case BlockType.VIDEO:
             content = block.videoUrl ? <div className="aspect-video bg-black flex items-center justify-center text-white font-mono text-xs">VIDEO EMBED: {block.videoUrl}</div> : <div className="p-8 border-2 border-dashed border-black/10 text-center text-muted-foreground uppercase font-mono text-xs">Video Placeholder</div>;
             break;
        case BlockType.FORMULA:
             content = (
                <div className="h-10 bg-indigo-50/50 border-2 border-indigo-100 flex items-center px-3 text-sm font-mono font-bold text-indigo-800">
                     ƒx = {SafeFormula.evaluate(block.formula || '', formValues) || 0}
                </div>
             );
             break;
        default: content = null;
    }

    return (
        <PartyWrapper id={uniqueId} assignedTo={assignedParty} locked={isLocked} lockedBy={assignedParty?.name}>
             <div className={cn("mb-6 transition-all duration-500", isActive && "scale-[1.01]")}>
                {block.label && !isLayoutBlock && block.type !== BlockType.CHECKBOX && (
                    <Label className="mb-2 block text-muted-foreground flex justify-between text-xs uppercase font-bold tracking-wider">
                        {block.label} 
                        {block.required && <span className="text-red-500 ml-1" title="Required">*</span>}
                        {validationErrors[uniqueId] && <span className="text-red-500 text-[10px] normal-case ml-auto">{validationErrors[uniqueId]}</span>}
                    </Label>
                )}
                {content}
             </div>
        </PartyWrapper>
    );
};

// --- Main Viewer Component ---

export const Viewer: React.FC<ViewerProps> = ({ blocks, snapshot, parties = [], variables = [], terms = [], isPreview = false, settings, docHash, onSigningComplete, status, verifiedIdentifier }) => {
  const [formValues, setFormValues] = useState<FormValues>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [userCurrencyPreferences, setUserCurrencyPreferences] = useState<Record<string, string>>({});
  const [simulatedPartyId, setSimulatedPartyId] = useState<string>(parties[0]?.id || 'p1');
  const [activeFieldIndex, setActiveFieldIndex] = useState<number>(-1);
  const [isCompleted, setIsCompleted] = useState(status === 'completed');
  const [docId, setDocId] = useState('doc_sample'); 

  // Update completion state if status changes from prop
  useEffect(() => {
    if (status === 'completed') setIsCompleted(true);
  }, [status]);

  const allBlocksFlat = useMemo(() => {
      const flat: DocBlock[] = [];
      const traverse = (list: DocBlock[]) => {
          list.forEach(b => {
              flat.push(b);
              if(b.children) traverse(b.children);
              if(b.elseChildren) traverse(b.elseChildren);
          });
      };
      traverse(blocks);
      return flat;
  }, [blocks]);

  // Sync initial form values from blocks (if they have content)
  useEffect(() => {
      const initial: FormValues = {};
      allBlocksFlat.forEach(b => {
          if (b.content && b.type !== BlockType.TEXT) {
              initial[b.id] = b.content;
          }
      });
      setFormValues(initial);
  }, [allBlocksFlat]);

  const handleInputChange = (id: string, val: any) => {
      setFormValues(prev => ({ ...prev, [id]: val }));
      if (validationErrors[id]) {
          setValidationErrors(p => { const n = {...p}; delete n[id]; return n; });
      }
  };

  const handleSignBlock = async (blockId: string, url: string) => {
      // 1. Update Local UI immediately
      handleInputChange(blockId, url);
      
      // 2. Perform Secure Transaction
      if (url && !isPreview) {
          try {
              // Capture metadata
              const userAgent = navigator.userAgent;
              const ip = await fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => data.ip).catch(() => '127.0.0.1');
              
              // Capture Geolocation for Audit Trail
              let locationString = '';
              try {
                  const pos: any = await new Promise((resolve, reject) => {
                      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
                  });
                  if (pos && pos.coords) {
                      locationString = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
                  }
              } catch (e) {
                  // Geo permission denied or timeout
              }

              const result = await SupabaseService.signDocumentBlock(
                  docId, 
                  blockId, 
                  {
                    url,
                    timestamp: Date.now(),
                    ip,
                    userAgent,
                    location: locationString
                  }, 
                  simulatedPartyId,
                  verifiedIdentifier // Pass 2FA info
              );

              if (result.success && result.updatedDoc?.status === 'completed') {
                  setIsCompleted(true);
                  if(onSigningComplete) onSigningComplete(docId);
              }
          } catch (e) {
              console.error("Signing failed", e);
          }
      }
  };

  const progress = useMemo(() => {
      const totalRequired = allBlocksFlat.filter(b => b.required).length;
      if (totalRequired === 0) return 100;
      const filled = allBlocksFlat.filter(b => b.required && formValues[b.id]).length;
      return Math.round((filled / totalRequired) * 100);
  }, [allBlocksFlat, formValues]);

  const renderRecursive = (block: DocBlock, index: number, prefix: string) => (
      <BlockRenderer 
        key={block.id} 
        block={block} 
        index={index} 
        idPrefix={prefix}
        formValues={formValues}
        handleInputChange={handleInputChange}
        parties={parties}
        simulatedPartyId={simulatedPartyId}
        activeFieldIndex={activeFieldIndex}
        renderTextWithGlossary={(t) => <div dangerouslySetInnerHTML={{ __html: t }} />}
        allBlocksFlat={allBlocksFlat}
        renderRecursive={renderRecursive}
        userCurrencyPreferences={userCurrencyPreferences}
        setUserCurrencyPreferences={setUserCurrencyPreferences}
        validationErrors={validationErrors}
        globalVariables={variables}
        docHash={docHash}
        docSettings={settings}
        onSignBlock={handleSignBlock}
        documentCompleted={isCompleted} // Pass locking state down
      />
  );

  return (
    <div className="max-w-5xl mx-auto p-8 pb-32 relative min-h-screen bg-muted/10 bg-grid-pattern pt-24">
        {isCompleted && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-zinc-900 p-8 border-2 border-black dark:border-white shadow-2xl max-w-md text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-200">
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Document Finalized</h2>
                    <p className="text-muted-foreground text-sm mb-6">All parties have signed. A secure audit trail has been generated and emailed to all participants.</p>
                    <Button onClick={() => setIsCompleted(false)} className="w-full">View Signed Document</Button>
                </div>
            </div>
        )}

        {/* Preview Controls */}
        {isPreview && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-full max-w-[850px] px-4">
                <Card className="p-2 bg-white dark:bg-black border-2 border-black dark:border-white shadow-sm inline-block pointer-events-auto">
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black font-mono uppercase tracking-wide text-black dark:text-white">Viewing as:</span>
                        <div className="flex gap-1">
                            {parties.map(p => (
                                <button key={p.id} onClick={() => setSimulatedPartyId(p.id)} className={cn("px-2 py-0.5 text-[10px] font-bold font-mono uppercase border border-black dark:border-white transition-all", simulatedPartyId === p.id ? "bg-primary text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-[1px]" : "bg-transparent hover:bg-black/5")}>{p.name}</button>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        )}

        <div className="max-w-[850px] mx-auto bg-white dark:bg-black border-2 border-black dark:border-zinc-800 shadow-hypr dark:shadow-hypr-dark relative transition-all p-16 min-h-[1100px]" dir={settings?.direction || 'ltr'}>
             <div className="absolute top-4 right-4 flex items-center gap-2">
                 {verifiedIdentifier && (
                     <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2 py-1 flex items-center gap-2">
                        <ShieldCheck size={10} className="text-green-600" />
                        <span className="font-mono text-[9px] uppercase tracking-widest text-green-700">{verifiedIdentifier}</span>
                     </div>
                 )}
                 <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-2 py-1 flex items-center gap-2">
                     <Lock size={10} className={isCompleted ? "text-green-600" : "text-muted-foreground"} />
                     <span className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{docHash ? docHash.substring(0, 16) + '...' : 'CALCULATING...'}</span>
                 </div>
             </div>

            <div className="mb-12 text-center border-b-2 border-black/10 dark:border-white/10 pb-6">
                {settings?.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-12 mx-auto mb-4 object-contain" />}
                <h1 className="text-3xl font-black tracking-tight mb-2 font-mono uppercase text-foreground dark:text-white">{blocks[0]?.content ? (blocks[0].content.includes('<h1>') ? '' : 'Untitled Document') : 'Untitled Document'}</h1>
                {isCompleted && <Badge variant="default" className="bg-green-600 border-green-700 text-white mt-2">LEGALLY BINDING & LOCKED</Badge>}
            </div>

            <div className="space-y-6">
                {blocks.map((block, i) => renderRecursive(block, i, ''))}
            </div>
        </div>
        
        {/* Progress Bar Footer */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
            <div className="bg-black dark:bg-zinc-900 text-white p-3 border-2 border-white/20 shadow-2xl flex items-center justify-between gap-4 pr-4 pl-5">
                 <div className="flex flex-col flex-1">
                     <span className="text-[9px] font-bold font-mono uppercase tracking-widest mb-1 text-primary">Progress</span>
                     <div className="h-1.5 w-full bg-white/20 overflow-hidden"><div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: `${progress}%` }} /></div>
                 </div>
                 <div className="flex items-center gap-2">
                     <Button size="sm" className="bg-primary text-black hover:bg-white font-bold font-mono h-8" disabled={isCompleted}>
                         {progress === 100 ? "FINISH" : "NEXT"} {progress === 100 ? <CheckCircle2 size={14} className="ml-1.5"/> : <ChevronRight size={14} className="ml-1.5" />}
                     </Button>
                 </div>
            </div>
        </div>
    </div>
  );
};
