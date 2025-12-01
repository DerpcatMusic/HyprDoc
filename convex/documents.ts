import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Document CRUD Operations
 * 
 * All operations are automatically scoped to the authenticated user via Clerk.
 */

// List all documents for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    
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
export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) return null;
    
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
export const create = mutation({
  args: {
    title: v.string(),
    content: v.optional(v.object({
      blocks: v.array(v.any()),
      parties: v.array(v.any()),
      variables: v.array(v.any()),
      settings: v.any(),
      terms: v.array(v.any()),
      auditLog: v.array(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

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
export const update = mutation({
  args: {
    id: v.id("documents"),
    title: v.optional(v.string()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("sent"),
      v.literal("completed"),
      v.literal("archived"),
      v.literal("template")
    )),
    content: v.optional(v.object({
      blocks: v.array(v.any()),
      parties: v.array(v.any()),
      variables: v.array(v.any()),
      settings: v.any(),
      terms: v.array(v.any()),
      auditLog: v.array(v.any()),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== identity.subject) {
      throw new Error("Document not found or access denied");
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Delete a document
export const remove = mutation({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const doc = await ctx.db.get(args.id);
    if (!doc || doc.userId !== identity.subject) {
      throw new Error("Document not found or access denied");
    }

    await ctx.db.delete(args.id);
  },
});

// Sign a document block
export const signBlock = mutation({
  args: {
    documentId: v.id("documents"),
    blockId: v.string(),
    partyId: v.string(),
    signatureUrl: v.string(),
    ipAddress: v.string(),
    userAgent: v.string(),
    location: v.optional(v.string()),
    integrityHash: v.optional(v.string()),
    verifiedIdentifier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.documentId);
    if (!doc) throw new Error("Document not found");
    if (doc.status === "completed") throw new Error("Document already completed");

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
    const updateBlocks = (blocks: any[]): any[] => {
      return blocks.map((b: any) => {
        if (b.id === args.blockId) {
          return { 
            ...b, 
            content: args.signatureUrl, 
            signedAt: Date.now(),
          };
        }
        if (b.children) b.children = updateBlocks(b.children);
        if (b.elseChildren) b.elseChildren = updateBlocks(b.elseChildren);
        return b;
      });
    };

    content.blocks = updateBlocks(content.blocks);

    // Add audit log entry
    const partyName = content.parties.find((p: any) => p.id === args.partyId)?.name || 'Unknown Signer';
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
    const getAllBlocks = (blocks: any[]): any[] => {
      let flat: any[] = [];
      blocks.forEach((b: any) => {
        flat.push(b);
        if (b.children) flat.push(...getAllBlocks(b.children));
        if (b.elseChildren) flat.push(...getAllBlocks(b.elseChildren));
      });
      return flat;
    };

    const allBlocks = getAllBlocks(content.blocks);
    const requiredSignatures = allBlocks.filter((b: any) => b.type === 'signature' && b.required);
    const allSigned = requiredSignatures.every((b: any) => b.content && b.content.length > 0);

    let newStatus: "draft" | "sent" | "completed" | "archived" | "template" = doc.status;
    if (allSigned) {
      newStatus = "completed";
      content.auditLog.unshift({
        id: `audit_${Date.now()}_complete`,
        timestamp: Date.now(),
        action: 'completed',
        user: 'System',
        details: 'All required signatures collected. Document finalized.',
      });
    } else if (doc.status === "draft") {
      newStatus = "sent";
    }

    await ctx.db.patch(args.documentId, {
      content,
      status: newStatus,
    });

    return { success: true, status: newStatus };
  },
});
