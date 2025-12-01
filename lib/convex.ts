/**
 * Convex Client Helpers
 * 
 * Re-exports Convex hooks and API for easy importing throughout the app.
 */

export { useQuery, useMutation, useAction } from "convex/react";
export { api } from "@/convex/_generated/api";
export type { Id, Doc } from "@/convex/_generated/dataModel";
