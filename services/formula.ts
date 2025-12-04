
/**
 * SAFE LOGIC ENGINE
 * 
 * Implements "The Safe Logic Rule":
 * A simple Lexer/Parser to evaluate math expressions with variable substitution.
 * 
 * Supports: +, -, *, /, (, )
 * Variables: Words starting with letters (e.g. price, quantity) or {{variableName}}
 */

type TokenType = 'NUMBER' | 'OPERATOR' | 'LPAREN' | 'RPAREN' | 'VARIABLE';

interface Token {
    type: TokenType;
    value: string;
}

const tokenize = (input: string): Token[] => {
    const tokens: Token[] = [];
    let cursor = 0;

    while (cursor < input.length) {
        const char = input[cursor];

        // Whitespace
        if (/\s/.test(char)) {
            cursor++;
            continue;
        }

        // Numbers
        if (/[0-9.]/.test(char)) {
            let num = '';
            while (cursor < input.length && /[0-9.]/.test(input[cursor])) {
                num += input[cursor];
                cursor++;
            }
            tokens.push({ type: 'NUMBER', value: num });
            continue;
        }

        // Explicit Variables {{name}}
        if (char === '{' && input[cursor + 1] === '{') {
            cursor += 2;
            let varName = '';
            while (cursor < input.length && !(input[cursor] === '}' && input[cursor + 1] === '}')) {
                varName += input[cursor];
                cursor++;
            }
            cursor += 2; // Skip }}
            tokens.push({ type: 'VARIABLE', value: varName.trim() });
            continue;
        }

        // Natural Variables (Words: price, qty, etc.)
        if (/[a-zA-Z_]/.test(char)) {
            let word = '';
            while (cursor < input.length && /[a-zA-Z0-9_]/.test(input[cursor])) {
                word += input[cursor];
                cursor++;
            }
            tokens.push({ type: 'VARIABLE', value: word });
            continue;
        }

        // Operators & Parens
        if (['+', '-', '*', '/'].includes(char)) {
            tokens.push({ type: 'OPERATOR', value: char });
            cursor++;
            continue;
        }

        if (char === '(') {
            tokens.push({ type: 'LPAREN', value: '(' });
            cursor++;
            continue;
        }

        if (char === ')') {
            tokens.push({ type: 'RPAREN', value: ')' });
            cursor++;
            continue;
        }

        // Skip unknown
        cursor++;
    }

    return tokens;
};

// Shunting-yard algorithm to RPN
const toRPN = (tokens: Token[], getValue: (key: string) => number): any[] => {
    const outputQueue: any[] = [];
    const operatorStack: Token[] = [];

    const precedence: Record<string, number> = {
        '+': 1,
        '-': 1,
        '*': 2,
        '/': 2
    };

    tokens.forEach(token => {
        if (token.type === 'NUMBER') {
            outputQueue.push(parseFloat(token.value));
        } else if (token.type === 'VARIABLE') {
            outputQueue.push(getValue(token.value));
        } else if (token.type === 'OPERATOR') {
            while (
                operatorStack.length > 0 &&
                operatorStack[operatorStack.length - 1].type === 'OPERATOR' &&
                precedence[operatorStack[operatorStack.length - 1].value] >= precedence[token.value]
            ) {
                outputQueue.push(operatorStack.pop()?.value);
            }
            operatorStack.push(token);
        } else if (token.type === 'LPAREN') {
            operatorStack.push(token);
        } else if (token.type === 'RPAREN') {
            while (
                operatorStack.length > 0 &&
                operatorStack[operatorStack.length - 1].type !== 'LPAREN'
            ) {
                outputQueue.push(operatorStack.pop()?.value);
            }
            operatorStack.pop(); // Pop LPAREN
        }
    });

    while (operatorStack.length > 0) {
        outputQueue.push(operatorStack.pop()?.value);
    }

    return outputQueue;
};

const evaluateRPN = (rpn: any[]): number => {
    const stack: number[] = [];

    rpn.forEach(token => {
        if (typeof token === 'number') {
            stack.push(token);
        } else {
            const b = stack.pop() || 0;
            const a = stack.pop() || 0;
            switch (token) {
                case '+': stack.push(a + b); break;
                case '-': stack.push(a - b); break;
                case '*': stack.push(a * b); break;
                case '/': stack.push(b === 0 ? 0 : a / b); break;
            }
        }
    });

    return stack[0] || 0;
};

export const SafeFormula = {
    evaluate: (formula: string, context: Record<string, any>): number | string => {
        try {
            if (!formula) return 0;
            const tokens = tokenize(formula);
            
            const getValue = (key: string) => {
                const val = context[key];
                const num = parseFloat(val);
                return isNaN(num) ? 0 : num;
            };

            const rpn = toRPN(tokens, getValue);
            const result = evaluateRPN(rpn);
            return isNaN(result) ? "Error" : parseFloat(result.toFixed(4)); // Precision limit
        } catch (e) {
            console.warn("Formula Error", e);
            return "Err";
        }
    }
};
