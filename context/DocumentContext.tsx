
import React, { createContext, useContext, useState, useEffect } from 'react';
import { DocumentState, DocBlock, BlockType, AuditLogEntry, Party, DocumentSettings, EventType } from '../types';
import * as TreeManager from '../services/treeManager';
import { logEvent } from '../services/eventLogger';
import { hashDocument } from '../services/crypto';

interface DocumentContextType {
    doc: DocumentState;
    selectedBlockId: string | null;
    mode: 'edit' | 'preview' | 'dashboard' | 'settings' | 'recipient';
    
    // Actions
    setDoc: React.Dispatch<React.SetStateAction<DocumentState>>;
    setMode: (mode: 'edit' | 'preview' | 'dashboard' | 'settings' | 'recipient') => void;
    setSelectedBlockId: (id: string | null) => void;
    
    getBlock: (id: string) => DocBlock | null;
    addBlock: (type: BlockType, targetId?: string, position?: 'after' | 'inside') => void;
    updateBlock: (id: string, updates: Partial<DocBlock>) => void;
    deleteBlock: (id: string) => void;
    moveBlock: (draggedId: string, targetId: string, position: 'after' | 'inside') => void;
    createColumnLayout: (targetBlockId: string, source: string | BlockType, direction: 'left' | 'right') => void;
    ungroupRow: (rowId: string) => void;
    
    updateSettings: (settings: DocumentSettings) => void;
    addAuditLog: (action: EventType, details?: string, data?: any) => void;
    
    updateParties: (parties: Party[]) => void;
    updateParty: (index: number, party: Party) => void;
    addParty: (party: Party) => void;
    removeParty: (id: string) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

const INITIAL_PARTIES: Party[] = [
    { id: 'p1', name: 'Me (Owner)', color: '#3b82f6', initials: 'ME' },
    { id: 'p2', name: 'Client', color: '#ec4899', initials: 'CL' },
    { id: 'p3', name: 'Legal Dept', color: '#10b981', initials: 'LG' }
];

const SAMPLE_DOC: DocumentState = {
  id: 'doc_123',
  title: "Service Agreement",
  status: 'draft',
  parties: INITIAL_PARTIES,
  variables: [{ id: 'v1', key: 'ClientName', value: 'Acme Corp', label: 'Client Name' }],
  settings: {
      signingOrder: 'parallel',
      brandColor: '#000000',
      fontFamily: 'Inter, sans-serif',
      margins: { top: 60, bottom: 60, left: 60, right: 60 }
  },
  terms: [], 
  blocks: [
    { id: '1', type: BlockType.TEXT, content: "# Service Agreement\n\nThis agreement is made between **HyprDoc Inc.** and **{{ClientName}}**." },
    { id: '2', type: BlockType.INPUT, label: "Client Representative", variableName: "rep_name", assignedToPartyId: 'p2', required: true },
    { id: '3', type: BlockType.NUMBER, label: "Hourly Rate", variableName: "rate", assignedToPartyId: 'p1', required: true },
  ],
  auditLog: [{ id: 'l1', timestamp: Date.now(), action: 'created', user: 'System', ipAddress: 'System' }]
};

const getNiceLabel = (type: BlockType): string => {
    switch(type) {
        case BlockType.TEXT: return 'Text Content';
        case BlockType.INPUT: return 'Short Answer';
        case BlockType.LONG_TEXT: return 'Long Answer';
        case BlockType.NUMBER: return 'Number Input';
        case BlockType.EMAIL: return 'Email Address';
        case BlockType.SELECT: return 'Dropdown Menu';
        case BlockType.RADIO: return 'Single Choice';
        case BlockType.CHECKBOX: return 'Checkbox';
        case BlockType.DATE: return 'Date Picker';
        case BlockType.SIGNATURE: return 'Signature';
        case BlockType.IMAGE: return 'Image Upload';
        case BlockType.FILE_UPLOAD: return 'File Attachment';
        case BlockType.SECTION_BREAK: return 'Section Break';
        case BlockType.PAYMENT: return 'Payment Request';
        case BlockType.CURRENCY: return 'Currency Value';
        case BlockType.VIDEO: return 'Video Embed';
        case BlockType.CONDITIONAL: return 'Conditional Branch';
        case BlockType.REPEATER: return 'Repeater Group';
        case BlockType.FORMULA: return 'Formula Calculation';
        case BlockType.COLUMNS: return 'Columns';
        case BlockType.COLUMN: return 'Column';
        default: return 'New Field';
    }
};

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [doc, setDoc] = useState<DocumentState>(SAMPLE_DOC);
    const [mode, setMode] = useState<'edit' | 'preview' | 'dashboard' | 'settings' | 'recipient'>('dashboard');
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

    // AUTO-HASHING EFFECT
    useEffect(() => {
        let isMounted = true;
        const calculateHash = async () => {
            const hash = await hashDocument(doc);
            if (isMounted && hash !== doc.sha256) {
                // We perform a silent update to avoid infinite loops if not handled carefully.
                // However, setDoc triggers re-render, so we only set if hash changed.
                setDoc(prev => ({ ...prev, sha256: hash }));
            }
        };
        // Debounce slightly to avoid hammering crypto API on every keystroke
        const timer = setTimeout(calculateHash, 500);
        return () => { isMounted = false; clearTimeout(timer); };
    }, [doc.blocks, doc.settings, doc.parties]); // Dependencies that affect legal state

    // Enhanced Audit Logger
    const addAuditLog = async (action: EventType, details?: string, data?: any) => {
        const newEntry = await logEvent(doc.auditLog || [], action, 'Me', details, data);
        setDoc(prev => ({ 
            ...prev, 
            auditLog: [newEntry, ...(prev.auditLog || [])] 
        }));
    };

    const createBlockObject = (type: BlockType): DocBlock => ({
        id: crypto.randomUUID(),
        type,
        content: type === BlockType.TEXT ? '' : undefined,
        label: getNiceLabel(type),
        variableName: `field_${Date.now()}`,
        options: ['select','radio','checkbox'].includes(type) ? ['Option 1'] : undefined,
        children: ['conditional','columns','column'].includes(type) ? [] : undefined,
        condition: type === BlockType.CONDITIONAL ? { variableName: '', operator: 'equals', value: '' } : undefined,
        width: type === BlockType.COLUMN ? 50 : undefined
    });

    // -------------------------------------------------------------------------
    // CORE LOGIC USING TREEMANAGER
    // -------------------------------------------------------------------------
    
    const getBlock = (id: string): DocBlock | null => {
        return TreeManager.findNode(doc.blocks, id);
    }

    const addBlock = (type: BlockType, targetId?: string, position: 'after' | 'inside' = 'after') => {
        const newBlock = createBlockObject(type);
        setDoc(prev => ({
            ...prev,
            blocks: TreeManager.insertNode(prev.blocks, newBlock, targetId, position)
        }));
        setSelectedBlockId(newBlock.id);
        addAuditLog('edited', `Added ${type}`);
    };

    const updateBlock = (id: string, updates: Partial<DocBlock>) => {
        const updateRecursive = (list: DocBlock[]): DocBlock[] => list.map(b => {
            if (b.id === id) return { ...b, ...updates };
            if (b.children) return { ...b, children: updateRecursive(b.children) };
            return b;
        });
        setDoc(prev => ({ ...prev, blocks: updateRecursive(prev.blocks) }));
    };

    const deleteBlock = (id: string) => {
        setDoc(prev => {
            const { tree } = TreeManager.removeNode(prev.blocks, id);
            return { ...prev, blocks: TreeManager.sanitizeTree(tree) };
        });
        if (selectedBlockId === id) setSelectedBlockId(null);
        addAuditLog('edited', 'Deleted block');
    };

    const moveBlock = (draggedId: string, targetId: string, position: 'after' | 'inside') => {
        if (draggedId === targetId) return;

        setDoc(prev => {
            const { tree: treeWithoutDragged, removed } = TreeManager.removeNode(prev.blocks, draggedId);
            if (!removed) return prev;

            const newTree = TreeManager.insertNode(treeWithoutDragged, removed, targetId, position);
            return { ...prev, blocks: TreeManager.sanitizeTree(newTree) };
        });
        addAuditLog('edited', 'Reordered blocks');
    };

    const createColumnLayout = (targetBlockId: string, source: string | BlockType, direction: 'left' | 'right') => {
        setDoc(prev => {
            let sourceBlock: DocBlock | null = null;
            let currentTree = prev.blocks;

            // 1. Get Source Block
            if (typeof source === 'string' && !Object.values(BlockType).includes(source as BlockType)) {
                const res = TreeManager.removeNode(currentTree, source);
                currentTree = res.tree;
                sourceBlock = res.removed;
            } else {
                sourceBlock = createBlockObject(source as BlockType);
            }

            if (!sourceBlock) return prev;

            // 2. Perform Split
            const newTree = TreeManager.splitBlock(currentTree, targetBlockId, sourceBlock, direction);
            return { ...prev, blocks: TreeManager.sanitizeTree(newTree) };
        });
        addAuditLog('edited', 'Created Columns');
    };

    const ungroupRow = (rowId: string) => {
        setDoc(prev => {
            const row = TreeManager.findNode(prev.blocks, rowId);
            if (!row || !row.children) return prev;

            const grandChildren: DocBlock[] = [];
            row.children.forEach(col => {
                if (col.children) grandChildren.push(...col.children);
            });

            const replaceWithChildren = (list: DocBlock[]): DocBlock[] => {
                const res: DocBlock[] = [];
                for(const b of list) {
                    if (b.id === rowId) {
                        res.push(...grandChildren);
                    } else {
                        if (b.children) b.children = replaceWithChildren(b.children);
                        res.push(b);
                    }
                }
                return res;
            }

            return { ...prev, blocks: replaceWithChildren(prev.blocks) };
        });
        addAuditLog('edited', 'Ungrouped columns');
    };

    // -------------------------------------------------------------------------
    
    const updateSettings = (settings: DocumentSettings) => {
        setDoc(p => ({ ...p, settings }));
        addAuditLog('edited', 'Updated document settings');
    }
    const updateParties = (parties: Party[]) => {
        setDoc(p => ({ ...p, parties }));
        addAuditLog('edited', 'Updated parties');
    }
    const updateParty = (i: number, p: Party) => {
        const newP = [...doc.parties]; newP[i] = p; updateParties(newP);
    };
    const addParty = (p: Party) => updateParties([...doc.parties, p]);
    const removeParty = (id: string) => updateParties(doc.parties.filter(p => p.id !== id));

    return (
        <DocumentContext.Provider value={{
            doc, setDoc, mode, setMode, selectedBlockId, setSelectedBlockId, getBlock,
            addBlock, updateBlock, deleteBlock, moveBlock, createColumnLayout, ungroupRow, updateSettings, addAuditLog,
            updateParties, updateParty, addParty, removeParty
        }}>
            {children}
        </DocumentContext.Provider>
    );
};

export const useDocument = () => {
    const context = useContext(DocumentContext);
    if (!context) throw new Error("useDocument must be used within a DocumentProvider");
    return context;
};
