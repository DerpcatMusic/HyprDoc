import { v } from "convex/values";
import { mutation } from "./_generated/server";

/**
 * File Storage Operations
 * 
 * Handles signature images and other document assets using Convex file storage.
 */

// Generate a URL for uploading a file
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");
    
    return await ctx.storage.generateUploadUrl();
  },
});

// Get the URL for a stored file
export const getFileUrl = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});
