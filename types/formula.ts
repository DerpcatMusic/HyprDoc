import { z } from 'zod';

/**
 * Zod Schemas for Formula Service
 * Replaces `any` types with proper validation
 */

// Token types for formula parsing
export type TokenType = 'NUMBER' | 'OPERATOR' | 'LPAREN' | 'RPAREN' | 'VARIABLE';

export interface Token {
    type: TokenType;
    value: string;
}

// RPN (Reverse Polish Notation) element can be a number or operator string
export type RPNElement = number | string;

// Formula context for variable resolution
export const FormulaContextSchema = z.record(z.string(), z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.undefined()
]));

export type FormulaContext = z.infer<typeof FormulaContextSchema>;
