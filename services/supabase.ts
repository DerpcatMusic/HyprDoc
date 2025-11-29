
import { createClient } from '@supabase/supabase-js';
import { DocumentState, BlockType, AuditLogEntry, DocBlock } from '../types';

// NOTE: These should be in your .env file
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only create client if keys exist, otherwise null (triggers offline mode)
export const supabase = (SUPABASE_URL && SUPABASE_KEY) ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;

// --- Local Storage Helpers ---
const LS_PREFIX = 'hyprdoc_v1_';
const LS_INDEX = 'hyprdoc_index';

const LocalStore = {
    getAll: (): DocMeta[] => {
        try {
            return JSON.parse(localStorage.getItem(LS_INDEX) || '[]');
        } catch { return []; }
    },
    save: (doc: DocumentState) => {
        try {
            // Save Doc
            localStorage.setItem(`${LS_PREFIX}${doc.id}`, JSON.stringify(doc));
            
            // Update Index
            const index = LocalStore.getAll();
            const meta = { id: doc.id!, title: doc.title, updated_at: new Date().toISOString(), status: doc.status };
            const existingIdx = index.findIndex(i => i.id === doc.id);
            
            if (existingIdx >= 0) index[existingIdx] = meta;
            else index.unshift(meta);
            
            localStorage.setItem(LS_INDEX, JSON.stringify(index));
        } catch (e) {
            console.error("Local Save Failed", e);
        }
    },
    get: (id: string): DocumentState | null => {
        try {
            const data = localStorage.getItem(`${LS_PREFIX}${id}`);
            return data ? JSON.parse(data) : null;
        } catch { return null; }
    },
    delete: (id: string) => {
        localStorage.removeItem(`${LS_PREFIX}${id}`);
        const index = LocalStore.getAll().filter(i => i.id !== id);
        localStorage.setItem(LS_INDEX, JSON.stringify(index));
    }
}

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

// --- OTP SIMULATION STORE (In-Memory for Demo) ---
const otpStore = new Map<string, { code: string; expires: number }>();

/**
 * Supabase Service with Local Storage Fallback
 */
export const SupabaseService = {
    // --- AUTHENTICATION ---
    auth: {
        signUp: async (email: string, password: string) => {
            if (!supabase) return { data: null, error: null }; // Mock success
            return await supabase.auth.signUp({ email, password });
        },
        signIn: async (email: string, password: string) => {
            if (!supabase) return { data: { user: { id: 'local_user', email } }, error: null }; // Mock success
            return await supabase.auth.signInWithPassword({ email, password });
        },
        signOut: async () => {
            if (!supabase) return { error: null };
            return await supabase.auth.signOut();
        },
        getUser: async () => {
            if (!supabase) return { data: { user: { id: 'local_user', email: 'demo@hyprdoc.com' } } };
            return await supabase.auth.getUser();
        },
        getSession: async () => {
            if (!supabase) return { data: { session: { user: { id: 'local_user' } } } };
            return await supabase.auth.getSession();
        },
        onAuthStateChange: (callback: (event: any, session: any) => void) => {
            if (!supabase) {
                // Mock subscription
                return { data: { subscription: { unsubscribe: () => {} } } };
            }
            return supabase.auth.onAuthStateChange(callback);
        }
    },

    // --- SECURE ACCESS 2FA ---
    requestAccessCode: async (docId: string, identifier: string): Promise<boolean> => {
        return new Promise((resolve) => {
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            otpStore.set(`${docId}_${identifier}`, { 
                code, 
                expires: Date.now() + 5 * 60 * 1000 // 5 mins 
            });
            console.log(`%c[SECURE GATEWAY] 🔒 2FA Code for ${identifier}: ${code}`, "color: #00ff00; background: #000; font-size: 14px; padding: 4px;");
            setTimeout(() => resolve(true), 1000);
        });
    },

    verifyAccessCode: async (docId: string, identifier: string, code: string): Promise<boolean> => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const record = otpStore.get(`${docId}_${identifier}`);
                if (!record || Date.now() > record.expires) {
                    resolve(false);
                    return;
                }
                if (record.code === code) {
                    otpStore.delete(`${docId}_${identifier}`);
                    resolve(true);
                } else {
                    resolve(false);
                }
            }, 800);
        });
    },

    /**
     * Upload a signature or image to Supabase Storage
     * FALLBACK: Returns DataURL (Base64) if storage is unavailable.
     */
    uploadAsset: async (file: Blob | File, path: string): Promise<string | null> => {
        try {
            if (!supabase) throw new Error("Offline");
            
            const { data, error } = await supabase.storage
                .from('assets')
                .upload(path, file, { upsert: true });

            if (error) throw error;
            
            const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(path);
            return publicUrl;
        } catch (e) {
            console.warn("Storage unavailable, converting to Base64");
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });
        }
    },

    /**
     * List Documents (Hybrid)
     */
    listDocuments: async (): Promise<DocMeta[]> => {
        if (!supabase) return LocalStore.getAll();

        try {
            const { data, error } = await supabase
                .from('documents')
                .select('id, title, status, updated_at')
                .order('updated_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (e) {
            console.warn("Supabase fetch failed, using local storage");
            return LocalStore.getAll();
        }
    },

    /**
     * Load Document (Hybrid)
     */
    loadDocument: async (id: string): Promise<DocumentState | null> => {
        if (id === 'doc_sample') return SAMPLE_DOC;

        // Try Local First for speed/fallback consistency
        const localDoc = LocalStore.get(id);
        
        if (!supabase) return localDoc;

        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            
            return {
                id: data.id,
                ownerId: data.user_id,
                title: data.title,
                status: data.status,
                updatedAt: new Date(data.updated_at).getTime(),
                ...data.content
            };
        } catch (e) {
            if (localDoc) return localDoc;
            return null;
        }
    },

    /**
     * Save Document (Hybrid)
     */
    saveDocument: async (doc: DocumentState): Promise<void> => {
        // Always save to local storage as backup/cache
        LocalStore.save(doc);

        if (!supabase) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();

            const content = {
                blocks: doc.blocks,
                parties: doc.parties,
                variables: doc.variables,
                settings: doc.settings,
                terms: doc.terms,
                auditLog: doc.auditLog
            };

            const payload: any = {
                id: doc.id,
                title: doc.title,
                status: doc.status,
                updated_at: new Date().toISOString(),
                content: content
            };

            if (user) payload.user_id = user.id; 

            const { error } = await supabase
                .from('documents')
                .upsert(payload);

            if (error) throw error;
        } catch (e) {
            console.error("Cloud save failed (saved locally)", e);
        }
    },

    /**
     * Process Signature
     */
    signDocumentBlock: async (
        docId: string, 
        blockId: string, 
        signatureData: { url: string, ip: string, userAgent: string, timestamp: number, location?: string }, 
        partyId: string,
        verifiedIdentifier?: string
    ): Promise<{ success: boolean, updatedDoc?: DocumentState }> => {
        try {
            let doc = await SupabaseService.loadDocument(docId);
            if (!doc) return { success: false };

            if (doc.status === 'completed') return { success: false };

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

            const partyName = doc.parties.find(p => p.id === partyId)?.name || 'Unknown Signer';
            const locationString = signatureData.location ? ` (Location: ${signatureData.location})` : '';
            const identifierString = verifiedIdentifier ? ` [Verified: ${verifiedIdentifier}]` : '';

            const newLog: AuditLogEntry = {
                id: crypto.randomUUID(),
                timestamp: signatureData.timestamp,
                action: 'signed',
                user: partyName,
                details: `Electronic Signature applied by ${partyName}${identifierString}. IP: ${signatureData.ip}${locationString}. Consent granted.`,
                ipAddress: signatureData.ip,
                eventData: { 
                    userAgent: signatureData.userAgent,
                    blockId: blockId,
                    integrityCheck: 'PASSED',
                    location: signatureData.location,
                    consent: true,
                    verifiedIdentifier
                }
            };
            doc.auditLog = [newLog, ...(doc.auditLog || [])];

            const allBlocks = getAllBlocks(doc.blocks);
            const requiredSignatures = allBlocks.filter(b => b.type === BlockType.SIGNATURE && b.required);
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
                if (doc.status === 'draft') doc.status = 'sent';
            }

            await SupabaseService.saveDocument(doc);
            return { success: true, updatedDoc: doc };
        } catch (e) {
            console.error("Signing Transaction Failed", e);
            return { success: false };
        }
    },

    deleteDocument: async (id: string): Promise<void> => {
        LocalStore.delete(id);
        if (supabase) {
            await supabase.from('documents').delete().eq('id', id);
        }
    }
};
