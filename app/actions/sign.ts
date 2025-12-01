'use server'

import { createClient } from '@supabase/supabase-js';
import { hashDocument } from '../../services/crypto';
import { DocumentState } from '../../types/document';
import { DocBlock, BlockType } from '../../types/block';
import { AuditLogEntry } from '../../types/audit';

// Helper to flatten tree
const getAllBlocks = (blocks: DocBlock[]): DocBlock[] => {
    let flat: DocBlock[] = [];
    blocks.forEach(b => {
        flat.push(b);
        if(b.children) flat.push(...getAllBlocks(b.children));
        if(b.elseChildren) flat.push(...getAllBlocks(b.elseChildren));
    });
    return flat;
};

export async function signDocument(
    docId: string, 
    blockId: string, 
    signatureData: { url: string, timestamp: number, ip: string, userAgent: string, location?: string },
    partyId: string,
    clientStateHash: string,
    verifiedIdentifier?: string
) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        return { success: false, error: "Missing Supabase Configuration" };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // 1. Load Document
        // In a real app, we'd use the user's session to fetch this securely
        // For now, we fetch public/shared doc (assuming RLS allows read)
        // Note: We use the 'hyprdoc_v1_' prefix logic from services/supabase.ts if we were using localStorage,
        // but here we are on the server. We assume Supabase DB usage.
        // However, the current codebase seems to rely heavily on localStorage in SupabaseService (lines 17-52).
        // If the app is using localStorage, Server Actions CANNOT access it.
        // CHECK: Does SupabaseService actually use Supabase DB?
        // Line 11: export const supabase = ... createClient ...
        // But LocalStore helper is defined.
        // And signDocumentBlock in SupabaseService calls SupabaseService.loadDocument.
        // If loadDocument uses localStorage, we are screwed for Server Actions.
        
        // Let's assume for this "Secure Signing" phase, we are transitioning to real DB.
        // But if I implement this and the app is using localStorage, it will fail.
        
        // I'll check SupabaseService.loadDocument implementation.
        // If it uses localStorage, I must revert to client-side logic but add the hash check there.
        // Or I can't use Server Actions for data that is only on the client.
        
        // Given the "SOC2-compliant" goal, it MUST be on the server.
        // I will implement this assuming Supabase DB is the source of truth.
        // If the current app is in "Demo Mode" (localStorage), this Action will fail to find the doc.
        
        // I'll add a fallback or check.
        // But for the purpose of the task "Secure Signing", I must assume a server exists.
        
        // Fetch from DB
        // const { data, error } = await supabase.from('documents').select('*').eq('id', docId).single();
        // if (error || !data) throw new Error("Document not found");
        // const doc = data.content as DocumentState;

        // MOCK FOR NOW since I don't have the DB schema setup confirmed in the prompt context
        // and I don't want to break the existing localStorage flow if that's what's active.
        
        // WAIT. If the user is using localStorage, I CANNOT verify the hash on the server because the server doesn't have the doc.
        // The "Server Rule" says "Legal views must be Server Components".
        // This implies we ARE using a server.
        
        // I will implement the logic. If it fails due to missing DB, that's a separate infrastructure issue.
        // But I should be careful.
        
        // Let's assume we fetch from Supabase.
        
        return { success: false, error: "Server Signing Not Fully Implemented (DB Connection Pending)" };

    } catch (e) {
        console.error("Server Signing Failed", e);
        return { success: false, error: "Internal Server Error" };
    }
}
