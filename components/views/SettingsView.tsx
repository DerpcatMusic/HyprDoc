

import React from 'react';
import { DocumentSettings, Integration, Party } from '../../types';
import { Card, Label, Input, Button, Switch, FontPicker, ColorPicker, Tabs, TabsList, TabsTrigger, TabsContent, Badge } from '../ui-components';
import { CreditCard, Webhook, Database, Link as LinkIcon, CheckCircle2, ArrowUp, ArrowDown, Users, Shuffle, AlignLeft, AlignRight, Landmark, QrCode } from 'lucide-react';

interface SettingsViewProps {
    settings?: DocumentSettings;
    onUpdate: (settings: DocumentSettings) => void;
    parties?: Party[];
    onUpdateParties?: (parties: Party[]) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdate, parties, onUpdateParties }) => {
    const handleChange = (key: keyof DocumentSettings, value: any) => {
        onUpdate({ ...settings, [key]: value });
    };
    
    const handleGatewayChange = (provider: string, key: string, value: any) => {
        const currentGateways = settings?.paymentGateways || {};
        const providerConfig = (currentGateways as any)[provider] || {};
        
        onUpdate({
            ...settings,
            paymentGateways: {
                ...currentGateways,
                [provider]: { ...providerConfig, [key]: value }
            }
        });
    };

    const moveParty = (index: number, direction: 'up' | 'down') => {
        if (!parties || !onUpdateParties) return;
        const newParties = [...parties];
        if (direction === 'up' && index > 0) {
            [newParties[index], newParties[index - 1]] = [newParties[index - 1], newParties[index]];
        } else if (direction === 'down' && index < newParties.length - 1) {
            [newParties[index], newParties[index + 1]] = [newParties[index + 1], newParties[index]];
        }
        onUpdateParties(newParties);
    };

    return (
        <div className="flex-1 overflow-y-auto bg-muted/10 p-8 dark:bg-zinc-950">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold">Document Settings</h1>
                
                <Tabs defaultValue="workflow" className="w-full">
                    <TabsList>
                        <TabsTrigger value="workflow">Workflow</TabsTrigger>
                        <TabsTrigger value="branding">Branding</TabsTrigger>
                        <TabsTrigger value="integrations">Integrations</TabsTrigger>
                    </TabsList>

                    <TabsContent value="workflow">
                        <div className="grid gap-6">
                            <Card className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-lg flex items-center gap-2"><Shuffle size={18} /> Signing Order</h3>
                                        <p className="text-sm text-muted-foreground">Enforce a strict sequence for signing.</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg">
                                        <button 
                                            onClick={() => handleChange('signingOrder', 'parallel')}
                                            className={`px-3 py-1 text-xs rounded-md transition-all ${settings?.signingOrder !== 'sequential' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
                                        >
                                            Parallel
                                        </button>
                                        <button 
                                            onClick={() => handleChange('signingOrder', 'sequential')}
                                            className={`px-3 py-1 text-xs rounded-md transition-all ${settings?.signingOrder === 'sequential' ? 'bg-background shadow text-foreground' : 'text-muted-foreground'}`}
                                        >
                                            Sequential
                                        </button>
                                    </div>
                                </div>

                                {settings?.signingOrder === 'sequential' && (
                                    <div className="mt-4 border rounded-lg overflow-hidden dark:border-zinc-800">
                                        <div className="bg-muted/30 px-4 py-2 text-xs font-semibold text-muted-foreground border-b dark:border-zinc-800">Signing Sequence</div>
                                        <div className="divide-y dark:divide-zinc-800">
                                            {parties?.map((party, i) => (
                                                <div key={party.id} className="p-3 flex items-center gap-3 bg-card">
                                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm" style={{ backgroundColor: party.color }}>
                                                        {i + 1}
                                                    </div>
                                                    <span className="text-sm font-medium flex-1">{party.name}</span>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === 0} onClick={() => moveParty(i, 'up')}><ArrowUp size={12}/></Button>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={i === (parties.length - 1)} onClick={() => moveParty(i, 'down')}><ArrowDown size={12}/></Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Card>

                            <Card className="p-6 space-y-6">
                                <h3 className="font-semibold text-lg">Notifications & Expiry</h3>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Email Reminders</Label>
                                        <p className="text-xs text-muted-foreground">Automatically remind signers after inactivity.</p>
                                    </div>
                                    <Switch checked={settings?.emailReminders || false} onCheckedChange={(c) => handleChange('emailReminders', c)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Reminder Days</Label>
                                        <Input type="number" value={settings?.reminderDays || 3} onChange={(e) => handleChange('reminderDays', parseInt(e.target.value))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Expiration Days</Label>
                                        <Input type="number" value={settings?.expirationDays || 30} onChange={(e) => handleChange('expirationDays', parseInt(e.target.value))} />
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </TabsContent>

                    <TabsContent value="branding">
                        <Card className="p-6 space-y-6">
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Visual Identity</h3>
                                <p className="text-sm text-muted-foreground">Customize how the document looks for your recipients.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>Font Family</Label>
                                        <FontPicker value={settings?.fontFamily || ''} onChange={(f) => handleChange('fontFamily', f)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Brand Primary Color</Label>
                                        <ColorPicker value={settings?.brandColor || '#000000'} onChange={(c) => handleChange('brandColor', c)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Company Logo URL</Label>
                                        <Input value={settings?.logoUrl || ''} onChange={(e) => handleChange('logoUrl', e.target.value)} placeholder="https://..." />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Company Name</Label>
                                        <Input value={settings?.companyName || ''} onChange={(e) => handleChange('companyName', e.target.value)} placeholder="Acme Corp" />
                                    </div>
                                </div>
                                
                                <div className="pt-4 border-t border-dashed">
                                     <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-base flex items-center gap-2">
                                                {settings?.direction === 'rtl' ? <AlignRight size={16}/> : <AlignLeft size={16}/>} 
                                                Text Direction
                                            </Label>
                                            <p className="text-xs text-muted-foreground">Support for Right-to-Left languages (Arabic, Hebrew).</p>
                                        </div>
                                        <div className="flex items-center border rounded-md overflow-hidden">
                                             <button 
                                                onClick={() => handleChange('direction', 'ltr')}
                                                className={`px-3 py-1 text-xs font-bold transition-colors ${settings?.direction !== 'rtl' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
                                             >
                                                 LTR
                                             </button>
                                             <button 
                                                onClick={() => handleChange('direction', 'rtl')}
                                                className={`px-3 py-1 text-xs font-bold transition-colors ${settings?.direction === 'rtl' ? 'bg-primary text-white' : 'hover:bg-muted'}`}
                                             >
                                                 RTL
                                             </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="integrations">
                         <div className="grid gap-6">
                             <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500 text-indigo-900 text-sm">
                                 Configure your payment providers and webhooks here. These credentials will be used for all Payment blocks in this document.
                             </div>
                             
                             {/* PAYMENT GATEWAYS */}
                             <h3 className="font-semibold text-lg flex items-center gap-2 mt-4">
                                 <CreditCard size={20} /> Payment Gateways
                             </h3>
                             
                             <Card className="p-6 space-y-4 border-2">
                                 <div className="flex items-center gap-2 text-primary font-bold">
                                     <CreditCard size={18} /> Stripe (Credit Cards)
                                 </div>
                                 <div className="space-y-2">
                                     <Label>Publishable Key</Label>
                                     <Input 
                                         value={settings?.paymentGateways?.stripe?.publishableKey || ''} 
                                         onChange={(e) => handleGatewayChange('stripe', 'publishableKey', e.target.value)} 
                                         placeholder="pk_test_..."
                                         className="font-mono text-xs"
                                     />
                                 </div>
                             </Card>

                             <Card className="p-6 space-y-4 border-2">
                                 <div className="flex items-center gap-2 text-[#00b2e3] font-bold">
                                     <QrCode size={18} /> Bit (Israel P2P)
                                 </div>
                                 <div className="space-y-2">
                                     <Label>Phone Number</Label>
                                     <Input 
                                         value={settings?.paymentGateways?.bit?.phoneNumber || ''} 
                                         onChange={(e) => handleGatewayChange('bit', 'phoneNumber', e.target.value)} 
                                         placeholder="+97250..."
                                         className="font-mono text-xs"
                                     />
                                 </div>
                             </Card>

                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="p-6 space-y-4">
                                     <div className="flex items-center gap-2 text-[#9fe870] font-bold">
                                         <Landmark size={18} fill="#163300" className="text-[#163300]" /> Wise (Transfer)
                                     </div>
                                     <div className="space-y-2">
                                         <Label>Recipient Email</Label>
                                         <Input value={settings?.paymentGateways?.wise?.recipientEmail || ''} onChange={(e) => handleGatewayChange('wise', 'recipientEmail', e.target.value)} className="text-xs" />
                                         <Label>IBAN / Account</Label>
                                         <Input value={settings?.paymentGateways?.wise?.iban || ''} onChange={(e) => handleGatewayChange('wise', 'iban', e.target.value)} className="text-xs" />
                                     </div>
                                 </Card>

                                 <Card className="p-6 space-y-4">
                                     <div className="flex items-center gap-2 text-[#003087] font-bold">
                                         <span className="italic">PayPal</span>
                                     </div>
                                     <div className="space-y-2">
                                         <Label>Client ID</Label>
                                         <Input value={settings?.paymentGateways?.paypal?.clientId || ''} onChange={(e) => handleGatewayChange('paypal', 'clientId', e.target.value)} className="font-mono text-xs" />
                                         <div className="flex items-center gap-2 mt-2">
                                            <Label className="mb-0">Env:</Label>
                                            <select 
                                                className="text-xs border bg-transparent h-6"
                                                value={settings?.paymentGateways?.paypal?.environment || 'sandbox'}
                                                onChange={(e) => handleGatewayChange('paypal', 'environment', e.target.value)}
                                            >
                                                <option value="sandbox">Sandbox</option>
                                                <option value="production">Production</option>
                                            </select>
                                         </div>
                                     </div>
                                 </Card>
                             </div>
                             
                             <Card className="p-6 space-y-4">
                                 <div className="flex items-center gap-2 text-[#4c0099] font-bold">
                                     <Landmark size={18} /> GoCardless (Direct Debit)
                                 </div>
                                 <div className="space-y-2">
                                     <Label>Merchant ID</Label>
                                     <Input value={settings?.paymentGateways?.gocardless?.merchantId || ''} onChange={(e) => handleGatewayChange('gocardless', 'merchantId', e.target.value)} className="font-mono text-xs" />
                                 </div>
                             </Card>

                            {/* WEBHOOKS */}
                            <h3 className="font-semibold text-lg flex items-center gap-2 mt-4">
                                <Webhook size={20} /> Developer
                            </h3>
                            <Card className="p-6">
                                <div className="space-y-2">
                                    <Label>Event Callback URL</Label>
                                    <Input 
                                        value={settings?.webhookUrl || ''} 
                                        onChange={(e) => handleChange('webhookUrl', e.target.value)} 
                                        placeholder="https://api.yourcompany.com/webhooks/hyprdoc"
                                        className="font-mono text-xs"
                                    />
                                    <p className="text-[10px] text-muted-foreground">We will send POST requests on 'document.signed' events.</p>
                                </div>
                            </Card>
                         </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};