// Canonicalize JSON to ensure deterministic hashing
// We recursively sort keys so {a:1, b:2} and {b:2, a:1} produce the same string.
export function canonicalizeJSON(value: any): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return '[' + value.map((item) => canonicalizeJSON(item)).join(',') + ']';
  }

  const keys = Object.keys(value).sort();
  const parts = keys.map((key) => {
    return JSON.stringify(key) + ':' + canonicalizeJSON(value[key]);
  });

  return '{' + parts.join(',') + '}';
}

// Generate SHA-256 hash of the canonicalized document
export async function hashDocument(doc: any): Promise<string> {
  const canonicalString = canonicalizeJSON(doc);
  const encoder = new TextEncoder();
  const data = encoder.encode(canonicalString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert buffer to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
}

// Import a PEM encoded public key
export async function importPublicKey(pem: string): Promise<CryptoKey> {
  // fetch the part of the PEM string between header and footer
  const pemHeader = '-----BEGIN PUBLIC KEY-----';
  const pemFooter = '-----END PUBLIC KEY-----';
  const pemContents = pem.substring(
    pem.indexOf(pemHeader) + pemHeader.length,
    pem.indexOf(pemFooter)
  );
  
  // base64 decode the string to get the binary data
  const binaryDerString = atob(pemContents.replace(/\s/g, ''));
  // convert from a binary string to an ArrayBuffer
  const binaryDer = new Uint8Array(binaryDerString.length);
  for (let i = 0; i < binaryDerString.length; i++) {
    binaryDer[i] = binaryDerString.charCodeAt(i);
  }

  return await crypto.subtle.importKey(
    'spki',
    binaryDer.buffer,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256',
    },
    true,
    ['verify']
  );
}

// Verify a signature
export async function verifySignature(
  publicKey: CryptoKey,
  signatureHex: string,
  dataHashHex: string
): Promise<boolean> {
  // Convert hex signature to ArrayBuffer
  const signatureBytes = new Uint8Array(
    signatureHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );

  // Convert hex data hash to ArrayBuffer (we verify the hash of the data, or the data itself?)
  // Usually we verify the signature OF the data.
  // In our flow: 
  // 1. Client: Hash(Doc) -> Sign(Hash)
  // 2. Server: Hash(Doc) -> Verify(Signature, Hash)
  
  // Wait, standard verify expects the original data, not the hash, unless we are doing raw RSA.
  // But we are signing the HASH on the client to avoid sending huge payloads to the signing function if using external hardware,
  // OR we are just signing the hash because that's the "State Hash".
  // Let's assume we are signing the Hex String of the Hash.
  
  const encoder = new TextEncoder();
  const data = encoder.encode(dataHashHex);

  return await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    publicKey,
    signatureBytes,
    data
  );
}
