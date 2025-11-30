import React, { useCallback } from 'react';
import { DocumentSettings } from '../../types';

interface MarginControlsProps {
    margins: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    mirrorMargins: boolean;
    canvasRef: React.RefObject<HTMLDivElement | null>;
    isDragging: boolean;
    draggingMargin: 'top' | 'bottom' | 'left' | 'right' | null;
    snapSize: number;
    onStartDrag: (margin: 'top' | 'bottom' | 'left' | 'right') => void;
    onUpdateMargins: (margins: { top: number; bottom: number; left: number; right: number }) => void;
}

/**
 * MarginControls component - handles margin dragging UI and logic
 * Extracts margin management concerns from the main EditorCanvas component
 */
export const MarginControls: React.FC<MarginControlsProps> = ({
    margins,
    mirrorMargins,
    canvasRef,
    isDragging,
    draggingMargin,
    snapSize,
    onStartDrag,
    onUpdateMargins,
}) => {
    // Calculate margin positions for display
    const getMarginStyle = useCallback((margin: keyof typeof margins) => {
        const value = margins[margin];
        switch (margin) {
            case 'top':
                return { height: value };
            case 'bottom':
                return { height: value };
            case 'left':
                return { width: value };
            case 'right':
                return { width: value };
            default:
                return {};
        }
    }, [margins]);

    // Handle margin resize
    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !draggingMargin || !canvasRef.current) return;
        
        try {
            const rect = canvasRef.current.getBoundingClientRect();
            let rawValue = 0;
            
            if (draggingMargin === 'left') rawValue = e.clientX - rect.left;
            else if (draggingMargin === 'right') rawValue = rect.right - e.clientX;
            else if (draggingMargin === 'top') rawValue = e.clientY - rect.top;
            else if (draggingMargin === 'bottom') rawValue = rect.bottom - e.clientY;

            // Apply snapping
            let newValue = Math.round(rawValue / snapSize) * snapSize;
            newValue = Math.max(20, Math.min(newValue, 300));
            
            const newMargins = { ...margins, [draggingMargin]: newValue };
            
            // Apply mirror margins if enabled
            if (mirrorMargins) {
                if (draggingMargin === 'left') newMargins.right = newValue;
                if (draggingMargin === 'right') newMargins.left = newValue;
                if (draggingMargin === 'top') newMargins.bottom = newValue;
                if (draggingMargin === 'bottom') newMargins.top = newValue;
            }

            onUpdateMargins(newMargins);
        } catch (error) {
            console.error('Error updating margins:', error);
        }
    }, [isDragging, draggingMargin, margins, snapSize, canvasRef, onUpdateMargins, mirrorMargins]);

    // Clean up event listeners
    React.useEffect(() => {
        if (isDragging && draggingMargin) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', () => {
                // The parent component should handle stopping the drag
                // This is just for the global event cleanup
            });
            
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
            };
        }
    }, [isDragging, draggingMargin, handleMouseMove]);

    const marginControls = [
        { position: 'top' as const, cursor: 'row-resize', border: 'border-b-2', bg: 'bg-hatch-pattern' },
        { position: 'bottom' as const, cursor: 'row-resize', border: 'border-t-2', bg: 'bg-hatch-pattern' },
        { position: 'left' as const, cursor: 'col-resize', border: 'border-r-2', bg: 'bg-hatch-pattern' },
        { position: 'right' as const, cursor: 'col-resize', border: 'border-l-2', bg: 'bg-hatch-pattern' },
    ];

    return (
        <div className="absolute inset-0 z-50 overflow-hidden pointer-events-none">
            {marginControls.map(({ position, cursor, border, bg }) => (
                <div
                    key={position}
                    className={`
                        absolute group pointer-events-auto ${cursor} 
                        ${bg} border-dashed border-tech-orange ${border}
                        transition-opacity hover:opacity-80
                    `}
                    style={getMarginStyle(position)}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onStartDrag(position);
                    }}
                    role="separator"
                    aria-orientation={position === 'top' || position === 'bottom' ? 'horizontal' : 'vertical'}
                    aria-label={`Resize ${position} margin`}
                    aria-valuenow={margins[position]}
                    aria-valuemin={20}
                    aria-valuemax={300}
                    tabIndex={0}
                    onKeyDown={(e) => {
                        // Keyboard accessibility for margin resizing
                        const step = e.shiftKey ? 10 : 1;
                        let newValue = margins[position];
                        
                        switch (e.key) {
                            case 'ArrowUp':
                            case 'ArrowLeft':
                                e.preventDefault();
                                newValue = Math.max(20, margins[position] - step);
                                break;
                            case 'ArrowDown':
                            case 'ArrowRight':
                                e.preventDefault();
                                newValue = Math.min(300, margins[position] + step);
                                break;
                        }
                        
                        if (newValue !== margins[position]) {
                            const newMargins = { ...margins, [position]: newValue };
                            if (mirrorMargins) {
                                const opposite = position === 'top' ? 'bottom' : 
                                               position === 'bottom' ? 'top' :
                                               position === 'left' ? 'right' : 'left';
                                newMargins[opposite] = newValue;
                            }
                            onUpdateMargins(newMargins);
                        }
                    }}
                >
                    {/* Visual indicator for active drag */}
                    {isDragging && draggingMargin === position && (
                        <div className="absolute inset-0 bg-tech-orange/20 border-2 border-tech-orange animate-pulse" />
                    )}
                    
                    {/* Hover indicator */}
                    <div className="absolute inset-0 bg-transparent group-hover:bg-tech-orange/10 transition-colors" />
                </div>
            ))}
        </div>
    );
};