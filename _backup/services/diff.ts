
import { DocBlock } from "../types";

export type DiffType = 'unchanged' | 'added' | 'modified' | 'removed';

export interface BlockDiff {
    blockId: string;
    status: DiffType;
}

/**
 * Compares current blocks against a snapshot to determine what changed.
 * This is a simplified diff based on ID existence and content hash.
 */
export const computeDiff = (current: DocBlock[], snapshot: DocBlock[] | undefined): Record<string, DiffType> => {
    if (!snapshot) return {};

    const diffs: Record<string, DiffType> = {};
    const snapshotMap = new Map(snapshot.map(b => [b.id, b]));

    // Check Current Blocks
    current.forEach(block => {
        const snapBlock = snapshotMap.get(block.id);
        if (!snapBlock) {
            diffs[block.id] = 'added';
        } else {
            // Check for modification (Content, Label, Options)
            const isModified = 
                block.content !== snapBlock.content ||
                block.label !== snapBlock.label ||
                JSON.stringify(block.options) !== JSON.stringify(snapBlock.options);
            
            diffs[block.id] = isModified ? 'modified' : 'unchanged';
        }

        // Recursive check for children
        if (block.children) {
            const childDiffs = computeDiff(block.children, snapBlock?.children || []);
            Object.assign(diffs, childDiffs);
        }
    });

    // We typically don't show "removed" blocks in the editor flow unless we render a "Ghost" block,
    // but for this implementation we focus on highlighting what is NEW or CHANGED in the current view.
    
    return diffs;
};
