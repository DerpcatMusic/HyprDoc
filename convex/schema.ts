import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex Database Schema for HyprDoc
 * 
 * This schema defines the structure for:
 * - Documents (with JSONB-like content storage)
 * - Signatures (audit trail for signing events)
 * - Subscriptions (Stripe billing integration)
 */

export default defineSchema({
  // Documents table - stores all contract documents
  documents: defineTable({
    userId: v.string(), // Clerk user ID
    title: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("completed"),
      v.literal("archived"),
      v.literal("template")
    ),
    content: v.object({
      blocks: v.array(v.any()), // DocBlock[] - recursive tree structure
      parties: v.array(v.any()), // Party[] - signers/participants
      variables: v.array(v.any()), // Variable[] - template variables
      settings: v.any(), // DocumentSettings
      terms: v.array(v.any()), // GlossaryTerm[]
      auditLog: v.array(v.any()), // AuditLogEntry[] - always an array
    }),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_user_and_status", ["userId", "status"]),

  // Signatures table - detailed signature audit trail
  signatures: defineTable({
    documentId: v.id("documents"),
    blockId: v.string(),
    partyId: v.string(),
    signatureUrl: v.string(), // URL to signature image in Convex storage
    ipAddress: v.string(),
    userAgent: v.string(),
    timestamp: v.number(),
    location: v.optional(v.string()),
    integrityHash: v.optional(v.string()),
    verifiedIdentifier: v.optional(v.string()), // Email/phone if 2FA used
  })
    .index("by_document", ["documentId"])
    .index("by_party", ["partyId"]),

  // Subscriptions table - Stripe billing integration
  subscriptions: defineTable({
    userId: v.string(), // Clerk user ID
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.optional(v.string()),
    plan: v.union(
      v.literal("free"),
      v.literal("pro"),
      v.literal("enterprise")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing")
    ),
    currentPeriodEnd: v.optional(v.number()),
    cancelAtPeriodEnd: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_stripe_customer", ["stripeCustomerId"])
    .index("by_stripe_subscription", ["stripeSubscriptionId"]),
});
