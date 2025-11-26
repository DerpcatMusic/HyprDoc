
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
    
    addBlock: (type: BlockType, targetId?: string, position?: 'after' | 'inside') => void;
    updateBlock: (id: string, updates: Partial<DocBlock>) => void;
    deleteBlock: (id: string) => void;
    moveBlock: (draggedId: string, targetId: string, position: 'after' | 'inside') => void;
    
    updateSettings: (settings: DocumentSettings) => void;
    addAuditLog: (action: AuditLogEntry['action'], details?: string) => void;
    
    // Party Management
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

// Helper for nice default labels
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
        default: return 'New Field';
    }
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

    // Move Block
    const moveBlock = (draggedId: string, targetId: string, position: 'after' | 'inside') => {
        setDoc(prev => {
            const newBlocks = [...prev.blocks];
            
            // 1. Find and remove dragged block
            let draggedBlock: DocBlock | null = null;
            
            const removeRecursive = (list: DocBlock[]): DocBlock[] => {
                const filtered = [];
                for (const b of list) {
                    if (b.id === draggedId) {
                        draggedBlock = b;
                        continue; 
                    }
                    if (b.children) {
                        b.children = removeRecursive(b.children);
                    }
                    filtered.push(b);
                }
                return filtered;
            }
            
            const blocksWithoutDragged = removeRecursive(newBlocks);
            
            if (!draggedBlock) return prev; 

            // 2. Insert at new location
            const insertRecursive = (list: DocBlock[]): boolean => {
                if (position === 'inside') {
                     const target = list.find(b => b.id === targetId);
                     if (target) {
                         target.children = target.children || [];
                         target.children.push(draggedBlock!);
                         return true;
                     }
                }

                if (position === 'after') {
                     const idx = list.findIndex(b => b.id === targetId);
                     if (idx !== -1) {
                         list.splice(idx + 1, 0, draggedBlock!);
                         return true;
                     }
                }

                for (const b of list) {
                    if (b.children) {
                        if (insertRecursive(b.children)) return true;
                    }
                }
                return false;
            }

            if (!insertRecursive(blocksWithoutDragged)) {
                 blocksWithoutDragged.push(draggedBlock);
            }

            return { ...prev, blocks: blocksWithoutDragged };
        });
    };

    // Recursive Add
    const addBlock = (type: BlockType, targetId?: string, position: 'after' | 'inside' = 'after') => {
        // Safety check: if targetId is actually an Event object (from a mis-bound click handler), ignore it
        const safeTargetId = typeof targetId === 'string' ? targetId : undefined;

        const newBlock: DocBlock = {
            id: crypto.randomUUID(),
            type,
            content: type === BlockType.TEXT ? '' : undefined,
            label: getNiceLabel(type),
            variableName: `field_${Date.now()}`,
            options: (type === BlockType.SELECT || type === BlockType.RADIO || type === BlockType.CHECKBOX) ? ['Option 1'] : undefined,
            repeaterFields: type === BlockType.REPEATER ? [
                { id: crypto.randomUUID(), type: BlockType.INPUT, label: 'Item Name', variableName: 'col_1' },
            ] : undefined,
            children: type === BlockType.CONDITIONAL ? [] : undefined,
            condition: type === BlockType.CONDITIONAL ? { variableName: '', equals: '' } : undefined,
            currencySettings: type === BlockType.CURRENCY ? { amountType: 'fixed', baseCurrency: 'USD', targetCurrency: 'EUR', amount: 1000 } : undefined
        };

        setDoc(prev => {
            const newBlocks = JSON.parse(JSON.stringify(prev.blocks));

            const insertRecursive = (list: DocBlock[]): boolean => {
                if (position === 'inside') {
                     const target = list.find(b => b.id === safeTargetId);
                     if (target) {
                         target.children = target.children || [];
                         target.children.push(newBlock);
                         return true;
                     }
                } else {
                     const idx = list.findIndex(b => b.id === safeTargetId);
                     if (idx !== -1) {
                         list.splice(idx + 1, 0, newBlock);
                         return true;
                     }
                }
                
                for (const b of list) {
                    if (b.children && insertRecursive(b.children)) return true;
                }
                return false;
            };

            if (safeTargetId) {
                if (!insertRecursive(newBlocks)) {
                    newBlocks.push(newBlock); // Fallback if target not found
                }
            } else {
                newBlocks.push(newBlock);
            }
            
            return { ...prev, blocks: newBlocks };
        });
        
        setSelectedBlockId(newBlock.id);
        addAuditLog('edited', `Added ${getNiceLabel(type)} block`);
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
    };

    const addParty = (party: Party) => {
        setDoc(prev => ({ ...prev, parties: [...prev.parties, party] }));
    };

    const removeParty = (id: string) => {
        setDoc(prev => ({ ...prev, parties: prev.parties.filter(p => p.id !== id) }));
    };

    return (
        <DocumentContext.Provider value={{
            doc, setDoc, mode, setMode, selectedBlockId, setSelectedBlockId,
            addBlock, updateBlock, deleteBlock, moveBlock, updateSettings, addAuditLog,
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
