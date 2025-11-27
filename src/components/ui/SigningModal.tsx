'use client';

import { useState } from 'react';
import { Loader2, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hashDocument } from '@/lib/crypto';
import { submitSignature } from '@/app/actions';

interface SigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  docId: string;
  documentContent: any;
  onSuccess: (signatureHash: string) => void;
}

export const SigningModal = ({ isOpen, onClose, docId, documentContent, onSuccess }: SigningModalProps) => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'signing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSign = async () => {
    try {
      setStatus('generating');
      
      // 1. Generate Key Pair
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true,
        ['sign', 'verify']
      );

      setStatus('signing');

      // 2. Hash Document
      // We hash the content we have in memory (which matches what's in the editor)
      // Ideally, we should fetch the latest from server to ensure we sign what's stored,
      // but for this prototype, we trust the editor state passed in.
      const docHashHex = await hashDocument(documentContent);

      // 3. Sign Hash
      const encoder = new TextEncoder();
      const dataToSign = encoder.encode(docHashHex);
      const signatureBuffer = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        keyPair.privateKey,
        dataToSign
      );

      // Convert signature to hex
      const signatureArray = Array.from(new Uint8Array(signatureBuffer));
      const signatureHex = signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      // 4. Export Public Key to PEM
      const exportedKey = await crypto.subtle.exportKey('spki', keyPair.publicKey);
      const exportedAsBase64 = btoa(String.fromCharCode(...new Uint8Array(exportedKey)));
      const pemExported = `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64}\n-----END PUBLIC KEY-----`;

      // 5. Submit to Server
      const formData = new FormData();
      formData.append('docId', docId);
      formData.append('signatureHex', signatureHex);
      formData.append('publicKeyPem', pemExported);

      const result = await submitSignature(formData);

      if (!result.success) {
        throw new Error(result.error || 'Signing failed');
      }

      setStatus('success');
      setTimeout(() => {
        onSuccess(signatureHex);
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl p-6 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
            <Lock className="w-6 h-6 text-amber-500" />
          </div>
          <h2 className="text-xl font-semibold text-zinc-100">Sign Document</h2>
          <p className="text-sm text-zinc-500">
            This will cryptographically sign the current state of the document.
          </p>
        </div>

        {status === 'error' && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        )}

        <div className="space-y-4">
          <div className="p-4 bg-zinc-900 rounded border border-zinc-800 space-y-3">
            <StepItem 
              label="Generate RSA-2048 Key Pair" 
              status={status === 'idle' ? 'pending' : 'done'} 
            />
            <StepItem 
              label="Calculate Document Hash (SHA-256)" 
              status={status === 'idle' || status === 'generating' ? 'pending' : 'done'} 
            />
            <StepItem 
              label="Sign Hash with Private Key" 
              status={status === 'idle' || status === 'generating' ? 'pending' : status === 'signing' ? 'loading' : 'done'} 
            />
            <StepItem 
              label="Verify & Timestamp on Server" 
              status={status === 'success' ? 'done' : status === 'error' ? 'error' : 'pending'} 
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={status !== 'idle' && status !== 'error'}
            className="flex-1 px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSign}
            disabled={status !== 'idle' && status !== 'error'}
            className={cn(
              "flex-1 px-4 py-2 text-sm font-medium bg-amber-500 text-zinc-950 rounded hover:bg-amber-400 disabled:opacity-50 flex items-center justify-center gap-2",
              status === 'success' && "bg-green-500 hover:bg-green-500"
            )}
          >
            {status === 'idle' || status === 'error' ? (
              'Sign Now'
            ) : status === 'success' ? (
              <>
                <CheckCircle size={16} />
                Signed
              </>
            ) : (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const StepItem = ({ label, status }: { label: string, status: 'pending' | 'loading' | 'done' | 'error' }) => (
  <div className="flex items-center gap-3 text-sm">
    <div className={cn(
      "w-2 h-2 rounded-full",
      status === 'pending' && "bg-zinc-700",
      status === 'loading' && "bg-amber-500 animate-pulse",
      status === 'done' && "bg-green-500",
      status === 'error' && "bg-red-500"
    )} />
    <span className={cn(
      status === 'pending' && "text-zinc-600",
      status !== 'pending' && "text-zinc-300"
    )}>
      {label}
    </span>
  </div>
);
