import { z } from "zod";

// --- Enums ---
export const BlockTypeEnum = z.enum([
  "text",
  "heading_1",
  "heading_2",
  "heading_3",
  "bullet_list",
  "ordered_list",
  "todo_list",
  "image",
  "code_block",
  "quote",
  "divider",
  "callout",
  "table",
  "columns",
  "column",
  "conditional",
  "repeater",
  "variable",
  "spacer",
  "alert",
]);

export const DocumentStatusEnum = z.enum([
  "draft",
  "sent",
  "completed",
  "archived",
  "template",
]);

// --- Sub-Schemas ---
export const PartySchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  color: z.string(),
  initials: z.string(),
  role: z.enum(["owner", "signer", "viewer"]).optional(),
});

export const DocumentSettingsSchema = z.object({
  signingOrder: z.enum(["parallel", "sequential"]).default("parallel"),
  brandColor: z.string().default("#000000"),
  fontFamily: z.string().default("Inter, sans-serif"),
  margins: z.object({
    top: z.number().default(60),
    bottom: z.number().default(60),
    left: z.number().default(60),
    right: z.number().default(60),
  }),
  direction: z.enum(["ltr", "rtl"]).default("ltr"),
});

export const VariableSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.string(),
  type: z.enum(["text", "number", "date", "boolean"]).default("text"),
});

export const AuditLogEntrySchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  action: z.string(),
  user: z.string(),
  details: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

// --- Block Schema (Recursive) ---
// We need to define the base schema first, then extend it for recursion
const BaseBlockSchema = z.object({
  id: z.string(),
  type: BlockTypeEnum,
  content: z.string().optional(), // HTML or text content
  attrs: z.record(z.any()).optional(), // Tiptap attributes

  // Legacy fields (to be deprecated but kept for compatibility during refactor)
  label: z.string().optional(),
  variableName: z.string().optional(),
  options: z.array(z.string()).optional(),
  condition: z
    .object({
      variableName: z.string(),
      operator: z.enum([
        "equals",
        "not_equals",
        "contains",
        "greater_than",
        "less_than",
      ]),
      value: z.string(),
    })
    .optional(),
});

export type DocBlock = z.infer<typeof BaseBlockSchema> & {
  children?: DocBlock[];
};

export const DocBlockSchema: z.ZodType<DocBlock> = BaseBlockSchema.extend({
  children: z.lazy(() => z.array(DocBlockSchema).optional()),
});

// --- Document Schema ---
export const DocumentSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  status: DocumentStatusEnum.default("draft"),
  ownerId: z.string().optional(),

  contentHtml: z.string().optional(), // Snapshot of HTML
  contentJson: z.record(z.any()).optional(), // Tiptap JSON

  blocks: z.array(DocBlockSchema).default([]), // Legacy block tree (will be replaced by Tiptap JSON)

  parties: z.array(PartySchema).default([]),
  variables: z.array(VariableSchema).default([]),
  settings: DocumentSettingsSchema.default({}),
  auditLog: z.array(AuditLogEntrySchema).default([]),

  updatedAt: z.number(),
  createdAt: z.number().optional(),

  // Security/Integrity
  sha256: z.string().optional(),
  snapshot: z.record(z.any()).optional(),
});

export type Document = z.infer<typeof DocumentSchema>;
