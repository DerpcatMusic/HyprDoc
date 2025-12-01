"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFileUrl = exports.generateUploadUrl = void 0;
const values_1 = require("convex/values");
const server_1 = require("./_generated/server");
/**
 * File Storage Operations
 *
 * Handles signature images and other document assets using Convex file storage.
 */
// Generate a URL for uploading a file
exports.generateUploadUrl = (0, server_1.mutation)({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity)
            throw new Error("Unauthorized");
        return await ctx.storage.generateUploadUrl();
    },
});
// Get the URL for a stored file
exports.getFileUrl = (0, server_1.mutation)({
    args: { storageId: values_1.v.string() },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});
