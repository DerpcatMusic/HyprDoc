
import React from 'react';
import { DocumentState, AuditLogEntry } from '../../types';
import { Card, Button, Badge } from '../ui-components';
import { FileText, PlusCircle, MoreHorizontal, Clock, CheckCircle2, Eye, PenTool } from 'lucide-react';

interface DashboardViewProps {
    documents: DocumentState[];
    auditLog?: AuditLogEntry[];
    onCreate: () => void;
    onSelect: (id: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ documents, auditLog = [], onCreate, onSelect }) => {
    
    const getStatusColor = (status: string) => {
        switch(status) {
            case 'sent': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
        }
    };

    return (
        <div className="flex-1 flex overflow-hidden bg-muted/10 dark:bg-zinc-950">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8">
                 <div className="max-w-5xl mx-auto space-y-8">
                   <div className="flex justify-between items-center">
                       <h1 className="text-3xl font-bold">Dashboard</h1>
                       <Button onClick={onCreate} className="gap-2"><PlusCircle size={16} /> New Document</Button>
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
                                   <Button variant="ghost" size="icon"><MoreHorizontal size={16}/></Button>
                               </div>
                           </Card>
                       ))}
                       {documents.length === 0 && (
                           <div className="p-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground">
                                <FileText size={48} className="mb-4 opacity-20" />
                                <p>No documents found.</p>
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
                                        <span className="capitalize">{log.action}</span> by {log.user}
                                    </span>
                                    {log.details && <span className="text-xs text-muted-foreground bg-muted/30 p-1.5 rounded">{log.details}</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
