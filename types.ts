import React from "react";
import { z } from "zod";
import {
  DocumentSchema,
  DocBlockSchema,
  PartySchema,
  DocumentSettingsSchema,
  VariableSchema,
  AuditLogEntrySchema,
  BlockTypeEnum,
} from "./lib/validation";

// --- Zod Inferred Types ---
export type BlockType = z.infer<typeof BlockTypeEnum>;
export const BlockType = {
  TEXT: "text",
  INPUT: "input",
  LONG_TEXT: "long_text",
  NUMBER: "number",
  EMAIL: "email",
  SELECT: "select",
  RADIO: "radio",
  CHECKBOX: "checkbox",
  CONDITIONAL: "conditional",
  REPEATER: "repeater",
  DATE: "date",
  SIGNATURE: "signature",
  IMAGE: "image",
  SECTION_BREAK: "section_break",
  FILE_UPLOAD: "file_upload",
  HTML: "html",
  FORMULA: "formula",
  PAYMENT: "payment",
  VIDEO: "video",
  CURRENCY: "currency",
  COLUMNS: "columns",
  COLUMN: "column",
  SPACER: "spacer",
  ALERT: "alert",
  QUOTE: "quote",
} as const;

export type DocBlock = z.infer<typeof DocBlockSchema>;
export type Party = z.infer<typeof PartySchema>;
export type DocumentSettings = z.infer<typeof DocumentSettingsSchema>;
export type Variable = z.infer<typeof VariableSchema>;
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;
export type DocumentState = z.infer<typeof DocumentSchema>;

export type EventType =
  | "created"
  | "viewed"
  | "started_form"
  | "field_updated"
  | "signed"
  | "declined"
  | "completed"
  | "emailed"
  | "downloaded"
  | "edited"
  | "sent";

// --- Legacy / UI Types ---
export interface Term {
  id: string;
  term: string;
  definition: string;
  color?: string;
  source: "system" | "user";
}

export interface PageMargins {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface GlobalPaymentSettings {
  stripe?: { publishableKey: string; connectedAccountId?: string };
  wise?: {
    recipientEmail: string;
    iban?: string;
    sortCode?: string;
    accountNumber?: string;
  };
  bit?: { phoneNumber: string };
  gocardless?: { merchantId?: string; redirectUrl?: string };
  paypal?: {
    clientId?: string;
    email?: string;
    environment?: "sandbox" | "production";
  };
}

export interface UserGlobalSettings {
  apiKeys?: {
    openai?: string;
    stripePublishable?: string;
    googleMaps?: string;
  };
  profile?: {
    companyName?: string;
    logoUrl?: string;
  };
}

export interface Integration {
  id: string;
  name: string;
  type: "crm" | "storage" | "sso";
  connected: boolean;
  icon?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  blocks: DocBlock[];
  parties: Party[];
  variables?: Variable[];
  createdAt: number;
}

export type FormValue = string | number | boolean | null | string[] | undefined;
export type FormValues = Record<string, FormValue>;

export interface SubmissionEvents {
  id?: string;
  document_id: string;
  submitter_id?: string;
  event_type: EventType;
  event_data?: Record<string, FormValue>;
  ip_address?: string;
  user_agent?: string;
  created_at?: string;
}

export type DropPosition = "before" | "after" | "inside" | "inside-false";

export interface EditorBlockProps {
  block: DocBlock;
  formValues: FormValues;
  isSelected: boolean;
  parties: Party[];
  allBlocks?: DocBlock[];
  docSettings?: DocumentSettings;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<DocBlock>) => void;
  onDelete: (id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string, position: DropPosition) => void;
  index?: number;
  isTiptap?: boolean;
}
