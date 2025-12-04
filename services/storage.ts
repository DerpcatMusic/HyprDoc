
import { DocumentState, BlockType } from '../types';

const STORAGE_KEY_PREFIX = 'hyprdoc_doc_';
const INDEX_KEY = 'hyprdoc_index';

interface DocMeta {
    id: string;
    title: string;
    updatedAt: number;
    status: string;
}

const SAMPLE_DOC: DocumentState = {
  id: 'doc_sample',
  title: "Service Agreement Template",
  status: 'draft',
  parties: [
      { id: 'p1', name: 'Me (Owner)', color: '#3b82f6', initials: 'ME' },
      { id: 'p2', name: 'Client', color: '#ec4899', initials: 'CL' }
  ],
  variables: [{ id: 'v1', key: 'ClientName', value: 'Acme Corp', label: 'Client Name' }],
  settings: {
      signingOrder: 'parallel',
      brandColor: '#000000',
      fontFamily: 'Inter, sans-serif',
      margins: { top: 60, bottom: 60, left: 60, right: 60 },
      direction: 'ltr'
  },
  terms: [], 
  blocks: [
    { id: '1', type: BlockType.TEXT, content: "# Service Agreement\n\nThis agreement is made between **HyprDoc Inc.** and **{{ClientName}}**." },
    { id: '2', type: BlockType.INPUT, label: "Client Representative", variableName: "rep_name", assignedToPartyId: 'p2', required: true },
    { id: '3', type: BlockType.NUMBER, label: "Hourly Rate", variableName: "rate", assignedToPartyId: 'p1', required: true },
    { id: '4', type: BlockType.SPACER, height: 40 },
    { id: '5', type: BlockType.SIGNATURE, label: "Signatures", required: true, assignedToPartyId: 'p2' }
  ],
  auditLog: [{ id: 'l1', timestamp: Date.now(), action: 'created', user: 'System', details: 'Template initialized' }],
  updatedAt: Date.now()
};

/**
 * DB Service Simulation
 */
export const StorageService = {
    /**
     * Get list of all documents (metadata only)
     */
    listDocuments: (): DocMeta[] => {
        try {
            const indexJson = localStorage.getItem(INDEX_KEY);
            let index: DocMeta[] = indexJson ? JSON.parse(indexJson) : [];
            
            // Seed if empty
            if (index.length === 0) {
                StorageService.saveDocument(SAMPLE_DOC);
                index = [{ 
                    id: SAMPLE_DOC.id!, 
                    title: SAMPLE_DOC.title, 
                    updatedAt: SAMPLE_DOC.updatedAt!, 
                    status: SAMPLE_DOC.status 
                }];
            }
            
            // Sort by newest
            return index.sort((a, b) => b.updatedAt - a.updatedAt);
        } catch (e) {
            console.error("Storage Error", e);
            return [];
        }
    },

    /**
     * Load full document by ID
     */
    loadDocument: (id: string): DocumentState | null => {
        try {
            const docJson = localStorage.getItem(STORAGE_KEY_PREFIX + id);
            return docJson ? JSON.parse(docJson) : null;
        } catch (e) {
            console.error("Load Error", e);
            return null;
        }
    },

    /**
     * Save document (Upsert)
     */
    saveDocument: (doc: DocumentState): void => {
        try {
            if (!doc.id) doc.id = crypto.randomUUID();
            doc.updatedAt = Date.now();

            // 1. Save Full Doc
            localStorage.setItem(STORAGE_KEY_PREFIX + doc.id, JSON.stringify(doc));

            // 2. Update Index
            const indexJson = localStorage.getItem(INDEX_KEY);
            let index: DocMeta[] = indexJson ? JSON.parse(indexJson) : [];
            
            const meta: DocMeta = { 
                id: doc.id, 
                title: doc.title, 
                updatedAt: doc.updatedAt, 
                status: doc.status 
            };

            const existingIdx = index.findIndex(i => i.id === doc.id);
            if (existingIdx >= 0) {
                index[existingIdx] = meta;
            } else {
                index.push(meta);
            }

            localStorage.setItem(INDEX_KEY, JSON.stringify(index));
        } catch (e) {
            console.error("Save Error", e);
            throw new Error("Failed to save to local storage");
        }
    },

    /**
     * Delete document
     */
    deleteDocument: (id: string): void => {
        try {
            localStorage.removeItem(STORAGE_KEY_PREFIX + id);
            
            const indexJson = localStorage.getItem(INDEX_KEY);
            if (indexJson) {
                let index: DocMeta[] = JSON.parse(indexJson);
                index = index.filter(i => i.id !== id);
                localStorage.setItem(INDEX_KEY, JSON.stringify(index));
            }
        } catch (e) {
            console.error("Delete Error", e);
        }
    }
};
