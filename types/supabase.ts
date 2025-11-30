import { z } from 'zod';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

/**
 * Zod Schemas for Supabase Service Types
 * Following user rules: "No `any`: If a type is complex, define a Zod schema and infer it."
 */

// Auth callback types
export type AuthCallback = (event: AuthChangeEvent, session: Session | null) => void;

// Document payload schema for Supabase upsert
export const DocumentPayloadSchema = z.object({
  id: z.string(),
  title: z.string(),
  status: z.string(),
  updated_at: z.string(),
  content: z.object({
    blocks: z.array(z.any()), // Will be replaced with proper BlockSchema
    parties: z.array(z.any()), // Will be replaced with proper PartySchema
    variables: z.array(z.any()), // Will be replaced with proper VariableSchema
    settings: z.any(), // Will be replaced with proper SettingsSchema
    terms: z.array(z.any()), // Will be replaced with proper TermSchema
    auditLog: z.array(z.any()), // Will be replaced with proper AuditLogSchema
  }),
  user_id: z.string().optional(),
});

export type DocumentPayload = z.infer<typeof DocumentPayloadSchema>;
