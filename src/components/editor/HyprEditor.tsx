'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { SmartFieldExtension } from './extensions/SmartFieldExtension';
import { SignatureBlockExtension } from './extensions/SignatureBlockExtension';
import { SigningModal } from '../ui/SigningModal';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Lock } from 'lucide-react';

export const HyprEditor = () => {
  const [isSigningOpen, setIsSigningOpen] = useState(false);
  
  // Mock Doc ID for prototype - in real app, get from URL/Props
  const docId = '00000000-0000-0000-0000-000000000000'; 

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      SmartFieldExtension,
      SignatureBlockExtension,
    ],
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Employment Contract' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This agreement is made between ' },
            {
              type: 'smartField',
              attrs: { id: 'employer', label: 'Employer', value: 'Acme Corp' },
            },
            { type: 'text', text: ' and ' },
            {
              type: 'smartField',
              attrs: { id: 'employee', label: 'Employee', required: true },
            },
            { type: 'text', text: '.' },
          ],
        },
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'By signing below, you agree to the terms.' }],
        },
        {
          type: 'signatureBlock',
          attrs: { id: 'sig-1' },
        },
      ],
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[500px] p-8 bg-zinc-950 border border-zinc-800 rounded-sm',
      },
    },
  });

  const handleSigningSuccess = (signatureHash: string) => {
    if (!editor) return;
    
    // Find the signature block and update it
    // In a real app, we'd find the specific block by ID. 
    // Here we just update all of them for the demo.
    editor.commands.updateAttributes('signatureBlock', {
      signed_at: new Date().toISOString(),
      signature_hash: signatureHash,
      signer_email: 'demo@user.com', // Mock user
    });
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto my-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-zinc-400 text-sm font-mono uppercase tracking-widest">HyprDoc Editor v0.1</h2>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsSigningOpen(true)}
            className="px-4 py-1.5 text-xs font-medium bg-amber-500 text-zinc-950 hover:bg-amber-400 rounded flex items-center gap-2 transition-colors"
          >
            <Lock size={14} />
            Sign Document
          </button>
        </div>
      </div>
      
      <EditorContent editor={editor} />

      <SigningModal
        isOpen={isSigningOpen}
        onClose={() => setIsSigningOpen(false)}
        docId={docId}
        documentContent={editor.getJSON()}
        onSuccess={handleSigningSuccess}
      />
    </div>
  );
};
