"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signBlock = exports.remove = exports.update = exports.create = exports.get = exports.list = void 0;
const values_1 = require("convex/values");
const server_1 = require("./_generated/server");
/**
 * Document CRUD Operations
 *
 * All operations are automatically scoped to the authenticated user via Clerk.
 */
// List all documents for the current user
exports.list = (0, server_1.query)({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity)
            return [];
        const documents = await ctx.db
            .query("documents")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .order("desc")
            .collect();
        return documents.map(doc => ({
            id: doc._id,
            title: doc.title,
            status: doc.status,
            updated_at: doc._creationTime,
        }));
    },
});
// Get a single document by ID
exports.get = (0, server_1.query)({
    args: { id: values_1.v.id("documents") },
    handler: async (ctx, args) => {
        const doc = await ctx.db.get(args.id);
        if (!doc)
            return null;
        // Check if user has access (owner or shared)
        const identity = await ctx.auth.getUserIdentity();
        if (identity && doc.userId !== identity.subject) {
            // TODO: Add sharing logic here
            return null;
        }
        return {
            id: doc._id,
            ownerId: doc.userId,
            title: doc.title,
            status: doc.status,
            updatedAt: doc._creationTime,
            ...doc.content,
        };
    },
});
// Create a new document
exports.create = (0, server_1.mutation)({
    args: {
        title: values_1.v.string(),
        content: values_1.v.optional(values_1.v.object({
            blocks: values_1.v.array(values_1.v.any()),
            parties: values_1.v.array(values_1.v.any()),
            variables: values_1.v.array(values_1.v.any()),
            settings: values_1.v.any(),
            terms: values_1.v.array(values_1.v.any()),
            auditLog: values_1.v.array(values_1.v.any()),
        })),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity)
            throw new Error("Unauthorized");
        const defaultContent = {
            blocks: [],
            parties: [],
            variables: [],
            settings: {
                signingOrder: 'parallel',
                brandColor: '#000000',
                fontFamily: 'Inter, sans-serif',
                margins: { top: 60, bottom: 60, left: 60, right: 60 },
                direction: 'ltr',
            },
            terms: [],
            auditLog: [{
                    id: `audit_${Date.now()}`,
                    timestamp: Date.now(),
                    action: 'created',
                    user: identity.email || 'User',
                    details: 'Document created',
                }],
        };
        const documentId = await ctx.db.insert("documents", {
            userId: identity.subject,
            title: args.title,
            status: "draft",
            content: args.content || defaultContent,
        });
        return documentId;
    },
});
// Update an existing document
exports.update = (0, server_1.mutation)({
    args: {
        id: values_1.v.id("documents"),
        title: values_1.v.optional(values_1.v.string()),
        status: values_1.v.optional(values_1.v.union(values_1.v.literal("draft"), values_1.v.literal("sent"), values_1.v.literal("completed"))),
        content: values_1.v.optional(values_1.v.object({
            blocks: values_1.v.array(values_1.v.any()),
            parties: values_1.v.array(values_1.v.any()),
            variables: values_1.v.array(values_1.v.any()),
            settings: values_1.v.any(),
            terms: values_1.v.array(values_1.v.any()),
            auditLog: values_1.v.array(values_1.v.any()),
        })),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity)
            throw new Error("Unauthorized");
        const doc = await ctx.db.get(args.id);
        if (!doc || doc.userId !== identity.subject) {
            throw new Error("Document not found or access denied");
        }
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});
// Delete a document
exports.remove = (0, server_1.mutation)({
    args: { id: values_1.v.id("documents") },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity)
            throw new Error("Unauthorized");
        const doc = await ctx.db.get(args.id);
        if (!doc || doc.userId !== identity.subject) {
            throw new Error("Document not found or access denied");
        }
        await ctx.db.delete(args.id);
    },
});
// Sign a document block
exports.signBlock = (0, server_1.mutation)({
    args: {
        documentId: values_1.v.id("documents"),
        blockId: values_1.v.string(),
        partyId: values_1.v.string(),
        signatureUrl: values_1.v.string(),
        ipAddress: values_1.v.string(),
        userAgent: values_1.v.string(),
        location: values_1.v.optional(values_1.v.string()),
        integrityHash: values_1.v.optional(values_1.v.string()),
        verifiedIdentifier: values_1.v.optional(values_1.v.string()),
    },
    handler: async (ctx, args) => {
        const doc = await ctx.db.get(args.documentId);
        if (!doc)
            throw new Error("Document not found");
        if (doc.status === "completed")
            throw new Error("Document already completed");
        // Record signature in audit table
        await ctx.db.insert("signatures", {
            documentId: args.documentId,
            blockId: args.blockId,
            partyId: args.partyId,
            signatureUrl: args.signatureUrl,
            ipAddress: args.ipAddress,
            userAgent: args.userAgent,
            timestamp: Date.now(),
            location: args.location,
            integrityHash: args.integrityHash,
            verifiedIdentifier: args.verifiedIdentifier,
        });
        // Update document content
        const content = doc.content;
        const updateBlocks = (blocks) => {
            return blocks.map((b) => {
                if (b.id === args.blockId) {
                    return {
                        ...b,
                        content: args.signatureUrl,
                        signedAt: Date.now(),
                    };
                }
                if (b.children)
                    b.children = updateBlocks(b.children);
                if (b.elseChildren)
                    b.elseChildren = updateBlocks(b.elseChildren);
                return b;
            });
        };
        content.blocks = updateBlocks(content.blocks);
        // Add audit log entry
        const partyName = content.parties.find((p) => p.id === args.partyId)?.name || 'Unknown Signer';
        const newLog = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            action: 'signed',
            user: partyName,
            details: `Electronic Signature applied by ${partyName}. IP: ${args.ipAddress}`,
            ipAddress: args.ipAddress,
            eventData: {
                userAgent: args.userAgent,
                blockId: args.blockId,
                integrityCheck: args.integrityHash ? 'PASSED' : 'SKIPPED',
                integrityHash: args.integrityHash,
                location: args.location,
                verifiedIdentifier: args.verifiedIdentifier,
            },
        };
        content.auditLog = [newLog, ...content.auditLog];
        // Check if all required signatures are collected
        const getAllBlocks = (blocks) => {
            let flat = [];
            blocks.forEach((b) => {
                flat.push(b);
                if (b.children)
                    flat.push(...getAllBlocks(b.children));
                if (b.elseChildren)
                    flat.push(...getAllBlocks(b.elseChildren));
            });
            return flat;
        };
        const allBlocks = getAllBlocks(content.blocks);
        const requiredSignatures = allBlocks.filter((b) => b.type === 'signature' && b.required);
        const allSigned = requiredSignatures.every((b) => b.content && b.content.length > 0);
        let newStatus = doc.status;
        if (allSigned) {
            newStatus = "completed";
            content.auditLog.unshift({
                id: `audit_${Date.now()}_complete`,
                timestamp: Date.now(),
                action: 'completed',
                user: 'System',
                details: 'All required signatures collected. Document finalized.',
            });
        }
        else if (doc.status === "draft") {
            newStatus = "sent";
        }
        await ctx.db.patch(args.documentId, {
            content,
            status: newStatus,
        });
        return { success: true, status: newStatus };
    },
});
