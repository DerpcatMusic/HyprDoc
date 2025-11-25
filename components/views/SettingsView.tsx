
import React from 'react';
import { DocumentSettings, Integration } from '../../types';
import { Card, Label, Input, Button, Switch, FontPicker, ColorPicker, Tabs, TabsList, TabsTrigger, TabsContent, Badge } from '../ui-components';
import { CreditCard, Webhook, Database, Link as LinkIcon, CheckCircle2 } from 'lucide-react';

interface SettingsViewProps {
    settings?: DocumentSettings;
    onUpdate: (settings: DocumentSettings) => void;
}

const INTEGRATIONS_MOCK: Integration[] = [
    { id: '1', name: 'Salesforce CRM', type: 'crm', connected: false, icon: 'SF' },
    { id: '2', name: 'HubSpot', type: 'crm', connected: true, icon: 'HS' },
    { id: '3', name: 'Google Drive', type: 'storage', connected: false, icon: 'GD' },
    { id: '4', name: 'AWS S3 Bucket', type: 'storage', connected: false, icon: 'S3' },
];

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdate }) => {
    const handleChange = (key: keyof DocumentSettings, value: any) => {
        onUpdate({ ...settings, [key]: value });
    };

    return (
        <div className="flex-1 overflow-y-auto bg-muted/10 p-8 dark:bg-zinc-950">
            <div className="max-w-4xl mx-auto space-y-6">
                <h1 className="text-3xl font-bold">Document Settings</h1>
                
                <Tabs defaultValue="branding" className="w-full">
                    <TabsList>
                        <TabsTrigger value="branding">Branding & Design</TabsTrigger>
                        <TabsTrigger value="general">General</TabsTrigger>
                        <TabsTrigger value="integrations">Integrations (Enterprise)</TabsTrigger>
                    </TabsList>

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
                            </div>
                        </Card>
                    </TabsContent>

                    <TabsContent value="general">
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
                    </TabsContent>

                    <TabsContent value="integrations">
                         <div className="grid gap-4">
                            <Card className="p-6">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <Webhook size={20} /> Webhooks
                                </h3>
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

                            <h3 className="font-semibold text-lg mt-4">Connected Apps</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {INTEGRATIONS_MOCK.map(int => (
                                    <Card key={int.id} className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center font-bold text-muted-foreground">
                                                {int.icon}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{int.name}</p>
                                                <p className="text-xs text-muted-foreground capitalize">{int.type}</p>
                                            </div>
                                        </div>
                                        {int.connected ? (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200"><CheckCircle2 size={12} className="mr-1" /> Active</Badge>
                                        ) : (
                                            <Button variant="outline" size="sm">Connect</Button>
                                        )}
                                    </Card>
                                ))}
                            </div>
                         </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};
