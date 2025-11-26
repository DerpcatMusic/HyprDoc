import React, { createContext, useContext, useState, useEffect } from 'react';
import { DocumentState, DocBlock, BlockType, AuditLogEntry, Party, DocumentSettings, Term } from '../types';

interface DocumentContextType {
    doc: DocumentState;
    selectedBlockId: string | null;
    mode: 'edit' | 'preview' | 'dashboard' | 'settings' | 'recipient';
    
    // Actions
    setDoc: React.Dispatch<React.SetStateAction<DocumentState>>;
    setMode: (mode: 'edit' | 'preview' | 'dashboard' | 'settings' | 'recipient') => void;
    setSelectedBlockId: (id: string | null) => void;
    
    addBlock: (type: BlockType, insertAfterId?: string) => void;
    updateBlock: (id: string, updates: Partial<DocBlock>) => void;
    deleteBlock: (id: string) => void;
    
    updateSettings: (settings: DocumentSettings) => void;
    addAuditLog: (action: AuditLogEntry['action'], details?: string) => void;
    
    // Party Management
    updateParties: (parties: Party[]) => void;
    updateParty: (index: number, party: Party) => void;
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
  variables: [
      { id: 'v1', key: 'ClientName', value: 'Acme Corp', label: 'Client Name' },
  ],
  settings: {
      signingOrder: 'parallel',
      brandColor: '#000000',
      fontFamily: 'Inter, sans-serif',
      margins: { top: 60, bottom: 60, left: 60, right: 60 }
  },
  terms: [], 
  blocks: [
    { id: '1', type: BlockType.TEXT, content: "# Service Agreement\n\nThis agreement is made between **HyprDoc Inc.** and **{{ClientName}}**.\n\nThe Supplier shall indemnify the Client against all Liability arising from any breach of Confidentiality." },
    { id: '2', type: BlockType.INPUT, label: "Client Representative", variableName: "rep_name", assignedToPartyId: 'p2', required: true },
    { id: '3', type: BlockType.NUMBER, label: "Hourly Rate", variableName: "rate", assignedToPartyId: 'p1', required: true },
  ],
  auditLog: [
      { id: 'l1', timestamp: Date.now() - 100000, action: 'created', user: 'System' },
  ]
};

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [doc, setDoc] = useState<DocumentState>(SAMPLE_DOC);
    const [mode, setMode] = useState<'edit' | 'preview' | 'dashboard' | 'settings' | 'recipient'>('dashboard');
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

    const addAuditLog = (action: AuditLogEntry['action'], details?: string) => {
        const newEntry: AuditLogEntry = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            action,
            user: 'Me (Owner)',
            details
        };
        setDoc(prev => ({ ...prev, auditLog: [newEntry, ...(prev.auditLog || [])] }));
    };

    // Recursive Update
    const updateBlock = (id: string, updates: Partial<DocBlock>) => {
        const updateRecursive = (list: DocBlock[]): DocBlock[] => {
            return list.map(b => {
                if (b.id === id) return { ...b, ...updates };
                if (b.children) return { ...b, children: updateRecursive(b.children) };
                return b;
            })
        }
        setDoc(prev => ({ ...prev, blocks: updateRecursive(prev.blocks) }));
    };

    // Recursive Delete
    const deleteBlock = (id: string) => {
        const deleteRecursive = (list: DocBlock[]): DocBlock[] => {
            return list.filter(b => b.id !== id).map(b => ({
                ...b,
                children: b.children ? deleteRecursive(b.children) : undefined
            }));
        }
        setDoc(prev => ({ ...prev, blocks: deleteRecursive(prev.blocks) }));
        if (selectedBlockId === id) setSelectedBlockId(null);
    };

    // Recursive Add
    const addBlock = (type: BlockType, insertAfterId?: string) => {
        const newBlock: DocBlock = {
            id: crypto.randomUUID(),
            type,
            content: type === BlockType.TEXT ? '' : undefined,
            label: `New ${type}`,
            variableName: `field_${Date.now()}`,
            options: (type === BlockType.SELECT || type === BlockType.RADIO || type === BlockType.CHECKBOX) ? ['Option 1'] : undefined,
            repeaterFields: type === BlockType.REPEATER ? [
                { id: crypto.randomUUID(), type: BlockType.INPUT, label: 'Item Name', variableName: 'col_1' },
            ] : undefined,
            children: type === BlockType.CONDITIONAL ? [] : undefined,
            condition: type === BlockType.CONDITIONAL ? { variableName: '', equals: '' } : undefined,
            currencySettings: type === BlockType.CURRENCY ? { baseCurrency: 'USD', targetCurrency: 'EUR', amount: 1000 } : undefined
        };

        setDoc(prev => {
            // Helper to find and insert into the correct list
            const insertRecursive = (list: DocBlock[]): { newList: DocBlock[], inserted: boolean } => {
                const newList = [...list];
                
                // Case 1: Insert after specific ID
                if (insertAfterId) {
                    const idx = newList.findIndex(b => b.id === insertAfterId);
                    if (idx !== -1) {
                         // Found it in this level
                         newList.splice(idx + 1, 0, newBlock);
                         return { newList, inserted: true };
                    }
                    
                    // Not found, check children
                    for (let i = 0; i < newList.length; i++) {
                        if (newList[i].children) {
                            const result = insertRecursive(newList[i].children!);
                            if (result.inserted) {
                                newList[i] = { ...newList[i], children: result.newList };
                                return { newList, inserted: true };
                            }
                        }
                    }
                    return { newList, inserted: false };
                } else {
                    // Case 2: No ID provided, append to root (handled by caller if recursive returns false/irrelevant, but here we just push to root list if it is the root call)
                    // Actually, if we are calling this function recursively, 'list' is a children array. 
                    // But if insertAfterId is undefined, we usually mean "Append to Root".
                    return { newList, inserted: false };
                }
            };

            if (insertAfterId) {
                const result = insertRecursive(prev.blocks);
                if (result.inserted) {
                    return { ...prev, blocks: result.newList };
                }
            }
            
            // Default: Append to root
            return { ...prev, blocks: [...prev.blocks, newBlock] };
        });
        
        setSelectedBlockId(newBlock.id);
        addAuditLog('edited', `Added ${type} block`);
    };

    const updateSettings = (settings: DocumentSettings) => {
        setDoc(prev => ({ ...prev, settings }));
        addAuditLog('edited', 'Updated settings');
    };

    const updateParties = (parties: Party[]) => {
        setDoc(prev => ({ ...prev, parties }));
    };
    
    const updateParty = (index: number, party: Party) => {
        setDoc(prev => {
            const newParties = [...prev.parties];
            newParties[index] = party;
            return { ...prev, parties: newParties };
        });
    }

    return (
        <DocumentContext.Provider value={{
            doc, setDoc, mode, setMode, selectedBlockId, setSelectedBlockId,
            addBlock, updateBlock, deleteBlock, updateSettings, addAuditLog,
            updateParties, updateParty
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