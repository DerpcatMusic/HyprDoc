
/**
 * CRYPTOGRAPHIC CORE
 * 
 * Implements "The Crypto Rule":
 * 1. Canonicalize JSON (Sort keys recursively) to ensure deterministic hashing.
 * 2. SHA-256 Hashing of the canonical string.
 */

/**
 * Recursively sorts object keys to ensure deterministic JSON stringification.
 * This is crucial because {a:1, b:2} and {b:2, a:1} must produce the same hash.
 */
type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

export const canonicalize = (value: JSONValue): JSONValue => {
    if (value === null || typeof value !== 'object') {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(canonicalize);
    }

    const sortedKeys = Object.keys(value).sort();
    const result: Record<string, JSONValue> = {};
    
    for (const key of sortedKeys) {
        const val = value[key];
        if (val !== undefined) {
            result[key] = canonicalize(val);
        }
    }

    return result;
};

/**
 * Generates a SHA-256 hash of the document state.
 * Uses the Web Crypto API.
 */
export const hashDocument = async (doc: {
    blocks: unknown[];
    parties: unknown[];
    settings: unknown;
    terms: unknown[];
    variables: unknown[];
}): Promise<string> => {
    try {
        // 1. Canonicalize (Order keys)
        // We exclude dynamic properties that don't affect legal content (like local UI state if any leaked in)
        // But for DocumentState, we typically hash 'blocks', 'terms', 'parties', 'settings'.
        const cleanDoc = {
            blocks: doc.blocks,
            parties: doc.parties,
            settings: doc.settings,
            terms: doc.terms,
            variables: doc.variables
        };

        const canonicalDoc = canonicalize(cleanDoc as JSONValue);
        const jsonString = JSON.stringify(canonicalDoc);

        // 2. Encode to Uint8Array
        const encoder = new TextEncoder();
        const data = encoder.encode(jsonString);

        // 3. Hash
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);

        // 4. Convert to Hex String
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        return hashHex;
    } catch (e) {
        console.error("Hashing failed", e);
        return "ERROR_HASHING_DOCUMENT";
    }
};
