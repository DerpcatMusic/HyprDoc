
import React, { useState } from 'react';
import { DocumentState, AuditLogEntry } from '../../types';
import { Card, Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, Textarea, Input } from '../ui-components';
import { FileText, PlusCircle, MoreHorizontal, Clock, CheckCircle2, Eye, PenTool, ShieldCheck, Sparkles, Loader2 } from 'lucide-react';
import { generateAuditTrailPDF } from '../../services/auditTrail';
import { generateDocumentFromPrompt } from '../../services/gemini';

interface DashboardViewProps {
    documents: DocumentState[];
    auditLog?: AuditLogEntry[];
    onCreate: () => void;
    onSelect: (id: string) => void;
    onImport?: (doc: DocumentState) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ documents, auditLog = [], onCreate, onSelect, onImport }) => {
    const [showAIGenerator, setShowAIGenerator] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'sent': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
        }
    };

    const handleDownloadAudit = async (e: React.MouseEvent, doc: DocumentState) => {
        e.stopPropagation();
        const blob = await generateAuditTrailPDF(doc);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-trail-${doc.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
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

    return (
        <div className="flex-1 flex overflow-hidden bg-muted/10 dark:bg-zinc-950">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8">
                 <div className="max-w-5xl mx-auto space-y-8">
                   <div className="flex justify-between items-center">
                       <h1 className="text-3xl font-bold">Dashboard</h1>
                       <div className="flex gap-2">
                            <Button onClick={() => setShowAIGenerator(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-800 shadow-hypr-sm">
                                <Sparkles size={16} /> Generate with AI
                            </Button>
                            <Button onClick={onCreate} variant="outline" className="gap-2 bg-white dark:bg-zinc-900 border-2">
                                <PlusCircle size={16} /> New Blank
                            </Button>
                       </div>
                   </div>
                   
                   <div className="grid gap-4">
                       {documents.map((doc, i) => (
                           <Card key={i} className="p-4 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onSelect(doc.id || 'new')}>
                               <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                       <FileText size={24} />
                                   </div>
                                   <div>
                                       <h3 className="font-semibold text-lg">{doc.title}</h3>
                                       <p className="text-sm text-muted-foreground">Updated {new Date(doc.updatedAt || Date.now()).toLocaleDateString()}</p>
                                   </div>
                               </div>
                               <div className="flex items-center gap-4">
                                   <Badge className={getStatusColor(doc.status)} variant="outline">{doc.status.toUpperCase()}</Badge>
                                   
                                   <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      onClick={(e) => handleDownloadAudit(e, doc)}
                                      title="Download Audit Trail"
                                      className="hidden group-hover:flex"
                                   >
                                       <ShieldCheck size={16} className="text-green-600" />
                                   </Button>
                                   
                                   <Button variant="ghost" size="icon"><MoreHorizontal size={16}/></Button>
                               </div>
                           </Card>
                       ))}
                       {documents.length === 0 && (
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
