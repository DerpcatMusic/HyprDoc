
import React from 'react';
import { DocumentSettings, Integration, Party } from '../../types';
import { Card, Label, Input, Button, Switch, FontPicker, ColorPicker, Tabs, TabsList, TabsTrigger, TabsContent, Badge } from '../ui-components';
import { CreditCard, Webhook, Database, Link as LinkIcon, CheckCircle2, ArrowUp, ArrowDown, Users, Shuffle, AlignLeft, AlignRight, Landmark, QrCode, LayoutTemplate, Key } from 'lucide-react';
import { useDocument } from '../../context/DocumentContext';
import { cn } from '../ui-components';

interface SettingsViewProps {
    settings?: DocumentSettings;
    onUpdate: (settings: DocumentSettings) => void;
    parties?: Party[];
    onUpdateParties?: (parties: Party[]) => void;
    mode: 'global' | 'document';
    isModal?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdate, parties, onUpdateParties, mode, isModal }) => {
    const { doc, setDoc } = useDocument();

    const handleChange = (key: keyof DocumentSettings, value: any) => {
        onUpdate({ ...settings, [key]: value });
    };

    const handleGatewayChange = (provider: string, key: string, value: string) => {
        const gateways: any = settings?.paymentGateways || {};
        const providerSettings = gateways[provider] || {};
        handleChange('paymentGateways', {
            ...gateways,
            [provider]: { ...providerSettings, [key]: value }
        });
    };

    const toggleTemplateStatus = () => {
        const newStatus = doc.status === 'template' ? 'draft' : 'template';
        setDoc(prev => ({ ...prev, status: newStatus }));
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

    // Strict fixed height when modal to prevent jumping
    const containerClass = isModal 
        ? "flex-1 overflow-y-auto p-6 pt-0 bg-white dark:bg-zinc-900 h-[500px]" // Modal Content Fixed Height
        : "flex-1 overflow-y-auto bg-muted/10 p-8 dark:bg-zinc-950"; // Full Page

    const wrapperClass = isModal ? "space-y-6" : "max-w-4xl mx-auto space-y-6";

    // --- GLOBAL SETTINGS VIEW ---
    if (mode === 'global') {
        return (
            <div className={containerClass}>
                <div className={wrapperClass}>
                    {!isModal && (
                        <>
                            <h1 className="text-3xl font-bold">Global Settings & Integrations</h1>
                            <p className="text-muted-foreground">Manage your API keys and default configurations for all documents.</p>
                        </>
                    )}
                    
                    <Card className="p-6 space-y-6 border-2">
                        <div className="flex items-center gap-2 mb-4 border-b pb-2">
                             <Key size={20} className="text-primary" />
                             <h3 className="font-bold uppercase font-mono tracking-wider">API Keys</h3>
                        </div>
                        
                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <Label>OpenAI / Gemini Key</Label>
                                <Input placeholder="sk-..." type="password" className="font-mono text-xs" />
                                <p className="text-[10px] text-muted-foreground">For AI text generation features.</p>
                            </div>

                            <div className="space-y-2">
                                <Label>Google Maps API Key</Label>
                                <Input placeholder="AIza..." type="password" className="font-mono text-xs" />
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6 space-y-6 border-2">
                         <div className="flex items-center gap-2 mb-4 border-b pb-2">
                             <CreditCard size={20} className="text-primary" />
                             <h3 className="font-bold uppercase font-mono tracking-wider">Payment Gateways</h3>
                        </div>

                        <Tabs defaultValue="stripe">
                            <TabsList className="grid grid-cols-5 w-full">
                                <TabsTrigger value="stripe">Stripe</TabsTrigger>
                                <TabsTrigger value="paypal">PayPal</TabsTrigger>
                                <TabsTrigger value="wise">Wise</TabsTrigger>
                                <TabsTrigger value="bit">Bit</TabsTrigger>
                                <TabsTrigger value="gocardless">GoCardless</TabsTrigger>
                            </TabsList>
                            
                            <div className="mt-4 p-4 border rounded-lg bg-muted/5 min-h-[160px]">
                                <TabsContent value="stripe" className="mt-0 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Stripe Publishable Key</Label>
                                        <Input placeholder="pk_test_..." className="font-mono text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Stripe Secret Key</Label>
                                        <Input placeholder="sk_test_..." type="password" className="font-mono text-xs" />
                                    </div>
                                </TabsContent>

                                <TabsContent value="paypal" className="mt-0 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Client ID</Label>
                                        <Input placeholder="PAYPAL_CLIENT_ID" className="font-mono text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Client Secret</Label>
                                        <Input placeholder="PAYPAL_SECRET" type="password" className="font-mono text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Environment</Label>
                                        <select className="w-full text-xs h-10 border-2 border-input bg-transparent px-2">
                                            <option value="sandbox">Sandbox</option>
                                            <option value="production">Production</option>
                                        </select>
                                    </div>
                                </TabsContent>

                                <TabsContent value="wise" className="mt-0 space-y-4">
                                    <div className="space-y-2">
                                        <Label>API Token</Label>
                                        <Input placeholder="WISE_API_TOKEN" type="password" className="font-mono text-xs" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Profile ID</Label>
                                        <Input placeholder="123456" className="font-mono text-xs" />
                                    </div>
                                </TabsContent>

                                <TabsContent value="bit" className="mt-0 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Merchant Phone Number</Label>
                                        <Input placeholder="+972..." className="font-mono text-xs" />
                                    </div>
                                </TabsContent>

                                <TabsContent value="gocardless" className="mt-0 space-y-4">
                                    <div className="space-y-2">
                                        <Label>Access Token</Label>
                                        <Input placeholder="GC_ACCESS_TOKEN" type="password" className="font-mono text-xs" />
                                    </div>
                                     <div className="space-y-2">
                                        <Label>Merchant ID</Label>
                                        <Input placeholder="MERCHANT_ID" className="font-mono text-xs" />
                                    </div>
                                </TabsContent>
                            </div>
                        </Tabs>
                        
                        <div className="flex justify-end pt-4">
                            <Button>Save Global Keys</Button>
                        </div>
                    </Card>

                    <Card className="p-6 space-y-6 border-2">
                        <div className="flex items-center gap-2 mb-4 border-b pb-2">
                             <Users size={20} className="text-primary" />
                             <h3 className="font-bold uppercase font-mono tracking-wider">Organization Profile</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Company Name</Label>
                                <Input placeholder="Acme Inc." />
                            </div>
                            <div className="space-y-2">
                                <Label>Default Logo URL</Label>
                                <Input placeholder="https://..." />
                            </div>
                        </div>
                         <div className="flex justify-end pt-4">
                            <Button>Update Profile</Button>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    // --- DOCUMENT SETTINGS VIEW ---
    return (
        <div className={containerClass}>
            <div className={wrapperClass}>
                <div className="flex justify-between items-center mb-6">
                    {!isModal && (
                        <div>
                            <h1 className="text-3xl font-bold">Document Config</h1>
                            <p className="text-muted-foreground text-sm font-mono mt-1">ID: {doc.id}</p>
                        </div>
                    )}
                    <div className="flex items-center gap-2 ml-auto w-full justify-end">
                        {doc.status === 'template' && <Badge className="bg-purple-100 text-purple-700 border-purple-200">TEMPLATE MODE</Badge>}
                        <Button 
                            variant="outline" 
                            size="sm"
                            className={doc.status === 'template' ? "border-purple-500 text-purple-600 bg-purple-50" : ""}
                            onClick={toggleTemplateStatus}
                        >
                            <LayoutTemplate size={16} className="mr-2" />
                            {doc.status === 'template' ? "Convert to Document" : "Save as Template"}
                        </Button>
                    </div>
                </div>
                
                <Tabs defaultValue="workflow" className="w-full">
                    <TabsList className="mb-6">
                        <TabsTrigger value="workflow">Workflow</TabsTrigger>
                        <TabsTrigger value="branding">Branding</TabsTrigger>
                        <TabsTrigger value="payments">Payment Config</TabsTrigger>
                    </TabsList>

                    <div className="min-h-[400px]">
                        <TabsContent value="workflow" className="mt-0">
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

                        <TabsContent value="branding" className="mt-0">
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

                        <TabsContent value="payments" className="mt-0">
                            <div className="grid gap-6">
                                <div className="p-4 bg-indigo-50 border-l-4 border-indigo-500 text-indigo-900 text-sm">
                                    Configure keys SPECIFIC to this document. If left blank, we will try to use your Global API Keys from Account Settings.
                                </div>
                                
                                <Card className="p-6 space-y-4 border-2">
                                    <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
                                        <CreditCard size={20} /> Provider Overrides
                                    </h3>
                                    
                                    <Tabs defaultValue="stripe">
                                        <TabsList className="grid grid-cols-5 w-full">
                                            <TabsTrigger value="stripe">Stripe</TabsTrigger>
                                            <TabsTrigger value="paypal">PayPal</TabsTrigger>
                                            <TabsTrigger value="wise">Wise</TabsTrigger>
                                            <TabsTrigger value="bit">Bit</TabsTrigger>
                                            <TabsTrigger value="gocardless">GoCardless</TabsTrigger>
                                        </TabsList>
                                        
                                        <div className="mt-4 p-4 border rounded-lg bg-muted/5 min-h-[160px]">
                                            <TabsContent value="stripe" className="mt-0 space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Stripe Publishable Key</Label>
                                                    <Input 
                                                        value={settings?.paymentGateways?.stripe?.publishableKey || ''}
                                                        onChange={(e) => handleGatewayChange('stripe', 'publishableKey', e.target.value)}
                                                        placeholder="pk_test_..." 
                                                        className="font-mono text-xs" 
                                                    />
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="paypal" className="mt-0 space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Client ID</Label>
                                                    <Input 
                                                        value={settings?.paymentGateways?.paypal?.clientId || ''}
                                                        onChange={(e) => handleGatewayChange('paypal', 'clientId', e.target.value)}
                                                        placeholder="PAYPAL_CLIENT_ID" 
                                                        className="font-mono text-xs" 
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Client Secret</Label>
                                                    <Input 
                                                        type="password"
                                                        value={settings?.paymentGateways?.paypal?.environment || ''} // Hacking this into existing type for now
                                                        placeholder="PAYPAL_SECRET" 
                                                        className="font-mono text-xs" 
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Environment</Label>
                                                    <select 
                                                        className="w-full text-xs h-10 border-2 border-input bg-transparent px-2"
                                                        value={settings?.paymentGateways?.paypal?.environment || 'sandbox'}
                                                        onChange={(e) => handleGatewayChange('paypal', 'environment', e.target.value)}
                                                    >
                                                        <option value="sandbox">Sandbox</option>
                                                        <option value="production">Production</option>
                                                    </select>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="wise" className="mt-0 space-y-4">
                                                <div className="space-y-2">
                                                    <Label>API Token</Label>
                                                    <Input 
                                                        type="password"
                                                        value={settings?.paymentGateways?.wise?.iban || ''}
                                                        onChange={(e) => handleGatewayChange('wise', 'iban', e.target.value)}
                                                        placeholder="WISE_API_TOKEN" 
                                                        className="font-mono text-xs" 
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Profile ID</Label>
                                                     <Input 
                                                        value={settings?.paymentGateways?.wise?.sortCode || ''}
                                                        onChange={(e) => handleGatewayChange('wise', 'sortCode', e.target.value)}
                                                        placeholder="PROFILE_ID" 
                                                        className="font-mono text-xs" 
                                                    />
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="bit" className="mt-0 space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Merchant Phone Number</Label>
                                                    <Input 
                                                        value={settings?.paymentGateways?.bit?.phoneNumber || ''}
                                                        onChange={(e) => handleGatewayChange('bit', 'phoneNumber', e.target.value)}
                                                        placeholder="+972..." 
                                                        className="font-mono text-xs" 
                                                    />
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="gocardless" className="mt-0 space-y-4">
                                                <div className="space-y-2">
                                                    <Label>Access Token</Label>
                                                    <Input 
                                                        type="password"
                                                        value={settings?.paymentGateways?.gocardless?.merchantId || ''} 
                                                        onChange={(e) => handleGatewayChange('gocardless', 'merchantId', e.target.value)}
                                                        placeholder="GC_ACCESS_TOKEN" 
                                                        className="font-mono text-xs" 
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Merchant ID</Label>
                                                    <Input 
                                                        value={settings?.paymentGateways?.gocardless?.redirectUrl || ''} 
                                                        onChange={(e) => handleGatewayChange('gocardless', 'redirectUrl', e.target.value)}
                                                        placeholder="MERCHANT_ID" 
                                                        className="font-mono text-xs" 
                                                    />
                                                </div>
                                            </TabsContent>
                                        </div>
                                    </Tabs>
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
                    </div>
                </Tabs>
            </div>
        </div>
    );
};
