
export enum BlockType {
  TEXT = 'text',
  INPUT = 'input', // Short Answer
  LONG_TEXT = 'long_text', // Paragraph
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
  
  // Smart Blocks
  FORMULA = 'formula',
  PAYMENT = 'payment',
  VIDEO = 'video',
  CURRENCY = 'currency'
}

export interface Party {
  id: string;
  name: string;
  color: string; // Hex code or Tailwind class reference
  initials: string;
  email?: string;
  accessCode?: string; // For simulation of secure auth
}

export interface Variable {
    id: string;
    key: string; // The placeholder key (e.g. "ClientName")
    value: string; // The default value
    label?: string; // Descriptive label
}

export interface DocBlock {
  id: string;
  type: BlockType;
  content?: string; // Markdown text or Image URL
  label?: string; // Label for inputs
  variableName?: string; // Key for form state
  options?: string[]; // For Select/Radio
  placeholder?: string;
  required?: boolean;
  assignedToPartyId?: string; // ID of the party responsible for this block
  
  // Conditional Logic
  condition?: {
    variableName: string;
    equals: string;
  };
  children?: DocBlock[]; // Nested blocks

  // Repeater Logic
  repeaterFields?: DocBlock[]; 
  
  // Smart Block Props
  formula?: string; // e.g. "{{price}} * {{qty}}"
  currency?: string; // 'USD', 'EUR'
  paymentSettings?: {
      amountType: 'fixed' | 'variable';
      amount?: number; // for fixed
      variableName?: string; // for variable linked to a formula
  };
  videoUrl?: string;
}

export interface DocumentSettings {
    brandColor?: string;
    logoUrl?: string;
    companyName?: string;
    fontFamily?: string; // 'Inter', 'Serif', 'Mono', etc.
    emailReminders?: boolean;
    reminderDays?: number;
    expirationDays?: number;
    webhookUrl?: string;
}

export interface AuditLogEntry {
    id: string;
    timestamp: number;
    action: 'created' | 'viewed' | 'signed' | 'edited' | 'sent';
    user: string;
    details?: string;
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
  variables: Variable[]; // Global variables for smart substitution
  settings?: DocumentSettings;
  updatedAt?: number;
  auditLog?: AuditLogEntry[];
  
  // Versioning
  snapshot?: DocBlock[]; // The state of blocks when last sent (for diffing)
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
