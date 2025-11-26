import React, { useState, useRef } from 'react';
import { DocBlock, Party, BlockType, DocumentSettings } from '../types';
import { EditorBlock } from './EditorBlock';
import { Button, Input, ColorPicker, Label, Switch } from './ui-components';
import { Play, Send, Users, X, Grid, GripHorizontal, GripVertical, Settings2, Link as LinkIcon, Lock } from 'lucide-react';
import { useDocument } from '../context/DocumentContext';

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
    onAddBlock: (type: BlockType, insertAfterId?: string) => void;
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
    const { updateSettings } = useDocument();
    const [showGrid, setShowGrid] = useState(false);
    const [marginSnap, setMarginSnap] = useState(10);
    const [mirrorMargins, setMirrorMargins] = useState(false);
    
    // Margin Drag State
    const [draggingMargin, setDraggingMargin] = useState<'top' | 'bottom' | 'left' | 'right' | null>(null);
    const [dragValue, setDragValue] = useState<number | null>(null);
    const canvasRef = useRef<HTMLDivElement>(null);

    const handleMarginMouseDown = (e: React.MouseEvent, type: 'top' | 'bottom' | 'left' | 'right') => {
        e.preventDefault();
        e.stopPropagation();
        setDraggingMargin(type);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!draggingMargin || !canvasRef.current || !docSettings?.margins) return;

        const rect = canvasRef.current.getBoundingClientRect();
        let rawVal = 0;
        
        // Limits
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

        // Snap to Pixel
        const snap = marginSnap > 0 ? marginSnap : 1;
        let val = Math.round(rawVal / snap) * snap;
        val = Math.max(MIN_MARGIN, Math.min(MAX_MARGIN, val));

        setDragValue(val);

        const newMargins = { ...docSettings.margins };
        newMargins[draggingMargin] = val;

        // Mirror Mode Logic
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

    // Click to Type Handler
    const handleCanvasClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onAddBlock(BlockType.TEXT);
        }
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

    return (
        <div 
            className="flex-1 flex flex-col bg-muted/10 relative z-0 dark:bg-zinc-950/50" 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDropBlock(e)}
            onMouseMove={draggingMargin ? handleMouseMove : undefined}
            onMouseUp={draggingMargin ? handleMouseUp : undefined}
            onMouseLeave={draggingMargin ? handleMouseUp : undefined}
        >
              <div className="h-16 bg-background border-b flex items-center justify-between px-6 shadow-sm dark:border-zinc-800 z-30">
                  <input 
                    value={docTitle} 
                    onChange={(e) => onTitleChange(e.target.value)}
                    className="text-lg font-bold bg-transparent outline-none w-auto dark:text-foreground"
                  />
                  <div className="flex items-center gap-2">
                      <Button variant={showGrid ? "secondary" : "ghost"} size="sm" onClick={() => setShowGrid(!showGrid)} title="Adjust Margins">
                          <Grid size={14} className="mr-2"/> Margins
                      </Button>
                      <div className="h-4 w-px bg-border mx-1"></div>
                      <Button variant="outline" size="sm" onClick={() => onTogglePartyManager(true)}><Users size={14} className="mr-2"/> Parties</Button>
                      <Button onClick={onPreview} size="sm"><Play size={14} className="mr-2"/> Preview</Button>
                      <Button onClick={onSend} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white"><Send size={14} className="mr-2"/> Send</Button>
                  </div>
              </div>

              {/* Margin Toolbar */}
              {showGrid && docSettings?.margins && (
                  <div className="bg-background border-b p-2 px-6 flex items-center gap-6 animate-in slide-in-from-top-2 shadow-sm z-20 dark:border-zinc-800">
                      <div className="flex items-center gap-2 border-r pr-4 dark:border-zinc-800">
                          <Label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1"><Grid size={12}/> Snap</Label>
                          <Input 
                            className="w-16 h-7 text-xs" 
                            type="number" 
                            value={marginSnap} 
                            onChange={(e) => setMarginSnap(parseInt(e.target.value))} 
                          />
                          <span className="text-xs text-muted-foreground">px</span>
                      </div>
                      
                      <div className="flex items-center gap-2 border-r pr-4 dark:border-zinc-800">
                           <Label className="text-xs font-semibold uppercase text-muted-foreground flex items-center gap-1"><LinkIcon size={12}/> Mirror All</Label>
                           <Switch checked={mirrorMargins} onCheckedChange={setMirrorMargins} />
                      </div>

                      <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-muted-foreground">Dimensions:</span>
                          {(['top', 'bottom', 'left', 'right'] as const).map(side => (
                              <div key={side} className="flex items-center gap-1">
                                  <span className="text-[10px] uppercase font-bold text-muted-foreground">{side[0]}</span>
                                  <Input 
                                    className="w-14 h-7 text-xs text-center" 
                                    value={docSettings.margins![side]} 
                                    onChange={(e) => handleManualMarginChange(side, e.target.value)}
                                  />
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              <div className="flex-1 overflow-y-auto p-8 relative" style={{ fontFamily: docSettings?.fontFamily }}>
                  {showPartyManager && (
                      <div className="mb-8 max-w-3xl mx-auto p-6 bg-background border rounded-lg shadow-sm">
                          <div className="flex justify-between mb-4"><h3 className="font-bold">Parties</h3><Button size="xs" variant="ghost" onClick={()=>onTogglePartyManager(false)}><X size={14}/></Button></div>
                          <div className="space-y-2">
                              {parties.map((p, i) => (
                                  <div key={p.id} className="flex items-center gap-3 p-2 bg-muted/20 rounded">
                                      <ColorPicker value={p.color} onChange={(c) => {
                                          const updated = { ...p, color: c };
                                          onUpdateParty(i, updated);
                                      }}/>
                                      <Input value={p.name} onChange={(e) => {
                                           const updated = { ...p, name: e.target.value };
                                           onUpdateParty(i, updated);
                                      }} />
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  <div 
                    ref={canvasRef}
                    className="max-w-4xl mx-auto bg-background min-h-[850px] shadow-sm border rounded-xl relative transition-all dark:border-zinc-800 cursor-text group/page box-border"
                    style={{
                        paddingTop: docSettings?.margins?.top || 80,
                        paddingBottom: docSettings?.margins?.bottom || 80,
                        paddingLeft: docSettings?.margins?.left || 80,
                        paddingRight: docSettings?.margins?.right || 80,
                        cursor: draggingMargin ? (['top','bottom'].includes(draggingMargin) ? 'ns-resize' : 'ew-resize') : 'text'
                    }}
                    onClick={handleCanvasClick}
                  >
                        {/* Margin Guidelines & Handles (Visible only when showGrid is true or dragging) */}
                        {(showGrid || draggingMargin) && (
                            <>
                                {/* Floating Bubble */}
                                {draggingMargin && dragValue !== null && (
                                    <div 
                                        className="fixed z-50 bg-black text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
                                        style={{ top: draggingMargin === 'top' ? (canvasRef.current?.getBoundingClientRect().top || 0) + dragValue : undefined }} 
                                        // Position is approximate via logic in mouseMove, but for simplicity we render a fixed badge here
                                    >
                                        <div className="fixed inset-0 pointer-events-none" style={{ left: '50%', top: '50%' }}>
                                             {/* Simplified: Just follow mouse in future iteration, for now show fixed badge in center of screen or near cursor */}
                                        </div>
                                    </div>
                                )}

                                {/* Top Margin */}
                                <div 
                                    className="absolute top-0 left-0 right-0 border-b border-dashed border-indigo-400/50 hover:bg-indigo-50/20 group/margin" 
                                    style={{ height: docSettings?.margins?.top || 80 }}
                                >
                                     <div 
                                        className="absolute bottom-[-5px] left-0 right-0 h-3 cursor-ns-resize flex justify-center items-center opacity-0 group-hover/margin:opacity-100 transition-opacity z-50"
                                        onMouseDown={(e) => handleMarginMouseDown(e, 'top')}
                                     >
                                         <div className="w-10 h-1 bg-indigo-500 rounded-full shadow-sm relative">
                                            {draggingMargin === 'top' && (
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded shadow font-mono">
                                                    {dragValue ?? docSettings?.margins?.top}px
                                                </div>
                                            )}
                                         </div>
                                     </div>
                                </div>

                                {/* Bottom Margin */}
                                <div 
                                    className="absolute bottom-0 left-0 right-0 border-t border-dashed border-indigo-400/50 hover:bg-indigo-50/20 group/margin" 
                                    style={{ height: docSettings?.margins?.bottom || 80 }} 
                                >
                                    <div 
                                        className="absolute top-[-5px] left-0 right-0 h-3 cursor-ns-resize flex justify-center items-center opacity-0 group-hover/margin:opacity-100 transition-opacity z-50"
                                        onMouseDown={(e) => handleMarginMouseDown(e, 'bottom')}
                                     >
                                         <div className="w-10 h-1 bg-indigo-500 rounded-full shadow-sm relative">
                                             {draggingMargin === 'bottom' && (
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded shadow font-mono">
                                                    {dragValue ?? docSettings?.margins?.bottom}px
                                                </div>
                                            )}
                                         </div>
                                     </div>
                                </div>

                                {/* Left Margin */}
                                <div 
                                    className="absolute top-0 bottom-0 left-0 border-r border-dashed border-indigo-400/50 hover:bg-indigo-50/20 group/margin" 
                                    style={{ width: docSettings?.margins?.left || 80 }} 
                                >
                                    <div 
                                        className="absolute right-[-5px] top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center opacity-0 group-hover/margin:opacity-100 transition-opacity z-50"
                                        onMouseDown={(e) => handleMarginMouseDown(e, 'left')}
                                     >
                                         <div className="h-10 w-1 bg-indigo-500 rounded-full shadow-sm relative">
                                             {draggingMargin === 'left' && (
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded shadow font-mono">
                                                    {dragValue ?? docSettings?.margins?.left}px
                                                </div>
                                            )}
                                         </div>
                                     </div>
                                </div>

                                {/* Right Margin */}
                                <div 
                                    className="absolute top-0 bottom-0 right-0 border-l border-dashed border-indigo-400/50 hover:bg-indigo-50/20 group/margin" 
                                    style={{ width: docSettings?.margins?.right || 80 }} 
                                >
                                     <div 
                                        className="absolute left-[-5px] top-0 bottom-0 w-3 cursor-ew-resize flex items-center justify-center opacity-0 group-hover/margin:opacity-100 transition-opacity z-50"
                                        onMouseDown={(e) => handleMarginMouseDown(e, 'right')}
                                     >
                                         <div className="h-10 w-1 bg-indigo-500 rounded-full shadow-sm relative">
                                             {draggingMargin === 'right' && (
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded shadow font-mono">
                                                    {dragValue ?? docSettings?.margins?.right}px
                                                </div>
                                            )}
                                         </div>
                                     </div>
                                </div>
                                
                                <div className="absolute top-2 right-2 text-[10px] text-indigo-500 font-mono bg-white/80 p-1 rounded border shadow-sm pointer-events-none">
                                    Drag edges to resize
                                </div>
                            </>
                        )}

                        <div className="space-y-1 relative z-10 w-full">
                            {blocks.map(block => (
                                <EditorBlock 
                                    key={block.id} 
                                    block={block} 
                                    allBlocks={blocks} 
                                    parties={parties}
                                    formValues={{}} 
                                    isSelected={selectedBlockId === block.id}
                                    onSelect={onSelectBlock}
                                    onUpdate={onUpdateBlock}
                                    onDelete={onDeleteBlock}
                                    onDragStart={() => {}}
                                    onDrop={onDropBlock}
                                    onInsertAfter={onAddBlock}
                                />
                            ))}
                        </div>
                        {blocks.length === 0 && <div className="text-center py-20 text-muted-foreground opacity-50">Click to start typing or drag blocks here</div>}
                  </div>
              </div>
        </div>
    )
};