import React from 'react';
import { DocumentProvider, useDocument } from './context/DocumentContext';
import { Viewer } from './components/Viewer';
import { AccessGate } from './components/AccessGate';
import { Toolbox } from './components/Toolbox';
import { PropertiesPanel } from './components/PropertiesPanel';
import { SettingsView } from './components/views/SettingsView';
import { DashboardView } from './components/views/DashboardView';
import { EditorCanvas } from './components/EditorCanvas';
import { GlossaryManager } from './components/GlossaryManager';
import { 
    FileText, Settings, LayoutTemplate, ArrowLeft, Share, 
    Moon, Sun, Book
} from 'lucide-react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './components/ui-components';

const AppContent: React.FC = () => {
    const { 
        doc, setDoc, mode, setMode, selectedBlockId, setSelectedBlockId,
        addBlock, updateBlock, deleteBlock, addAuditLog, updateParties
    } = useDocument();

    const [recipientEmail, setRecipientEmail] = React.useState<string | null>(null);
    const [isDarkMode, setIsDarkMode] = React.useState(false);
    const [showPartyManager, setShowPartyManager] = React.useState(false);
    const [showGlossary, setShowGlossary] = React.useState(false);
    const [showSendModal, setShowSendModal] = React.useState(false);

    // Toggle Dark Mode
    React.useEffect(() => {
        if (isDarkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDarkMode]);

    const handleDragStartToolbox = (e: React.DragEvent, type: any) => {
        e.dataTransfer.setData('application/hyprdoc-new', type);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDropCanvas = (e: React.DragEvent, targetId?: string) => {
        e.preventDefault();
        const newType = e.dataTransfer.getData('application/hyprdoc-new') as any;
        if (newType) {
            addBlock(newType, targetId);
        }
    };

    // --- Routes ---

    if (mode === 'recipient') {
        if (!recipientEmail) {
            return <AccessGate documentTitle={doc.title} onAccessGranted={(email) => setRecipientEmail(email)} />;
        }
        return <Viewer blocks={doc.blocks} snapshot={doc.snapshot} settings={doc.settings} parties={doc.parties} terms={doc.terms} />;
    }

    if (mode === 'preview') {
        return (
            <div className="min-h-screen bg-muted/30 dark:bg-zinc-950 transition-colors">
                <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b px-6 py-4 flex justify-between items-center shadow-sm dark:border-zinc-800">
                    <Button variant="ghost" onClick={() => setMode('edit')} className="gap-2"><ArrowLeft size={16} /> Back to Editor</Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</Button>
                        <Button onClick={() => setMode('recipient')} className="bg-purple-600 hover:bg-purple-700 text-white gap-2"><Share size={16}/> Simulate Secure Link</Button>
                    </div>
                </div>
                <Viewer blocks={doc.blocks} settings={doc.settings} parties={doc.parties} variables={doc.variables} terms={doc.terms} isPreview={true} />
            </div>
        )
    }

    return (
        <div className="flex h-screen w-screen bg-background text-foreground font-sans overflow-hidden">
            {/* Navigation Sidebar */}
            <div className="hidden md:flex w-16 md:w-20 border-r bg-muted/5 flex-col items-center py-6 gap-6 dark:border-zinc-800 z-30">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
                    <LayoutTemplate size={20} />
                </div>
                <div className="flex-1 flex flex-col gap-4 w-full px-2">
                    <Button variant={mode === 'dashboard' ? 'secondary' : 'ghost'} size="icon" className="w-full h-10 rounded-lg" onClick={() => setMode('dashboard')} title="Dashboard"><LayoutTemplate size={20} /></Button>
                    <Button variant={mode === 'edit' ? 'secondary' : 'ghost'} size="icon" className="w-full h-10 rounded-lg" onClick={() => setMode('edit')} title="Editor"><FileText size={20} /></Button>
                    <Button variant={mode === 'settings' ? 'secondary' : 'ghost'} size="icon" className="w-full h-10 rounded-lg" onClick={() => setMode('settings')} title="Settings"><Settings size={20} /></Button>
                </div>
                <div className="flex flex-col gap-4 w-full px-2">
                    <Button variant={showGlossary ? 'secondary' : 'ghost'} size="icon" className="w-full h-10" onClick={() => setShowGlossary(!showGlossary)} title="Glossary"><Book size={20} /></Button>
                    <Button variant="ghost" size="icon" className="w-full h-10" onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</Button>
                </div>
            </div>

            {/* Glossary Sidebar */}
            {showGlossary && (
                <div className="w-80 border-r bg-background z-20 animate-in slide-in-from-left duration-300">
                    <GlossaryManager 
                        terms={doc.terms} 
                        onAddTerm={(t) => setDoc(p => ({...p, terms: [...p.terms, t]}))} 
                        onDeleteTerm={(id) => setDoc(p => ({...p, terms: p.terms.filter(t => t.id !== id)}))} 
                        onClose={() => setShowGlossary(false)} 
                    />
                </div>
            )}

            {/* Routes */}
            {mode === 'dashboard' && (
                <DashboardView 
                    documents={[doc]} 
                    auditLog={doc.auditLog} 
                    onCreate={() => { setMode('edit'); addAuditLog('created'); }} 
                    onSelect={() => setMode('edit')} 
                />
            )}

            {mode === 'settings' && (
                <SettingsView 
                    settings={doc.settings} 
                    onUpdate={(s) => setDoc(prev => ({ ...prev, settings: s }))} 
                    parties={doc.parties}
                    onUpdateParties={updateParties}
                />
            )}

            {mode === 'edit' && (
            <>
            {/* TOOLBOX */}
            <div className="hidden md:flex w-72 border-r bg-muted/10 flex-col z-20 dark:border-zinc-800">
                <div className="p-5 border-b bg-background h-16 flex items-center font-semibold text-sm dark:border-zinc-800">Toolbox</div>
                <Toolbox onDragStart={handleDragStartToolbox} onAddBlock={addBlock} />
            </div>

            {/* CANVAS */}
            <EditorCanvas 
                docTitle={doc.title}
                docSettings={doc.settings}
                blocks={doc.blocks}
                parties={doc.parties}
                selectedBlockId={selectedBlockId}
                showPartyManager={showPartyManager}
                onTitleChange={(t) => setDoc(prev => ({...prev, title: t}))}
                onTogglePartyManager={setShowPartyManager}
                onPreview={() => setMode('preview')}
                onSend={() => setShowSendModal(true)}
                onSelectBlock={setSelectedBlockId}
                onUpdateBlock={updateBlock}
                onDeleteBlock={deleteBlock}
                onAddBlock={addBlock}
                onDropBlock={handleDropCanvas}
                onUpdateParty={(i, p) => {
                    const newParties = [...doc.parties];
                    newParties[i] = p;
                    setDoc(d => ({...d, parties: newParties}));
                }}
            />

            {/* PROPERTIES PANEL (Always rendered, handles empty state internally) */}
            <PropertiesPanel 
                block={doc.blocks.find(b => b.id === selectedBlockId) || null}
                parties={doc.parties}
                onUpdate={updateBlock}
                onDelete={deleteBlock}
                onClose={() => setSelectedBlockId(null)}
            />
            </>
            )}
            
            {/* SEND MODAL */}
            <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Secure Send</DialogTitle></DialogHeader>
                    <div className="p-4 bg-muted/30 rounded border text-sm text-center">
                        <p className="font-mono text-xs mb-2 bg-background p-2 rounded select-all">https://hyprdoc.com/s/{doc.id || 'draft-id'}</p>
                        <p className="text-muted-foreground text-xs">Anyone with this link will need to verify their email.</p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => { 
                            setDoc(prev => ({ ...prev, status: 'sent', snapshot: prev.blocks })); 
                            setShowSendModal(false); 
                            addAuditLog('sent', 'Document snapshot created');
                        }}>Create Link & Snapshot</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

const App: React.FC = () => (
    <DocumentProvider>
        <AppContent />
    </DocumentProvider>
);

export default App;