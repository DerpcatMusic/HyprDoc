'use client';

import { NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import { cn } from '@/lib/utils';

export const SmartField = (props: NodeViewProps) => {
  const { node, updateAttributes } = props;
  const { id, label, value, required, assigned_to } = node.attrs;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAttributes({ value: e.target.value });
  };

  return (
    <NodeViewWrapper className="inline-flex items-center gap-2 mx-1 align-middle">
      <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider select-none">
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
      <input
        type="text"
        value={value || ''}
        onChange={handleChange}
        placeholder={assigned_to ? `Assigned to ${assigned_to}` : 'Enter value...'}
        className={cn(
          "h-8 px-2 min-w-[120px]",
          "bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-sm",
          "focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500",
          "placeholder:text-zinc-600"
        )}
      />
    </NodeViewWrapper>
  );
};
