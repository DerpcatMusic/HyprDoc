"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeFreeSubscription = exports.upsertSubscription = exports.getUserSubscription = void 0;
const values_1 = require("convex/values");
const server_1 = require("./_generated/server");
/**
 * Billing & Subscription Management
 *
 * Handles Stripe integration for user subscriptions.
 */
// Get user's subscription
exports.getUserSubscription = (0, server_1.query)({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity)
            return null;
        const subscription = await ctx.db
            .query("subscriptions")
            .withIndex("by_user", (q) => q.eq("userId", identity.subject))
            .first();
        return subscription;
    },
});
// Create or update subscription (called from Stripe webhook)
exports.upsertSubscription = (0, server_1.internalMutation)({
    args: {
        userId: values_1.v.string(),
        stripeCustomerId: values_1.v.string(),
        stripeSubscriptionId: values_1.v.optional(values_1.v.string()),
        plan: values_1.v.union(values_1.v.literal("free"), values_1.v.literal("pro"), values_1.v.literal("enterprise")),
        status: values_1.v.union(values_1.v.literal("active"), values_1.v.literal("canceled"), values_1.v.literal("past_due"), values_1.v.literal("trialing")),
        currentPeriodEnd: values_1.v.optional(values_1.v.number()),
        cancelAtPeriodEnd: values_1.v.optional(values_1.v.boolean()),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("subscriptions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();
        if (existing) {
            await ctx.db.patch(existing._id, args);
        }
        else {
            await ctx.db.insert("subscriptions", args);
        }
    },
});
// Initialize free subscription for new user
exports.initializeFreeSubscription = (0, server_1.mutation)({
    args: {
        userId: values_1.v.string(),
        stripeCustomerId: values_1.v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("subscriptions")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();
        if (!existing) {
            await ctx.db.insert("subscriptions", {
                userId: args.userId,
                stripeCustomerId: args.stripeCustomerId,
                plan: "free",
                status: "active",
            });
        }
    },
});
