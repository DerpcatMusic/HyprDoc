
import React, { useState, useRef, useEffect } from 'react';
import { DocBlock, Party, BlockType, DocumentSettings, Variable } from '../types';
import { EditorBlock } from './EditorBlock';
import { Button, Input, ColorPicker, cn } from './ui-components';
import { FileText, Grid, Plus, Settings2, Play, Lock, Unlock, Magnet, RotateCcw, RotateCw } from 'lucide-react';
import { useDocument } from '../context/DocumentContext';

interface EditorCanvasProps {
    docTitle: string;
    docSettings?: DocumentSettings;
    blocks: DocBlock[];
    parties: Party[];
    variables?: Variable[];
    selectedBlockId: string | null;
    showPartyManager: boolean;
    onTitleChange: (t: string) => void;
    onTogglePartyManager: (show: boolean) => void;
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

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
    docTitle, docSettings, blocks, parties, selectedBlockId, showPartyManager,
    onTitleChange, onTogglePartyManager, onPreview, onSelectBlock,
    onUpdateBlock, onDeleteBlock, onAddBlock, onDropBlock, onUpdateParty
}) => {
    const { updateSettings, moveBlock, addParty, removeParty, addBlock, undo, redo, canUndo, canRedo } = useDocument();
    const [showMargins, setShowMargins] = useState(false); 
    const [snapSize, setSnapSize] = useState(5); 
    const [draggingMargin, setDraggingMargin] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);
    const margins = docSettings?.margins || { top: 80, bottom: 80, left: 80, right: 80 };
    const mirrorMargins = docSettings?.mirrorMargins || false;

    // Undo/Redo Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                if (e.shiftKey) redo();
                else undo();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
                e.preventDefault();
                redo();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [undo, redo]);

    const handleDragStartBlock = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('application/hyprdoc-block-id', id);
        e.dataTransfer.effectAllowed = 'move';
        e.stopPropagation();
    };

    const handleDropInternal = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const newType = e.dataTransfer.getData('application/hyprdoc-new') as BlockType;
        const existingId = e.dataTransfer.getData('application/hyprdoc-block-id');
        
        // If dropping directly on canvas (not handled by a child block), append to root
        if (newType) {
            addBlock(newType);
        } else if (existingId) {
            // Move to root level, at the end
            moveBlock(existingId, undefined, 'after');
        }
    };

    const handleBlockDrop = (e: React.DragEvent, targetId: string, position: any) => {
        e.preventDefault(); e.stopPropagation();
        const newType = e.dataTransfer.getData('application/hyprdoc-new') as BlockType;
        const existingId = e.dataTransfer.getData('application/hyprdoc-block-id');

        if (existingId === targetId) return;

        if (newType) {
            addBlock(newType, targetId, position);
        } else if (existingId) {
            moveBlock(existingId, targetId, position);
        }
    };

    // --- MARGIN DRAGGING LOGIC ---
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!draggingMargin || !canvasRef.current) return;
            const rect = canvasRef.current.getBoundingClientRect();
            
            let rawValue = 0;
            if (draggingMargin === 'left') rawValue = e.clientX - rect.left;
            else if (draggingMargin === 'right') rawValue = rect.right - e.clientX;
            else if (draggingMargin === 'top') rawValue = e.clientY - rect.top; 
            else if (draggingMargin === 'bottom') rawValue = rect.bottom - e.clientY;

            // Apply Snapping
            let newValue = Math.round(rawValue / snapSize) * snapSize;
            newValue = Math.max(20, Math.min(newValue, 300));
            
            const newMargins = { ...margins, [draggingMargin]: newValue };
            if (mirrorMargins) {
                if (draggingMargin === 'left') newMargins.right = newValue;
                if (draggingMargin === 'right') newMargins.left = newValue;
                if (draggingMargin === 'top') newMargins.bottom = newValue;
                if (draggingMargin === 'bottom') newMargins.top = newValue;
            }

            updateSettings({ ...docSettings, margins: newMargins });
        };

        const handleMouseUp = () => setDraggingMargin(null);

        if (draggingMargin) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggingMargin, margins, docSettings, updateSettings, mirrorMargins, snapSize]);

    const toggleMirrorMargins = () => {
        updateSettings({ ...docSettings, mirrorMargins: !mirrorMargins });
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        // If clicking on the canvas container directly (not a block)
        if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('min-h-full')) {
            onSelectBlock('');
            
            // Check if last block is empty text, if so focus it, else create new
            const lastBlock = blocks[blocks.length - 1];
            if (lastBlock?.type === BlockType.TEXT && !lastBlock.content) {
                onSelectBlock(lastBlock.id);
            } else {
                addBlock(BlockType.TEXT);
            }
        }
    };

    return (
        <div 
            className="flex-1 flex flex-col bg-muted/10 relative z-0 h-full overflow-hidden" 
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={handleDropInternal}
        >
              <div className="h-14 flex-shrink-0 bg-background border-b-2 border-black dark:border-white flex items-center justify-between px-4 z-30">
                  <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-black dark:bg-white flex items-center justify-center border border-black dark:border-white">
                            <FileText size={16} className="text-white dark:text-black" />
                          </div>
                          <div className="flex flex-col">
                              <span className="text-[9px] font-mono font-bold uppercase text-muted-foreground leading-none mb-1 tracking-widest">Doc Reference</span>
                              <input 
                                value={docTitle} 
                                onChange={(e) => onTitleChange(e.target.value)}
                                className="text-sm font-bold bg-transparent outline-none w-48 font-mono tracking-tight uppercase border-b-2 border-transparent focus:border-primary transition-colors hover:border-black/20"
                              />
                          </div>
                      </div>

                      <div className="h-8 w-px bg-black/10 dark:bg-white/10" />

                      <div className="flex items-center gap-2">
                            <button 
                                onClick={undo} 
                                disabled={!canUndo} 
                                className="h-8 w-8 flex items-center justify-center hover:bg-black hover:text-white disabled:opacity-30 transition-colors border-2 border-transparent hover:border-black dark:hover:border-white active:scale-95" 
                                title="Undo (Ctrl+Z)"
                            >
                                <RotateCcw size={16} />
                            </button>
                            <button 
                                onClick={redo} 
                                disabled={!canRedo} 
                                className="h-8 w-8 flex items-center justify-center hover:bg-black hover:text-white disabled:opacity-30 transition-colors border-2 border-transparent hover:border-black dark:hover:border-white active:scale-95" 
                                title="Redo (Ctrl+Y)"
                            >
                                <RotateCw size={16} />
                            </button>

                          <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-2" />

                          <button 
                            className={cn(
                                "h-8 px-3 flex items-center gap-2 text-[10px] font-bold uppercase font-mono border-2 transition-colors",
                                showMargins 
                                    ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" 
                                    : "bg-transparent border-transparent hover:border-black/20"
                            )}
                            onClick={() => setShowMargins(!showMargins)}
                          >
                            <Grid size={14} /> Grid / Margins
                          </button>
                          
                          {showMargins && (
                             <>
                                 <button
                                    className={cn(
                                        "h-8 px-3 flex items-center gap-2 text-[10px] font-bold uppercase font-mono border-2 transition-colors",
                                        mirrorMargins 
                                            ? "text-tech-orange border-tech-orange bg-tech-orange/10" 
                                            : "bg-transparent border-transparent hover:border-black/20"
                                    )}
                                    onClick={toggleMirrorMargins}
                                 >
                                     {mirrorMargins ? <Lock size={12} /> : <Unlock size={12} />} Sync
                                 </button>
                                 
                                 <div className="flex items-center gap-1 border border-black/10 dark:border-white/10 h-8 px-2 bg-white dark:bg-black">
                                     <Magnet size={12} className="text-muted-foreground" />
                                     <span className="text-[9px] font-mono font-bold uppercase text-muted-foreground">Snap</span>
                                     <input 
                                        type="number" 
                                        className="w-8 text-[10px] font-mono bg-transparent outline-none text-center border-b border-black/20 focus:border-black"
                                        value={snapSize}
                                        onChange={(e) => setSnapSize(parseInt(e.target.value) || 1)}
                                     />
                                     <span className="text-[9px] font-mono text-muted-foreground">px</span>
                                 </div>
                             </>
                          )}
                      </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-mono font-bold uppercase text-muted-foreground mr-1">Parties:</span>
                        <div className="flex -space-x-1">
                            {parties.map(p => (
                                <div key={p.id} className="w-6 h-6 border border-black flex items-center justify-center text-[9px] font-bold font-mono" style={{ backgroundColor: p.color }}>
                                    {p.initials}
                                </div>
                            ))}
                            <button 
                                onClick={() => onTogglePartyManager(true)}
                                className="w-6 h-6 bg-white dark:bg-black border border-black dark:border-white flex items-center justify-center hover:bg-black hover:text-white transition-colors"
                            >
                                <Settings2 size={12} />
                            </button>
                        </div>
                      </div>

                      <div className="h-8 w-px bg-black/10 dark:bg-white/10" />

                      <Button onClick={onPreview} size="sm" className="font-mono h-8 border-black shadow-sharp hover:shadow-sharp-hover bg-primary border-primary text-white"><Play size={12} className="mr-2"/> PREVIEW</Button>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 relative bg-grid-pattern cursor-text" style={{ fontFamily: docSettings?.fontFamily }} onClick={handleCanvasClick}>
                  
                  <div 
                    ref={canvasRef}
                    className="max-w-[850px] mx-auto bg-white dark:bg-black min-h-[1100px] border-2 border-black dark:border-white shadow-sharp dark:shadow-sharp-dark relative transition-all"
                    dir={docSettings?.direction || 'ltr'}
                  >
                        {showMargins && (
                            <div className="absolute inset-0 z-50 overflow-hidden pointer-events-none">
                                <div 
                                    className="absolute top-0 left-0 right-0 bg-hatch-pattern border-b-2 border-dashed border-tech-orange pointer-events-auto cursor-row-resize group"
                                    style={{ height: margins.top }}
                                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setDraggingMargin('top'); }}
                                />
                                <div 
                                    className="absolute bottom-0 left-0 right-0 bg-hatch-pattern border-t-2 border-dashed border-tech-orange pointer-events-auto cursor-row-resize group"
                                    style={{ height: margins.bottom }}
                                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setDraggingMargin('bottom'); }}
                                />
                                <div 
                                    className="absolute top-0 bottom-0 left-0 bg-hatch-pattern border-r-2 border-dashed border-tech-orange pointer-events-auto cursor-col-resize group"
                                    style={{ width: margins.left }}
                                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setDraggingMargin('left'); }}
                                />
                                <div 
                                    className="absolute top-0 bottom-0 right-0 bg-hatch-pattern border-l-2 border-dashed border-tech-orange pointer-events-auto cursor-col-resize group"
                                    style={{ width: margins.right }}
                                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setDraggingMargin('right'); }}
                                />
                            </div>
                        )}

                        <div 
                            className="relative z-10 min-h-full"
                            style={{ padding: `${margins.top}px ${margins.right}px ${margins.bottom}px ${margins.left}px` }}
                            onClick={handleCanvasClick}
                            onDrop={handleDropInternal}
                            onDragOver={(e) => e.preventDefault()}
                        >
                            {blocks.map((block, index) => (
                                <EditorBlock 
                                    key={block.id}
                                    index={index}
                                    block={block} 
                                    allBlocks={blocks} 
                                    parties={parties}
                                    formValues={{}} 
                                    docSettings={docSettings}
                                    isSelected={selectedBlockId === block.id}
                                    onSelect={onSelectBlock}
                                    onUpdate={onUpdateBlock}
                                    onDelete={onDeleteBlock}
                                    onDragStart={handleDragStartBlock}
                                    onDrop={handleBlockDrop}
                                />
                            ))}
                        </div>
                        
                        {blocks.length === 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
                                <div className="flex flex-col items-center">
                                     <p className="font-mono text-xs uppercase tracking-[0.2em] font-bold">Start Typing...</p>
                                     <p className="font-mono text-[9px] mt-2">OR PRESS '/' FOR COMMANDS</p>
                                </div>
                            </div>
                        )}
                  </div>
                  
                  {/* Click area below the page to simulate "infinite" typing space at bottom. Also handles drop to root. */}
                  <div 
                    className="h-[300px] w-full max-w-[850px] mx-auto cursor-text" 
                    onClick={handleCanvasClick}
                    onDrop={handleDropInternal}
                    onDragOver={(e) => e.preventDefault()}
                  />
              </div>
        </div>
    )
};
