import type { DocBlock } from '../types/block';

/**
 * Deep clone utility - Modernized for performance
 */
export const cloneTree = (blocks: DocBlock[]): DocBlock[] => {
    if (typeof structuredClone === 'function') {
        return structuredClone(blocks);
    }
    return JSON.parse(JSON.stringify(blocks));
};

/**
 * Recursive finder
 */
export const findNode = (blocks: DocBlock[], id: string): DocBlock | null => {
    for (const block of blocks) {
        if (block.id === id) return block;
        if (block.children) {
            const found = findNode(block.children, id);
            if (found) return found;
        }
        if (block.elseChildren) {
            const found = findNode(block.elseChildren, id);
            if (found) return found;
        }
    }
    return null;
};

/**
 * Recursive remover
 */
export const removeNode = (blocks: DocBlock[], id: string): { tree: DocBlock[], removed: DocBlock | null } => {
    let removed: DocBlock | null = null;

    const removeRecursive = (list: DocBlock[]): DocBlock[] => {
        const result: DocBlock[] = [];
        for (const block of list) {
            if (block.id === id) {
                removed = block;
                continue;
            }
            if (block.children) {
                block.children = removeRecursive(block.children);
            }
            if (block.elseChildren) {
                block.elseChildren = removeRecursive(block.elseChildren);
            }
            result.push(block);
        }
        return result;
    };

    const tree = removeRecursive(cloneTree(blocks));
    return { tree, removed };
};

/**
 * Recursive replacement (swap a node with a list of nodes)
 * Used for "Ungroup" functionality to explode a container in place.
 */
export const replaceNode = (blocks: DocBlock[], targetId: string, newNodes: DocBlock[]): DocBlock[] => {
    const replaceRecursive = (list: DocBlock[]): DocBlock[] => {
        const result: DocBlock[] = [];
        for (const block of list) {
            if (block.id === targetId) {
                // Insert all new nodes in place of this block
                result.push(...newNodes);
            } else {
                const newBlock = { ...block };
                if (newBlock.children) newBlock.children = replaceRecursive(newBlock.children);
                if (newBlock.elseChildren) newBlock.elseChildren = replaceRecursive(newBlock.elseChildren);
                result.push(newBlock);
            }
        }
        return result;
    };
    return replaceRecursive(cloneTree(blocks));
}

/**
 * Recursive inserter
 * Supports before, after, inside (children), inside-false (elseChildren)
 */
export const insertNode = (
    blocks: DocBlock[], 
    node: DocBlock, 
    targetId: string | undefined, 
    position: 'before' | 'after' | 'inside' | 'inside-false'
): DocBlock[] => {
    // Append to root if no target
    if (!targetId) {
        return [...blocks, node];
    }

    const insertRecursive = (list: DocBlock[]): DocBlock[] => {
        const result: DocBlock[] = [];
        
        for (const block of list) {
            if (block.id === targetId) {
                if (position === 'before') result.push(node);
                
                // Clone block to avoid mutation issues
                const newBlock = { ...block };
                
                if (position === 'inside') {
                    newBlock.children = [...(newBlock.children || []), node];
                } else if (position === 'inside-false') {
                    newBlock.elseChildren = [...(newBlock.elseChildren || []), node];
                }
                
                result.push(newBlock);
                
                if (position === 'after') result.push(node);
            } else {
                const newBlock = { ...block };
                if (newBlock.children) newBlock.children = insertRecursive(newBlock.children);
                if (newBlock.elseChildren) newBlock.elseChildren = insertRecursive(newBlock.elseChildren);
                result.push(newBlock);
            }
        }
        return result;
    };

    return insertRecursive(cloneTree(blocks));
};