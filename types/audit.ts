/**
 * @fileoverview Audit trail and event type definitions
 * @description Types for tracking document events, actions, and audit logging
 */

/**
 * Document event types for audit trail
 * Represents different actions that can occur on a document
 */
export type EventType = 
  | 'created'       // Document created
  | 'viewed'        // Document viewed/opened
  | 'started_form'  // User started filling form
  | 'field_updated' // Form field updated
  | 'signed'        // Document signed
  | 'declined'      // Document declined
  | 'completed'     // Document fully completed
  | 'emailed'       // Document emailed
  | 'downloaded'    // Document downloaded
  | 'edited'        // Document edited
  | 'sent';         // Document sent to parties

export interface AuditLogEntry {
  /** Unique entry identifier */
  id: string;
  /** Event timestamp (milliseconds since epoch) */
  timestamp: number;
  /** Type of event that occurred */
  action: EventType;
  /** User who performed the action */
  user: string;
  /** Additional event details */
  details?: string;
  /** User's IP address */
  ipAddress?: string;
  /** Additional event data */
  eventData?: Record<string, string | number | boolean | null | undefined | object>;
}

