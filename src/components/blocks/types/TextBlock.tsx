'use client';

import { Textarea } from '@/components/ui/textarea';
import type { Block } from '@/lib/schemas/blocks';

interface TextBlockProps {
  block: Block & { type: 'text' };
  onUpdate: (updates: Partial<Block>) => void;
}

export const TextBlock = ({ block, onUpdate }: TextBlockProps) => {
  return (
    <Textarea
      value={block.content || ''}
      onChange={(e) => onUpdate({ content: e.target.value })}
      placeholder={block.placeholder || 'Enter text...'}
      className="min-h-[100px] bg-transparent border-none focus-visible:ring-0 resize-none font-sans text-zinc-200"
    />
  );
};
