import { z } from 'zod';

/**
 * Zod Schemas for Payment Service
 * Replaces `any` types with proper validation
 */

// Form values can be strings, numbers, or booleans
export const FormValueSchema = z.union([
    z.string(),
    z.number(),
    z.boolean(),
]);

export type FormValue = z.infer<typeof FormValueSchema>;

// Form values record
export type FormValues = Record<string, FormValue>;

// Global variables type - matches Variable interface from block types
export type GlobalVariable = { id: string; key: string; value: string; label?: string };
export type GlobalVariables = GlobalVariable[];
