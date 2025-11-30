import { useState, useCallback, useRef } from 'react';
import { DocumentSettings } from '../types/block';

/**
 * Custom hook for managing margin dragging state and logic
 * Extracts margin drag concerns from the main EditorCanvas component
 */
export const useMarginDrag = (
    docSettings: DocumentSettings | undefined,
    updateSettings: (settings: DocumentSettings) => void
) => {
    const [isDragging, setIsDragging] = useState(false);
    const [draggingMargin, setDraggingMargin] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);
    const lastDragTimeRef = useRef<number>(0);
    
    const margins = docSettings?.margins || { top: 80, bottom: 80, left: 80, right: 80 };
    const mirrorMargins = docSettings?.mirrorMargins || false;
    
    // Start dragging a specific margin
    const startDrag = useCallback((margin: 'top' | 'bottom' | 'left' | 'right') => {
        // Prevent rapid-fire dragging to avoid performance issues
        const now = Date.now();
        if (now - lastDragTimeRef.current < 16) return; // ~60fps
        lastDragTimeRef.current = now;
        
        setIsDragging(true);
        setDraggingMargin(margin);
        
        // Add global cursor styles
        document.body.style.cursor = margin === 'top' || margin === 'bottom' ? 'row-resize' : 'col-resize';
        document.body.style.userSelect = 'none';
    }, []);
    
    // Stop dragging
    const stopDrag = useCallback(() => {
        setIsDragging(false);
        setDraggingMargin(null);
        
        // Reset global styles
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, []);
    
    // Update margins with proper validation
    const updateMargins = useCallback((newMargins: { top: number; bottom: number; left: number; right: number }) => {
        try {
            // Validate margins are within reasonable bounds
            const validatedMargins = {
                top: Math.max(20, Math.min(newMargins.top, 300)),
                bottom: Math.max(20, Math.min(newMargins.bottom, 300)),
                left: Math.max(20, Math.min(newMargins.left, 300)),
                right: Math.max(20, Math.min(newMargins.right, 300)),
            };
            
            // Update document settings with new margins
            updateSettings({
                ...docSettings,
                margins: validatedMargins
            });
        } catch (error) {
            console.error('Failed to update margins:', error);
        }
    }, [docSettings, updateSettings]);
    
    // Clean up on unmount
    const cleanup = useCallback(() => {
        stopDrag();
    }, [stopDrag]);
    
    // Handle global mouse up event to ensure drag stops even outside the component
    const handleGlobalMouseUp = useCallback(() => {
        if (isDragging) {
            stopDrag();
        }
    }, [isDragging, stopDrag]);
    
    return {
        // State
        isDragging,
        draggingMargin,
        margins,
        mirrorMargins,
        
        // Actions
        startDrag,
        stopDrag,
        updateMargins,
        cleanup,
        handleGlobalMouseUp,
    };
};