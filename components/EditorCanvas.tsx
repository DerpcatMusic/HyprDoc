import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { DocBlock, Party, BlockType, DocumentSettings, Variable } from '../types';
import { EditorBlock } from './EditorBlock';
import { Button, cn, Dialog, DialogContent, DialogHeader, DialogTitle } from './ui-components';
import { useDocument } from '../context/DocumentContext';
import { SettingsView } from './views/SettingsView';
import { CanvasToolbar } from './editor/CanvasToolbar';
import { MarginControls } from './editor/MarginControls';
import { useMarginDrag } from '../hooks/useMarginDrag';
import { useCanvasInteractions } from '../hooks/useCanvasInteractions';

interface EditorCanvasProps {
    docTitle: string;
    docSettings?: DocumentSettings | undefined;
    blocks: DocBlock[];
    parties: Party[];
    variables?: Variable[] | undefined;
    selectedBlockId: string | null;
    showPartyManager?: boolean; // Deprecated
    onTitleChange: (t: string) => void;
    onTogglePartyManager?: (show: boolean) => void; // Deprecated
    onPreview: () => void;
    onSend: () => void;
    onSelectBlock: (id: string) => void;
    onUpdateBlock: (id: string, u: Partial<DocBlock>) => void;
    onDeleteBlock: (id: string) => void;
    onAddBlock: (type: BlockType) => void;
    onDropBlock: (e: React.DragEvent, targetId: string, position: any) => void;
    onUpdateParty: (index: number, p: Party) => void;
    onUpdateVariables: (vars: Variable[]) => void;
}

/**
 * EditorCanvas component - Main editor interface for document editing
 * Refactored to use focused sub-components and custom hooks for better maintainability
 * 
 * Key improvements:
 * - Split into focused sub-components (CanvasToolbar, MarginControls)
 * - Extracted logic into custom hooks (useMarginDrag, useCanvasInteractions)
 * - Added proper error handling and accessibility
 * - Improved performance with memoization
 */
export const EditorCanvas: React.FC<EditorCanvasProps> = memo(({
    docTitle,
    docSettings,
    blocks,
    parties,
    selectedBlockId,
    onTitleChange,
    onPreview,
    onSelectBlock,
    onUpdateBlock,
    onDeleteBlock,
    onAddBlock,
    onDropBlock,
    onUpdateParty,
}) => {
    const { 
        updateSettings, 
        moveBlock, 
        addParty, 
        removeParty, 
        addBlock: contextAddBlock, 
        undo, 
        redo, 
        canUndo, 
        canRedo, 
        saveStatus, 
        saveNow, 
        updateParties 
    } = useDocument();
    
    // Local UI state
    const [showMargins, setShowMargins] = useState(false); 
    const [snapSize, setSnapSize] = useState(5); 
    const [showDocSettings, setShowDocSettings] = useState(false);
    const [showPartiesPopover, setShowPartiesPopover] = useState(false);
    
    // Refs
    const canvasRef = useRef<HTMLDivElement>(null);
    const partiesButtonRef = useRef<HTMLButtonElement>(null);
    
    // Custom hooks for separated concerns
    const {
        isDragging,
        draggingMargin,
        margins,
        mirrorMargins,
        startDrag,
        stopDrag,
        updateMargins,
        cleanup: marginCleanup,
        handleGlobalMouseUp,
    } = useMarginDrag(docSettings, updateSettings);
    
    const {
        handleDragStartBlock,
        handleDropInternal,
        handleBlockDrop,
        handleCanvasClick,
        handleDragOver,
        cleanup: canvasCleanup,
    } = useCanvasInteractions(
        blocks,
        selectedBlockId,
        onSelectBlock,
        onAddBlock,
        onDropBlock,
        contextAddBlock,
        moveBlock
    );
    
    // Keyboard shortcuts for undo/redo
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            try {
                if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) redo();
                    else undo();
                }
                if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                    e.preventDefault();
                    redo();
                }
            } catch (error) {
                console.error('Error handling keyboard shortcut:', error);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);
    
    // Close parties popover on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            try {
                if (showPartiesPopover && 
                    partiesButtonRef.current && 
                    !partiesButtonRef.current.contains(e.target as Node) &&
                    !(e.target as Element).closest('.parties-popover')) {
                    setShowPartiesPopover(false);
                }
            } catch (error) {
                console.error('Error handling click outside:', error);
            }
        };
        
        window.addEventListener('mousedown', handleClickOutside);
        return () => window.removeEventListener('mousedown', handleClickOutside);
    }, [showPartiesPopover]);
    
    // Global mouse up handler for margin dragging
    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mouseup', handleGlobalMouseUp);
            return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
        }
    }, [isDragging, handleGlobalMouseUp]);
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            marginCleanup();
            canvasCleanup();
        };
    }, [marginCleanup, canvasCleanup]);
    
    // Memoized handlers for better performance
    const handleAddParty = useCallback(() => {
        try {
            addParty({
                id: crypto.randomUUID(),
                name: 'New Signer',
                color: '#' + Math.floor(Math.random()*16777215).toString(16),
                initials: 'NS'
            });
        } catch (error) {
            console.error('Failed to add party:', error);
        }
    }, [addParty]);
    
    const handleToggleMirrorMargins = useCallback(() => {
        try {
            updateSettings({ ...docSettings, mirrorMargins: !mirrorMargins });
        } catch (error) {
            console.error('Failed to toggle mirror margins:', error);
        }
    }, [docSettings, mirrorMargins, updateSettings]);
    
    // Error boundary component for canvas operations
    const CanvasErrorBoundary: React.FC<{ children: React.ReactNode }> = memo(({ children }) => {
        const [hasError, setHasError] = useState(false);
        
        useEffect(() => {
            const handleError = (error: ErrorEvent) => {
                console.error('Canvas operation failed:', error);
                setHasError(true);
            };
            
            window.addEventListener('error', handleError);
            return () => window.removeEventListener('error', handleError);
        }, []);
        
        if (hasError) {
            return (
                <div className="flex items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">Canvas temporarily unavailable. Please refresh the page.</p>
                </div>
            );
        }
        
        return <>{children}</>;
    });
    
    return (
        <div className="flex-1 flex flex-col bg-muted/10 relative z-0 h-full overflow-hidden">
            <CanvasToolbar
                docTitle={docTitle}
                docSettings={docSettings}
                parties={parties}
                selectedBlockId={selectedBlockId}
                saveStatus={saveStatus}
                canUndo={canUndo}
                canRedo={canRedo}
                showMargins={showMargins}
                mirrorMargins={mirrorMargins}
                snapSize={snapSize}
                showDocSettings={showDocSettings}
                showPartiesPopover={showPartiesPopover}
                partiesButtonRef={partiesButtonRef}
                onTitleChange={onTitleChange}
                onSaveNow={saveNow}
                onShowDocSettings={setShowDocSettings}
                onUndo={undo}
                onRedo={redo}
                onToggleMargins={() => setShowMargins(!showMargins)}
                onToggleMirrorMargins={handleToggleMirrorMargins}
                onSnapSizeChange={setSnapSize}
                onTogglePartiesPopover={() => setShowPartiesPopover(!showPartiesPopover)}
                onAddParty={handleAddParty}
                onRemoveParty={removeParty}
                onUpdateParty={onUpdateParty}
                onPreview={onPreview}
            />

            <div className="flex-1 overflow-y-auto p-8 relative bg-grid-pattern cursor-text" style={{ fontFamily: docSettings?.fontFamily }}>
                <CanvasErrorBoundary>
                    <div 
                        ref={canvasRef}
                        className="max-w-[850px] mx-auto bg-white dark:bg-black min-h-[1100px] border-2 border-black dark:border-white shadow-sharp dark:shadow-sharp-dark relative transition-all"
                        dir={docSettings?.direction || 'ltr'}
                        data-canvas="true"
                    >
                        {/* Margin controls overlay */}
                        {showMargins && (
                            <MarginControls
                                margins={margins}
                                mirrorMargins={mirrorMargins}
                                canvasRef={canvasRef}
                                isDragging={isDragging}
                                draggingMargin={draggingMargin}
                                snapSize={snapSize}
                                onStartDrag={startDrag}
                                onUpdateMargins={updateMargins}
                            />
                        )}

                        {/* Main content area */}
                        <div 
                            className="relative z-10 min-h-full"
                            style={{ padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px` }}
                            onClick={handleCanvasClick}
                            onDrop={handleDropInternal}
                            onDragOver={handleDragOver}
                        >
                            {blocks.map((block, index) => (
                                <EditorBlock 
                                    key={block.id}
                                    index={index}
                                    block={block} 
                                    allBlocks={blocks} 
                                    parties={parties}
                                    formValues={{}} 
                                    {...(docSettings && { docSettings })}
                                    isSelected={selectedBlockId === block.id}
                                    onSelect={onSelectBlock}
                                    onUpdate={onUpdateBlock}
                                    onDelete={onDeleteBlock}
                                    onDragStart={handleDragStartBlock}
                                    onDrop={handleBlockDrop}
                                />
                            ))}
                        </div>
                        
                        {/* Empty state */}
                        {blocks.length === 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
                                <div className="flex flex-col items-center">
                                    <p className="font-mono text-xs uppercase tracking-[0.2em] font-bold">Start Typing...</p>
                                    <p className="font-mono text-[9px] mt-2">OR PRESS '/' FOR COMMANDS</p>
                                </div>
                            </div>
                        )}
                    </div>
                </CanvasErrorBoundary>
                
                {/* Click area below the page for infinite scroll space */}
                <div 
                    className="h-[300px] w-full max-w-[850px] mx-auto cursor-text" 
                    onClick={handleCanvasClick}
                    onDrop={handleDropInternal}
                    onDragOver={handleDragOver}
                />
            </div>

            {/* Document Settings Modal */}
            <Dialog open={showDocSettings} onOpenChange={setShowDocSettings}>
                <DialogContent className="max-w-4xl h-[600px] p-0 flex flex-col overflow-hidden">
                    <DialogHeader className="p-6 pb-2 shrink-0">
                        <DialogTitle>Document Configuration</DialogTitle>
                    </DialogHeader>
                    <SettingsView 
                        mode="document" 
                        settings={docSettings} 
                        onUpdate={updateSettings} 
                        parties={parties}
                        onUpdateParties={updateParties}
                        isModal={true}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
});

EditorCanvas.displayName = 'EditorCanvas';