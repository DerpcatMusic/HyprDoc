import { z } from 'zod';

/**
 * Zod Schemas for Crypto Service
 * Replaces `any` types with proper validation
 */

// JSON-serializable value type
export type JSONValue = 
    | string 
    | number 
    | boolean 
    | null 
    | JSONValue[] 
    | { [key: string]: JSONValue };

// Document structure for hashing
export const HashableDocumentSchema = z.object({
    blocks: z.array(z.any()), // Will be replaced with proper BlockSchema
    parties: z.array(z.any()), // Will be replaced with proper PartySchema
    settings: z.any(), // Will be replaced with proper SettingsSchema
    terms: z.array(z.any()), // Will be replaced with proper TermSchema
    variables: z.array(z.any()), // Will be replaced with proper VariableSchema
});

export type HashableDocument = z.infer<typeof HashableDocumentSchema>;
