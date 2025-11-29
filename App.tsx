
import React, { useState, useEffect, useCallback } from 'react';
import { DocumentProvider, useDocument } from './context/DocumentContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Viewer } from './components/Viewer';
import { AccessGate } from './components/AccessGate';
import { Toolbox } from './components/Toolbox';
import { PropertiesPanel } from './components/PropertiesPanel';
import { SettingsView } from './components/views/SettingsView';
import { DashboardView } from './components/views/DashboardView';
import { EditorCanvas } from './components/EditorCanvas';
import { GlossaryManager } from './components/GlossaryManager';
import { AuthPage } from './components/AuthPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { 
    Settings, LayoutTemplate, ArrowLeft, Share, 
    Moon, Sun, Book, Package, Hexagon, LogOut, Menu, X, SlidersHorizontal
} from 'lucide-react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, cn } from './components/ui-components';

// --- CUSTOM HASH ROUTER HOOK (ROBUST & SANDBOX SAFE) ---
const useHashLocation = () => {
    const getHash = useCallback(() => {
        try {
            if (typeof window === 'undefined') return '#dashboard';
            return window.location.hash || '#dashboard';
        } catch (e) {
            return '#dashboard'; 
        }
    }, []);

    const [hash, setHash] = useState(getHash());
    
    useEffect(() => {
        const onHashChange = () => setHash(getHash());
        window.addEventListener('hashchange', onHashChange);
        return () => window.removeEventListener('hashchange', onHashChange);
    }, [getHash]);

    const navigate = useCallback((newHash: string) => {
        setHash(newHash);
        try {
            window.location.hash = newHash;
        } catch (e) {
            console.warn("Router: Hash update blocked by environment.", e);
        }
    }, []);

    return { hash, navigate };
};

const AppContent: React.FC = () => {
    const { 
        doc, setDoc, selectedBlockId, setSelectedBlockId, getBlock,
        addBlock, updateBlock, deleteBlock, addAuditLog, updateParties, loadDocument
    } = useDocument();
    
    const { user, loading, signOut } = useAuth();
    const { hash, navigate } = useHashLocation();

    const [recipientIdentifier, setRecipientIdentifier] = useState<string | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showGlossary, setShowGlossary] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Initial Routing Logic
    useEffect(() => {
        if (!hash || hash === '') navigate('#dashboard');
    }, [hash, navigate]);

    // Parse Route
    // Format: 
    // #dashboard
    // #settings (Global)
    // #doc/:id/edit
    // #doc/:id/settings (Doc Specific)
    // #s/:id (public share)
    const routeParts = hash.replace('#', '').split('/');
    const rootRoute = routeParts[0] || 'dashboard'; 
    const docId = routeParts[1];
    const subView = routeParts[2] || 'edit'; 

    // Load Doc Effect
    useEffect(() => {
        if ((rootRoute === 'doc' || rootRoute === 's') && docId && docId !== doc.id) {
            loadDocument(docId);
        }
    }, [docId, rootRoute, doc.id, loadDocument]);

    // Toggle Dark Mode
    useEffect(() => {
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

    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center bg-background"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
    }

    // Recipient View (Public)
    if (rootRoute === 's') {
        if (!recipientIdentifier) {
            return <AccessGate documentTitle={doc.title} onAccessGranted={(id) => setRecipientIdentifier(id)} />;
        }
        return (
            <Viewer 
                blocks={doc.blocks} 
                snapshot={doc.snapshot} 
                settings={doc.settings} 
                parties={doc.parties} 
                terms={doc.terms} 
                docHash={doc.sha256}
                verifiedIdentifier={recipientIdentifier} 
            />
        );
    }

    if (!user) {
        return <AuthPage />;
    }

    // Preview Mode
    if (rootRoute === 'doc' && subView === 'preview') {
        return (
            <div className="min-h-screen bg-background transition-colors font-sans">
                <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-none border-b-2 border-black dark:border-white px-6 py-4 flex justify-between items-center shadow-none">
                    <Button variant="outline" onClick={() => navigate(`#doc/${docId}/edit`)} className="gap-2 font-mono"><ArrowLeft size={16} /> BACK TO EDITOR</Button>
                    <div className="flex gap-4">
                        <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</Button>
                        <Button onClick={() => navigate(`#s/${docId}`)} className="gap-2 font-mono"><Share size={16}/> SHARE LINK</Button>
                    </div>
                </div>
                <Viewer blocks={doc.blocks} settings={doc.settings} parties={doc.parties} variables={doc.variables} terms={doc.terms} isPreview={true} docHash={doc.sha256} />
            </div>
        )
    }

    return (
        <div className="flex h-screen w-screen bg-background text-foreground font-sans overflow-hidden relative">
            
            {/* Mobile Header */}
            <div className="md:hidden absolute top-0 left-0 right-0 h-14 bg-background border-b-2 border-black flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-2">
                    <Hexagon size={20} strokeWidth={3} />
                    <span className="font-bold font-mono tracking-tight uppercase">HyprDoc</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Navigation Sidebar */}
            <div className={cn(
                "w-16 border-r-2 border-black bg-white dark:bg-black dark:border-white flex flex-col items-center py-6 gap-8 z-40 shadow-none flex-shrink-0 transition-all duration-300",
                "md:static md:flex",
                isMobileMenuOpen ? "absolute inset-0 w-full flex-col pt-20" : "hidden"
            )}>
                <div className="w-10 h-10 bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-lg tracking-tighter shadow-sharp dark:shadow-sharp-dark md:flex hidden">
                    <Hexagon size={24} strokeWidth={3} />
                </div>
                
                <div className="flex-1 flex flex-col gap-6 w-full px-2 items-center mt-4">
                    <button 
                        className={`w-10 h-10 flex items-center justify-center border-2 transition-all ${rootRoute === 'dashboard' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'border-transparent hover:border-black dark:hover:border-white text-muted-foreground'}`} 
                        onClick={() => { navigate('#dashboard'); setIsMobileMenuOpen(false); }} 
                        title="Dashboard"
                    >
                        <LayoutTemplate size={20} />
                        <span className="md:hidden ml-2 font-mono font-bold">Dashboard</span>
                    </button>

                    <button 
                        className={`w-10 h-10 flex items-center justify-center border-2 transition-all ${rootRoute === 'settings' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'border-transparent hover:border-black dark:hover:border-white text-muted-foreground'}`} 
                        onClick={() => { navigate('#settings'); setIsMobileMenuOpen(false); }} 
                        title="Global Settings & Integrations"
                    >
                        <Settings size={20} />
                        <span className="md:hidden ml-2 font-mono font-bold">Global Settings</span>
                    </button>

                    <div className="w-8 h-px bg-black/10 dark:bg-white/10 my-2" />

                    {/* Document Specific Navigation */}
                    {rootRoute === 'doc' && docId && (
                        <>
                            <button 
                                className={`w-10 h-10 flex items-center justify-center border-2 transition-all ${subView === 'edit' ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'border-transparent hover:border-black dark:hover:border-white text-muted-foreground'}`} 
                                onClick={() => { navigate(`#doc/${docId}/edit`); setIsMobileMenuOpen(false); }} 
                                title="Editor"
                            >
                                <Package size={20} />
                                <span className="md:hidden ml-2 font-mono font-bold">Editor</span>
                            </button>
                        </>
                    )}
                </div>
                
                <div className="flex flex-col gap-4 w-full px-2 items-center mb-4">
                    <button 
                        className={`w-10 h-10 flex items-center justify-center border-2 transition-all ${showGlossary ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'border-transparent hover:border-black dark:hover:border-white text-muted-foreground'}`} 
                        onClick={() => { setShowGlossary(!showGlossary); setIsMobileMenuOpen(false); }} 
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
                    <div className="w-full h-px bg-black/10 dark:bg-white/10" />
                    <button 
                         className="w-10 h-10 flex items-center justify-center border-2 border-transparent hover:border-red-500 hover:text-red-500 text-muted-foreground transition-all"
                         onClick={signOut}
                         title="Sign Out"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            {/* Glossary Sidebar */}
            {showGlossary && (
                <div className="w-96 border-r-2 border-black bg-background z-20 animate-in slide-in-from-left duration-300 shadow-sharp dark:shadow-sharp-dark dark:border-white flex-shrink-0 absolute md:static h-full">
                    <GlossaryManager 
                        terms={doc.terms} 
                        onAddTerm={(t) => setDoc(p => ({...p, terms: [...p.terms, t]}))} 
                        onDeleteTerm={(id) => setDoc(p => ({...p, terms: p.terms.filter(t => t.id !== id)}))} 
                        onClose={() => setShowGlossary(false)} 
                    />
                </div>
            )}

            {/* Routes */}
            <div className="flex-1 flex flex-col min-w-0 h-full pt-14 md:pt-0">
                {rootRoute === 'dashboard' && (
                    <DashboardView 
                        documents={[doc]} 
                        auditLog={doc.auditLog} 
                        onCreate={() => { 
                            const newId = crypto.randomUUID(); 
                            navigate(`#doc/${newId}/edit`); 
                        }} 
                        onSelect={(id) => navigate(`#doc/${id}/edit`)} 
                        onImport={(newDoc) => {
                            setDoc(newDoc);
                            navigate(`#doc/${newDoc.id}/edit`);
                        }}
                    />
                )}

                {/* Global User Settings */}
                {rootRoute === 'settings' && (
                    <SettingsView 
                        mode="global"
                        settings={doc.settings} // Not used for global, but passing prop type satisfaction
                        onUpdate={() => {}} 
                    />
                )}

                {rootRoute === 'doc' && subView === 'edit' && (
                <div className="flex flex-1 h-full relative">
                    {/* TOOLBOX */}
                    <div className="hidden md:flex w-52 border-r-2 border-black dark:border-white bg-background flex-col z-20 shadow-none flex-shrink-0">
                        <Toolbox onDragStart={handleDragStartToolbox} onAddBlock={addBlock} />
                    </div>

                    {/* MAIN EDITOR AREA */}
                    <div className="flex-1 flex min-w-0 relative bg-muted/10 h-full overflow-hidden">
                        <EditorCanvas 
                            docTitle={doc.title}
                            docSettings={doc.settings}
                            blocks={doc.blocks}
                            parties={doc.parties}
                            variables={doc.variables}
                            selectedBlockId={selectedBlockId}
                            onTitleChange={(t) => setDoc(prev => ({...prev, title: t}))}
                            onPreview={() => navigate(`#doc/${docId}/preview`)}
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

                        {/* PROPERTIES PANEL */}
                        <div className="flex-shrink-0 z-30 h-full hidden lg:block">
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
                        {selectedBlockId && (
                            <div className="lg:hidden absolute inset-0 z-50 bg-background">
                                <PropertiesPanel 
                                    block={getBlock(selectedBlockId)}
                                    parties={doc.parties}
                                    variables={doc.variables}
                                    onUpdate={updateBlock}
                                    onDelete={(id) => { deleteBlock(id); setSelectedBlockId(null); }}
                                    onClose={() => setSelectedBlockId(null)}
                                    onUpdateVariables={(vars) => setDoc(d => ({...d, variables: vars}))}
                                />
                            </div>
                        )}
                    </div>
                </div>
                )}
            </div>
            
            {/* SEND MODAL */}
            <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Secure Transmission</DialogTitle></DialogHeader>
                    <div className="p-8 bg-muted/10 border-2 border-dashed border-black dark:border-white text-sm text-center">
                        <p className="font-mono text-xs mb-6 bg-white dark:bg-black border-2 border-black dark:border-white p-4 select-all shadow-sharp flex justify-between items-center">
                            <span className="truncate mr-4 text-primary">
                                {window.location.origin}/#s/{doc.id || 'draft-id'}
                            </span>
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
    <ErrorBoundary>
        <AuthProvider>
            <DocumentProvider>
                <AppContent />
            </DocumentProvider>
        </AuthProvider>
    </ErrorBoundary>
);

export default App;
