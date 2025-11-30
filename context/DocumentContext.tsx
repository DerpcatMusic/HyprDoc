'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DocumentState } from '../types/document';
import { DocBlock, BlockType, Party, DocumentSettings } from '../types/block';
import { AuditLogEntry, EventType } from '../types/audit';
import * as TreeManager from '../services/treeManager';
import { logEvent } from '../services/eventLogger';
import { hashDocument } from '../services/crypto';
import { SupabaseService } from '../services/supabase';

interface DocumentContextType {
    doc: DocumentState;
    saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
    selectedBlockId: string | null;
    mode: 'edit' | 'preview' | 'dashboard' | 'settings' | 'recipient';
    
    setDoc: React.Dispatch<React.SetStateAction<DocumentState>>;
    loadDocument: (id: string) => Promise<void>;
    createNewDocument: () => void;
    setMode: (mode: 'edit' | 'preview' | 'dashboard' | 'settings' | 'recipient') => void;
    setSelectedBlockId: (id: string | null) => void;
    
    getBlock: (id: string) => DocBlock | null;
    addBlock: (type: BlockType, targetId?: string, position?: 'after' | 'before' | 'inside' | 'inside-false') => void;
    updateBlock: (id: string, updates: Partial<DocBlock>, saveHistory?: boolean) => void;
    deleteBlock: (id: string) => void;
    moveBlock: (draggedId: string, targetId: string | null | undefined, position: 'after' | 'before' | 'inside' | 'inside-false') => void;
    ungroupBlock: (id: string) => void;
    
    updateSettings: (settings: DocumentSettings) => void;
    addAuditLog: (action: EventType, details?: string, data?: any) => void;
    
    updateParties: (parties: Party[]) => void;
    updateParty: (index: number, party: Party) => void;
    addParty: (party: Party) => void;
    removeParty: (id: string) => void;

    undo: () => void;
    redo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    
    uploadAsset: (file: Blob, path: string) => Promise<string | null>;
    saveNow: () => Promise<void>;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

const INITIAL_PARTIES: Party[] = [
    { id: 'p1', name: 'Me (Owner)', color: '#3b82f6', initials: 'ME' },
    { id: 'p2', name: 'Client', color: '#ec4899', initials: 'CL' }
];

const DEFAULT_DOC: DocumentState = {
    id: '',
    title: "Untitled Document",
    status: 'draft',
    parties: INITIAL_PARTIES,
    variables: [],
    settings: {
        signingOrder: 'parallel',
        brandColor: '#000000',
        fontFamily: 'Inter, sans-serif',
        margins: { top: 60, bottom: 60, left: 60, right: 60 },
        direction: 'ltr'
    },
    terms: [], 
    blocks: [],
    auditLog: []
};

const getNiceLabel = (type: BlockType): string => {
    return type.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
};

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [doc, setDoc] = useState<DocumentState>(DEFAULT_DOC);
    const [mode, setMode] = useState<'edit' | 'preview' | 'dashboard' | 'settings' | 'recipient'>('dashboard');
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | 'error'>('saved');

    // History State
    const [past, setPast] = useState<DocumentState[]>([]);
    const [future, setFuture] = useState<DocumentState[]>([]);

    // Auto-Save Logic (Debounced Sync to Supabase)
    const isFirstRun = useRef(true);
    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return;
        }
        if (!doc.id) return; 

        setSaveStatus('saving');
        const timer = setTimeout(async () => {
            try {
                await SupabaseService.saveDocument(doc);
                setSaveStatus('saved');
            } catch (e) {
                setSaveStatus('error');
            }
        }, 2000); // 2s Debounce to reduce DB writes

        return () => clearTimeout(timer);
    }, [doc]);

    const saveNow = async () => {
        if (!doc.id) return;
        setSaveStatus('saving');
        try {
            await SupabaseService.saveDocument(doc);
            setSaveStatus('saved');
        } catch (e) {
            setSaveStatus('error');
        }
    };

    // Hashing Logic
    useEffect(() => {
        let isMounted = true;
        const calculateHash = async () => {
            if (!doc.blocks) return;
            const hash = await hashDocument(doc);
            if (isMounted && hash !== doc.sha256) {
                setDoc(prev => ({ ...prev, sha256: hash }));
            }
        };
        const timer = setTimeout(calculateHash, 500);
        return () => { isMounted = false; clearTimeout(timer); };
    }, [doc.blocks, doc.settings, doc.parties]); 

    // --- Loading Logic ---
    const loadDocument = async (id: string) => {
        setSaveStatus('saving'); // Show loading
        const loaded = await SupabaseService.loadDocument(id);
        if (loaded) {
            setDoc(loaded);
            setPast([]);
            setFuture([]);
            setSaveStatus('saved');
        } else {
            setSaveStatus('error');
        }
    };

    const createNewDocument = () => {
        const newDoc = {
            ...DEFAULT_DOC,
            id: crypto.randomUUID(),
            updatedAt: Date.now(),
            blocks: [{ id: crypto.randomUUID(), type: BlockType.TEXT, content: "# Untitled\nStart typing..." }],
            auditLog: [{ id: crypto.randomUUID(), timestamp: Date.now(), action: 'created', user: 'Me' }]
        } as DocumentState;
        
        setDoc(newDoc);
        setPast([]);
        setFuture([]);
        setSaveStatus('unsaved'); 
    };

    // --- History Management ---
    const saveSnapshot = useCallback(() => {
        setPast(prev => [...prev, doc]);
        setFuture([]);
        setSaveStatus('unsaved');
    }, [doc]);

    const undo = useCallback(() => {
        if (past.length === 0) return;
        const previous = past[past.length - 1];
        if (!previous) return;
        const newPast = past.slice(0, past.length - 1);
        
        setPast(newPast);
        setFuture(prev => [doc, ...prev]);
        setDoc(previous);
    }, [doc, past]);

    const redo = useCallback(() => {
        if (future.length === 0) return;
        const next = future[0];
        if (!next) return;
        const newFuture = future.slice(1);

        setPast(prev => [...prev, doc]);
        setFuture(newFuture);
        setDoc(next);
    }, [doc, future]);


    const addAuditLog = async (action: EventType, details?: string, data?: any) => {
        const newEntry = await logEvent(doc.auditLog || [], action, 'Me', details, data);
        setDoc(prev => ({ 
            ...prev, 
            auditLog: [newEntry, ...(prev.auditLog || [])] 
        }));
    };

    const createBlockObject = (type: BlockType): DocBlock => {
        const base: DocBlock = {
            id: crypto.randomUUID(),
            type,
            ...(type === BlockType.TEXT && { content: '' }),
            label: getNiceLabel(type),
            variableName: `field_${Date.now()}_${Math.floor(Math.random()*1000)}`,
            ...(['select','radio','checkbox'].includes(type) && { options: ['Option 1'] }),
            ...(['conditional','repeater'].includes(type) && { children: [] }),
            ...(type === BlockType.CONDITIONAL && { condition: { variableName: '', operator: 'equals', value: '' } }),
        };

        if (type === BlockType.COLUMNS) {
            base.children = [
                { id: crypto.randomUUID(), type: BlockType.COLUMN, width: 50, children: [] },
                { id: crypto.randomUUID(), type: BlockType.COLUMN, width: 50, children: [] }
            ];
        }

        if (type === BlockType.COLUMN) {
            base.width = 50;
            base.children = [];
        }

        if (type === BlockType.SPACER) base.height = 32;
        if (type === BlockType.ALERT) { base.variant = 'info'; base.content = 'Important Information'; }
        if (type === BlockType.QUOTE) base.content = 'Citation or quote text here.';

        return base;
    };

    const getBlock = (id: string): DocBlock | null => {
        return TreeManager.findNode(doc.blocks, id);
    }

    const addBlock = (type: BlockType, targetId?: string, position: 'after' | 'before' | 'inside' | 'inside-false' = 'after') => {
        saveSnapshot();
        const newBlock = createBlockObject(type);
        setDoc(prev => ({
            ...prev,
            blocks: TreeManager.insertNode(prev.blocks, newBlock, targetId, position)
        }));
        setSelectedBlockId(newBlock.id);
        addAuditLog('edited', `Added ${type}`);
    };

    const updateBlock = (id: string, updates: Partial<DocBlock>, recordHistory = true) => {
        if(recordHistory) saveSnapshot();
        setDoc(prev => {
            // Find and update - simpler to clone whole tree for React state
            const newBlocks = TreeManager.cloneTree(prev.blocks);
            const node = TreeManager.findNode(newBlocks, id);
            if(node) {
                Object.assign(node, updates);
            }
            return { ...prev, blocks: newBlocks };
        });
    };

    const deleteBlock = (id: string) => {
        saveSnapshot();
        setDoc(prev => {
            const { tree } = TreeManager.removeNode(prev.blocks, id);
            return { ...prev, blocks: tree };
        });
        setSelectedBlockId(null);
        addAuditLog('edited', 'Deleted block');
    };

    const moveBlock = (draggedId: string, targetId: string | null | undefined, position: 'after' | 'before' | 'inside' | 'inside-false') => {
        saveSnapshot();
        setDoc(prev => {
            // 1. Remove
            const { tree: tempTree, removed } = TreeManager.removeNode(prev.blocks, draggedId);
            if (!removed) return prev;
            
            // 2. Insert
            const finalTree = TreeManager.insertNode(tempTree, removed, targetId || undefined, position);
            return { ...prev, blocks: finalTree };
        });
    };

    const ungroupBlock = (id: string) => {
        saveSnapshot();
        setDoc(prev => {
             const container = TreeManager.findNode(prev.blocks, id);
             if (!container || !container.children) return prev;
             
             // Gather all children from all columns
             let allItems: DocBlock[] = [];
             if (container.type === BlockType.COLUMNS) {
                 container.children.forEach(col => {
                     if (col.children) allItems = [...allItems, ...col.children];
                 });
             } else {
                 allItems = container.children;
             }
             
             // Replace container with items
             const newBlocks = TreeManager.replaceNode(prev.blocks, id, allItems);
             return { ...prev, blocks: newBlocks };
        });
        addAuditLog('edited', 'Ungrouped columns');
    }

    const updateSettings = (settings: DocumentSettings) => {
        saveSnapshot();
        setDoc(prev => ({ ...prev, settings }));
    }

    // Party Management
    const updateParties = (parties: Party[]) => {
        saveSnapshot();
        setDoc(prev => ({ ...prev, parties }));
    };

    const updateParty = (index: number, party: Party) => {
        saveSnapshot();
        const newParties = [...doc.parties];
        newParties[index] = party;
        setDoc(prev => ({ ...prev, parties: newParties }));
    };

    const addParty = (party: Party) => {
        saveSnapshot();
        setDoc(prev => ({ ...prev, parties: [...prev.parties, party] }));
    };

    const removeParty = (id: string) => {
        saveSnapshot();
        setDoc(prev => ({ ...prev, parties: prev.parties.filter(p => p.id !== id) }));
    };
    
    // Asset Management
    const uploadAsset = async (file: Blob, path: string) => {
        return await SupabaseService.uploadAsset(file, path);
    }

    return (
        <DocumentContext.Provider value={{
            doc, setDoc, saveStatus, selectedBlockId, mode,
            loadDocument, createNewDocument, setMode, setSelectedBlockId,
            getBlock, addBlock, updateBlock, deleteBlock, moveBlock, ungroupBlock,
            updateSettings, addAuditLog,
            updateParties, updateParty, addParty, removeParty,
            undo, redo, canUndo: past.length > 0, canRedo: future.length > 0,
            uploadAsset, saveNow
        }}>
            {children}
        </DocumentContext.Provider>
    );
};

export const useDocument = () => {
    const context = useContext(DocumentContext);
    if (context === undefined) {
        throw new Error('useDocument must be used within a DocumentProvider');
    }
    return context;
};
