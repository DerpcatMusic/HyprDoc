'use server';

import { createClient } from '@supabase/supabase-js';
import { hashDocument, importPublicKey, verifySignature } from '@/lib/crypto';
import { z } from 'zod';

// Initialize Supabase Client (Service Role for admin tasks if needed, but here we use standard client)
// Note: In a real app, use @supabase/ssr for proper cookie handling in Server Actions.
// For this prototype, we'll assume environment variables are set.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const SubmitSignatureSchema = z.object({
  docId: z.string().uuid(),
  signatureHex: z.string(),
  publicKeyPem: z.string(),
});

export async function submitSignature(formData: FormData) {
  const rawData = {
    docId: formData.get('docId'),
    signatureHex: formData.get('signatureHex'),
    publicKeyPem: formData.get('publicKeyPem'),
  };

  const result = SubmitSignatureSchema.safeParse(rawData);

  if (!result.success) {
    return { success: false, error: 'Invalid input data' };
  }

  const { docId, signatureHex, publicKeyPem } = result.data;

  try {
    // 1. Fetch the document from Supabase
    const { data: doc, error: fetchError } = await supabase
      .from('documents')
      .select('content')
      .eq('id', docId)
      .single();

    if (fetchError || !doc) {
      return { success: false, error: 'Document not found' };
    }

    // 2. Re-calculate the hash of the document content
    // We must ensure the content we hash is EXACTLY what is stored.
    const currentHash = await hashDocument(doc.content);

    // 3. Import the public key
    const publicKey = await importPublicKey(publicKeyPem);

    // 4. Verify the signature
    // We verify that 'signatureHex' is a valid signature of 'currentHash' by 'publicKey'
    const isValid = await verifySignature(publicKey, signatureHex, currentHash);

    if (!isValid) {
      return { success: false, error: 'Invalid signature' };
    }

    // 5. Log the successful signing to audit_logs
    const { error: logError } = await supabase
      .from('audit_logs')
      .insert({
        document_id: docId,
        action: 'signed',
        details: {
          signature: signatureHex,
          hash: currentHash,
          timestamp: new Date().toISOString(),
        },
      });

    if (logError) {
      console.error('Audit log failed:', logError);
      // We might still consider the signing successful, but warn.
    }

    return { success: true, message: 'Document signed successfully' };

  } catch (error) {
    console.error('Signing error:', error);
    return { success: false, error: 'Internal server error' };
  }
}
