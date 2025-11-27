'use client';

import { cn } from '@/lib/utils';
import { Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Block } from '@/lib/schemas/blocks';

interface BlockWrapperProps {
  block: Block;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  children: React.ReactNode;
}

export const BlockWrapper = ({
  block,
  isSelected,
  onSelect,
  onDelete,
  onDragStart,
  children,
}: BlockWrapperProps) => {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onSelect}
      className={cn(
        'group relative border-2 transition-all',
        isSelected
          ? 'border-amber-500 bg-amber-500/5'
          : 'border-transparent hover:border-zinc-700 hover:bg-zinc-900/50'
      )}
    >
      {/* Drag Handle */}
      <div
        className={cn(
          'absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity',
          isSelected && 'opacity-100'
        )}
      >
        <GripVertical size={16} className="text-zinc-500" />
      </div>

      {/* Content */}
      <div className="pl-10 pr-10 py-2">{children}</div>

      {/* Delete Button */}
      {isSelected && (
        <div className="absolute right-2 top-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-6 w-6 hover:bg-red-500 hover:text-white"
          >
            <Trash2 size={14} />
          </Button>
        </div>
      )}

      {/* Required Indicator */}
      {block.required && (
        <div className="absolute left-2 top-2">
          <span className="text-xs text-red-500 font-mono">*</span>
        </div>
      )}
    </div>
  );
};
