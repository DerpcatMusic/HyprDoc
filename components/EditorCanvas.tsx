
import React from 'react';
import { DocBlock, Party, FormValues, BlockType, DocumentSettings } from '../types';
import { EditorBlock } from './EditorBlock';
import { Button, ColorPicker, Input } from './ui-components';
import { Play, Send, Users, X } from 'lucide-react';

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
    return (
        <div 
            className="flex-1 flex flex-col bg-muted/10 relative z-0 dark:bg-zinc-950/50" 
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDropBlock(e)}
        >
              <div className="h-16 bg-background border-b flex items-center justify-between px-6 shadow-sm dark:border-zinc-800">
                  <input 
                    value={docTitle} 
                    onChange={(e) => onTitleChange(e.target.value)}
                    className="text-lg font-bold bg-transparent outline-none w-auto"
                  />
                  <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => onTogglePartyManager(true)}><Users size={14} className="mr-2"/> Parties</Button>
                      <Button onClick={onPreview} size="sm"><Play size={14} className="mr-2"/> Preview</Button>
                      <Button onClick={onSend} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white"><Send size={14} className="mr-2"/> Send</Button>
                  </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12" style={{ fontFamily: docSettings?.fontFamily }}>
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

                  <div className="max-w-3xl mx-auto bg-background min-h-[850px] shadow-sm border rounded-xl p-12 transition-all dark:border-zinc-800">
                        <div className="space-y-1">
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
                        {blocks.length === 0 && <div className="text-center py-20 text-muted-foreground opacity-50">Drag blocks here from the toolbox</div>}
                  </div>
              </div>
        </div>
    )
};
