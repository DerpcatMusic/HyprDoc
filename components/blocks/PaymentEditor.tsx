
import React from 'react';
import { EditorBlockProps } from '../../types';
import { CreditCard, ExternalLink, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn, Input, Label, Switch, Badge } from '../ui-components';
import { useBlockDrag } from '../../hooks/useBlockDrag';
import { useDocument } from '../../context/DocumentContext';

export const PaymentEditor: React.FC<EditorBlockProps> = (props) => {
    const { block, onUpdate, onDelete, onSelect, isSelected, docSettings } = props;
    const { doc, setMode } = useDocument();
    const { elementRef, handleDragStartInternal, handleDropInternal } = useBlockDrag(block, props.onDragStart, props.onDrop);
    
    // Default safe values
    const settings = block.paymentSettings || { 
        amountType: 'fixed', amount: 0, currency: 'USD', enabledProviders: ['stripe'] 
    };

    const enabledProviders = settings.enabledProviders || [];

    const handleSettingChange = (key: string, value: any) => {
        onUpdate(block.id, { 
            paymentSettings: { ...settings, [key]: value } 
        });
    };

    const toggleProvider = (providerId: string, enabled: boolean) => {
        let newProviders = [...enabledProviders];
        if (enabled) {
            if (!newProviders.includes(providerId)) newProviders.push(providerId);
        } else {
            newProviders = newProviders.filter(p => p !== providerId);
        }
        onUpdate(block.id, { 
            paymentSettings: { ...settings, enabledProviders: newProviders } 
        });
    };
    
    // Check global configuration status
    const isConfigured = (provider: string) => {
        const gateways = docSettings?.paymentGateways as any;
        if (!gateways) return false;
        const config = gateways[provider];
        if (!config) return false;
        
        // Basic check for required keys
        if (provider === 'stripe') return !!config.publishableKey;
        if (provider === 'bit') return !!config.phoneNumber;
        if (provider === 'wise') return !!config.recipientEmail;
        if (provider === 'paypal') return !!config.clientId;
        if (provider === 'gocardless') return !!config.merchantId;
        return false;
    };

    const numericVariables = doc.variables.filter(v => !isNaN(parseFloat(v.value)));

    const SelectedHeader = ({ label, onDelete }: { label: string, onDelete: () => void }) => (
        <div className="absolute -top-3 right-0 flex border-2 border-black dark:border-white bg-white dark:bg-black shadow-sharp z-50 h-6">
            <div className="px-2 flex items-center bg-black dark:bg-white text-white dark:text-black text-[9px] font-bold font-mono uppercase">{label}</div>
            <button className="px-2 hover:bg-red-600 hover:text-white dark:text-white transition-colors" onClick={(e) => { e.stopPropagation(); onDelete(); }}><Trash2 size={12} /></button>
        </div>
    )

    return (
        <div ref={elementRef}
             className={cn("relative group mb-3 border-2 transition-all p-4 bg-white dark:bg-black/20", isSelected ? "border-primary z-20" : "border-black/10 hover:border-black/30")}
             onClick={(e) => { e.stopPropagation(); onSelect(block.id); }}
             draggable onDragStart={handleDragStartInternal} onDragEnd={props.onDragEnd} onDragOver={(e) => e.preventDefault()} onDrop={handleDropInternal}>
             
             {isSelected && <SelectedHeader label="PAYMENT" onDelete={() => onDelete(block.id)} />}

             <div className="flex items-center gap-2 mb-4 text-xs font-bold font-mono uppercase tracking-widest text-muted-foreground border-b pb-2">
                 <CreditCard size={14} /> Payment Gateway
             </div>

             <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                         <Label>Calculation Mode</Label>
                         <select 
                             className="w-full text-xs h-8 border border-input bg-transparent"
                             value={settings.amountType}
                             onChange={(e) => handleSettingChange('amountType', e.target.value)}
                         >
                             <option value="fixed">Fixed Amount</option>
                             <option value="variable">From Variable</option>
                             <option value="percent">Percentage (Deposit)</option>
                         </select>
                     </div>
                     <div>
                         <Label>Currency</Label>
                         <select 
                            className="w-full text-xs h-8 border border-input bg-transparent"
                            value={settings.currency}
                            onChange={(e) => handleSettingChange('currency', e.target.value)}
                         >
                             {['USD', 'EUR', 'GBP', 'ILS', 'CAD', 'AUD'].map(c => <option key={c} value={c}>{c}</option>)}
                         </select>
                     </div>
                 </div>

                 {settings.amountType === 'fixed' && (
                     <div>
                         <Label>Amount</Label>
                         <Input type="number" className="h-8" value={settings.amount} onChange={(e) => handleSettingChange('amount', parseFloat(e.target.value))} />
                     </div>
                 )}

                 {settings.amountType === 'variable' && (
                     <div>
                         <Label>Source Variable</Label>
                         <select 
                            className="w-full text-xs h-8 border border-input bg-transparent"
                            value={settings.variableName || ''}
                            onChange={(e) => handleSettingChange('variableName', e.target.value)}
                         >
                             <option value="" disabled>Select Variable...</option>
                             {numericVariables.map(v => <option key={v.id} value={v.key}>{v.key} ({v.value})</option>)}
                         </select>
                     </div>
                 )}

                 {settings.amountType === 'percent' && (
                     <div className="grid grid-cols-2 gap-4">
                         <div>
                             <Label>Percentage %</Label>
                             <Input type="number" className="h-8" placeholder="10" value={settings.percentage || ''} onChange={(e) => handleSettingChange('percentage', parseFloat(e.target.value))} />
                         </div>
                         <div>
                             <Label>Of Total (Variable)</Label>
                             <select 
                                className="w-full text-xs h-8 border border-input bg-transparent"
                                value={settings.variableName || ''}
                                onChange={(e) => handleSettingChange('variableName', e.target.value)}
                             >
                                 <option value="" disabled>Select Total...</option>
                                 {numericVariables.map(v => <option key={v.id} value={v.key}>{v.key} ({v.value})</option>)}
                             </select>
                         </div>
                     </div>
                 )}

                 <div className="pt-2">
                     <Label className="mb-2 block flex items-center justify-between">
                         <span>Enabled Providers</span>
                         <button onClick={() => setMode('settings')} className="text-primary text-[9px] hover:underline flex items-center gap-1">
                             Configure Keys <ExternalLink size={8} />
                         </button>
                     </Label>
                     
                     <div className="space-y-2">
                         {['stripe', 'wise', 'bit', 'gocardless', 'paypal'].map(provider => {
                             const isEnabled = enabledProviders.includes(provider);
                             const configured = isConfigured(provider);
                             
                             return (
                                 <div key={provider} className={cn("flex items-center justify-between border p-2 text-xs", isEnabled ? "bg-white dark:bg-white/5 border-black/20" : "bg-muted/10 border-transparent")}>
                                     <div className="flex items-center gap-2">
                                         <Switch checked={isEnabled} onCheckedChange={(c) => toggleProvider(provider, c)} className="scale-75 origin-left" />
                                         <span className="uppercase font-bold">{provider}</span>
                                     </div>
                                     {isEnabled && (
                                         configured ? (
                                             <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-[9px]">
                                                 <CheckCircle2 size={10} className="mr-1"/> Ready
                                             </Badge>
                                         ) : (
                                             <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-[9px]">
                                                 <AlertTriangle size={10} className="mr-1"/> Missing Config
                                             </Badge>
                                         )
                                     )}
                                 </div>
                             );
                         })}
                     </div>
                 </div>
             </div>
        </div>
    );
}
