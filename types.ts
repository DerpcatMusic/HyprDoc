
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
  COLUMN = 'column'
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

  // Media Properties
  src?: string;
  altText?: string;
  
  // File Upload
  acceptedFileTypes?: string; // e.g. ".pdf,.jpg"

  // Logic
  condition?: {
    variableName: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: string;
  };
  children?: DocBlock[]; 
  // removed repeaterFields in favor of children for consistency
  
  formula?: string; // e.g. "{{field_a}} * {{field_b}}"
  
  currencySettings?: {
      amountType: 'fixed' | 'field';
      amount?: number; 
      sourceFieldId?: string; // ID of a NUMBER block
      baseCurrency: string; 
      targetCurrency: string; 
  };
  paymentSettings?: {
      amountType: 'fixed' | 'variable';
      amount?: number; 
      variableName?: string; 
      currency?: string;
  };
  videoUrl?: string;
  
  // Signature Specific
  signatureId?: string;
  signedAt?: number;
  signatureType?: 'drawn' | 'typed' | 'uploaded';
}

export interface PageMargins {
    top: number;
    bottom: number;
    left: number;
    right: number;
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
    eventData?: Record<string, any>;
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
  title: string;
  status: 'draft' | 'sent' | 'completed' | 'archived';
  description?: string;
  blocks: DocBlock[];
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

export type FormValues = Record<string, any>;
export interface SubmissionEvents {
    // Defines structure for submission_events table
    id?: string;
    document_id: string;
    submitter_id?: string;
    event_type: EventType;
    event_data?: Record<string, any>;
    ip_address?: string;
    user_agent?: string;
    created_at?: string;
}
