import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Shared sub-schemas
const partySchema = v.object({
  id: v.string(),
  name: v.string(),
  email: v.optional(v.string()),
  color: v.string(),
  initials: v.string(),
  role: v.optional(v.string()), // "owner" | "signer" | "viewer"
});

const variableSchema = v.object({
  id: v.string(),
  name: v.string(),
  value: v.string(),
  type: v.string(), // "text" | "number" | "date" | "boolean"
});

const settingsSchema = v.object({
  signingOrder: v.string(), // "parallel" | "sequential"
  brandColor: v.string(),
  fontFamily: v.string(),
  margins: v.object({
    top: v.number(),
    bottom: v.number(),
    left: v.number(),
    right: v.number(),
  }),
  direction: v.string(), // "ltr" | "rtl"
});

const auditLogSchema = v.object({
  id: v.string(),
  timestamp: v.number(),
  action: v.string(),
  user: v.string(),
  details: v.optional(v.string()),
  metadata: v.optional(v.any()),
});

// Recursive block schema workaround for Convex
// Convex doesn't support recursive types directly in v.object() easily without v.any() or deep nesting limits
// For now, we will use v.any() for the children to avoid recursion depth issues, but validate the top level
const blockSchema = v.object({
  id: v.string(),
  type: v.string(),
  content: v.optional(v.string()),
  attrs: v.optional(v.any()), // Tiptap attributes
  // Legacy fields
  label: v.optional(v.string()),
  variableName: v.optional(v.string()),
  options: v.optional(v.array(v.string())),
  condition: v.optional(v.any()),
  children: v.optional(v.any()), // Recursive children
});

export default defineSchema({
  documents: defineTable({
    title: v.string(),
    status: v.string(),
    ownerId: v.optional(v.string()),

    contentHtml: v.optional(v.string()),
    contentJson: v.optional(v.any()), // Tiptap JSON

    blocks: v.array(blockSchema), // Legacy block tree

    parties: v.array(partySchema),
    variables: v.array(variableSchema),
    terms: v.array(v.any()), // Placeholder
    settings: settingsSchema,

    auditLog: v.array(auditLogSchema),

    updatedAt: v.number(),
    createdAt: v.optional(v.number()),

    snapshot: v.optional(v.any()),
    sha256: v.optional(v.string()),

    // OTP Access
    accessCode: v.optional(v.string()),
    accessPhone: v.optional(v.string()),
    accessEmail: v.optional(v.string()),
  }).index("by_owner", ["ownerId"]),
});
