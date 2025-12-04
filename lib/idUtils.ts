/**
 * Centralized ID handling utilities for both Convex and UUID compatibility
 */

export interface ConvexId {
  toString(): string;
  [key: string]: any;
}

export function isConvexId(id: string): boolean {
  if (typeof id !== "string" || !id) return false;
  return id.length === 25 && /^[a-f0-9]{8}/.test(id);
}

export function isUUID(id: string): boolean {
  if (typeof id !== "string" || !id) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    id
  );
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function normalizeId(
  id: string | ConvexId | null | undefined
): string | null {
  if (!id) return null;

  if (typeof id === "string") {
    return id;
  }

  if (id.toString) {
    return id.toString();
  }

  return String(id);
}

export function validateDocumentId(id: string): {
  isValid: boolean;
  normalizedId?: string;
  error?: string;
} {
  if (!id || typeof id !== "string") {
    return { isValid: false, error: "ID must be a non-empty string" };
  }

  const normalizedId = normalizeId(id);
  if (!normalizedId) {
    return { isValid: false, error: "Failed to normalize ID" };
  }

  if (isConvexId(normalizedId) || isUUID(normalizedId)) {
    return { isValid: true, normalizedId };
  }

  return { isValid: true, normalizedId };
}

export function convertConvexId(
  convexId: ConvexId | null | undefined
): string | null {
  if (!convexId) return null;

  try {
    return convexId.toString();
  } catch (error) {
    console.error("Failed to convert Convex ID:", error);
    return null;
  }
}

export function createDocumentId(
  mode: "offline" | "online" = "online"
): string {
  if (mode === "offline" || typeof isConvexId === "undefined") {
    return generateUUID();
  }
  return generateUUID();
}

export function extractDocumentId(doc: any, fallback?: string): string | null {
  const idFields = ["id", "_id", "docId", "documentId"];

  for (const field of idFields) {
    const value = doc?.[field];
    if (value) {
      const normalized = normalizeId(value);
      if (normalized) return normalized;
    }
  }

  return fallback || null;
}

export function debugIdFormat(id: string, context: string = "document"): void {
  console.log(`[ID Utils] ${context} ID: "${id}"`, {
    length: id.length,
    isConvexId: isConvexId(id),
    isUUID: isUUID(id),
    startsWith: id.substring(0, 8),
  });
}

export function sanitizeForConvex(id: string): {
  sanitizedId: string;
  warnings: string[];
} {
  const warnings: string[] = [];
  let sanitizedId = id;

  if (!isConvexId(id) && !isUUID(id)) {
    warnings.push(`ID format "${id}" is not a standard Convex ID or UUID.`);
  }

  if (id.length > 100) {
    warnings.push("ID length exceeds 100 characters.");
  }

  return { sanitizedId, warnings };
}
