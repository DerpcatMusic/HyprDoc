import React, { useState, useRef } from 'react';
import { DocBlock, DropPosition } from '../types/block';

export const useBlockDrag = (
    block: DocBlock, 
    onDragStart: (e: React.DragEvent, id: string) => void, 
    onDrop: (e: React.DragEvent, id: string, position: DropPosition) => void
) => {
    const [dropPosition, setDropPosition] = useState<DropPosition | null>(null);
    const elementRef = useRef<HTMLDivElement>(null);

    const handleDragStartInternal = (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.stopPropagation(); // Don't drag parent
        onDragStart(e, block.id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!elementRef.current) return;
        const rect = elementRef.current.getBoundingClientRect();
        const y = e.clientY - rect.top;
        
        if (['repeater', 'column', 'columns', 'conditional'].includes(block.type)) {
            // For container types, prioritize 'inside' dropping
            // Simple heuristic: if hovering the middle 50%, go inside
            if (y > rect.height * 0.25 && y < rect.height * 0.75) {
                setDropPosition('inside');
                return;
            }
        }

        if (y < rect.height * 0.5) setDropPosition('before');
        else setDropPosition('after');
    };

    const handleDropInternal = (e: React.DragEvent) => {
        e.preventDefault(); 
        e.stopPropagation();
        if (dropPosition) onDrop(e, block.id, dropPosition);
        setDropPosition(null);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDropPosition(null);
    }

    return {
        dropPosition,
        setDropPosition,
        elementRef,
        handleDragStartInternal,
        handleDragOver,
        handleDropInternal,
        handleDragLeave
    };
};