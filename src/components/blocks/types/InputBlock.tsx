'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Block } from '@/lib/schemas/blocks';

interface InputBlockProps {
  block: Block & { type: 'input' };
  onUpdate: (updates: Partial<Block>) => void;
}

export const InputBlock = ({ block, onUpdate }: InputBlockProps) => {
  return (
    <div className="space-y-2">
      {block.label && (
        <Label className="text-zinc-400 font-mono text-xs uppercase tracking-wider">
          {block.label}
          {block.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <Input
        type="text"
        placeholder={block.placeholder || 'Enter value...'}
        className="bg-zinc-900 border-zinc-700 text-zinc-200 focus-visible:border-amber-500"
      />
    </div>
  );
};
