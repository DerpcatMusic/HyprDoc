import { z } from 'zod';

// --- Party Schema ---
export const PartySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  initials: z.string(),
  email: z.string().email().optional(),
  accessCode: z.string().optional(),
});

export type Party = z.infer<typeof PartySchema>;

// --- Variable Schema ---
export const VariableSchema = z.object({
  id: z.string(),
  key: z.string(),
  value: z.string(),
  label: z.string().optional(),
});

export type Variable = z.infer<typeof VariableSchema>;

// --- Term Schema ---
export const TermSchema = z.object({
  id: z.string(),
  term: z.string(),
  definition: z.string(),
  color: z.string().optional(),
  source: z.enum(['system', 'user']),
});

export type Term = z.infer<typeof TermSchema>;

// --- Base Block Schema ---
const BaseBlockSchema = z.object({
  id: z.string(),
  label: z.string().optional(),
  placeholder: z.string().optional(),
  required: z.boolean().default(false),
  assignedToPartyId: z.string().optional(),
  width: z.number().min(0).max(100).optional(), // For column layouts
});

// --- Block Type Enum ---
export enum BlockType {
  TEXT = 'text',
  INPUT = 'input',
  LONG_TEXT = 'long_text',
  NUMBER = 'number',
  EMAIL = 'email',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  CONDITIONAL = 'conditional',
  REPEATER = 'repeater',
  DATE = 'date',
  SIGNATURE = 'signature',
  IMAGE = 'image',
  SECTION_BREAK = 'section_break',
  FILE_UPLOAD = 'file_upload',
  HTML = 'html',
  FORMULA = 'formula',
  PAYMENT = 'payment',
  VIDEO = 'video',
  CURRENCY = 'currency',
  COLUMNS = 'columns',
  COLUMN = 'column',
}

// --- Individual Block Schemas ---

export const TextBlockSchema = BaseBlockSchema.extend({
  type: z.literal(BlockType.TEXT),
  content: z.string().default(''),
});

export const InputBlockSchema = BaseBlockSchema.extend({
  type: z.literal(BlockType.INPUT),
  variableName: z.string().optional(),
});

export const LongTextBlockSchema = BaseBlockSchema.extend({
  type: z.literal(BlockType.LONG_TEXT),
  variableName: z.string().optional(),
});

export const NumberBlockSchema = BaseBlockSchema.extend({
  type: z.literal(BlockType.NUMBER),
  variableName: z.string().optional(),
});

export const EmailBlockSchema = BaseBlockSchema.extend({
  type: z.literal(BlockType.EMAIL),
  variableName: z.string().optional(),
});

export const SelectBlockSchema = BaseBlockSchema.extend({
  type: z.literal(BlockType.SELECT),
  variableName: z.string().optional(),
  options: z.array(z.string()).default([]),
});

export const RadioBlockSchema = BaseBlockSchema.extend({
  type: z.literal(BlockType.RADIO),
  variableName: z.string().optional(),
  options: z.array(z.string()).default([]),
});

export const CheckboxBlockSchema = BaseBlockSchema.extend({
  type: z.literal(BlockType.CHECKBOX),
  variableName: z.string().optional(),
  options: z.array(z.string()).default([]),
  allowMultiple: z.boolean().default(false),
});

export const DateBlockSchema = BaseBlockSchema.extend({
  type: z.literal(BlockType.DATE),
  variableName: z.string().optional(),
});

export const SignatureBlockSchema = BaseBlockSchema.extend({
  type: z.literal(BlockType.SIGNATURE),
  signatureId: z.string().optional(),
  signedAt: z.number().optional(),
  signatureType: z.enum(['drawn', 'typed', 'uploaded']).optional(),
});

export const ImageBlockSchema = BaseBlockSchema.extend({
  type: z.literal(BlockType.IMAGE),
  content: z.string().optional(), // URL or base64
});

export const SectionBreakBlockSchema = BaseBlockSchema.extend({
  type: z.literal(BlockType.SECTION_BREAK),
  content: z.string().optional(), // Section title
});

export const FileUploadBlockSchema = BaseBlockSchema.extend({
  type: z.literal(BlockType.FILE_UPLOAD),
  variableName: z.string().optional(),
});

export const HtmlBlockSchema = BaseBlockSchema.extend({
  type: z.literal(BlockType.HTML),
  content: z.string().default(''),
});

export const FormulaBlockSchema = BaseBlockSchema.extend({
  type: z.literal(BlockType.FORMULA),
  formula: z.string().optional(),
  variableName: z.string().optional(),
});

export const PaymentBlockSchema = BaseBlockSchema.extend({
  type: z.literal(BlockType.PAYMENT),
  paymentSettings: z.object({
    amountType: z.enum(['fixed', 'variable']),
    amount: z.number().optional(),
    variableName: z.string().optional(),
  }).optional(),
});

export const VideoBlockSchema = BaseBlockSchema.extend({
  type: z.literal(BlockType.VIDEO),
  videoUrl: z.string().url().optional(),
});

export const CurrencyBlockSchema = BaseBlockSchema.extend({
  type: z.literal(BlockType.CURRENCY),
  currencySettings: z.object({
    amountType: z.enum(['fixed', 'field']),
    amount: z.number().optional(),
    sourceFieldId: z.string().optional(),
    baseCurrency: z.string().default('USD'),
    targetCurrency: z.string().default('EUR'),
  }).optional(),
});

// --- Recursive Block Schemas ---

export const ConditionalBlockSchema: z.ZodType<any> = BaseBlockSchema.extend({
  type: z.literal(BlockType.CONDITIONAL),
  condition: z.object({
    variableName: z.string(),
    equals: z.string(),
  }).optional(),
  children: z.lazy(() => z.array(BlockSchema)).default([]),
});

export const RepeaterBlockSchema: z.ZodType<any> = BaseBlockSchema.extend({
  type: z.literal(BlockType.REPEATER),
  repeaterFields: z.lazy(() => z.array(BlockSchema)).default([]),
});

export const ColumnsBlockSchema: z.ZodType<any> = BaseBlockSchema.extend({
  type: z.literal(BlockType.COLUMNS),
  children: z.lazy(() => z.array(BlockSchema)).default([]),
});

export const ColumnBlockSchema: z.ZodType<any> = BaseBlockSchema.extend({
  type: z.literal(BlockType.COLUMN),
  children: z.lazy(() => z.array(BlockSchema)).default([]),
});

// --- Discriminated Union ---
export const BlockSchema: z.ZodType<any> = z.discriminatedUnion('type', [
  TextBlockSchema,
  InputBlockSchema,
  LongTextBlockSchema,
  NumberBlockSchema,
  EmailBlockSchema,
  SelectBlockSchema,
  RadioBlockSchema,
  CheckboxBlockSchema,
  DateBlockSchema,
  SignatureBlockSchema,
  ImageBlockSchema,
  SectionBreakBlockSchema,
  FileUploadBlockSchema,
  HtmlBlockSchema,
  FormulaBlockSchema,
  PaymentBlockSchema,
  VideoBlockSchema,
  CurrencyBlockSchema,
  ConditionalBlockSchema,
  RepeaterBlockSchema,
  ColumnsBlockSchema,
  ColumnBlockSchema,
]);

export type Block = z.infer<typeof BlockSchema>;

// --- Document Settings ---
export const PageMarginsSchema = z.object({
  top: z.number().default(72),
  bottom: z.number().default(72),
  left: z.number().default(72),
  right: z.number().default(72),
});

export const DocumentSettingsSchema = z.object({
  brandColor: z.string().optional(),
  logoUrl: z.string().url().optional(),
  companyName: z.string().optional(),
  fontFamily: z.string().optional(),
  emailReminders: z.boolean().default(false),
  reminderDays: z.number().default(3),
  expirationDays: z.number().optional(),
  expirationDate: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  signingOrder: z.enum(['parallel', 'sequential']).default('parallel'),
  margins: PageMarginsSchema.default({}),
});

export type DocumentSettings = z.infer<typeof DocumentSettingsSchema>;

// --- Full Document Schema ---
export const FullDocumentSchema = z.object({
  id: z.string().optional(),
  title: z.string().default('Untitled Document'),
  status: z.enum(['draft', 'sent', 'completed', 'archived']).default('draft'),
  description: z.string().optional(),
  blocks: z.array(BlockSchema).default([]),
  parties: z.array(PartySchema).default([]),
  variables: z.array(VariableSchema).default([]),
  terms: z.array(TermSchema).default([]),
  settings: DocumentSettingsSchema.default({}),
  updatedAt: z.number().optional(),
});

export type FullDocument = z.infer<typeof FullDocumentSchema>;
