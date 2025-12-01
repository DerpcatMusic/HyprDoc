"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("convex/server");
const values_1 = require("convex/values");
/**
 * Convex Database Schema for HyprDoc
 *
 * This schema defines the structure for:
 * - Documents (with JSONB-like content storage)
 * - Signatures (audit trail for signing events)
 * - Subscriptions (Stripe billing integration)
 */
exports.default = (0, server_1.defineSchema)({
    // Documents table - stores all contract documents
    documents: (0, server_1.defineTable)({
        userId: values_1.v.string(), // Clerk user ID
        title: values_1.v.string(),
        status: values_1.v.union(values_1.v.literal("draft"), values_1.v.literal("sent"), values_1.v.literal("completed")),
        content: values_1.v.object({
            blocks: values_1.v.array(values_1.v.any()), // DocBlock[] - recursive tree structure
            parties: values_1.v.array(values_1.v.any()), // Party[] - signers/participants
            variables: values_1.v.array(values_1.v.any()), // Variable[] - template variables
            settings: values_1.v.any(), // DocumentSettings
            terms: values_1.v.array(values_1.v.any()), // GlossaryTerm[]
            auditLog: values_1.v.array(values_1.v.any()), // AuditLogEntry[]
        }),
    })
        .index("by_user", ["userId"])
        .index("by_status", ["status"])
        .index("by_user_and_status", ["userId", "status"]),
    // Signatures table - detailed signature audit trail
    signatures: (0, server_1.defineTable)({
        documentId: values_1.v.id("documents"),
        blockId: values_1.v.string(),
        partyId: values_1.v.string(),
        signatureUrl: values_1.v.string(), // URL to signature image in Convex storage
        ipAddress: values_1.v.string(),
        userAgent: values_1.v.string(),
        timestamp: values_1.v.number(),
        location: values_1.v.optional(values_1.v.string()),
        integrityHash: values_1.v.optional(values_1.v.string()),
        verifiedIdentifier: values_1.v.optional(values_1.v.string()), // Email/phone if 2FA used
    })
        .index("by_document", ["documentId"])
        .index("by_party", ["partyId"]),
    // Subscriptions table - Stripe billing integration
    subscriptions: (0, server_1.defineTable)({
        userId: values_1.v.string(), // Clerk user ID
        stripeCustomerId: values_1.v.string(),
        stripeSubscriptionId: values_1.v.optional(values_1.v.string()),
        plan: values_1.v.union(values_1.v.literal("free"), values_1.v.literal("pro"), values_1.v.literal("enterprise")),
        status: values_1.v.union(values_1.v.literal("active"), values_1.v.literal("canceled"), values_1.v.literal("past_due"), values_1.v.literal("trialing")),
        currentPeriodEnd: values_1.v.optional(values_1.v.number()),
        cancelAtPeriodEnd: values_1.v.optional(values_1.v.boolean()),
    })
        .index("by_user", ["userId"])
        .index("by_stripe_customer", ["stripeCustomerId"])
        .index("by_stripe_subscription", ["stripeSubscriptionId"]),
});
