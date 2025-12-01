import { z } from 'zod';
import { BlockType } from './block';

/**
 * Zod Schemas for Runtime Validation
 * Mirrors interfaces in types/*.ts
 */

// Basic Types
export const DropPositionSchema = z.enum(['before', 'after', 'inside', 'inside-false']);

// Variable Schema
export const VariableSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
  label: z.string().optional(),
});

// Party Schema
export const PartySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  color: z.string(),
  initials: z.string(),
  role: z.string().optional(),
});

// Payment Settings Schema
export const PaymentSettingsSchema = z.object({
  amountType: z.enum(['fixed', 'variable', 'percent']),
  amount: z.number().optional(),
  currency: z.string(),
  variableName: z.string().optional(),
  percentage: z.number().optional(),
  enabledProviders: z.array(z.string()).optional(),
});

// Block Condition Schema
export const BlockConditionSchema = z.object({
  variableName: z.string(),
  operator: z.enum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'is_set', 'is_empty']),
  value: z.union([z.string(), z.number(), z.boolean()]),
});

// Recursive DocBlock Schema
export const DocBlockSchema: z.ZodType<any> = z.lazy(() => z.object({
  id: z.string(),
  type: z.nativeEnum(BlockType),
  content: z.string().optional(), // HTML or text content
  label: z.string().optional(), // Field label
  placeholder: z.string().optional(),
  required: z.boolean().optional(),
  variableName: z.string().optional(), // For data binding
  options: z.array(z.string()).optional(), // For select/radio
  
  // Layout & Styling
  columns: z.number().optional(),
  columnWidths: z.array(z.number()).optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  
  // Logic
  condition: BlockConditionSchema.optional(),
  
  // Children for nesting (columns, repeaters, conditionals)
  children: z.array(DocBlockSchema).optional(),
  elseChildren: z.array(DocBlockSchema).optional(), // For else branches
  
  // Specific block settings
  paymentSettings: PaymentSettingsSchema.optional(),
  
  // Metadata
  partyId: z.string().optional(), // Who needs to fill/sign this
}));

// Global Payment Settings Schema
export const GlobalPaymentSettingsSchema = z.object({
  stripe: z.object({
    publishableKey: z.string().optional(),
    secretKey: z.string().optional(),
  }).optional(),
  paypal: z.object({
    clientId: z.string().optional(),
    clientSecret: z.string().optional(),
    environment: z.enum(['sandbox', 'production']).optional(),
  }).optional(),
  wise: z.object({
    apiKey: z.string().optional(),
    profileId: z.string().optional(),
    iban: z.string().optional(),
    sortCode: z.string().optional(),
  }).optional(),
  bit: z.object({
    phoneNumber: z.string().optional(),
  }).optional(),
  gocardless: z.object({
    accessToken: z.string().optional(),
    merchantId: z.string().optional(),
    redirectUrl: z.string().optional(),
  }).optional(),
});

// Document Settings Schema
export const DocumentSettingsSchema = z.object({
  // Branding
  fontFamily: z.string().optional(),
  brandColor: z.string().optional(),
  logoUrl: z.string().optional(),
  companyName: z.string().optional(),
  
  // Layout
  direction: z.enum(['ltr', 'rtl']).optional(),
  pageMargins: z.object({
    top: z.number(),
    right: z.number(),
    bottom: z.number(),
    left: z.number(),
  }).optional(),
  mirrorMargins: z.boolean().optional(),
  
  // Workflow
  signingOrder: z.enum(['parallel', 'sequential']).optional(),
  emailReminders: z.boolean().optional(),
  reminderDays: z.number().optional(),
  expirationDays: z.number().optional(),
  
  // Integrations
  paymentGateways: GlobalPaymentSettingsSchema.optional(),
  webhookUrl: z.string().optional(),
});

// Full Document Schema
export const DocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().optional(), // Legacy HTML content
  blocks: z.array(DocBlockSchema),
  variables: z.array(VariableSchema),
  parties: z.array(PartySchema),
  settings: DocumentSettingsSchema.optional(),
  status: z.enum(['draft', 'template', 'active', 'completed', 'archived']),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number(),
});
