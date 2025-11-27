'use client';

import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils';
import { PenLine, CheckCircle2 } from 'lucide-react';

export const SignatureBlock = (props: NodeViewProps) => {
  const { node } = props;
  const { id, signer_email, signed_at, signature_hash } = node.attrs;

  const isSigned = !!signature_hash;

  return (
    <NodeViewWrapper className="my-4">
      <div className={cn(
        "border-2 border-dashed rounded-sm p-4 transition-colors",
        isSigned 
          ? "border-green-500/50 bg-green-500/5" 
          : "border-zinc-700 bg-zinc-900/50"
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              isSigned ? "bg-green-500/10 text-green-500" : "bg-zinc-800 text-zinc-400"
            )}>
              {isSigned ? <CheckCircle2 size={20} /> : <PenLine size={20} />}
            </div>
            <div>
              <p className="text-sm font-mono font-medium text-zinc-200">
                {isSigned ? 'Digitally Signed' : 'Signature Required'}
              </p>
              <p className="text-xs text-zinc-500 font-mono">
                {signer_email || 'Unassigned'}
              </p>
            </div>
          </div>

          {isSigned && (
            <div className="text-right">
              <p className="text-[10px] text-zinc-600 font-mono uppercase tracking-wider">Hash</p>
              <p className="text-xs text-zinc-400 font-mono truncate max-w-[150px]" title={signature_hash}>
                {signature_hash.substring(0, 16)}...
              </p>
              <p className="text-[10px] text-zinc-600 font-mono mt-1">
                {new Date(signed_at).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
};
