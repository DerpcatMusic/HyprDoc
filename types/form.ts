/**
 * @fileoverview Form handling type definitions
 * @description Types for form data management, validation, and submission
 */

/**
 * Database submission event structure
 * Defines the structure for submission_events table
 */
export interface SubmissionEvents {
  /** Unique event identifier */
  id?: string;
  /** Associated document ID */
  document_id: string;
  /** User who submitted the event */
  submitter_id?: string;
  /** Type of submission event */
  event_type: EventType;
  /** Event data as key-value pairs */
  event_data?: Record<string, FormValue>;
  /** User's IP address */
  ip_address?: string;
  /** User agent string */
  user_agent?: string;
  /** Creation timestamp */
  created_at?: string;
}

// Import EventType from audit module
import type { EventType } from './audit';

/**
 * Form value type for flexible data storage
 * Supports various data types that can be stored in form fields
 */
export type FormValue = string | number | boolean | null | string[] | undefined;

/**
 * Collection of form values keyed by field name
 * Represents all data entered into a document form
 */
export type FormValues = Record<string, FormValue>;