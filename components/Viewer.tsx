
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
  snapshot?: DocBlock[] | undefined;
  parties?: Party[] | undefined;
  variables?: Variable[] | undefined;
  terms?: Term[] | undefined;
  isPreview?: boolean | undefined;
  settings?: DocumentSettings | undefined;
  docHash?: string | undefined; // Passed from parent
  onSigningComplete?: ((docId: string) => void) | undefined;
  status?: 'draft' | 'sent' | 'completed' | 'archived' | undefined; // Add status prop
  verifiedIdentifier?: string | undefined; // NEW: from 2FA
}

// --- Helper Components ---

const PartyWrapper: React.FC<{ children: React.ReactNode; assignedTo?: Party | undefined; locked?: boolean | undefined; lockedBy?: string | undefined; id?: string | undefined }> = ({ children, assignedTo, locked, lockedBy, id }) => {
    if (!assignedTo) return <div id={id} className="my-4 relative group">{children}</div>;
    return (
        <div id={id} className="my-4 relative pl-4 border-l-4 transition-all group scroll-mt-32 rounded-none" style={{ borderLeftColor: assignedTo.color }}>
            {children}
            {locked && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-[1px]">
                    <div className="bg-background/90 dark:bg-zinc-900/90 border-2 border-muted p-2 rounded-none shadow-sharp flex items-center gap-2 text-xs font-semibold text-muted-foreground backdrop-blur-md uppercase tracking-wider font-mono">
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
                if (typeof sourceVal === 'number') return sourceVal;
                return parseFloat(String(sourceVal)) || 0;
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

      if (!block.currencySettings) return <div className="text-red-500 text-xs font-bold font-mono border border-red-200 bg-red-50 p-2">INVALID CONFIG</div>;
      const convertedAmount = rate !== null ? baseAmount * rate : 0;

      return (
            <div className="flex items-center gap-4 p-4 bg-white dark:bg-black border-2 border-black dark:border-white shadow-sm">
                <div className="flex-1">
                    <div className="text-2xl font-black tracking-tighter font-mono">{loading ? '...' : new Intl.NumberFormat('en-US', { style: 'currency', currency: targetCurrency }).format(convertedAmount)}</div>
                    <div className="text-[10px] text-muted-foreground mt-1 font-mono uppercase tracking-wide">{loading ? 'FETCHING RATES...' : `1 ${baseCurrency} = ${rate?.toFixed(4)} ${targetCurrency}`}</div>
                </div>
                <div>
                    <select 
                        className="h-10 rounded-none border-2 border-black bg-transparent px-3 py-1 text-xs font-bold uppercase shadow-none focus:shadow-sharp transition-shadow cursor-pointer dark:border-white dark:bg-black dark:text-white" 
                        value={targetCurrency} 
                        onChange={(e) => onPrefChange(block.id, e.target.value)}
                    >
                        {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                    </select>
                </div>
            </div>
      );
};

const PaymentWidget = ({ block, formValues, globalVariables, docHash, docSettings, allBlocks }: { block: DocBlock, formValues: FormValues, globalVariables: Variable[], docHash?: string | undefined, docSettings?: DocumentSettings | undefined, allBlocks: DocBlock[] }) => {
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
            setSelectedProvider(effectiveProviders[0] || null);
        }
    }, [effectiveProviders, selectedProvider]);

    const amount = useMemo(() => {
        return PaymentService.calculateAmount(settings, formValues, globalVariables, allBlocks);
    }, [settings, formValues, globalVariables, allBlocks]);

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
            <div className="p-6 bg-green-50 border-2 border-green-600 text-green-800 flex flex-col items-center justify-center gap-2 shadow-sharp">
                <CheckCircle2 size={32} />
                <span className="font-bold uppercase tracking-wider">Payment Complete</span>
                <span className="font-mono text-sm">{formatCurrency(amount, settings.currency || 'USD')} paid via {selectedProvider}.</span>
            </div>
        );
    }
    
    return (
        <div className="border-2 border-black dark:border-white bg-card p-6 rounded-none shadow-sm hover:shadow-sharp transition-shadow">
             <div className="flex justify-between items-end mb-4 border-b-2 border-black/10 pb-4 dark:border-white/10">
                 <div>
                     <div className="text-[10px] font-bold uppercase text-muted-foreground font-mono tracking-widest mb-1">Amount Due</div>
                     <div className="text-3xl font-black font-mono tracking-tighter">{formatCurrency(amount, settings.currency || 'USD')}</div>
                 </div>
                 <Button size="lg" onClick={handlePay} disabled={status === 'processing'} className="h-12 px-8 text-base">
                    {status === 'processing' ? 'Processing...' : 'Pay Now'}
                 </Button>
             </div>
             {/* Provider Selection could go here if > 1 provider */}
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
    docHash?: string | undefined;
    docSettings?: DocumentSettings | undefined;
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

    // Common Input Styles to ensure consistency
    const commonInputClass = cn(
        "font-inherit border-2 border-black/20 focus:border-black dark:border-white/20 dark:focus:border-white rounded-none shadow-none focus:shadow-sharp transition-all bg-transparent px-3 py-2",
        isActive && "border-primary ring-1 ring-primary focus:border-primary",
        isLocked && "opacity-50 cursor-not-allowed bg-muted/20"
    );

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                 <div className="space-y-4 border-l-4 border-black/10 dark:border-white/10 pl-6 py-2">
                    <Label className="flex items-center gap-2 mb-2 text-primary font-black"><Repeat size={14} /> {block.label || "Repeating Group"}</Label>
                    {Array.from({ length: rowCount }).map((_, rIndex) => (
                        <div key={rIndex} className="p-6 border-2 border-dashed border-black/10 dark:border-white/10 relative bg-muted/5">
                            <div className="absolute top-2 right-2 text-[10px] font-mono text-muted-foreground font-bold uppercase tracking-widest">Item {rIndex + 1}</div>
                            {block.children?.map(child => <div key={child.id} className="mb-4 last:mb-0">{renderRecursive(child, -1, `${uniqueId}_${rIndex}_`)}</div>)}
                            {rowCount > 1 && !isLocked && <button className="text-red-600 hover:text-red-800 text-[10px] uppercase font-bold mt-4 flex items-center gap-1" onClick={() => handleInputChange(uniqueId, rowCount - 1)}><Trash2 size={12}/> Remove Item</button>}
                        </div>
                    ))}
                    {!isLocked && <Button size="sm" variant="outline" onClick={() => handleInputChange(uniqueId, rowCount + 1)} className="w-full border-dashed border-2 hover:border-solid hover:shadow-sharp"><Plus size={14} className="mr-2"/> Add Item</Button>}
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

        if (isMatch) return <div className="pl-6 border-l-2 border-black/5 dark:border-white/5 my-4 animate-in fade-in slide-in-from-left-2">{block.children.map(child => renderRecursive(child, -1, idPrefix))}</div>;
        if (block.elseChildren) return <div className="pl-6 border-l-2 border-black/5 dark:border-white/5 my-4 animate-in fade-in slide-in-from-left-2">{block.elseChildren.map(child => renderRecursive(child, -1, idPrefix))}</div>;
        return null;
    }

    let content;
    switch(block.type) {
        // Layout Elements
        case BlockType.SPACER: content = <div style={{ height: block.height || 32 }} />; break;
        case BlockType.QUOTE: content = <blockquote className="pl-6 border-l-4 border-black dark:border-white italic text-xl text-foreground font-serif my-6 py-2">{block.content}</blockquote>; break;
        case BlockType.ALERT: 
            const colors = { info: 'bg-blue-50 border-blue-600 text-blue-900', warning: 'bg-amber-50 border-amber-500 text-amber-900', error: 'bg-red-50 border-red-600 text-red-900', success: 'bg-green-50 border-green-600 text-green-900' };
            const icons = { info: Info, warning: AlertTriangle, error: XOctagon, success: CheckCircle2 };
            const AlertIcon = icons[block.variant || 'info'];
            
            content = (
                <div className={cn("p-4 border-l-4 shadow-sm flex gap-4 my-6 items-start", colors[block.variant || 'info'])}>
                    <AlertIcon size={24} className="shrink-0 mt-0.5" />
                    <div className="text-sm font-medium leading-relaxed">{block.content || "Important information."}</div>
                </div>
            ); 
            break;
        case BlockType.SECTION_BREAK: content = <hr className="border-t-2 border-black/10 my-8 dark:border-white/10" />; break;

        // --- Native HTML5 Inputs ---
        case BlockType.INPUT: 
            content = (
                <Input 
                    type="text" 
                    value={(formValues[uniqueId] as string) || ''} 
                    onChange={(e) => handleInputChange(uniqueId, e.target.value)} 
                    placeholder={block.placeholder} 
                    disabled={isLocked} 
                    autoComplete="off"
                    required={block.required}
                    className={commonInputClass}
                />
            ); 
            break;
        case BlockType.EMAIL:
             content = (
                <Input 
                    type="email" 
                    inputMode="email"
                    autoComplete="email"
                    value={(formValues[uniqueId] as string) || ''} 
                    onChange={(e) => handleInputChange(uniqueId, e.target.value)} 
                    placeholder={block.placeholder || "name@example.com"} 
                    disabled={isLocked} 
                    required={block.required}
                    className={commonInputClass}
                />
             ); 
             break;
        case BlockType.LONG_TEXT:
             content = (
                <Textarea 
                    value={(formValues[uniqueId] as string) || ''} 
                    onChange={(e) => handleInputChange(uniqueId, e.target.value)} 
                    placeholder={block.placeholder} 
                    disabled={isLocked} 
                    spellCheck={true}
                    required={block.required}
                    className={cn(commonInputClass, "min-h-[120px] leading-relaxed")}
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
                    value={(formValues[uniqueId] as number | string) ?? ''} 
                    onChange={(e) => handleInputChange(uniqueId, e.target.value)} 
                    placeholder={block.placeholder || "0"} 
                    disabled={isLocked} 
                    required={block.required}
                    className={commonInputClass}
                    onWheel={(e) => e.currentTarget.blur()}
                />
            ); 
            break;
        case BlockType.DATE:
             content = (
                <Input 
                    type="date"
                    value={(formValues[uniqueId] as string) || ''} 
                    onChange={(e) => handleInputChange(uniqueId, e.target.value)} 
                    disabled={isLocked} 
                    required={block.required}
                    className={commonInputClass}
                />
             );
             break;
        case BlockType.FILE_UPLOAD:
            content = (
                <div className="flex flex-col gap-2">
                    <div className={cn(
                        "relative border-2 border-dashed transition-all p-6 flex flex-col items-center justify-center text-center group",
                         formValues[uniqueId] ? "border-green-500 bg-green-50/20" : "border-black/20 hover:border-black bg-muted/5 hover:bg-white dark:border-white/20 dark:hover:border-white"
                    )}>
                        <FileUp className={cn("w-8 h-8 mb-2 transition-colors", formValues[uniqueId] ? "text-green-600" : "text-muted-foreground group-hover:text-black dark:group-hover:text-white")} />
                        <span className="text-xs font-bold font-mono uppercase tracking-widest text-muted-foreground">{formValues[uniqueId] ? 'File Ready' : 'Upload File'}</span>
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
                        <div className="text-[10px] font-mono flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 border border-green-200 w-fit">
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
                        className={cn(
                            commonInputClass, 
                            "appearance-none pr-8 cursor-pointer h-12"
                        )}
                        value={(formValues[uniqueId] as string) || ''} 
                        onChange={(e) => handleInputChange(uniqueId, e.target.value)} 
                        disabled={isLocked}
                        required={block.required}
                    >
                        <option value="" disabled>Select option...</option>
                        {block.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                        <ChevronDown size={16} />
                    </div>
                </div>
             );
             break;
        case BlockType.CHECKBOX:
             content = (
                 <label className={cn(
                     "flex items-center gap-4 p-4 border-2 transition-all cursor-pointer select-none group",
                     !!formValues[uniqueId] ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black shadow-sharp" : "border-black/10 bg-white hover:border-black/30 dark:bg-black dark:border-white/20"
                 )}>
                     <input 
                        type="checkbox"
                        id={uniqueId}
                        checked={!!formValues[uniqueId]} 
                        onChange={(e) => handleInputChange(uniqueId, e.target.checked)} 
                        disabled={isLocked}
                        required={block.required}
                        className="sr-only" 
                     />
                     <div className={cn(
                         "w-6 h-6 border-2 flex items-center justify-center shrink-0 transition-all",
                         !!formValues[uniqueId] ? "border-white bg-black dark:border-black dark:bg-white" : "border-black/30 bg-transparent group-hover:border-black"
                     )}>
                         {!!formValues[uniqueId] && <CheckCircle2 size={16} className={!!formValues[uniqueId] ? "text-white dark:text-black" : "opacity-0"} />}
                     </div>
                     <span className="text-sm font-bold font-mono uppercase tracking-wide flex-1">{block.label || "Confirm"}</span>
                 </label>
             );
             break;
        case BlockType.RADIO:
            content = (
                <div className="flex flex-col gap-3">
                    {block.options?.map((opt, i) => {
                        const isChecked = formValues[uniqueId] === opt;
                        return (
                            <label key={i} className={cn(
                                "flex items-center gap-4 p-3 border-2 transition-all cursor-pointer select-none group hover:shadow-sharp-sm",
                                isChecked ? "border-black bg-black/5 dark:border-white dark:bg-white/10" : "border-black/10 bg-white hover:border-black/30 dark:bg-black dark:border-white/20"
                            )}>
                                <input 
                                    type="radio" 
                                    name={uniqueId} 
                                    value={opt} 
                                    checked={isChecked} 
                                    onChange={(e) => handleInputChange(uniqueId, e.target.value)}
                                    disabled={isLocked}
                                    required={block.required}
                                    className="sr-only"
                                />
                                <div className={cn(
                                    "w-5 h-5 border-2 rounded-full flex items-center justify-center shrink-0 transition-all",
                                    isChecked ? "border-primary" : "border-black/30 group-hover:border-black dark:border-white/30"
                                )}>
                                    <div className={cn("w-2.5 h-2.5 rounded-full bg-primary transition-transform duration-200", isChecked ? "scale-100" : "scale-0")} />
                                </div>
                                <span className={cn("text-sm font-medium", isChecked && "font-bold")}>{opt}</span>
                            </label>
                        )
                    })}
                </div>
            );
            break;

        // --- Complex Blocks ---
        case BlockType.SIGNATURE:
            content = (
                <div className={cn(isLocked && "opacity-80 pointer-events-none")}>
                    <SignatureWidget 
                        initialValue={block.content || (formValues[uniqueId] as string)} 
                        onSign={(val: string) => onSignBlock(block.id, val)} 
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
            content = <PaymentWidget block={block} formValues={formValues} globalVariables={globalVariables} docHash={docHash} docSettings={docSettings} allBlocks={allBlocksFlat} />;
            break;
        case BlockType.IMAGE:
             content = block.src ? <img src={block.src} alt="Embedded" className="w-full max-h-[500px] object-contain border-2 border-black/10 dark:border-white/10 bg-muted/5" /> : <div className="p-8 border-2 border-dashed border-black/10 text-center text-muted-foreground uppercase font-mono text-xs">Image Placeholder</div>;
             break;
        case BlockType.VIDEO:
             content = block.videoUrl ? <div className="aspect-video bg-black flex items-center justify-center text-white font-mono text-xs border-2 border-black dark:border-white/20">VIDEO EMBED: {block.videoUrl}</div> : <div className="p-8 border-2 border-dashed border-black/10 text-center text-muted-foreground uppercase font-mono text-xs">Video Placeholder</div>;
             break;
        case BlockType.FORMULA:
             content = (
                <div className="h-12 bg-indigo-50/50 border-2 border-indigo-100 flex items-center px-4 text-sm font-mono font-bold text-indigo-800 shadow-sm">
                     <span className="opacity-50 mr-2">ƒx =</span> {SafeFormula.evaluate(block.formula || '', formValues) || 0}
                </div>
             );
             break;
        default: content = null;
    }

    return (
        <PartyWrapper id={uniqueId} assignedTo={assignedParty} locked={isLocked} lockedBy={assignedParty?.name}>
             <div className={cn("mb-8 transition-all duration-300", isActive && "translate-x-1")}>
                {block.label && !isLayoutBlock && block.type !== BlockType.CHECKBOX && (
                    <Label className="mb-2 block text-muted-foreground flex justify-between text-xs uppercase font-bold tracking-wider select-none">
                        {block.label} 
                        {block.required && <span className="text-red-500 ml-1" title="Required">*</span>}
                        {validationErrors[uniqueId] && <span className="text-red-500 text-[10px] normal-case ml-auto animate-pulse font-bold">{validationErrors[uniqueId]}</span>}
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
          if (b.content && b.type !== BlockType.TEXT && b.type !== BlockType.ALERT) {
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
      handleInputChange(blockId, url);
      
      if (url && !isPreview) {
          try {
              const userAgent = navigator.userAgent;
              const ip = await fetch('https://api.ipify.org?format=json').then(res => res.json()).then(data => data.ip).catch(() => '127.0.0.1');
              
              let locationString = '';
              try {
                  const pos: any = await new Promise((resolve, reject) => {
                      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
                  });
                  if (pos && pos.coords) {
                      locationString = `${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`;
                  }
              } catch (e) {
                  // Geo permission denied
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
                  verifiedIdentifier 
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

  // --- WIZARD LOGIC ---
  
  const getNextRequiredField = () => {
      return allBlocksFlat.find(b => {
          // 1. Must be required
          if (!b.required) return false;
          // 2. Must be empty
          const val = formValues[b.id];
          if (val) return false;
          // 3. Must be assigned to current party (or no assignment for some types)
          // But strict logic: only assigned blocks block the wizard
          if (b.assignedToPartyId && b.assignedToPartyId !== simulatedPartyId) return false;
          
          return true;
      });
  };

  const nextField = getNextRequiredField();
  
  const handleWizardNext = () => {
      if (nextField) {
          const el = document.getElementById(nextField.id);
          if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              const input = el.querySelector('input, select, textarea');
              if (input instanceof HTMLElement) input.focus();
          }
      } else {
          // Finished?
      }
  };

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
        documentCompleted={isCompleted} 
      />
  );

  return (
    <div className="max-w-5xl mx-auto p-8 pb-32 relative min-h-screen bg-muted/10 bg-grid-pattern pt-24 font-sans">
        {isCompleted && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
                <div className="bg-white dark:bg-zinc-900 p-8 border-2 border-black dark:border-white shadow-2xl max-w-md text-center">
                    <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-200">
                        <ShieldCheck size={32} />
                    </div>
                    <h2 className="text-2xl font-bold mb-2 uppercase font-mono tracking-tight">Document Finalized</h2>
                    <p className="text-muted-foreground text-sm mb-6">All parties have signed. A secure audit trail has been generated and emailed to all participants.</p>
                    <Button onClick={() => setIsCompleted(false)} className="w-full">View Signed Document</Button>
                </div>
            </div>
        )}

        {/* Preview Controls */}
        {isPreview && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none w-full max-w-[850px] px-4">
                <Card className="p-2 bg-white dark:bg-black border-2 border-black dark:border-white shadow-sharp inline-block pointer-events-auto">
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

        <div 
            className="max-w-[850px] mx-auto bg-white dark:bg-black border-2 border-black dark:border-zinc-800 shadow-hypr dark:shadow-hypr-dark relative transition-all p-16 min-h-[1100px]" 
            dir={settings?.direction || 'ltr'}
            style={{ fontFamily: settings?.fontFamily || 'inherit' }}
        >
             <div className="absolute top-4 right-4 flex items-center gap-2 font-mono">
                 {verifiedIdentifier && (
                     <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-2 py-1 flex items-center gap-2">
                        <ShieldCheck size={10} className="text-green-600" />
                        <span className="text-[9px] uppercase tracking-widest text-green-700">{verifiedIdentifier}</span>
                     </div>
                 )}
                 <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 px-2 py-1 flex items-center gap-2">
                     <Lock size={10} className={isCompleted ? "text-green-600" : "text-muted-foreground"} />
                     <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{docHash ? docHash.substring(0, 16) + '...' : 'CALCULATING...'}</span>
                 </div>
             </div>

            <div className="mb-12 text-center border-b-2 border-black/10 dark:border-white/10 pb-6">
                {settings?.logoUrl && <img src={settings.logoUrl} alt="Logo" className="h-16 mx-auto mb-6 object-contain" />}
                <h1 className="text-4xl font-black tracking-tight mb-2 uppercase text-foreground dark:text-white">{blocks[0]?.content ? (blocks[0].content.includes('<h1>') ? '' : 'Untitled Document') : 'Untitled Document'}</h1>
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
                     <span className="text-[9px] font-bold font-mono uppercase tracking-widest mb-1 text-primary">Next Action</span>
                     <div className="text-xs font-mono truncate max-w-[200px] text-white/70">
                         {nextField ? `Fill: ${nextField.label || 'Required Field'}` : "All actions complete"}
                     </div>
                 </div>
                 <div className="flex items-center gap-2">
                     <Button 
                        size="sm" 
                        className={cn("bg-primary text-black hover:bg-white font-bold font-mono h-8 border-none", !nextField && "bg-green-500 text-black")}
                        disabled={isCompleted}
                        onClick={handleWizardNext}
                     >
                         {nextField ? "NEXT" : "COMPLETE"} {nextField ? <ChevronRight size={14} className="ml-1.5" /> : <CheckCircle2 size={14} className="ml-1.5"/>}
                     </Button>
                 </div>
            </div>
        </div>
    </div>
  );
};
