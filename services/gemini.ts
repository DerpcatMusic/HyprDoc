
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BlockType, DocBlock } from "../types";

// Initialize Gemini Client
// IMPORTANT: The API key must be obtained exclusively from the environment variable.
// We do not provide a fallback to 'dummy_key' to ensure security and fail-fast behavior.
let ai: GoogleGenAI | null = null;
try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  } else {
    console.warn("Gemini API Key missing. AI features will be disabled.");
  }
} catch (e) {
  console.error("Gemini Client Init Failed:", e);
}

/**
 * AI Service for HyprDoc
 * Uses Gemini 2.5 Flash for high-speed structure generation and text refinement.
 */

// Define shared block properties to reuse for nesting to avoid circular reference issues in schema definition
const baseBlockProperties = {
  type: {
      type: Type.STRING,
      description: "Block type. MUST be one of: text, input, number, email, date, signature, section_break, checkbox, radio, select, columns, column, spacer, alert, quote, repeater, currency, payment"
  },
  label: { type: Type.STRING, description: "Label for the input field" },
  content: { type: Type.STRING, description: "Markdown content for text, or message for alert/quote" },
  placeholder: { type: Type.STRING, description: "Placeholder text" },
  required: { type: Type.BOOLEAN, description: "Is this field required?" },
  variableName: { type: Type.STRING, description: "Unique variable name for logic (snake_case)" },
  variant: { type: Type.STRING, description: "For alert blocks: 'info', 'warning', 'error', 'success'" },
  options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Options for select/radio/checkbox" },
  width: { type: Type.NUMBER, description: "Width percentage for column blocks" },
  height: { type: Type.NUMBER, description: "Height in pixels for spacer blocks" },
};

// Schema for generating a full document structure with nesting support
const docBlockSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The title of the document" },
    blocks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          ...baseBlockProperties,
          children: {
              type: Type.ARRAY,
              items: { 
                  type: Type.OBJECT,
                  // Fix: Explicitly define properties for nested children to satisfy schema requirements
                  properties: {
                      ...baseBlockProperties,
                      // Allow one deeper level of nesting for columns -> column -> content
                      children: {
                          type: Type.ARRAY,
                          items: {
                              type: Type.OBJECT,
                              properties: baseBlockProperties
                          }
                      }
                  }
              },
              description: "Nested child blocks (CRITICAL for 'columns' and 'repeater')"
          }
        },
        required: ["type"]
      }
    }
  }
};

/**
 * Recursively hydrates raw AI JSON into valid DocBlock objects.
 * Handles ID generation, type validation, and structural auto-correction.
 */
const processAIBlock = (raw: any): DocBlock => {
    const id = crypto.randomUUID();
    let type = raw.type;

    // Normalize type if AI hallucinates case or synonyms
    const validTypes = Object.values(BlockType);
    if (!validTypes.includes(type)) {
        if (type === 'paragraph' || type === 'heading') type = BlockType.TEXT;
        else if (type === 'textfield') type = BlockType.INPUT;
        else type = BlockType.TEXT; // Fallback
    }

    const block: DocBlock = {
        id,
        type: type as BlockType,
        content: raw.content,
        label: raw.label,
        variableName: raw.variableName || (['input','number','date','email','select','checkbox','radio'].includes(type) ? `var_${Math.random().toString(36).substr(2, 6)}` : undefined),
        placeholder: raw.placeholder,
        required: raw.required,
        variant: raw.variant,
        options: raw.options,
        // Default visual props
        height: type === BlockType.SPACER ? (raw.height || 32) : undefined,
    };

    // --- Structural Logic & Auto-Correction ---
    
    if (raw.children && Array.isArray(raw.children)) {
        if (type === BlockType.COLUMNS) {
            // Heuristic: Check if children are actually columns or just loose blocks
            const childrenAreColumns = raw.children.every((c: any) => c.type === 'column' || c.type === BlockType.COLUMN);
            
            if (childrenAreColumns && raw.children.length > 0) {
                // Perfect structure returned
                block.children = raw.children.map((c: any) => processAIBlock(c));
            } else {
                // Auto-fix: AI returned loose blocks inside "columns".
                // We wrap them into 2 balanced columns.
                const col1Children: DocBlock[] = [];
                const col2Children: DocBlock[] = [];
                
                raw.children.forEach((c: any, i: number) => {
                    if (i % 2 === 0) col1Children.push(processAIBlock(c));
                    else col2Children.push(processAIBlock(c));
                });
                
                block.children = [
                    { id: crypto.randomUUID(), type: BlockType.COLUMN, width: 50, children: col1Children },
                    { id: crypto.randomUUID(), type: BlockType.COLUMN, width: 50, children: col2Children }
                ];
            }
        } else if (type === BlockType.COLUMN) {
            // Normal recursion for column contents
             block.width = raw.width || 50;
             block.children = raw.children.map((c: any) => processAIBlock(c));
        } else {
            // Normal recursion for Repeater / Conditional
            block.children = raw.children.map((c: any) => processAIBlock(c));
        }
    } else if (type === BlockType.COLUMNS) {
        // Fix empty columns block -> create default structure
        block.children = [
             { id: crypto.randomUUID(), type: BlockType.COLUMN, width: 50, children: [] },
             { id: crypto.randomUUID(), type: BlockType.COLUMN, width: 50, children: [] }
        ];
    } else if (type === BlockType.COLUMN) {
        block.width = 50;
        block.children = [];
    }

    return block;
};

export const generateDocumentFromPrompt = async (prompt: string): Promise<{ title: string, blocks: DocBlock[] }> => {
  if (!ai) {
      console.warn("Missing API Key - Returning mock content.");
      return {
          title: "Demo Document (AI Unavailable)",
          blocks: [{ id: crypto.randomUUID(), type: BlockType.TEXT, content: "# AI Unavailable\n\nPlease configure the `API_KEY` environment variable to use Gemini features." }]
      };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert legal document architect. Create a structured document based on this request: "${prompt}".
      
      Design Guidelines:
      1. LAYOUT: Use 'columns' blocks to organize related short fields (e.g. First Name | Last Name) side-by-side. 
         IMPORTANT: A 'columns' block should ideally contain 'column' children.
      2. EMPHASIS: Use 'alert' blocks (variant: 'info', 'warning', or 'error') for critical notices, disclaimers, or instructions.
      3. STYLING: Use 'quote' blocks for recitals, key definitions, or preambles.
      4. SPACING: Use 'spacer' blocks to separate distinct sections visually.
      5. DATA: Use 'input', 'number', 'date', 'email', 'select', 'checkbox', 'radio' for data collection.
      6. CONTENT: Use 'text' blocks with Markdown (headers #, bold **) for clauses.
      7. LOGIC: Ensure variableNames are snake_case and unique.
      8. ADVANCED: Use 'currency' for money fields (amount, exchange rates). Use 'payment' if the user explicitly asks for checkout or billing.
      
      Create a professional, modern, and comprehensive document structure.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: docBlockSchema,
        temperature: 0.3, // Slightly creative but structured
      },
    });

    const data = JSON.parse(response.text || "{}");
    
    // Process and hydrate the blocks
    const processedBlocks = (data.blocks || []).map(processAIBlock);

    return {
      title: data.title || "Generated Document",
      blocks: processedBlocks.length > 0 ? processedBlocks : [{ id: crypto.randomUUID(), type: BlockType.TEXT, content: "Error: AI generated no content." }]
    };

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Failed to generate document. Please try again.");
  }
};

export const refineText = async (text: string, instruction: 'fix_grammar' | 'make_legalese' | 'shorten' | 'expand'): Promise<string> => {
  if (!ai) return text;

  try {
    const prompts = {
      fix_grammar: "Fix grammar and spelling errors in the following text, keeping the tone professional:",
      make_legalese: "Rewrite the following text to sound like a professional legal contract clause:",
      shorten: "Summarize the following text concisely, retaining key legal meaning:",
      expand: "Expand the following text with more professional detail and context:"
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `${prompts[instruction]}\n\n"${text}"`,
    });

    return response.text || text;
  } catch (error) {
    console.error("Gemini Refinement Error:", error);
    return text;
  }
};
