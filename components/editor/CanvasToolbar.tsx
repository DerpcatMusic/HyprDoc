import React, { useCallback } from 'react';
import { Button, cn } from '../ui-components';
import { FileText, Save, Cog, RotateCcw, RotateCw, Grid, Lock, Unlock, Magnet, Play, Users, ChevronDown } from 'lucide-react';
import { DocumentSettings } from '../../types';
import { PartiesList } from '../PartiesList';

interface CanvasToolbarProps {
    docTitle: string;
    docSettings?: DocumentSettings | undefined;
    parties: Array<{
        id: string;
        name: string;
        color: string;
        initials: string;
    }>;
    selectedBlockId: string | null;
    saveStatus: 'saved' | 'saving' | 'unsaved' | 'error';
    canUndo: boolean;
    canRedo: boolean;
    showMargins: boolean;
    mirrorMargins: boolean;
    snapSize: number;
    showDocSettings: boolean;
    showPartiesPopover: boolean;
    partiesButtonRef: React.RefObject<HTMLButtonElement | null>;
    onTitleChange: (title: string) => void;
    onSaveNow: () => void;
    onShowDocSettings: (show: boolean) => void;
    onUndo: () => void;
    onRedo: () => void;
    onToggleMargins: () => void;
    onToggleMirrorMargins: () => void;
    onSnapSizeChange: (size: number) => void;
    onTogglePartiesPopover: () => void;
    onAddParty: () => void;
    onRemoveParty: (id: string) => void;
    onUpdateParty: (index: number, party: { id: string; name: string; color: string; initials: string }) => void;
    onPreview: () => void;
}

/**
 * CanvasToolbar component - handles all toolbar-related functionality
 * Extracts toolbar concerns from the main EditorCanvas component
 */
export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
    docTitle,
    docSettings,
    parties,
    selectedBlockId,
    saveStatus,
    canUndo,
    canRedo,
    showMargins,
    mirrorMargins,
    snapSize,
    showDocSettings,
    showPartiesPopover,
    partiesButtonRef,
    onTitleChange,
    onSaveNow,
    onShowDocSettings,
    onUndo,
    onRedo,
    onToggleMargins,
    onToggleMirrorMargins,
    onSnapSizeChange,
    onTogglePartiesPopover,
    onAddParty,
    onRemoveParty,
    onUpdateParty,
    onPreview,
}) => {
    const handleSnapSizeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 1;
        onSnapSizeChange(value);
    }, [onSnapSizeChange]);

    return (
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
                            aria-label="Document title"
                        />
                    </div>
                </div>

                <div className="h-8 w-px bg-black/10 dark:bg-white/10" />

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2 gap-2 border-2 border-transparent hover:border-black"
                        onClick={onSaveNow}
                        title="Force Save"
                        aria-label="Save document"
                    >
                        <Save size={14} />
                        {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'unsaved' ? 'Unsaved' : 'Saved'}
                    </Button>
                    
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 border-2 border-transparent hover:border-black"
                        onClick={() => onShowDocSettings(true)}
                        title="Document Settings"
                        aria-label="Open document settings"
                    >
                        <Cog size={16} />
                    </Button>

                    <div className="h-4 w-px bg-black/10 dark:bg-white/10 mx-2" />

                    <button 
                        onClick={onUndo} 
                        disabled={!canUndo} 
                        className="h-8 w-8 flex items-center justify-center hover:bg-black hover:text-white disabled:opacity-30 transition-colors border-2 border-transparent hover:border-black dark:hover:border-white active:scale-95" 
                        title="Undo (Ctrl+Z)"
                        aria-label="Undo last action"
                    >
                        <RotateCcw size={16} />
                    </button>
                    <button 
                        onClick={onRedo} 
                        disabled={!canRedo} 
                        className="h-8 w-8 flex items-center justify-center hover:bg-black hover:text-white disabled:opacity-30 transition-colors border-2 border-transparent hover:border-black dark:hover:border-white active:scale-95" 
                        title="Redo (Ctrl+Y)"
                        aria-label="Redo last action"
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
                        onClick={onToggleMargins}
                        aria-pressed={showMargins}
                        aria-label="Toggle grid and margins view"
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
                                onClick={onToggleMirrorMargins}
                                aria-pressed={mirrorMargins}
                                aria-label="Toggle mirror margins"
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
                                    onChange={handleSnapSizeChange}
                                    min={1}
                                    max={50}
                                    aria-label="Snap size in pixels"
                                />
                                <span className="text-[9px] font-mono text-muted-foreground">px</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            <div className="flex items-center gap-4 relative">
                <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold uppercase text-muted-foreground mr-1 hidden lg:inline">Signers:</span>
                    <div className="flex items-center bg-muted/10 border border-black/10 rounded-sm pl-1 pr-1">
                        <div className="flex -space-x-1 mr-2">
                            {parties.map(party => (
                                <div 
                                    key={party.id} 
                                    className="w-6 h-6 border border-black flex items-center justify-center text-[9px] font-bold font-mono text-white shadow-sm" 
                                    style={{ backgroundColor: party.color }}
                                    title={party.name}
                                >
                                    {party.initials}
                                </div>
                            ))}
                        </div>
                        <button 
                            ref={partiesButtonRef}
                            onClick={onTogglePartiesPopover}
                            className={cn(
                                "h-6 px-1 flex items-center gap-1 hover:bg-black hover:text-white transition-colors text-[10px] font-bold uppercase",
                                showPartiesPopover ? "bg-black text-white" : ""
                            )}
                            aria-expanded={showPartiesPopover}
                            aria-haspopup="true"
                            aria-label="Manage parties"
                        >
                            <Users size={12} /> <ChevronDown size={10} />
                        </button>
                    </div>
                </div>

                {/* PARTIES POPOVER */}
                {showPartiesPopover && (
                    <div className="absolute top-full right-0 mt-2 z-50 parties-popover">
                        <PartiesList 
                            parties={parties} 
                            onUpdate={onUpdateParty} 
                            onAdd={onAddParty} 
                            onRemove={onRemoveParty}
                        />
                    </div>
                )}

                <div className="h-8 w-px bg-black/10 dark:bg-white/10" />

                <Button 
                    onClick={onPreview} 
                    size="sm" 
                    className="font-mono h-8 border-black shadow-sharp hover:shadow-sharp-hover bg-primary border-primary text-white"
                    aria-label="Preview document"
                >
                    <Play size={12} className="mr-2"/> PREVIEW
                </Button>
            </div>
        </div>
    );
};