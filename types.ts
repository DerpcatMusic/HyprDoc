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
  SECTION_BREAK = 'section_break'
}

export interface Party {
  id: string;
  name: string;
  color: string; // Hex code or Tailwind class reference
  initials: string;
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
}

export interface DocumentState {
  id?: string;
  title: string;
  description?: string;
  blocks: DocBlock[];
  parties: Party[];
  updatedAt?: number;
}

export interface Template {
    id: string;
    name: string;
    description: string;
    blocks: DocBlock[];
    parties: Party[];
    createdAt: number;
}

export type FormValues = Record<string, any>;