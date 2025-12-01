import { z } from 'zod';
import type { DropPosition } from './block';
import type { LucideIcon } from 'lucide-react';

/**
 * Zod Schemas for UI Component Types
 * Replaces `any` types in components with proper validation
 */

// Icon type for Lucide React icons
export type IconComponent = LucideIcon;

// Drag and drop handler types
export type DragStartHandler = (e: React.DragEvent, type: string) => void;
export type ClickHandler = (type: string) => void;

// Position type for block operations (already defined in block.ts as DropPosition)
export type BlockPosition = DropPosition;
