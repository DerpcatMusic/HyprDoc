
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BlockType, DocBlock } from "../types";

// Initialize Gemini Client
// Note: process.env.API_KEY is injected by the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * AI Service for HyprDoc
 * Uses Gemini 2.5 Flash for high-speed structure generation and text refinement.
 */

// Schema for generating a full document structure
const docBlockSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "The title of the document" },
    blocks: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, description: "Block type (text, input, number, email, date, signature, section_break)" },
          label: { type: Type.STRING, description: "Label for the input field" },
          content: { type: Type.STRING, description: "Markdown content for text blocks" },
          placeholder: { type: Type.STRING, description: "Placeholder text" },
          required: { type: Type.BOOLEAN, description: "Is this field required?" },
          variableName: { type: Type.STRING, description: "Unique variable name for logic (snake_case)" }
        },
        required: ["type"]
      }
    }
  }
};

export const generateDocumentFromPrompt = async (prompt: string): Promise<{ title: string, blocks: DocBlock[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are an expert legal document architect. Create a structured document based on this request: "${prompt}".
      
      Rules:
      1. Use 'text' blocks for clauses, introductions, and terms. Use Markdown for formatting (bold, headers).
      2. Use 'input', 'number', 'date', 'email' for variable data collection.
      3. Use 'signature' blocks for required signatures.
      4. Ensure variableNames are snake_case and unique.
      5. Create a professional, comprehensive document.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: docBlockSchema,
        temperature: 0.2, // Low temperature for consistent structure
      },
    });

    const data = JSON.parse(response.text || "{}");
    
    // Post-process to ensure IDs and valid types
    const blocks = (data.blocks || []).map((b: any) => ({
      ...b,
      id: crypto.randomUUID(),
      // Map simplified string types to Enum if necessary, though Schema matches Enum strings mostly
      type: Object.values(BlockType).includes(b.type) ? b.type : BlockType.TEXT,
      variableName: b.variableName || `var_${Math.random().toString(36).substr(2, 5)}`
    }));

    return {
      title: data.title || "Generated Document",
      blocks: blocks.length > 0 ? blocks : [{ id: '1', type: BlockType.TEXT, content: "Error generating content." }]
    };

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw new Error("Failed to generate document. Please try again.");
  }
};

export const refineText = async (text: string, instruction: 'fix_grammar' | 'make_legalese' | 'shorten' | 'expand'): Promise<string> => {
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

// Legacy shim for PDF import (placeholder to prevent breaking existing imports, 
// but we recommend the Generator workflow now)
export const parsePDFToModularDoc = async (file: File): Promise<DocBlock[]> => {
   return [{
       id: crypto.randomUUID(),
       type: BlockType.TEXT,
       content: "## PDF Parsing is currently disabled.\n\nPlease use the 'Generate with AI' feature to build documents from scratch."
   }];
};
