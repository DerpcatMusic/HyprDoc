import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define schema matching DocumentState interfaces
export default defineSchema({
  documents: defineTable({
    title: v.string(),
    status: v.string(), // 'draft' | 'sent' | 'completed' | 'archived' | 'template'
    ownerId: v.optional(v.string()),
    contentHtml: v.optional(v.string()),
    
    // JSON blocks for complex structures (DocBlock[])
    blocks: v.any(), 
    parties: v.any(), // Party[]
    variables: v.any(), // Variable[]
    terms: v.any(), // Term[]
    settings: v.any(), // DocumentSettings
    
    auditLog: v.any(), // AuditLogEntry[]
    snapshot: v.optional(v.any()),
    sha256: v.optional(v.string()),
    
    updatedAt: v.number(),
    
    // For simple OTP access (demo only)
    accessCode: v.optional(v.string()),
    accessPhone: v.optional(v.string()),
    accessEmail: v.optional(v.string()),
  }).index("by_owner", ["ownerId"])
});
