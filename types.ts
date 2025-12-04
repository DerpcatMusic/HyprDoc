
import React from 'react';

export enum BlockType {
  TEXT = 'text',
  INPUT = 'input', 
  LONG_TEXT = 'long_text', 
  NUMBER = 'number',
  EMAIL = 'email',
  SELECT = 'select',
  RADIO = 'radio',
  CHECKBOX = 'checkbox',
  CONDITIONAL = 'conditional',
  REPEATER = 'repeater',
  DATE = 'date',
  SIGNATURE = 'signature',
  IMAGE = 'image',
  SECTION_BREAK = 'section_break',
  FILE_UPLOAD = 'file_upload',
  HTML = 'html',
  FORMULA = 'formula',
  PAYMENT = 'payment',
  VIDEO = 'video',
  CURRENCY = 'currency',
  COLUMNS = 'columns',
  COLUMN = 'column',
  SPACER = 'spacer',
  ALERT = 'alert',
  QUOTE = 'quote'
}

export interface Party {
  id: string;
  name: string; // Role name e.g., "Client", "HR Manager"
  color: string; 
  initials: string;
  email?: string;
  accessCode?: string; // For security
}

export interface Variable {
    id: string;
    key: string; 
    value: string; 
    label?: string; 
}

export interface Term {
    id: string;
    term: string;
    definition: string;
    color?: string;
    source: 'system' | 'user';
}

export interface DocBlock {
  id: string;
  type: BlockType;
  content?: string; 
  label?: string; 
  variableName?: string; 
  options?: string[]; 
  placeholder?: string;
  required?: boolean;
  assignedToPartyId?: string; 
  allowMultiple?: boolean; // For Checkbox groups
  width?: number; // For column resizing (percentage)
  
  // Numeric Constraints
  min?: number;
  max?: number;
  step?: number;
  
  // Text Constraints
  minLength?: number;
  
  // Date Constraints
  isDateRange?: boolean;

  // Media Properties
  src?: string;
  altText?: string;
  
  // File Upload
  acceptedFileTypes?: string; // e.g. ".pdf,.jpg"

  // Logic
  condition?: {
    variableName: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_set' | 'is_empty' | 'before' | 'after';
    value: string;
  };
  children?: DocBlock[]; 
  elseChildren?: DocBlock[]; // For False branch
  
  formula?: string; // e.g. "{{field_a}} * {{field_b}}"
  
  currencySettings?: {
      amountType: 'fixed' | 'field';
      amount?: number; 
      sourceFieldId?: string; // ID of a NUMBER block
      baseCurrency: string; 
      targetCurrency: string; 
  };
  
  paymentSettings?: {
      amountType: 'fixed' | 'variable' | 'percent';
      amount?: number; 
      percentage?: number; // For deposit logic (e.g. 10%)
      variableName?: string; // The variable to calculate percentage FROM
      currency?: string;
      
      /** @deprecated Use enabledProviders instead */
      provider?: 'stripe' | 'wise' | 'bit' | 'gocardless' | 'paypal';
      enabledProviders?: string[]; // List of enabled providers for the recipient to choose from
  };

  videoUrl?: string;
  
  // Signature Specific
  signatureId?: string;
  signedAt?: number;
  signatureType?: 'drawn' | 'typed' | 'uploaded';

  // Design Props
  height?: number; // For Spacer
  variant?: 'info' | 'warning' | 'error' | 'success'; // For Alert
}

export interface PageMargins {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export interface GlobalPaymentSettings {
    stripe?: { publishableKey: string; connectedAccountId?: string };
    wise?: { recipientEmail: string; iban?: string; sortCode?: string; accountNumber?: string };
    bit?: { phoneNumber: string };
    gocardless?: { merchantId?: string; redirectUrl?: string };
    paypal?: { clientId?: string; email?: string; environment?: 'sandbox' | 'production' };
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
    }
}

export interface DocumentSettings {
    brandColor?: string;
    logoUrl?: string;
    companyName?: string;
    fontFamily?: string; 
    emailReminders?: boolean;
    reminderDays?: number;
    expirationDays?: number;
    expirationDate?: string; // Specific date override
    webhookUrl?: string;
    signingOrder?: 'parallel' | 'sequential';
    margins?: PageMargins;
    mirrorMargins?: boolean;
    direction?: 'ltr' | 'rtl';
    paymentGateways?: GlobalPaymentSettings;
}

export type EventType = 
  | 'created' 
  | 'viewed' 
  | 'started_form' 
  | 'field_updated'
  | 'signed' 
  | 'declined' 
  | 'completed' 
  | 'emailed' 
  | 'downloaded' 
  | 'edited'
  | 'sent';

export interface AuditLogEntry {
    id: string;
    timestamp: number;
    action: EventType;
    user: string;
    details?: string;
    ipAddress?: string;
    eventData?: Record<string, string | number | boolean | null | undefined | object>;
}

export interface Integration {
    id: string;
    name: string;
    type: 'crm' | 'storage' | 'sso';
    connected: boolean;
    icon?: string;
}

export interface DocumentState {
  id?: string;
  ownerId?: string; // User ID of the document creator
  title: string;
  status: 'draft' | 'sent' | 'completed' | 'archived' | 'template';
  description?: string;
  contentHtml?: string; // The full Tiptap HTML content
  blocks: DocBlock[]; // The registry of blocks referenced in contentHtml
  parties: Party[];
  variables: Variable[]; 
  terms: Term[]; 
  settings?: DocumentSettings;
  updatedAt?: number;
  auditLog?: AuditLogEntry[];
  snapshot?: DocBlock[]; 
  sha256?: string; // Document Hash
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

// Replace generic 'any' with robust union type
export type FormValue = string | number | boolean | null | string[] | undefined;
export type FormValues = Record<string, FormValue>;

export interface SubmissionEvents {
    // Defines structure for submission_events table
    id?: string;
    document_id: string;
    submitter_id?: string;
    event_type: EventType;
    event_data?: Record<string, FormValue>;
    ip_address?: string;
    user_agent?: string;
    created_at?: string;
}

// --- Editor Specific Types ---
export type DropPosition = 'before' | 'after' | 'inside' | 'inside-false';

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
