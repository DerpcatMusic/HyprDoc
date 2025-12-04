import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const get = query({
  args: { id: v.id("documents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }
    // Filter by owner
    return await ctx.db
      .query("documents")
      .withIndex("by_owner", (q) => q.eq("ownerId", identity.subject))
      .order("desc")
      .collect();
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    status: v.string(),
    blocks: v.any(),
    parties: v.any(),
    variables: v.any(),
    terms: v.any(),
    settings: v.any(),
    auditLog: v.any(),
    updatedAt: v.number(),
    contentHtml: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const ownerId = identity ? identity.subject : undefined;

    return await ctx.db.insert("documents", {
      ...args,
      ownerId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("documents"),
    title: v.optional(v.string()),
    status: v.optional(v.string()),
    blocks: v.optional(v.any()),
    parties: v.optional(v.any()),
    variables: v.optional(v.any()),
    terms: v.optional(v.any()),
    settings: v.optional(v.any()),
    auditLog: v.optional(v.any()),
    updatedAt: v.number(),
    contentHtml: v.optional(v.string()),
    snapshot: v.optional(v.any()),
    sha256: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const { id, ...rest } = args;
    await ctx.db.patch(id, rest);
  },
});

export const signBlock = mutation({
  args: {
    id: v.id("documents"),
    blockId: v.string(),
    signatureUrl: v.string(),
    partyId: v.string(),
    logEntry: v.any(), // AuditLogEntry
  },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Document not found");

    // Update block content
    const updateBlocks = (blocks: any[]): any[] => {
      return blocks.map((b: any) => {
        if (b.id === args.blockId) {
          return { ...b, content: args.signatureUrl, signedAt: Date.now() };
        }
        if (b.children) b.children = updateBlocks(b.children);
        if (b.elseChildren) b.elseChildren = updateBlocks(b.elseChildren);
        return b;
      });
    };

    const newBlocks = updateBlocks(doc.blocks);
    const newLog = [args.logEntry, ...(doc.auditLog || [])];

    // Check completion (Naive check)
    // In real app, this logic mirrors WizardBar completion check
    const isComplete = false; // Simplified

    await ctx.db.patch(args.id, {
      blocks: newBlocks,
      auditLog: newLog,
      status: isComplete ? 'completed' : doc.status
    });
    
    return { success: true, updatedDoc: { ...doc, blocks: newBlocks } };
  },
});

// --- Simple OTP Logic for AccessGate ---
export const requestAccess = mutation({
  args: { id: v.id("documents"), identifier: v.string() },
  handler: async (ctx, args) => {
    // Generate simple 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    console.log("GENERATED OTP:", code); // In production, send via Email/SMS
    
    await ctx.db.patch(args.id, {
      accessCode: code,
      accessEmail: args.identifier // simple assumption
    });
    return true;
  }
});

export const verifyAccess = mutation({
  args: { id: v.id("documents"), identifier: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.id);
    if (!doc) return false;
    
    // In real app, check expiry
    if (doc.accessCode === args.code) {
      return true;
    }
    return false;
  }
});
