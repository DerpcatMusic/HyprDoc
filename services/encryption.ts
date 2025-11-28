
/**
 * Web Crypto API Implementation
 * Provides AES-GCM encryption for client-side security before data persistence.
 * Note: In a real environment, MASTER_KEY would be an env var or retrieved from a vault.
 */

// Simulated Master Key for Demo (Do NOT use in production)
const MASTER_KEY_MATERIAL = "HYPRDOC_DEV_MASTER_KEY_2025"; 

async function getKey(salt: string): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        encoder.encode(MASTER_KEY_MATERIAL),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );

    return window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(salt),
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );
}

export async function encryptValue(value: string, userSalt: string = 'default_salt'): Promise<string> {
    try {
        const key = await getKey(userSalt);
        const encoder = new TextEncoder();
        const data = encoder.encode(value);
        const iv = window.crypto.getRandomValues(new Uint8Array(12));

        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        );

        // Convert IV and Encrypted Data to Base64
        const ivB64 = btoa(String.fromCharCode(...new Uint8Array(iv)));
        const encryptedB64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));

        return `${ivB64}:${encryptedB64}`;
    } catch (e) {
        console.error("Encryption Failed:", e);
        throw new Error("Encryption failed");
    }
}

export async function decryptValue(encryptedValue: string, userSalt: string = 'default_salt'): Promise<string> {
    try {
        const [ivB64, ciphertextB64] = encryptedValue.split(':');
        if (!ivB64 || !ciphertextB64) throw new Error("Invalid format");

        const key = await getKey(userSalt);
        
        const ivStr = atob(ivB64);
        const iv = new Uint8Array(ivStr.length);
        for (let i = 0; i < ivStr.length; i++) iv[i] = ivStr.charCodeAt(i);

        const cipherStr = atob(ciphertextB64);
        const ciphertext = new Uint8Array(cipherStr.length);
        for (let i = 0; i < cipherStr.length; i++) ciphertext[i] = cipherStr.charCodeAt(i);

        const decrypted = await window.crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ciphertext
        );

        return new TextDecoder().decode(decrypted);
    } catch (e) {
        console.error("Decryption Failed:", e);
        return "*** DECRYPTION ERROR ***";
    }
}
