/**
 * @fileoverview Document block type definitions
 * @description Core types for document building blocks and block-related functionality
 */

import React from 'react';

/**
 * Available document block types
 * Each type represents a different kind of content or input field
 */
export enum BlockType {
  /** Rich text content block */
  TEXT = 'text',
  /** Single-line text input */
  INPUT = 'input',
  /** Multi-line text input */
  LONG_TEXT = 'long_text',
  /** Numeric input field */
  NUMBER = 'number',
  /** Email input field */
  EMAIL = 'email',
  /** Dropdown selection */
  SELECT = 'select',
  /** Radio button group */
  RADIO = 'radio',
  /** Checkbox input */
  CHECKBOX = 'checkbox',
  /** Conditional content display */
  CONDITIONAL = 'conditional',
  /** Repeating group of blocks */
  REPEATER = 'repeater',
  /** Date input field */
  DATE = 'date',
  /** Digital signature capture */
  SIGNATURE = 'signature',
  /** Image embedding */
  IMAGE = 'image',
  /** Section divider */
  SECTION_BREAK = 'section_break',
  /** File upload field */
  FILE_UPLOAD = 'file_upload',
  /** Raw HTML content */
  HTML = 'html',
  /** Dynamic formula calculation */
  FORMULA = 'formula',
  /** Payment processing */
  PAYMENT = 'payment',
  /** Video embedding */
  VIDEO = 'video',
  /** Currency conversion widget */
  CURRENCY = 'currency',
  /** Multi-column layout container */
  COLUMNS = 'columns',
  /** Single column within columns */
  COLUMN = 'column',
  /** Spacer/blank space */
  SPACER = 'spacer',
  /** Alert/notification block */
  ALERT = 'alert',
  /** Quote styling */
  QUOTE = 'quote'
}

/**
 * Document block condition interface
 * Used for conditional logic to show/hide blocks based on other field values
 */
export interface BlockCondition {
  /** Variable name to check */
  variableName: string;
  /** Comparison operator */
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_set' | 'is_empty' | 'before' | 'after';
  /** Value to compare against */
  value: string;
}

/**
 * Currency conversion settings
 * Configuration for currency conversion blocks
 */
export interface CurrencySettings {
  /** How the amount is determined */
  amountType: 'fixed' | 'field';
  /** Fixed amount if type is 'fixed' */
  amount?: number;
  /** Source field ID if type is 'field' */
  sourceFieldId?: string;
  /** Base currency code */
  baseCurrency: string;
  /** Target currency code */
  targetCurrency: string;
}

/**
 * Payment processing settings
 * Configuration for payment blocks
 */
export interface PaymentSettings {
  /** How payment amount is calculated */
  amountType: 'fixed' | 'variable' | 'percent';
  /** Fixed amount */
  amount?: number;
  /** Percentage for percent-based payments */
  percentage?: number;
  /** Variable name for percentage calculation */
  variableName?: string;
  /** Payment currency */
  currency?: string;
  
  /** @deprecated Use enabledProviders instead */
  provider?: 'stripe' | 'wise' | 'bit' | 'gocardless' | 'paypal';
  /** List of enabled payment providers */
  enabledProviders?: string[];
}

/**
 * Main document block interface
 * Represents any element that can be placed in a document
 */
export interface DocBlock {
  /** Unique block identifier */
  id: string;
  /** Block type */
  type: BlockType;
  /** Block content (text, HTML, etc.) */
  content?: string;
  /** Display label for the block */
  label?: string;
  /** Variable name for form data binding */
  variableName?: string;
  /** Available options for selection fields */
  options?: string[];
  /** Placeholder text for input fields */
  placeholder?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Party assigned to this block */
  assignedToPartyId?: string;
  /** Allow multiple selections for checkbox groups */
  allowMultiple?: boolean;
  /** Column width percentage for column blocks */
  width?: number;
  
  // Numeric constraints
  /** Minimum value for number inputs */
  min?: number;
  /** Maximum value for number inputs */
  max?: number;
  /** Step value for number inputs */
  step?: number;
  
  // Date constraints
  /** Whether this is a date range */
  isDateRange?: boolean;
  
  // Media properties
  /** Image or media source URL */
  src?: string;
  /** Alternative text for images */
  altText?: string;
  
  // File upload
  /** Accepted file types (e.g., ".pdf,.jpg") */
  acceptedFileTypes?: string;
  
  // Logic
  /** Conditional display logic */
  condition?: BlockCondition;
  /** Child blocks for containers */
  children?: DocBlock[];
  /** Alternative child blocks for false condition */
  elseChildren?: DocBlock[];
  
  // Calculations
  /** Formula for calculated fields (e.g., "{{field_a}} * {{field_b}}") */
  formula?: string;
  
  // Currency settings
  /** Currency conversion configuration */
  currencySettings?: CurrencySettings;
  
  // Payment settings
  /** Payment processing configuration */
  paymentSettings?: PaymentSettings;
  
  // Video
  /** Video URL for video blocks */
  videoUrl?: string;
  
  // Signature specific
  /** Signature identifier */
  signatureId?: string;
  /** When the signature was completed */
  signedAt?: number;
  /** Type of signature */
  signatureType?: 'drawn' | 'typed' | 'uploaded';
  
  // Design properties
  /** Height for spacer blocks */
  height?: number;
  /** Variant for alert blocks */
  variant?: 'info' | 'warning' | 'error' | 'success';
}

/**
 * Page margin settings for document layout
 */
export interface PageMargins {
  /** Top margin in pixels */
  top: number;
  /** Bottom margin in pixels */
  bottom: number;
  /** Left margin in pixels */
  left: number;
  /** Right margin in pixels */
  right: number;
}

/**
 * Global payment gateway settings
 * Configuration for external payment providers
 */
export interface GlobalPaymentSettings {
  /** Stripe payment settings */
  stripe?: { 
    /** Stripe publishable key */
    publishableKey: string; 
    /** Connected account ID */
    connectedAccountId?: string; 
  };
  /** Wise payment settings */
  wise?: { 
    /** Recipient email */
    recipientEmail: string; 
    /** IBAN account number */
    iban?: string; 
    /** UK sort code */
    sortCode?: string; 
    /** Account number */
    accountNumber?: string; 
  };
  /** Bit payment settings */
  bit?: { 
    /** Phone number */
    phoneNumber: string; 
  };
  /** GoCardless payment settings */
  gocardless?: { 
    /** Merchant ID */
    merchantId?: string; 
    /** Redirect URL */
    redirectUrl?: string; 
  };
  /** PayPal payment settings */
  paypal?: { 
    /** Client ID */
    clientId?: string; 
    /** PayPal email */
    email?: string; 
    /** Environment mode */
    environment?: 'sandbox' | 'production'; 
  };
}

/**
 * User global settings and preferences
 */
export interface UserGlobalSettings {
  /** API keys for external services */
  apiKeys?: {
    /** OpenAI API key */
    openai?: string;
    /** Stripe publishable key */
    stripePublishable?: string;
    /** Google Maps API key */
    googleMaps?: string;
  };
  /** User profile information */
  profile?: {
    /** Company name */
    companyName?: string;
    /** Company logo URL */
    logoUrl?: string;
  };
}

/**
 * Document configuration settings
 */
export interface DocumentSettings {
  /** Brand color for the document */
  brandColor?: string;
  /** Logo URL to display in document */
  logoUrl?: string;
  /** Company name to display */
  companyName?: string;
  /** Font family for document text */
  fontFamily?: string;
  /** Whether to send email reminders */
  emailReminders?: boolean;
  /** Days before sending reminder */
  reminderDays?: number;
  /** Days until document expires */
  expirationDays?: number;
  /** Specific expiration date override */
  expirationDate?: string;
  /** Webhook URL for status updates */
  webhookUrl?: string;
  /** Signing order for multiple parties */
  signingOrder?: 'parallel' | 'sequential';
  /** Page margin settings */
  margins?: PageMargins;
  /** Whether to mirror margins for double-sided printing */
  mirrorMargins?: boolean;
  /** Text direction (left-to-right or right-to-left) */
  direction?: 'ltr' | 'rtl';
  /** Payment gateway configurations */
  paymentGateways?: GlobalPaymentSettings;
}

/**
 * Signing party/role interface
 * Represents a person or entity who needs to sign or interact with the document
 */
export interface Party {
  /** Unique party identifier */
  id: string;
  /** Role name (e.g., "Client", "HR Manager") */
  name: string;
  /** Party color for UI identification */
  color: string;
  /** Party initials for display */
  initials: string;
  /** Party email address */
  email?: string;
  /** Access code for security */
  accessCode?: string;
}

/**
 * Document variable for dynamic content
 * Used for template variables and calculated values
 */
export interface Variable {
  /** Unique variable identifier */
  id: string;
  /** Variable key/name */
  key: string;
  /** Variable value */
  value: string;
  /** Display label */
  label?: string;
}

/**
 * Legal term definition interface
 * Used for glossary and term definitions in documents
 */
export interface Term {
  /** Unique term identifier */
  id: string;
  /** Term text */
  term: string;
  /** Term definition */
  definition: string;
  /** Term color for highlighting */
  color?: string;
  /** Term source */
  source: 'system' | 'user';
}

// Form values type for editor and form handling
export type FormValue = string | number | boolean | null | string[] | undefined;
export type FormValues = Record<string, FormValue>;

// Drop position types for block manipulation
export type DropPosition = 'before' | 'after' | 'inside' | 'inside-false';