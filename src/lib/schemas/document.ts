import { z } from 'zod';

// --- Attribute Schemas ---

export const SmartFieldAttrsSchema = z.object({
  id: z.string(),
  label: z.string(),
  assigned_to: z.string().email().optional(),
  value: z.union([z.string(), z.number(), z.boolean(), z.null()]).default(null),
  required: z.boolean().default(false),
});

export const SignatureBlockAttrsSchema = z.object({
  id: z.string(),
  signer_email: z.string().email().optional(),
  signed_at: z.string().datetime().nullable().default(null),
  signature_hash: z.string().nullable().default(null),
});

export const VariableAttrsSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.string().default(''),
});

// --- Node Schemas ---

// Base attributes for any node
const BaseNodeAttrs = z.record(z.string(), z.any()).optional();

// Recursive definition for the document tree
export const DocumentNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    type: z.string(),
    attrs: z.union([
      SmartFieldAttrsSchema,
      SignatureBlockAttrsSchema,
      VariableAttrsSchema,
      BaseNodeAttrs,
    ]).optional(),
    content: z.array(DocumentNodeSchema).optional(),
    text: z.string().optional(),
    marks: z.array(
      z.object({
        type: z.string(),
        attrs: z.record(z.string(), z.any()).optional(),
      })
    ).optional(),
  })
);

// Root Document Schema
export const DocumentSchema = z.object({
  type: z.literal('doc'),
  content: z.array(DocumentNodeSchema),
});

export type DocumentNode = z.infer<typeof DocumentNodeSchema>;
export type Document = z.infer<typeof DocumentSchema>;
export type SmartFieldAttrs = z.infer<typeof SmartFieldAttrsSchema>;
export type SignatureBlockAttrs = z.infer<typeof SignatureBlockAttrsSchema>;
