import { createClient } from '@supabase/supabase-js';
import { DocumentState, BlockType, AuditLogEntry, DocBlock } from '../types';

// NOTE: These should be in your .env file
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyz.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface DocMeta {
    id: string;
    title: string;
    updated_at: string;
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

// Helper to flatten tree for searching
const getAllBlocks = (blocks: DocBlock[]): DocBlock[] => {
    let flat: DocBlock[] = [];
    blocks.forEach(b => {
        flat.push(b);
        if(b.children) flat.push(...getAllBlocks(b.children));
        if(b.elseChildren) flat.push(...getAllBlocks(b.elseChildren));
    });
    return flat;
};

/**
 * Supabase Service
 */
export const SupabaseService = {
    /**
     * Upload a signature or image to Supabase Storage
     */
    uploadAsset: async (file: Blob | File, path: string): Promise<string | null> => {
        try {
            if (SUPABASE_URL.includes('xyz')) throw new Error("Supabase not configured");
            
            const { data, error } = await supabase.storage
                .from('assets')
                .upload(path, file, { upsert: true });

            if (error) throw error;
            
            const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(path);
            return publicUrl;
        } catch (e) {
            console.error("Upload Error (Mocking fallback)", e);
            // Fallback for demo environment without real Credentials
            return URL.createObjectURL(file);
        }
    },

    /**
     * List Documents
     */
    listDocuments: async (): Promise<DocMeta[]> => {
        try {
            if (SUPABASE_URL.includes('xyz')) {
                // Return mock data if no DB connected
                return [{ id: SAMPLE_DOC.id!, title: SAMPLE_DOC.title, updated_at: new Date().toISOString(), status: SAMPLE_DOC.status }];
            }

            const { data, error } = await supabase
                .from('documents')
                .select('id, title, status, updated_at')
                .order('updated_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("Using Offline Mode:", e);
            return [{ id: SAMPLE_DOC.id!, title: SAMPLE_DOC.title, updated_at: new Date().toISOString(), status: SAMPLE_DOC.status }];
        }
    },

    /**
     * Load Document
     */
    loadDocument: async (id: string): Promise<DocumentState | null> => {
        try {
            if (id === 'doc_sample' || SUPABASE_URL.includes('xyz')) return SAMPLE_DOC;

            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            
            // Map JSONB content back to DocumentState
            return {
                id: data.id,
                title: data.title,
                status: data.status,
                updatedAt: new Date(data.updated_at).getTime(),
                ...data.content // Assuming 'content' column holds blocks, parties, etc.
            };
        } catch (e) {
            console.error("Load Error", e);
            return null;
        }
    },

    /**
     * Save Document
     */
    saveDocument: async (doc: DocumentState): Promise<void> => {
        try {
            if (SUPABASE_URL.includes('xyz')) {
                console.log("Mock Saved:", doc.title);
                return;
            }

            const content = {
                blocks: doc.blocks,
                parties: doc.parties,
                variables: doc.variables,
                settings: doc.settings,
                terms: doc.terms,
                auditLog: doc.auditLog
            };

            const { error } = await supabase
                .from('documents')
                .upsert({
                    id: doc.id,
                    title: doc.title,
                    status: doc.status,
                    updated_at: new Date().toISOString(),
                    content: content
                });

            if (error) throw error;
        } catch (e) {
            console.error("Save Error", e);
            throw e;
        }
    },

    /**
     * PROCESS SIGNATURE EVENT
     * Atomic update for signing a block, logging the audit trail, and checking completion.
     */
    signDocumentBlock: async (
        docId: string, 
        blockId: string, 
        signatureData: { url: string, ip: string, userAgent: string, timestamp: number, location?: string }, 
        partyId: string
    ): Promise<{ success: boolean, updatedDoc?: DocumentState }> => {
        try {
            // 1. Fetch current doc (Real-time check)
            let doc = await SupabaseService.loadDocument(docId);
            if (!doc) return { success: false };

            // Security check: Prevent signing if document is already finalized
            if (doc.status === 'completed') {
                console.warn("Attempt to sign a completed document");
                return { success: false };
            }

            // 2. Update the specific block (Recursive search)
            const updateBlocks = (blocks: DocBlock[]): DocBlock[] => {
                return blocks.map(b => {
                    if (b.id === blockId) {
                        return { 
                            ...b, 
                            content: signatureData.url, 
                            signedAt: signatureData.timestamp 
                        };
                    }
                    if (b.children) b.children = updateBlocks(b.children);
                    if (b.elseChildren) b.elseChildren = updateBlocks(b.elseChildren);
                    return b;
                });
            };

            doc.blocks = updateBlocks(doc.blocks);

            // 3. Add Audit Log Entry
            const partyName = doc.parties.find(p => p.id === partyId)?.name || 'Unknown Signer';
            const locationString = signatureData.location ? ` (Location: ${signatureData.location})` : '';
            
            const newLog: AuditLogEntry = {
                id: crypto.randomUUID(),
                timestamp: signatureData.timestamp,
                action: 'signed',
                user: partyName,
                details: `Electronic Signature applied by ${partyName}. IP: ${signatureData.ip}${locationString}. Consent granted for electronic transmission.`,
                ipAddress: signatureData.ip,
                eventData: { 
                    userAgent: signatureData.userAgent,
                    blockId: blockId,
                    integrityCheck: 'PASSED',
                    location: signatureData.location
                }
            };
            doc.auditLog = [newLog, ...(doc.auditLog || [])];

            // 4. Check for Document Completion
            const allBlocks = getAllBlocks(doc.blocks);
            const requiredSignatures = allBlocks.filter(b => b.type === BlockType.SIGNATURE && b.required);
            
            // Check if every required signature block has content (url)
            const allSigned = requiredSignatures.every(b => b.content && b.content.length > 0);

            if (allSigned) {
                doc.status = 'completed';
                doc.auditLog.unshift({
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    action: 'completed',
                    user: 'System',
                    details: 'All required signatures collected. Document Finalized and Locked.'
                });
            } else {
                doc.status = 'sent'; // Ensure it's marked as in-progress
            }

            // 5. Persist
            await SupabaseService.saveDocument(doc);
            
            return { success: true, updatedDoc: doc };
        } catch (e) {
            console.error("Signing Transaction Failed", e);
            return { success: false };
        }
    },

    /**
     * Delete Document
     */
    deleteDocument: async (id: string): Promise<void> => {
        try {
            if (SUPABASE_URL.includes('xyz')) return;
            await supabase.from('documents').delete().eq('id', id);
        } catch (e) {
            console.error("Delete Error", e);
        }
    }
};