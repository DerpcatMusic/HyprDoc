
import { DocBlock, BlockType } from '../types';

/**
 * Deep clone blocks to ensure immutability
 */
export const cloneTree = (blocks: DocBlock[]): DocBlock[] => JSON.parse(JSON.stringify(blocks));

/**
 * Find a block by ID anywhere in the tree
 */
export const findNode = (blocks: DocBlock[], id: string): DocBlock | null => {
    for (const block of blocks) {
        if (block.id === id) return block;
        if (block.children) {
            const found = findNode(block.children, id);
            if (found) return found;
        }
    }
    return null;
};

/**
 * Remove a block by ID from the tree.
 * Returns the new tree and the removed block (if found).
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
            result.push(block);
        }
        return result;
    };

    const newTree = removeRecursive(blocks);
    return { tree: newTree, removed };
};

/**
 * Insert a block relative to a target ID
 */
export const insertNode = (
    blocks: DocBlock[], 
    node: DocBlock, 
    targetId: string | undefined, 
    position: 'before' | 'after' | 'inside'
): DocBlock[] => {
    // If no target, add to end of root
    if (!targetId) {
        return [...blocks, node];
    }

    const insertRecursive = (list: DocBlock[]): boolean => {
        // Position: Inside (Append to children)
        if (position === 'inside') {
            const target = list.find(b => b.id === targetId);
            if (target) {
                target.children = target.children || [];
                target.children.push(node);
                return true;
            }
        } 
        // Position: Before/After (Sibling)
        else {
            const idx = list.findIndex(b => b.id === targetId);
            if (idx !== -1) {
                if (position === 'after') list.splice(idx + 1, 0, node);
                else list.splice(idx, 0, node);
                return true;
            }
        }

        // Recurse
        for (const block of list) {
            if (block.children) {
                if (insertRecursive(block.children)) return true;
            }
        }
        return false;
    };

    const newTree = cloneTree(blocks);
    if (!insertRecursive(newTree)) {
        // Fallback: if target not found, push to root
        newTree.push(node);
    }
    return newTree;
};

/**
 * Sanitize the tree:
 * 1. Remove empty COLUMNS blocks.
 * 2. AUTO-UNWRAP: If a ROW has only 1 populated COLUMN, dissolve the row and promote children.
 * 3. Prune empty columns to ensure "drag-to-unsplit" feels natural.
 */
export const sanitizeTree = (blocks: DocBlock[]): DocBlock[] => {
    const sanitizeRecursive = (list: DocBlock[]): DocBlock[] => {
        const result: DocBlock[] = [];
        
        for (const block of list) {
            // Process children first (bottom-up)
            if (block.children) {
                block.children = sanitizeRecursive(block.children);
            }

            // SMART CLEANUP LOGIC
            if (block.type === BlockType.COLUMNS) {
                // Filter out columns that are completely empty
                const populatedColumns = (block.children || []).filter(col => 
                    col.children && col.children.length > 0
                );

                if (populatedColumns.length === 0) {
                    // Entire row is empty, delete it
                    continue; 
                }

                if (populatedColumns.length === 1) {
                    // Auto-Unwrap: Only 1 column left? Dissolve the row.
                    // Push the children of that single column to the current level
                    if (populatedColumns[0].children) {
                        result.push(...populatedColumns[0].children);
                    }
                    continue;
                }

                // If we have valid columns, update the block.
                // Re-normalize widths if we removed a column
                if (populatedColumns.length !== (block.children?.length || 0)) {
                    const newWidth = 100 / populatedColumns.length;
                    populatedColumns.forEach(c => c.width = newWidth);
                }
                
                block.children = populatedColumns;
            }
            
            result.push(block);
        }
        return result;
    };
    return sanitizeRecursive(blocks);
};

/**
 * Logic to split a block into columns
 */
export const splitBlock = (
    tree: DocBlock[], 
    targetBlockId: string, 
    sourceBlock: DocBlock, 
    direction: 'left' | 'right'
): DocBlock[] => {
    let newTree = cloneTree(tree);

    // Helper to create basic column
    const createColumn = (children: DocBlock[] = []) => ({
        id: crypto.randomUUID(),
        type: BlockType.COLUMN,
        width: 50,
        children
    });

    const replaceRecursive = (list: DocBlock[]): DocBlock[] => {
        return list.map(b => {
            if (b.id === targetBlockId) {
                // We found the target. Replace it with a Row.
                const colSource = createColumn([sourceBlock]);
                const colTarget = createColumn([b]); // Wrap existing block
                
                const children = direction === 'left' 
                    ? [colSource, colTarget] 
                    : [colTarget, colSource];

                return {
                    id: crypto.randomUUID(),
                    type: BlockType.COLUMNS,
                    children
                };
            }
            if (b.children) {
                return { ...b, children: replaceRecursive(b.children) };
            }
            return b;
        });
    };

    return replaceRecursive(newTree);
};
