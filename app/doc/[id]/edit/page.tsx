'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { EditorCanvas } from '@/components/EditorCanvas';
import { Toolbox } from '@/components/Toolbox';
import { PropertiesPanel } from '@/components/PropertiesPanel';
import { GlossaryManager } from '@/components/GlossaryManager';
import { Button, Dialog } from '@/components/ui-components';
import { 
    ArrowLeft, Share, Moon, Sun, Book, 
    LogOut, Menu, X, SlidersHorizontal
} from 'lucide-react';
import { useDocument } from '@/context/DocumentContext';
import { useAuth } from '@/context/AuthContext';

export default function DocumentEditorPage() {
    const router = useRouter();
    const params = useParams();
    const docId = params.id as string;
    
    const { 
        doc, setDoc, selectedBlockId, setSelectedBlockId, getBlock,
        addBlock, updateBlock, deleteBlock, addAuditLog, updateParties, loadDocument
    } = useDocument();
    
    const { user, signOut } = useAuth();

    const [recipientIdentifier, setRecipientIdentifier] = useState<string | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showGlossary, setShowGlossary] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Load document effect
    useEffect(() => {
        if (docId && docId !== doc.id) {
            loadDocument(docId);
        }
    }, [docId, doc.id, loadDocument]);

    // Toggle dark mode
    useEffect(() => {
        if (isDarkMode) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [isDarkMode]);

    const handleDragStartToolbox = (e: React.DragEvent, type: any) => {
        e.dataTransfer.setData('application/hyprdoc-new', type);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const handleDropCanvas = (e: React.DragEvent, targetId?: string, position?: any) => {
        e.preventDefault();
        const newType = e.dataTransfer.getData('application/hyprdoc-new') as any;
        if (newType) {
            addBlock(newType, targetId);
        }
    };

    const handlePreview = () => {
        router.push(`/doc/${docId}/preview`);
    };

    const handleBackToDashboard = () => {
        router.push('/dashboard');
    };

    const handleShare = () => {
        router.push(`/s/${docId}`);
    };

    if (!user) {
        router.push('/auth');
        return null;
    }

    return (
        <div className="flex h-screen w-screen bg-background text-foreground font-sans overflow-hidden relative">
            {/* Mobile Header */}
            <div className="md:hidden absolute top-0 left-0 right-0 h-14 bg-background border-b-2 border-black flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-2">
                    <button onClick={handleBackToDashboard}>
                        <ArrowLeft size={20} />
                    </button>
                    <span className="font-bold font-mono tracking-tight uppercase">{doc.title || 'Document'}</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Navigation Sidebar */}
            <div className={`
                w-16 border-r-2 border-black bg-white dark:bg-black dark:border-white 
                flex flex-col items-center py-6 gap-8 z-40 shadow-none flex-shrink-0 transition-all duration-300
                md:static md:flex
                ${isMobileMenuOpen ? "absolute inset-0 w-full flex-col pt-20" : "hidden"}
            `}>
                <div className="w-10 h-10 bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-lg tracking-tighter shadow-sharp dark:shadow-sharp-dark md:flex hidden">
                    <span className="text-sm">HD</span>
                </div>
                
                <div className="flex-1 flex flex-col gap-6 w-full px-2 items-center mt-4">
                    <button 
                        className="w-10 h-10 flex items-center justify-center border-2 transition-all bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" 
                        onClick={handleBackToDashboard}
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={20} />
                        <span className="md:hidden ml-2 font-mono font-bold">Dashboard</span>
                    </button>

                    <button 
                        className="w-10 h-10 flex items-center justify-center border-2 transition-all border-transparent hover:border-black dark:hover:border-white text-muted-foreground" 
                        onClick={handlePreview}
                        title="Preview Document"
                    >
                        <SlidersHorizontal size={20} />
                        <span className="md:hidden ml-2 font-mono font-bold">Preview</span>
                    </button>
                </div>
                
                <div className="flex flex-col gap-4 w-full px-2 items-center mb-4">
                    <button 
                        className={`w-10 h-10 flex items-center justify-center border-2 transition-all ${
                            showGlossary ? 'bg-black text-white border-black dark:bg-white dark:text-black dark:border-white' : 'border-transparent hover:border-black dark:hover:border-white text-muted-foreground'
                        }`} 
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

            {/* Main Editor */}
            <div className="flex-1 flex flex-col min-w-0 h-full pt-14 md:pt-0">
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
                            onPreview={handlePreview}
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
            </div>
            
            {/* Top Bar for Desktop */}
            <div className="hidden md:flex absolute top-0 right-0 h-14 bg-background/90 backdrop-blur-none border-b-2 border-black dark:border-white px-6 py-4 gap-4 z-50">
                <Button variant="ghost" size="icon" onClick={() => setIsDarkMode(!isDarkMode)}>
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </Button>
                <Button onClick={handlePreview} variant="outline">
                    Preview
                </Button>
                <Button onClick={() => setShowSendModal(true)} className="gap-2">
                    <Share size={16}/> SHARE
                </Button>
            </div>
            
            {/* SEND MODAL */}
            <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
                <div className="p-8 bg-muted/10 border-2 border-dashed border-black dark:border-white text-sm text-center">
                    <p className="font-mono text-xs mb-6 bg-white dark:bg-black border-2 border-black dark:border-white p-4 select-all shadow-sharp flex justify-between items-center">
                        <span className="truncate mr-4 text-primary">
                            {typeof window !== 'undefined' ? window.location.origin : ''}/s/{doc.id || 'draft-id'}
                        </span>
                        <span className="text-[9px] bg-black text-white px-2 py-1 font-bold cursor-pointer hover:bg-primary dark:bg-white dark:text-black">COPY</span>
                    </p>
                    <p className="text-muted-foreground text-[10px] font-mono uppercase tracking-widest">Recipient requires authentication</p>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setShowSendModal(false)}>Cancel</Button>
                    <Button onClick={() => { 
                        setDoc(prev => ({ ...prev, status: 'sent', snapshot: prev.blocks })); 
                        setShowSendModal(false); 
                        addAuditLog('sent', 'Document snapshot created');
                    }}>
                        Generate Link & Snapshot
                    </Button>
                </div>
            </Dialog>
        </div>
    );
}