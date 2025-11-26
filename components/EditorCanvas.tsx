
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { DocBlock, Party, BlockType, DocumentSettings } from '../types';
import { EditorBlock } from './EditorBlock';
import { Button, Input, ColorPicker, Label, Switch, Dialog, DialogContent, DialogHeader, DialogTitle } from './ui-components';
import { Play, Send, Users, X, Grid, FileText, Link as LinkIcon, Plus, Trash2 } from 'lucide-react';
import { useDocument } from '../context/DocumentContext';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

interface EditorCanvasProps {
    docTitle: string;
    docSettings?: DocumentSettings;
    blocks: DocBlock[];
    parties: Party[];
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
    onDropBlock: (e: React.DragEvent, targetId?: string) => void;
    onUpdateParty: (index: number, p: Party) => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
    docTitle,
    docSettings,
    blocks,
    parties,
    selectedBlockId,
    showPartyManager,
    onTitleChange,
    onTogglePartyManager,
    onPreview,
    onSend,
    onSelectBlock,
    onUpdateBlock,
    onDeleteBlock,
    onAddBlock,
    onDropBlock,
    onUpdateParty
}) => {
    const { updateSettings, moveBlock, addParty, removeParty, addBlock } = useDocument();
    const [showGrid, setShowGrid] = useState(false);
    const [marginSnap, setMarginSnap] = useState(10);
    const [mirrorMargins, setMirrorMargins] = useState(false);
    
    const [draggingMargin, setDraggingMargin] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);
    const [dragValue, setDragValue] = useState<number | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    // GSAP Flip Logic
    useLayoutEffect(() => {
        if (!canvasRef.current) return;
        
        const ctx = gsap.context(() => {
            const state = Flip.getState("[data-flip-id]");
            
            Flip.from(state, {
                targets: "[data-flip-id]",
                duration: 0.4,
                ease: "power1.inOut",
                stagger: 0.05,
                absolute: true, 
                nested: true,
                onEnter: elements => gsap.fromTo(elements, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.3 }),
                onLeave: elements => gsap.to(elements, { opacity: 0, scale: 0.9, duration: 0.3 })
            });
        }, canvasRef);

        return () => ctx.revert();
    }, [blocks]); // Trigger animation when blocks change

    const handleDragStartBlock = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('application/hyprdoc-block-id', id);
        e.dataTransfer.effectAllowed = 'move';
        
        // Create a ghost image that is transparent to avoid blocking view
        const ghost = document.createElement('div');
        ghost.style.width = '1px';
        ghost.style.height = '1px';
        ghost.style.opacity = '0';
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 0, 0);
        setTimeout(() => document.body.removeChild(ghost), 0);
    };

    const handleDropBlockInternal = (e: React.DragEvent, targetId?: string) => {
        e.preventDefault();
        e.stopPropagation();

        const draggedBlockId = e.dataTransfer.getData('application/hyprdoc-block-id');
        const newBlockType = e.dataTransfer.getData('application/hyprdoc-new') as BlockType;

        if (draggedBlockId && targetId && draggedBlockId !== targetId) {
            moveBlock(draggedBlockId, targetId, 'after');
        } else if (newBlockType) {
            addBlock(newBlockType, targetId, 'after');
        }
    };
    
    const handleMarginMouseDown = (e: React.MouseEvent, type: 'top' | 'bottom' | 'left' | 'right') => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingMargin(type);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingMargin || !canvasRef.current || !docSettings?.margins) return;

        const rect = canvasRef.current.getBoundingClientRect();
        let rawVal = 0;
        const MIN_MARGIN = 0;
        const MAX_MARGIN = 300;

        if (draggingMargin === 'top') {
            rawVal = e.clientY - rect.top;
        } else if (draggingMargin === 'bottom') {
            rawVal = rect.bottom - e.clientY;
        } else if (draggingMargin === 'left') {
            rawVal = e.clientX - rect.left;
        } else if (draggingMargin === 'right') {
            rawVal = rect.right - e.clientX;
        }

        const snap = marginSnap > 0 ? marginSnap : 1;
        let val = Math.round(rawVal / snap) * snap;
        val = Math.max(MIN_MARGIN, Math.min(MAX_MARGIN, val));

        setDragValue(val);

        const newMargins = { ...docSettings.margins };
        newMargins[draggingMargin] = val;

        if (mirrorMargins) {
            newMargins.top = val;
            newMargins.bottom = val;
            newMargins.left = val;
            newMargins.right = val;
        }

        updateSettings({ ...docSettings, margins: newMargins });
    };

    const handleMouseUp = () => {
        setDraggingMargin(null);
        setDragValue(null);
    };
    
    const handleManualMarginChange = (key: keyof typeof docSettings.margins, val: string) => {
        const num = parseInt(val) || 0;
        const newMargins = { ...docSettings?.margins, [key]: num };
        
        if (mirrorMargins && docSettings?.margins) {
             newMargins.top = num;
             newMargins.bottom = num;
             newMargins.left = num;
             newMargins.right = num;
        }
        
        updateSettings({ ...docSettings, margins: newMargins as any });
    }

    // --- Party Management Logic ---
    const handleAddParty = () => {
        addParty({
            id: crypto.randomUUID(),
            name: `Party ${parties.length + 1}`,
            color: '#000000',
            initials: `P${parties.length + 1}`
        });
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        // Ensure we only add if clicking the canvas directly, not a child
        if (e.target === e.currentTarget) {
            // Logic to prevent duplicate "Click to type..."
            // Check if the last block is an empty text block
            const lastBlock = blocks[blocks.length - 1];
            if (lastBlock && lastBlock.type === BlockType.TEXT && (!lastBlock.content || lastBlock.content.trim() === '')) {
                // Just select it instead of adding a new one
                onSelectBlock(lastBlock.id);
            } else {
                // Add new text block
                onAddBlock(BlockType.TEXT); 
            }
        }
    };

    return (
        <div 
            className="flex-1 flex flex-col bg-background relative z-0" 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDropBlockInternal(e)}
            onMouseMove={draggingMargin ? handleMouseMove : undefined}
            onMouseUp={draggingMargin ? handleMouseUp : undefined}
            onMouseLeave={draggingMargin ? handleMouseUp : undefined}
        >
              {/* Header Bar */}
              <div className="h-16 bg-background border-b-2 border-black dark:border-zinc-800 flex items-center justify-between px-6 z-30 shadow-sm dark:bg-zinc-950 transition-colors">
                  <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-primary border-2 border-black dark:border-zinc-700 flex items-center justify-center">
                        <FileText size={16} className="text-white" />
                      </div>
                      <input 
                        value={docTitle} 
                        onChange={(e) => onTitleChange(e.target.value)}
                        className="text-lg font-bold bg-transparent outline-none w-auto font-mono tracking-tight uppercase placeholder:text-muted-foreground/50 focus:underline decoration-2 decoration-primary underline-offset-4 text-foreground"
                        placeholder="UNTITLED_DOC"
                      />
                  </div>
                  <div className="flex items-center gap-2">
                      <Button variant={showGrid ? "secondary" : "ghost"} size="sm" onClick={() => setShowGrid(!showGrid)} title="Adjust Margins" className="font-mono border-2 border-transparent hover:border-black dark:hover:border-zinc-500 hover:shadow-hypr-sm dark:text-foreground">
                          <Grid size={14} className="mr-2"/> MARGINS
                      </Button>
                      <div className="h-6 w-px bg-border mx-1"></div>
                      <Button variant="outline" size="sm" onClick={() => onTogglePartyManager(true)} className="font-mono hover:shadow-hypr-sm dark:border-zinc-700 dark:text-foreground"><Users size={14} className="mr-2"/> PARTIES</Button>
                      <Button onClick={onPreview} size="sm" variant="outline" className="font-mono hover:shadow-hypr-sm dark:border-zinc-700 dark:text-foreground"><Play size={14} className="mr-2"/> PREVIEW</Button>
                      <Button onClick={onSend} size="sm" className="bg-black text-white hover:bg-primary hover:text-black font-mono border-2 border-black shadow-hypr-sm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all dark:border-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-primary"><Send size={14} className="mr-2"/> SEND</Button>
                  </div>
              </div>

              {/* Margin Toolbar */}
              {showGrid && docSettings?.margins && (
                  <div className="bg-muted/30 border-b-2 border-black dark:border-zinc-800 p-2 px-6 flex items-center gap-6 animate-in slide-in-from-top-2 z-20 dark:bg-zinc-900">
                      <div className="flex items-center gap-2 border-r-2 border-black/20 dark:border-zinc-700 pr-4">
                          <Label className="text-xs font-bold font-mono text-muted-foreground flex items-center gap-1"><Grid size={12}/> SNAP</Label>
                          <Input className="w-16 h-8 text-xs font-mono border-black dark:border-zinc-600 focus:shadow-hypr-sm dark:bg-black" type="number" value={marginSnap} onChange={(e) => setMarginSnap(parseInt(e.target.value))} />
                          <span className="text-xs font-mono text-muted-foreground">PX</span>
                      </div>
                      
                      <div className="flex items-center gap-2 border-r-2 border-black/20 dark:border-zinc-700 pr-4">
                           <Label className="text-xs font-bold font-mono text-muted-foreground flex items-center gap-1"><LinkIcon size={12}/> MIRROR</Label>
                           <Switch checked={mirrorMargins} onCheckedChange={setMirrorMargins} />
                      </div>

                      <div className="flex items-center gap-3">
                          <span className="text-xs font-bold font-mono text-muted-foreground">DIMENSIONS:</span>
                          {(['top', 'bottom', 'left', 'right'] as const).map(side => (
                              <div key={side} className="flex items-center gap-1">
                                  <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">{side[0]}</span>
                                  <Input className="w-14 h-8 text-xs text-center font-mono border-black dark:border-zinc-600 focus:shadow-hypr-sm dark:bg-black" value={docSettings.margins![side]} onChange={(e) => handleManualMarginChange(side, e.target.value)} />
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              <div className="flex-1 overflow-y-auto p-8 relative bg-muted/10 bg-grid-pattern dark:bg-zinc-950" style={{ fontFamily: docSettings?.fontFamily }}>
                  
                  {/* Party Manager Modal */}
                  <Dialog open={showPartyManager} onOpenChange={onTogglePartyManager}>
                    <DialogContent className="max-w-2xl border-2 border-black dark:border-zinc-700 shadow-hypr rounded-none dark:bg-zinc-900">
                        <DialogHeader className="border-b-2 border-black/10 dark:border-zinc-800 pb-4 mb-4">
                            <DialogTitle className="font-mono font-black uppercase text-xl flex items-center gap-2 dark:text-white">
                                <Users size={24} /> Party Management
                            </DialogTitle>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                            {parties.map((p, i) => (
                                <div key={p.id} className="flex items-center gap-3 p-3 border-2 border-black/10 dark:border-zinc-800 hover:border-black/30 dark:hover:border-zinc-600 transition-colors bg-white dark:bg-black">
                                    <ColorPicker value={p.color} onChange={(c) => onUpdateParty(i, { ...p, color: c })} className="flex-shrink-0"/>
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">Role Name</span>
                                            <Input className="h-8 text-xs font-mono dark:bg-zinc-900 dark:border-zinc-700" value={p.name} onChange={(e) => onUpdateParty(i, { ...p, name: e.target.value })} />
                                        </div>
                                        <div className="flex flex-col gap-1">
                                             <span className="text-[10px] font-bold text-muted-foreground uppercase">Initials</span>
                                             <Input className="h-8 text-xs font-mono dark:bg-zinc-900 dark:border-zinc-700" value={p.initials} onChange={(e) => onUpdateParty(i, { ...p, initials: e.target.value })} />
                                        </div>
                                    </div>
                                    {parties.length > 1 && (
                                        <Button variant="ghost" size="icon" onClick={() => removeParty(p.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 size={16}/></Button>
                                    )}
                                </div>
                            ))}
                            <Button onClick={handleAddParty} className="w-full border-2 border-dashed border-black/20 dark:border-zinc-700 hover:border-primary hover:bg-primary/5 hover:text-primary gap-2 font-mono uppercase text-xs py-4 dark:text-zinc-400" variant="ghost">
                                <Plus size={16} /> Add New Party
                            </Button>
                        </div>
                    </DialogContent>
                  </Dialog>

                  <div 
                    ref={canvasRef}
                    className="max-w-4xl mx-auto bg-white dark:bg-black min-h-[1100px] border-2 border-black dark:border-zinc-800 shadow-hypr relative transition-all cursor-text group/page box-border"
                    style={{
                        paddingTop: docSettings?.margins?.top || 80,
                        paddingBottom: docSettings?.margins?.bottom || 80,
                        paddingLeft: docSettings?.margins?.left || 80,
                        paddingRight: docSettings?.margins?.right || 80,
                        cursor: draggingMargin ? (['top','bottom'].includes(draggingMargin) ? 'ns-resize' : 'ew-resize') : 'text'
                    }}
                    onClick={handleCanvasClick}
                  >
                        {/* Margins Render */}
                        {(showGrid || draggingMargin) && (
                            <>
                                <div className="absolute top-0 left-0 right-0 border-b-2 border-dashed border-primary bg-primary/5 hover:bg-primary/10 group/margin z-50" style={{ height: docSettings?.margins?.top || 80 }}>
                                     <div className="absolute bottom-[-6px] left-0 right-0 h-3 cursor-ns-resize flex justify-center items-center opacity-0 group-hover/margin:opacity-100 transition-opacity" onMouseDown={(e) => handleMarginMouseDown(e, 'top')}><div className="w-10 h-2 bg-primary border border-black"></div></div>
                                     {draggingMargin === 'top' && <div className="absolute top-2 left-2 bg-black text-white font-mono text-xs px-2 py-1">{dragValue ?? docSettings?.margins?.top}px</div>}
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 border-t-2 border-dashed border-primary bg-primary/5 hover:bg-primary/10 group/margin z-50" style={{ height: docSettings?.margins?.bottom || 80 }}>
                                    <div className="absolute top-[-6px] left-0 right-0 h-3 cursor-ns-resize flex justify-center items-center opacity-0 group-hover/margin:opacity-100 transition-opacity" onMouseDown={(e) => handleMarginMouseDown(e, 'bottom')}><div className="w-10 h-2 bg-primary border border-black"></div></div>
                                    {draggingMargin === 'bottom' && <div className="absolute bottom-2 left-2 bg-black text-white font-mono text-xs px-2 py-1">{dragValue ?? docSettings?.margins?.bottom}px</div>}
                                </div>
                                <div className="absolute top-0 bottom-0 left-0 border-r-2 border-dashed border-primary bg-primary/5 hover:bg-primary/10 group/margin z-50" style={{ width: docSettings?.margins?.left || 80 }}>
                                    <div className="absolute right-[-6px] top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center opacity-0 group-hover/margin:opacity-100 transition-opacity" onMouseDown={(e) => handleMarginMouseDown(e, 'left')}><div className="h-10 w-2 bg-primary border border-black"></div></div>
                                    {draggingMargin === 'left' && <div className="absolute top-2 left-2 bg-black text-white font-mono text-xs px-2 py-1">{dragValue ?? docSettings?.margins?.left}px</div>}
                                </div>
                                <div className="absolute top-0 bottom-0 right-0 border-l-2 border-dashed border-primary bg-primary/5 hover:bg-primary/10 group/margin z-50" style={{ width: docSettings?.margins?.right || 80 }}>
                                     <div className="absolute left-[-6px] top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center opacity-0 group-hover/margin:opacity-100 transition-opacity" onMouseDown={(e) => handleMarginMouseDown(e, 'right')}><div className="h-10 w-2 bg-primary border border-black"></div></div>
                                     {draggingMargin === 'right' && <div className="absolute top-2 right-2 bg-black text-white font-mono text-xs px-2 py-1">{dragValue ?? docSettings?.margins?.right}px</div>}
                                </div>
                            </>
                        )}

                        <div className="space-y-1 relative z-10 w-full min-h-[200px]" style={{ transformStyle: 'preserve-3d' }}>
                            {blocks.map((block, index) => (
                                <EditorBlock 
                                    key={block.id}
                                    index={index}
                                    block={block} 
                                    allBlocks={blocks} 
                                    parties={parties}
                                    formValues={{}} 
                                    isSelected={selectedBlockId === block.id}
                                    onSelect={onSelectBlock}
                                    onUpdate={onUpdateBlock}
                                    onDelete={onDeleteBlock}
                                    onDragStart={handleDragStartBlock}
                                    onDrop={handleDropBlockInternal}
                                />
                            ))}
                        </div>
                        {blocks.length === 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-30">
                                <div className="w-24 h-24 border-4 border-dashed border-black/50 dark:border-white/20 flex items-center justify-center mb-4 rounded-full">
                                    <FileText size={48} className="text-black/50 dark:text-white/50" />
                                </div>
                                <p className="font-mono text-sm uppercase tracking-widest dark:text-white">Drop Blocks Here</p>
                            </div>
                        )}
                  </div>
              </div>
        </div>
    )
};
