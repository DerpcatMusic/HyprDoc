'use client';

import { Card } from '@/components/ui/card';
import { PenLine, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Block } from '@/lib/schemas/blocks';

interface SignatureBlockProps {
  block: Block & { type: 'signature' };
  onUpdate: (updates: Partial<Block>) => void;
}

export const SignatureBlock = ({ block, onUpdate }: SignatureBlockProps) => {
  const isSigned = !!block.signatureId;

  return (
    <Card
      className={cn(
        'border-2 border-dashed p-4',
        isSigned
          ? 'border-green-500/50 bg-green-500/5'
          : 'border-zinc-700 bg-zinc-900/50'
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'p-2 rounded-full',
            isSigned ? 'bg-green-500/10 text-green-500' : 'bg-zinc-800 text-zinc-400'
          )}
        >
          {isSigned ? <CheckCircle2 size={20} /> : <PenLine size={20} />}
        </div>
        <div>
          <p className="text-sm font-mono font-medium text-zinc-200">
            {isSigned ? 'Digitally Signed' : 'Signature Required'}
          </p>
          {block.label && (
            <p className="text-xs text-zinc-500 font-mono">{block.label}</p>
          )}
        </div>
      </div>
    </Card>
  );
};
