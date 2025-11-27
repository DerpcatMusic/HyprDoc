'use client';

import type { Block, BlockType } from '@/lib/schemas/blocks';
import { TextBlock } from './types/TextBlock';
import { InputBlock } from './types/InputBlock';
import { SignatureBlock as SignatureBlockComponent } from './types/SignatureBlock';

interface BlockRendererProps {
  block: Block;
  onUpdate: (updates: Partial<Block>) => void;
}

export const BlockRenderer = ({ block, onUpdate }: BlockRendererProps) => {
  switch (block.type) {
    case 'text':
      return <TextBlock block={block} onUpdate={onUpdate} />;
    
    case 'input':
      return <InputBlock block={block} onUpdate={onUpdate} />;
    
    case 'signature':
      return <SignatureBlockComponent block={block} onUpdate={onUpdate} />;
    
    // TODO: Implement remaining block types
    case 'long_text':
    case 'number':
    case 'email':
    case 'select':
    case 'radio':
    case 'checkbox':
    case 'date':
    case 'image':
    case 'section_break':
    case 'file_upload':
    case 'html':
    case 'formula':
    case 'payment':
    case 'video':
    case 'currency':
    case 'conditional':
    case 'repeater':
    case 'columns':
    case 'column':
      return (
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded text-zinc-500 text-sm font-mono">
          Block type "{block.type}" - Coming soon
        </div>
      );
    
    default:
      return (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-sm font-mono">
          Unknown block type
        </div>
      );
  }
};
