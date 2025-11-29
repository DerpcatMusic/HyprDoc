/**
 * Gemini AI Service is currently disabled
 * To enable, install @google/generation-ai and configure the service
 */

import { BlockType, DocBlock } from '@/types';

export const generateDocumentFromPrompt = async (prompt: string): Promise<{ title: string, blocks: DocBlock[] }> => {
  console.warn('Gemini AI service is disabled - returning placeholder');
  return {
    title: "New Document",
    blocks: [
      { 
        id: crypto.randomUUID(), 
        type: BlockType.TEXT, 
        content: "# Welcome to HyprDoc\n\nStart building your document by clicking the toolbox." 
      }
    ]
  };
};

export const refineText = async (text: string, instruction: 'fix_grammar' | 'make_legalese' | 'shorten' | 'expand'): Promise<string> => {
  console.warn('Gemini AI service is disabled');
  return text;
};
