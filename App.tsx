
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
    Moon, Sun, Book, Package
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
            <div className="min-h-screen bg-background transition-colors font-sans">
                <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b-2 border-black px-6 py-4 flex justify-between items-center shadow-none dark:border-zinc-700">
                    <Button variant="ghost" onClick={() => setMode('edit')} className="gap-2 font-mono hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black dark:text-white"><ArrowLeft size={16} /> BACK TO EDITOR</Button>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)} className="hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black dark:text-white">{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</Button>
                        <Button onClick={() => setMode('recipient')} className="bg-primary hover:bg-primary/90 text-white gap-2 font-mono border-2 border-black shadow-hypr-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all dark:border-zinc-700"><Share size={16}/> SHARE LINK</Button>
                    </div>
                </div>
                <Viewer blocks={doc.blocks} settings={doc.settings} parties={doc.parties} variables={doc.variables} terms={doc.terms} isPreview={true} />
            </div>
        )
    }

    return (
        <div className="flex h-screen w-screen bg-background text-foreground font-sans overflow-hidden">
            {/* Navigation Sidebar */}
            <div className="hidden md:flex w-16 md:w-20 border-r-2 border-black bg-white dark:bg-zinc-950 dark:border-zinc-800 flex-col items-center py-6 gap-6 z-30 shadow-md">
                <div className="w-10 h-10 bg-primary flex items-center justify-center text-white shadow-hypr-sm border-2 border-black dark:border-zinc-700 font-bold text-xl">
                    H
                </div>
                <div className="flex-1 flex flex-col gap-4 w-full px-2 items-center">
                    <Button variant={mode === 'dashboard' ? 'secondary' : 'ghost'} size="icon" className="w-10 h-10 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded-none border-2 border-transparent hover:border-black dark:hover:border-white dark:text-zinc-400" onClick={() => setMode('dashboard')} title="Dashboard"><LayoutTemplate size={20} /></Button>
                    <Button variant={mode === 'edit' ? 'secondary' : 'ghost'} size="icon" className="w-10 h-10 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded-none border-2 border-transparent hover:border-black dark:hover:border-white dark:text-zinc-400" onClick={() => setMode('edit')} title="Editor"><Package size={20} /></Button>
                    <Button variant={mode === 'settings' ? 'secondary' : 'ghost'} size="icon" className="w-10 h-10 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded-none border-2 border-transparent hover:border-black dark:hover:border-white dark:text-zinc-400" onClick={() => setMode('settings')} title="Settings"><Settings size={20} /></Button>
                </div>
                <div className="flex flex-col gap-4 w-full px-2 items-center">
                    <Button variant={showGlossary ? 'secondary' : 'ghost'} size="icon" className="w-10 h-10 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded-none border-2 border-transparent hover:border-black dark:hover:border-white dark:text-zinc-400" onClick={() => setShowGlossary(!showGlossary)} title="Glossary"><Book size={20} /></Button>
                    <Button variant="ghost" size="icon" className="w-10 h-10 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors rounded-none border-2 border-transparent hover:border-black dark:hover:border-white dark:text-zinc-400" onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</Button>
                </div>
            </div>

            {/* Glossary Sidebar */}
            {showGlossary && (
                <div className="w-80 border-r-2 border-black bg-background z-20 animate-in slide-in-from-left duration-300 shadow-hypr dark:border-zinc-800">
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
            <div className="hidden md:flex w-72 border-r-2 border-black dark:border-zinc-800 bg-background flex-col z-20 shadow-sm">
                <div className="p-5 border-b-2 border-black dark:border-zinc-800 h-16 flex items-center justify-between bg-muted/20">
                    <span className="font-black font-mono text-sm tracking-widest uppercase">Components</span>
                    <span className="text-xs font-mono opacity-50">LIB_V2</span>
                </div>
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
                <DialogContent className="border-2 border-black shadow-hypr bg-white dark:bg-zinc-900 dark:border-zinc-700 dark:text-white">
                    <DialogHeader><DialogTitle className="font-mono uppercase text-xl font-black">Secure Transmission</DialogTitle></DialogHeader>
                    <div className="p-6 bg-muted/10 border-2 border-dashed border-black/20 dark:border-zinc-700 text-sm text-center">
                        <p className="font-mono text-xs mb-4 bg-white dark:bg-black border-2 border-black dark:border-zinc-700 p-3 select-all shadow-sm flex justify-between items-center">
                            <span className="truncate mr-2">https://hyprdoc.com/s/{doc.id || 'draft-id'}</span>
                            <span className="text-[10px] bg-primary px-1 text-white font-bold cursor-pointer hover:bg-primary/80">COPY</span>
                        </p>
                        <p className="text-muted-foreground text-xs font-mono uppercase tracking-wide">Recipient will require email verification</p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => { 
                            setDoc(prev => ({ ...prev, status: 'sent', snapshot: prev.blocks })); 
                            setShowSendModal(false); 
                            addAuditLog('sent', 'Document snapshot created');
                        }} className="font-mono bg-black text-white hover:bg-primary hover:text-white border-2 border-black shadow-hypr-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px] dark:bg-white dark:text-black dark:hover:bg-primary dark:border-zinc-700">GENERATE LINK & SNAPSHOT</Button>
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
