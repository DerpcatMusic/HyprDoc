/**
 * @fileoverview Document-related type definitions
 * @description Core types for document structure, state, and management
 */

import type { DocBlock, Party, Variable, Term, DocumentSettings } from './block';
import type { AuditLogEntry } from './audit';

// Re-export AuditLogEntry so it can be imported from document types
export type { AuditLogEntry };

/**
 * Document status lifecycle states
 */
export type DocumentStatus = 'draft' | 'sent' | 'completed' | 'archived' | 'template';

/**
 * Complete document state interface containing all document data
 * Used for document management, editing, and persistence
 */
export interface DocumentState {
  /** Unique document identifier */
  id?: string;
  /** User ID of the document creator */
  ownerId?: string;
  /** Document title/name */
  title: string;
  /** Current document status in lifecycle */
  status: DocumentStatus;
  /** Optional document description */
  description?: string;
  /** Array of document blocks/elements */
  blocks: DocBlock[];
  /** Array of signing parties/roles */
  parties: Party[];
  /** Document variables for dynamic content */
  variables: Variable[];
  /** Legal terms glossary */
  terms: Term[];
  /** Document configuration settings */
  settings?: DocumentSettings;
  /** Last update timestamp */
  updatedAt?: number;
  /** Audit trail of document events */
  auditLog?: AuditLogEntry[];
  /** Document content snapshot for versioning */
  snapshot?: DocBlock[];
  /** SHA-256 hash for document integrity */
  sha256?: string;
}

/**
 * Template structure for creating new documents
 * Represents reusable document patterns
 */
export interface Template {
  /** Unique template identifier */
  id: string;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Default document blocks */
  blocks: DocBlock[];
  /** Default signing parties */
  parties: Party[];
  /** Default variables */
  variables?: Variable[];
  /** Template creation timestamp */
  createdAt: number;
}