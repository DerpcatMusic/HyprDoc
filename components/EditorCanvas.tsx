import React, { useState, useRef } from 'react';
import { DocBlock, Party, BlockType, DocumentSettings } from '../types';
import { EditorBlock } from './EditorBlock';
import { Button, Input, ColorPicker, Label, Switch, Dialog, DialogContent, DialogHeader, DialogTitle } from './ui-components';
import { Send, Users, Grid, FileText, Link as LinkIcon, Plus, Trash2, Play } from 'lucide-react';
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
    onAddBlock: (type: BlockType) => void;
    onDropBlock: (e: React.DragEvent, targetId?: string) => void;
    onUpdateParty: (index: number, p: Party) => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({
    docTitle, docSettings, blocks, parties, selectedBlockId, showPartyManager,
    onTitleChange, onTogglePartyManager, onPreview, onSend, onSelectBlock,
    onUpdateBlock, onDeleteBlock, onAddBlock, onDropBlock, onUpdateParty
}) => {
    const { updateSettings, moveBlock, createColumnLayout, addParty, removeParty, addBlock } = useDocument();
    const [showGrid, setShowGrid] = useState(false);
    
    // Ghost Drag Image Helper
    const handleDragStartBlock = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData('application/hyprdoc-block-id', id);
        e.dataTransfer.effectAllowed = 'move';
        const ghost = document.createElement('div');
        ghost.style.opacity = '0';
        document.body.appendChild(ghost);
        e.dataTransfer.setDragImage(ghost, 0, 0);
        setTimeout(() => document.body.removeChild(ghost), 0);
    };

    // Main Canvas Drop Handler
    const handleDropInternal = (e: React.DragEvent) => {
        e.preventDefault();
        // If dropping on canvas background (not on a block), append to end
        const newType = e.dataTransfer.getData('application/hyprdoc-new') as BlockType;
        const existingId = e.dataTransfer.getData('application/hyprdoc-block-id');

        if (newType) addBlock(newType);
        else if (existingId) moveBlock(existingId, blocks[blocks.length-1]?.id, 'after'); // Move to end
    };

    const handleBlockDrop = (e: React.DragEvent, targetId: string, position: any) => {
        e.preventDefault(); e.stopPropagation();
        const newType = e.dataTransfer.getData('application/hyprdoc-new') as BlockType;
        const existingId = e.dataTransfer.getData('application/hyprdoc-block-id');

        if (position === 'left' || position === 'right') {
            createColumnLayout(targetId, newType || existingId, position);
        } else {
            if (newType) addBlock(newType, targetId, position);
            else if (existingId) moveBlock(existingId, targetId, position);
        }
    };

    return (
        <div 
            className="flex-1 flex flex-col bg-background relative z-0 h-full overflow-hidden" 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropInternal}
        >
             {/* Header */}
              <div className="h-16 flex-shrink-0 bg-background border-b-2 border-black dark:border-zinc-800 flex items-center justify-between px-6 z-30 shadow-sm dark:bg-zinc-950">
                  <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-primary border-2 border-black dark:border-zinc-700 flex items-center justify-center">
                        <FileText size={16} className="text-white" />
                      </div>
                      <input 
                        value={docTitle} 
                        onChange={(e) => onTitleChange(e.target.value)}
                        className="text-lg font-bold bg-transparent outline-none w-auto font-mono tracking-tight uppercase placeholder:text-muted-foreground/50 focus:underline decoration-2 decoration-primary underline-offset-4 text-foreground"
                      />
                  </div>
                  <div className="flex items-center gap-2">
                      <Button variant={showGrid ? "secondary" : "ghost"} size="sm" onClick={() => setShowGrid(!showGrid)} className="font-mono"><Grid size={14} className="mr-2"/> MARGINS</Button>
                      <Button variant="outline" size="sm" onClick={() => onTogglePartyManager(true)} className="font-mono"><Users size={14} className="mr-2"/> PARTIES</Button>
                      <Button onClick={onPreview} size="sm" variant="outline" className="font-mono"><Play size={14} className="mr-2"/> PREVIEW</Button>
                  </div>
              </div>

              {/* Canvas Area */}
              <div className="flex-1 overflow-y-auto p-8 relative bg-muted/10 bg-grid-pattern dark:bg-zinc-950" style={{ fontFamily: docSettings?.fontFamily }}>
                  <div 
                    className="max-w-4xl mx-auto bg-white dark:bg-black min-h-[1100px] border-2 border-black dark:border-zinc-800 shadow-hypr relative transition-all"
                    style={{
                        paddingTop: docSettings?.margins?.top || 80,
                        paddingBottom: docSettings?.margins?.bottom || 80,
                        paddingLeft: docSettings?.margins?.left || 80,
                        paddingRight: docSettings?.margins?.right || 80,
                    }}
                    onClick={(e) => { if(e.target === e.currentTarget) onAddBlock(BlockType.TEXT); }}
                  >
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
                                onDrop={handleBlockDrop}
                            />
                        ))}
                        {blocks.length === 0 && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-30">
                                <p className="font-mono text-sm uppercase tracking-widest">Click to start typing</p>
                            </div>
                        )}
                  </div>
              </div>

              {/* Party Manager Dialog (Keep existing) */}
              <Dialog open={showPartyManager} onOpenChange={onTogglePartyManager}>
                    <DialogContent className="max-w-xl border-2 border-black dark:border-zinc-700 shadow-hypr rounded-none dark:bg-zinc-900">
                        <DialogHeader>
                            <DialogTitle className="font-mono font-black uppercase">Party Management</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {parties.map((p, i) => (
                                <div key={p.id} className="flex items-center gap-3 p-3 border-2 border-black/10 dark:border-zinc-800 bg-white dark:bg-black">
                                    <ColorPicker value={p.color} onChange={(c) => onUpdateParty(i, { ...p, color: c })} />
                                    <Input className="h-8 text-xs font-mono" value={p.name} onChange={(e) => onUpdateParty(i, { ...p, name: e.target.value })} />
                                    {parties.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeParty(p.id)}><Trash2 size={16}/></Button>}
                                </div>
                            ))}
                            <Button onClick={() => addParty({ id: crypto.randomUUID(), name: 'New Party', color: '#000000', initials: 'NP' })} className="w-full border-2 border-dashed" variant="ghost">Add Party</Button>
                        </div>
                    </DialogContent>
              </Dialog>
        </div>
    )
};
