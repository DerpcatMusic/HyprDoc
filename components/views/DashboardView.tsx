
import React, { useState, useEffect } from 'react';
import { DocumentState, AuditLogEntry } from '../../types';
import { Card, Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, Textarea, Tabs, TabsList, TabsTrigger, TabsContent } from '../ui-components';
import { FileText, PlusCircle, MoreHorizontal, Clock, CheckCircle2, Eye, PenTool, ShieldCheck, Sparkles, Loader2, RefreshCw, LayoutTemplate, Copy } from 'lucide-react';
import { generateAuditTrailPDF } from '../../services/auditTrail';
import { generateDocumentFromPrompt } from '../../services/gemini';
import { SupabaseService, DocMeta } from '../../services/supabase';

interface DashboardViewProps {
    documents: DocumentState[]; 
    auditLog?: AuditLogEntry[];
    onCreate: () => void;
    onSelect: (id: string) => void;
    onImport?: (doc: DocumentState) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ auditLog = [], onCreate, onSelect, onImport }) => {
    const [showAIGenerator, setShowAIGenerator] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Local state for fetched docs
    const [docList, setDocList] = useState<DocMeta[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshDocs = async () => {
        setIsLoading(true);
        const docs = await SupabaseService.listDocuments();
        setDocList(docs);
        setIsLoading(false);
    };

    useEffect(() => {
        refreshDocs();
    }, []);
    
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'sent': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'template': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
        }
    };

    const handleDownloadAudit = async (e: React.MouseEvent, docId: string) => {
        e.stopPropagation();
        const fullDoc = await SupabaseService.loadDocument(docId);
        if(!fullDoc) return;

        const blob = await generateAuditTrailPDF(fullDoc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-trail-${docId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleCreateFromTemplate = async (e: React.MouseEvent, docId: string) => {
        e.stopPropagation();
        const templateDoc = await SupabaseService.loadDocument(docId);
        if (!templateDoc) return;

        // Clone without ID and status
        const newDoc: DocumentState = {
            ...templateDoc,
            id: crypto.randomUUID(),
            title: `${templateDoc.title} (Copy)`,
            status: 'draft',
            updatedAt: Date.now(),
            auditLog: [{ id: crypto.randomUUID(), timestamp: Date.now(), action: 'created', user: 'Me', details: `Created from template: ${templateDoc.title}` }],
            ...(templateDoc.ownerId && { ownerId: templateDoc.ownerId })
        };

        if (onImport) onImport(newDoc);
    };

    const handleGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        try {
            const { title, blocks } = await generateDocumentFromPrompt(aiPrompt);
            const newDoc: DocumentState = {
                id: crypto.randomUUID(),
                title: title,
                status: 'draft',
                parties: [{ id: 'p1', name: 'Me (Owner)', color: '#3b82f6', initials: 'ME' }, { id: 'p2', name: 'Recipient', color: '#ec4899', initials: 'RE' }],
                variables: [],
                terms: [],
                blocks: blocks,
                updatedAt: Date.now(),
                auditLog: [{ id: crypto.randomUUID(), timestamp: Date.now(), action: 'created', user: 'AI Assistant', details: 'Generated from prompt' }]
            };
            
            if (onImport) {
                onImport(newDoc);
            }
            setShowAIGenerator(false);
            setAiPrompt('');
        } catch (error) {
            alert('Failed to generate document. Please try again.');
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    const myDocs = docList.filter(d => d.status !== 'template');
    const templates = docList.filter(d => d.status === 'template');

    return (
        <div className="flex-1 flex overflow-hidden bg-muted/10 dark:bg-zinc-950">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8">
                 <div className="max-w-5xl mx-auto space-y-8">
                   <div className="flex justify-between items-center">
                       <h1 className="text-3xl font-bold flex items-center gap-3">
                           Dashboard 
                           {isLoading && <Loader2 size={20} className="animate-spin text-muted-foreground"/>}
                       </h1>
                       <div className="flex gap-2">
                            <Button onClick={() => refreshDocs()} variant="ghost" size="icon" title="Refresh List">
                                <RefreshCw size={16} />
                            </Button>
                            <Button onClick={() => setShowAIGenerator(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-800 shadow-hypr-sm">
                                <Sparkles size={16} /> Generate with AI
                            </Button>
                            <Button onClick={onCreate} variant="outline" className="gap-2 bg-white dark:bg-zinc-900 border-2">
                                <PlusCircle size={16} /> New Blank
                            </Button>
                       </div>
                   </div>
                   
                   <Tabs defaultValue="documents" className="w-full">
                       <TabsList className="mb-6">
                           <TabsTrigger value="documents" className="text-sm px-6">My Documents</TabsTrigger>
                           <TabsTrigger value="templates" className="text-sm px-6">Templates</TabsTrigger>
                       </TabsList>

                       <TabsContent value="documents">
                           <div className="grid gap-4">
                               {myDocs.map((doc) => (
                                   <Card key={doc.id} className="p-4 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onSelect(doc.id)}>
                                       <div className="flex items-center gap-4">
                                           <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                               <FileText size={24} />
                                           </div>
                                           <div>
                                               <h3 className="font-semibold text-lg">{doc.title}</h3>
                                               <p className="text-sm text-muted-foreground">Updated {new Date(doc.updated_at).toLocaleDateString()}</p>
                                           </div>
                                       </div>
                                       <div className="flex items-center gap-4">
                                           <Badge className={getStatusColor(doc.status)} variant="outline">{doc.status.toUpperCase()}</Badge>
                                           <Button 
                                              variant="ghost" 
                                              size="sm" 
                                              onClick={(e) => handleDownloadAudit(e, doc.id)}
                                              title="Download Audit Trail"
                                              className="hidden group-hover:flex"
                                           >
                                               <ShieldCheck size={16} className="text-green-600" />
                                           </Button>
                                           <Button variant="ghost" size="icon"><MoreHorizontal size={16}/></Button>
                                       </div>
                                   </Card>
                               ))}
                               {!isLoading && myDocs.length === 0 && (
                                   <div className="p-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-white/50 dark:bg-zinc-900/50">
                                        <Sparkles size={48} className="mb-4 text-indigo-400 opacity-50" />
                                        <h3 className="text-lg font-bold text-foreground mb-2">Create your first document</h3>
                                        <p className="text-center max-w-sm mb-6">Start from scratch or use our Gemini AI engine to build a contract in seconds.</p>
                                        <Button onClick={() => setShowAIGenerator(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                                            <Sparkles size={16} /> Try AI Generator
                                        </Button>
                                   </div>
                               )}
                           </div>
                       </TabsContent>

                       <TabsContent value="templates">
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                               {templates.map((doc) => (
                                   <Card key={doc.id} className="p-6 hover:border-purple-500 transition-colors cursor-pointer group flex flex-col" onClick={() => onSelect(doc.id)}>
                                       <div className="flex items-start justify-between mb-4">
                                           <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center rounded-none border border-purple-200">
                                               <LayoutTemplate size={20} />
                                           </div>
                                           <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">TEMPLATE</Badge>
                                       </div>
                                       <h3 className="font-bold text-lg mb-2">{doc.title}</h3>
                                       <p className="text-xs text-muted-foreground mb-6 line-clamp-2">Click to edit this template master.</p>
                                       <div className="mt-auto">
                                            <Button size="sm" className="w-full bg-white text-black border-black hover:bg-purple-50 hover:text-purple-700" onClick={(e) => handleCreateFromTemplate(e, doc.id)}>
                                                <Copy size={14} className="mr-2"/> Create New
                                            </Button>
                                       </div>
                                   </Card>
                               ))}
                               {!isLoading && templates.length === 0 && (
                                    <div className="col-span-full p-12 text-center text-muted-foreground border-2 border-dashed">
                                        <p>No templates found. Go to Settings in any document to "Save as Template".</p>
                                    </div>
                               )}
                           </div>
                       </TabsContent>
                   </Tabs>
               </div>
            </div>

            {/* Audit Log Sidebar */}
            <div className="w-80 border-l bg-background hidden xl:flex flex-col dark:border-zinc-800">
                <div className="p-6 border-b font-semibold text-sm flex items-center gap-2 dark:border-zinc-800">
                    <Clock size={16} /> Recent Activity
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {auditLog.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center italic">No activity recorded.</p>
                    ) : (
                        auditLog.map(log => (
                            <div key={log.id} className="relative pl-6 pb-6 border-l last:pb-0 border-muted">
                                <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-primary border-2 border-background"></div>
                                <div className="flex flex-col gap-1">
                                    <span className="text-xs text-muted-foreground font-mono">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    <span className="text-sm font-medium flex items-center gap-2">
                                        {log.action === 'created' && <PlusCircle size={12} className="text-blue-500"/>}
                                        {log.action === 'signed' && <CheckCircle2 size={12} className="text-green-500"/>}
                                        {log.action === 'viewed' && <Eye size={12} className="text-amber-500"/>}
                                        {log.action === 'edited' && <PenTool size={12} className="text-zinc-500"/>}
                                        <span className="capitalize">{log.action.replace('_', ' ')}</span> by {log.user}
                                    </span>
                                    {log.details && <span className="text-xs text-muted-foreground bg-muted/30 p-1.5 rounded">{log.details}</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* AI Generator Modal */}
            <Dialog open={showAIGenerator} onOpenChange={setShowAIGenerator}>
                <DialogContent className="max-w-xl border-2 border-black shadow-hypr dark:border-zinc-700 dark:bg-zinc-900">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Sparkles className="text-indigo-500" /> AI Document Generator
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-200 text-sm border-l-4 border-indigo-500">
                            Describe the document you need. HyprDoc will generate the structure, text clauses, and required input fields automatically.
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold uppercase font-mono">Your Prompt</label>
                            <Textarea 
                                placeholder="e.g. A freelance web design contract for a client paying $5000 upfront, with a 2-week delivery timeline and standard confidentiality clauses." 
                                className="min-h-[120px] resize-none text-base"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                            />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setShowAIGenerator(false)}>Cancel</Button>
                            <Button 
                                onClick={handleGenerate} 
                                disabled={!aiPrompt.trim() || isGenerating}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
                            >
                                {isGenerating ? <><Loader2 className="animate-spin mr-2" size={16} /> Building...</> : 'Generate Doc'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};
