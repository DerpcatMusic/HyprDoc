import { useCallback, useRef } from 'react';
import { DocBlock, BlockType, DropPosition } from '../types/block';

/**
 * Custom hook for managing canvas interactions (click, drag, drop)
 * Extracts canvas interaction concerns from the main EditorCanvas component
 */
export const useCanvasInteractions = (
    blocks: DocBlock[],
    selectedBlockId: string | null,
    onSelectBlock: (id: string) => void,
    onAddBlock: (type: BlockType, targetId?: string, position?: DropPosition) => void,
    onDropBlock: (e: React.DragEvent, targetId: string, position: DropPosition) => void,
    addBlock: (type: BlockType, targetId?: string, position?: DropPosition) => void,
    moveBlock: (id: string, targetId: string | undefined, position: DropPosition) => void
) => {
    const dragDataRef = useRef<{ type: 'new' | 'existing'; value: string; position?: DropPosition } | null>(null);
    
    // Handle drag start for blocks
    const handleDragStartBlock = useCallback((e: React.DragEvent, id: string) => {
        try {
            e.dataTransfer.setData('application/hyprdoc-block-id', id);
            e.dataTransfer.effectAllowed = 'move';
            e.stopPropagation();
            
            // Store drag data for reference
            dragDataRef.current = { type: 'existing', value: id };
        } catch (error) {
            console.error('Failed to handle drag start:', error);
        }
    }, []);
    
    // Handle drop on canvas (root level)
    const handleDropInternal = useCallback((e: React.DragEvent) => {
        try {
            e.preventDefault();
            e.stopPropagation();
            
            const newType = e.dataTransfer.getData('application/hyprdoc-new') as BlockType;
            const existingId = e.dataTransfer.getData('application/hyprdoc-block-id');
            
            if (newType) {
                // Adding new block at root level
                addBlock(newType);
            } else if (existingId) {
                // Moving existing block to root level, at the end
                moveBlock(existingId, undefined, 'after');
            }
            
            // Clear drag data
            dragDataRef.current = null;
        } catch (error) {
            console.error('Failed to handle drop on canvas:', error);
        }
    }, [addBlock, moveBlock]);
    
    // Handle drop on specific block
    const handleBlockDrop = useCallback((e: React.DragEvent, targetId: string, position: DropPosition) => {
        try {
            e.preventDefault();
            e.stopPropagation();
            
            const newType = e.dataTransfer.getData('application/hyprdoc-new') as BlockType;
            const existingId = e.dataTransfer.getData('application/hyprdoc-block-id');

            // Prevent dropping on itself
            if (existingId === targetId) {
                dragDataRef.current = null;
                return;
            }

            if (newType) {
                // Add new block relative to target
                onAddBlock(newType, targetId, position);
            } else if (existingId) {
                // Move existing block relative to target
                moveBlock(existingId, targetId, position);
            }
            
            // Clear drag data
            dragDataRef.current = null;
        } catch (error) {
            console.error('Failed to handle block drop:', error);
        }
    }, [onAddBlock, moveBlock]);
    
    // Handle canvas click
    const handleCanvasClick = useCallback((e: React.MouseEvent) => {
        try {
            // If clicking on the canvas container directly (not a block)
            const target = e.target as HTMLElement;
            const isCanvasClick = target === e.currentTarget || 
                                target.classList.contains('min-h-full') ||
                                target.closest('[data-canvas="true"]');
            
            if (isCanvasClick) {
                // Clear block selection
                onSelectBlock('');
                
                // Check if last block is empty text, if so focus it, else create new
                const lastBlock = blocks[blocks.length - 1];
                if (lastBlock?.type === BlockType.TEXT && !lastBlock.content?.trim()) {
                    onSelectBlock(lastBlock.id);
                } else {
                    // Add new text block at the end
                    addBlock(BlockType.TEXT);
                }
            }
        } catch (error) {
            console.error('Failed to handle canvas click:', error);
        }
    }, [blocks, onSelectBlock, addBlock]);
    
    // Prevent default drag over behavior
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);
    
    // Clean up drag data when component unmounts
    const cleanup = useCallback(() => {
        dragDataRef.current = null;
    }, []);
    
    // Get current drag data for debugging
    const getDragData = useCallback(() => dragDataRef.current, []);
    
    return {
        // Handlers
        handleDragStartBlock,
        handleDropInternal,
        handleBlockDrop,
        handleCanvasClick,
        handleDragOver,
        
        // Utilities
        cleanup,
        getDragData,
    };
};