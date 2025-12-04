// Stub for server functions
import { actionGeneric, mutationGeneric, queryGeneric } from "convex/server";

export const query = queryGeneric as any;
export const mutation = mutationGeneric as any;
export const action = actionGeneric as any;
