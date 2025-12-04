
// Supabase Service Removed
// Now using Convex.
export const SupabaseService = {
    // Stub to prevent crash if lazy loaded anywhere else before cleanup
    auth: { signUp: async () => {}, signInWithPassword: async () => {} },
    saveDocument: async () => {},
    loadDocument: async () => null,
    listDocuments: async () => [],
};
