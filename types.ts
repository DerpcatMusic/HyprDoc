/**
 * @fileoverview Re-export consolidated type definitions
 * @description Main types file that re-exports all consolidated types for backward compatibility
 */

// Re-export all types from the consolidated locations
// Block types and core interfaces
export * from './types/block';

// Document state and related types  
export * from './types/document';

// Audit and event types
export * from './types/audit';

// Integration types
export * from './types/integration';

// Editor-specific types (excluding duplicates already exported from block)
export type { EditorBlockProps } from './types/editor';

// Explicitly avoid re-exporting form and settings types to prevent conflicts
// Users should import directly from './types/form' and './types/settings' if needed

// Legacy exports for backward compatibility - these are now re-exported from above
// Keep empty for now to avoid conflicts