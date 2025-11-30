/**
 * @fileoverview Editor-specific type definitions
 * @description Types for document editor functionality and UI interactions
 */

import React from 'react';
import type { DocBlock, FormValues, Party, DocumentSettings } from './block';

/**
 * Drop position types for block manipulation
 * Defines where a block can be dropped relative to another block
 */
export type DropPosition = 'before' | 'after' | 'inside' | 'inside-false';

/**
 * Editor block component properties
 * Props passed to individual block components in the editor
 */
export interface EditorBlockProps {
  /** The block data to render */
  block: DocBlock;
  /** Current form values for the document */
  formValues: FormValues;
  /** Whether this block is currently selected */
  isSelected: boolean;
  /** Available signing parties */
  parties: Party[];
  /** All blocks in the document (for cross-references) */
  allBlocks?: DocBlock[];
  /** Document configuration settings */
  docSettings?: DocumentSettings;
  
  /** Callback when block is selected */
  onSelect: (id: string) => void;
  /** Callback when block is updated */
  onUpdate: (id: string, updates: Partial<DocBlock>) => void;
  /** Callback when block is deleted */
  onDelete: (id: string) => void;
  /** Callback when drag operation starts */
  onDragStart: (e: React.DragEvent, id: string) => void;
  /** Callback when drag operation ends */
  onDragEnd?: ((e: React.DragEvent) => void);
  /** Callback when block is dropped */
  onDrop: (e: React.DragEvent, id: string, position: DropPosition) => void;
  /** Block index in the document */
  index?: number;
}