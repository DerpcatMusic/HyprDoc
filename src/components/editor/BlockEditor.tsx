'use client';

import { useState } from 'react';
import { BlockWrapper } from '../blocks/BlockWrapper';
import { BlockRenderer } from '../blocks/BlockRenderer';
import { Toolbox } from './Toolbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Play, Send, Settings } from 'lucide-react';
import type { Block, BlockType, FullDocument } from '@/lib/schemas/blocks';
import { nanoid } from 'nanoid';

export const BlockEditor = () => {
  const [document, setDocument] = useState<FullDocument>({
    title: 'Untitled Document',
    status: 'draft',
    blocks: [],
    parties: [],
    variables: [],
    terms: [],
    settings: {
      emailReminders: false,
      reminderDays: 3,
      signingOrder: 'parallel' as const,
      margins: {
        top: 72,
        bottom: 72,
        left: 72,
        right: 72,
      },
    },
  });

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const addBlock = (type: BlockType, targetId?: string) => {
    const newBlock: Block = {
      id: nanoid(),
      type,
      label: '',
      placeholder: '',
      required: false,
    } as Block;

    setDocument((prev) => {
      if (!targetId) {
        // Add to end
        return { ...prev, blocks: [...prev.blocks, newBlock] };
      }

      // Insert after target
      const targetIndex = prev.blocks.findIndex((b) => b.id === targetId);
      if (targetIndex === -1) return prev;

      const newBlocks = [...prev.blocks];
      newBlocks.splice(targetIndex + 1, 0, newBlock);
      return { ...prev, blocks: newBlocks };
    });

    setSelectedBlockId(newBlock.id);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setDocument((prev) => ({
      ...prev,
      blocks: prev.blocks.map((block) =>
        block.id === id ? { ...block, ...updates } : block
      ),
    }));
  };

  const deleteBlock = (id: string) => {
    setDocument((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((block) => block.id !== id),
    }));
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const blockType = e.dataTransfer.getData('application/hyprdoc-block') as BlockType;
    if (blockType) {
      addBlock(blockType);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-200">
      {/* Toolbox */}
      <Toolbox onAddBlock={addBlock} />

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-16 border-b-2 border-zinc-800 px-6 flex items-center justify-between bg-zinc-950/80 backdrop-blur-sm">
          <Input
            value={document.title}
            onChange={(e) => setDocument((prev) => ({ ...prev, title: e.target.value }))}
            className="max-w-md bg-transparent border-none text-lg font-semibold focus-visible:ring-0 px-0"
            placeholder="Document Title"
          />
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="hover:bg-zinc-800">
              <Settings size={18} />
            </Button>
            <Button variant="ghost" className="gap-2 hover:bg-zinc-800">
              <Play size={16} />
              Preview
            </Button>
            <Button className="gap-2 bg-amber-500 text-zinc-950 hover:bg-amber-400">
              <Send size={16} />
              Send
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <ScrollArea className="flex-1">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="max-w-4xl mx-auto p-8 min-h-full"
          >
            {document.blocks.length === 0 ? (
              <div className="flex items-center justify-center h-64 border-2 border-dashed border-zinc-800 rounded-lg">
                <div className="text-center">
                  <p className="text-zinc-500 font-mono text-sm mb-2">
                    Drag blocks from the toolbox to start building
                  </p>
                  <p className="text-zinc-700 font-mono text-xs">
                    or click a block to add it
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {document.blocks.map((block) => (
                  <BlockWrapper
                    key={block.id}
                    block={block}
                    isSelected={selectedBlockId === block.id}
                    onSelect={() => setSelectedBlockId(block.id)}
                    onDelete={() => deleteBlock(block.id)}
                  >
                    <BlockRenderer
                      block={block}
                      onUpdate={(updates) => updateBlock(block.id, updates)}
                    />
                  </BlockWrapper>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
