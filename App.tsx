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
    Moon, Sun, Book, Package, Hexagon
} from 'lucide-react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './components/ui-components';

const AppContent: React.FC = () => {
    const { 
        doc, setDoc, mode, setMode, selectedBlockId, setSelectedBlockId, getBlock,
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
        return <Viewer blocks={doc.blocks} snapshot={doc.snapshot} settings={doc.settings} parties={doc.parties} terms={doc.terms} docHash={doc.sha256} />;
    }

    if (mode === 'preview') {
        return (
            <div className="min-h-screen bg-background transition-colors font-sans">
                <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-none border-b-2 border-black dark:border-white px-6 py-4 flex justify-between items-center shadow-none">
                    <Button variant="outline" onClick={() => setMode('edit')} className="gap-2 font-mono"><ArrowLeft size={16} /> BACK TO EDITOR</Button>
                    <div className="flex gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</Button>
                        <Button onClick={() => setMode('recipient')} className="gap-2 font-mono"><Share size={16}/> SHARE LINK</Button>
                    </div>
                </div>
                <Viewer blocks={doc.blocks} settings={doc.settings} parties={doc.parties} variables={doc.variables} terms={doc.terms} isPreview={true} docHash={doc.sha256} />
            </div>
        )
    }

    return (
        <div className="flex h-screen w-screen bg-background text-foreground font-sans overflow-hidden">
            {/* Navigation Sidebar */}
            <div className="hidden md:flex w-16 border-r-2 border-black bg-white dark:bg-black dark:border-white flex-col items-center py-6 gap-8 z-30 shadow-none flex-shrink-0">
                <div className="w-10 h-10 bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-lg tracking-tighter shadow-sharp dark:shadow-sharp-dark">
                    <Hexagon size={24} strokeWidth={3} />
                </div>
                
                <div className="flex-1 flex flex-col gap-4 w-full px-2 items-center mt-4">
                    <button 
                        className={`w-10 h-10 flex items-center justify-center border-2 transition-all ${mode === 'dashboard' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'border-transparent hover:border-black dark:hover:border-white text-muted-foreground'}`} 
                        onClick={() => setMode('dashboard')} 
                        title="Dashboard"
                    >
                        <LayoutTemplate size={20} />
                    </button>
                    <button 
                        className={`w-10 h-10 flex items-center justify-center border-2 transition-all ${mode === 'edit' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'border-transparent hover:border-black dark:hover:border-white text-muted-foreground'}`} 
                        onClick={() => setMode('edit')} 
                        title="Editor"
                    >
                        <Package size={20} />
                    </button>
                    <button 
                        className={`w-10 h-10 flex items-center justify-center border-2 transition-all ${mode === 'settings' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'border-transparent hover:border-black dark:hover:border-white text-muted-foreground'}`} 
                        onClick={() => setMode('settings')} 
                        title="Settings"
                    >
                        <Settings size={20} />
                    </button>
                </div>
                
                <div className="flex flex-col gap-4 w-full px-2 items-center mb-4">
                    <button 
                        className={`w-10 h-10 flex items-center justify-center border-2 transition-all ${showGlossary ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'border-transparent hover:border-black dark:hover:border-white text-muted-foreground'}`} 
                        onClick={() => setShowGlossary(!showGlossary)} 
                        title="Glossary"
                    >
                        <Book size={20} />
                    </button>
                    <button 
                         className="w-10 h-10 flex items-center justify-center border-2 border-transparent hover:border-black dark:hover:border-white text-muted-foreground transition-all"
                         onClick={() => setIsDarkMode(!isDarkMode)}
                    >
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
            </div>

            {/* Glossary Sidebar */}
            {showGlossary && (
                <div className="w-96 border-r-2 border-black bg-background z-20 animate-in slide-in-from-left duration-300 shadow-sharp dark:shadow-sharp-dark dark:border-white flex-shrink-0">
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
                    onImport={(newDoc) => {
                        setDoc(newDoc);
                        setMode('edit');
                    }}
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
            <div className="hidden md:flex w-52 border-r-2 border-black dark:border-white bg-background flex-col z-20 shadow-none flex-shrink-0">
                <Toolbox onDragStart={handleDragStartToolbox} onAddBlock={addBlock} />
            </div>

            {/* MAIN EDITOR AREA - FLEX CONTAINER */}
            <div className="flex-1 flex min-w-0 relative bg-muted/10">
                {/* CANVAS */}
                <EditorCanvas 
                    docTitle={doc.title}
                    docSettings={doc.settings}
                    blocks={doc.blocks}
                    parties={doc.parties}
                    variables={doc.variables}
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
                    onUpdateVariables={(vars) => setDoc(d => ({...d, variables: vars}))}
                />

                {/* PROPERTIES PANEL (Relative Flex Item) */}
                <div className="flex-shrink-0 z-30 h-full">
                    <PropertiesPanel 
                        block={selectedBlockId ? getBlock(selectedBlockId) : null}
                        parties={doc.parties}
                        variables={doc.variables}
                        onUpdate={updateBlock}
                        onDelete={deleteBlock}
                        onClose={() => setSelectedBlockId(null)}
                        onUpdateVariables={(vars) => setDoc(d => ({...d, variables: vars}))}
                    />
                </div>
            </div>
            </>
            )}
            
            {/* SEND MODAL */}
            <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Secure Transmission</DialogTitle></DialogHeader>
                    <div className="p-8 bg-muted/10 border-2 border-dashed border-black dark:border-white text-sm text-center">
                        <p className="font-mono text-xs mb-6 bg-white dark:bg-black border-2 border-black dark:border-white p-4 select-all shadow-sharp flex justify-between items-center">
                            <span className="truncate mr-4 text-primary">https://hyprdoc.com/s/{doc.id || 'draft-id'}</span>
                            <span className="text-[9px] bg-black text-white px-2 py-1 font-bold cursor-pointer hover:bg-primary dark:bg-white dark:text-black">COPY</span>
                        </p>
                        <p className="text-muted-foreground text-[10px] font-mono uppercase tracking-widest">Recipient requires authentication</p>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => { 
                            setDoc(prev => ({ ...prev, status: 'sent', snapshot: prev.blocks })); 
                            setShowSendModal(false); 
                            addAuditLog('sent', 'Document snapshot created');
                        }}>GENERATE LINK & SNAPSHOT</Button>
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
