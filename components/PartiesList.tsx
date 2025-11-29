
import React from 'react';
import { Party } from '../types';
import { Input, Button } from './ui-components';
import { Trash2, Plus, User, Mail, ShieldCheck, Palette } from 'lucide-react';

interface PartiesListProps {
    parties: Party[];
    onUpdate: (index: number, party: Party) => void;
    onAdd: () => void;
    onRemove: (id: string) => void;
}

export const PartiesList: React.FC<PartiesListProps> = ({ parties, onUpdate, onAdd, onRemove }) => {
    return (
        <div className="flex flex-col w-[360px] bg-white dark:bg-zinc-900 border-2 border-black dark:border-white shadow-sharp p-6 animate-in fade-in zoom-in-95 duration-100 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-black/10 dark:border-white/10 shrink-0">
                <h3 className="text-sm font-black font-mono uppercase tracking-widest flex items-center gap-2">
                    <User size={16} /> Signing Parties
                </h3>
                <span className="text-[10px] bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 font-bold font-mono">
                    {parties.length}
                </span>
            </div>

            <div className="space-y-4 overflow-y-auto pr-2 pb-2 flex-1 scrollbar-hide">
                {parties.map((party, index) => (
                    <div key={party.id} className="group relative border-2 border-black/10 dark:border-white/10 p-4 hover:border-black dark:hover:border-white transition-all bg-muted/5 hover:bg-white dark:hover:bg-black hover:shadow-sharp-sm">
                        
                        {/* Header Row: Color & Name */}
                        <div className="flex gap-3 mb-3">
                            <div className="relative shrink-0 group/picker">
                                <label htmlFor={`color-${party.id}`} className="sr-only">Party Color</label>
                                <div 
                                    className="w-10 h-10 border-2 border-black dark:border-white shadow-sm cursor-pointer hover:scale-105 transition-transform flex items-center justify-center"
                                    style={{ backgroundColor: party.color }}
                                >
                                    <Palette size={14} className="text-white drop-shadow-md opacity-0 group-hover/picker:opacity-100 transition-opacity" />
                                </div>
                                <input 
                                    id={`color-${party.id}`}
                                    type="color" 
                                    value={party.color} 
                                    onChange={(e) => onUpdate(index, { ...party, color: e.target.value })} 
                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                            </div>
                            
                            <div className="flex-1 space-y-1">
                                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Party Name</label>
                                <Input 
                                    className="h-8 text-sm font-bold border-black/20 focus:border-black bg-white dark:bg-black"
                                    value={party.name}
                                    onChange={(e) => onUpdate(index, { ...party, name: e.target.value })}
                                    placeholder="e.g. Client"
                                />
                            </div>
                        </div>

                        {/* Details Row: Email & Initials */}
                        <div className="flex gap-3">
                             <div className="flex-1 space-y-1">
                                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                    <Mail size={10} /> Email
                                </label>
                                <Input 
                                    className="h-8 text-xs border-black/20 focus:border-black bg-white dark:bg-black"
                                    value={party.email || ''}
                                    onChange={(e) => onUpdate(index, { ...party, email: e.target.value })}
                                    placeholder="signer@email.com"
                                />
                             </div>
                              <div className="w-16 space-y-1">
                                <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground text-center block">Initials</label>
                                <Input 
                                    className="h-8 text-xs text-center border-black/20 focus:border-black font-bold uppercase bg-white dark:bg-black"
                                    value={party.initials}
                                    onChange={(e) => onUpdate(index, { ...party, initials: e.target.value.substring(0,2).toUpperCase() })}
                                    placeholder="XX"
                                    maxLength={2}
                                />
                             </div>
                        </div>
                        
                        {/* Actions */}
                        {index > 0 && (
                            <button 
                                onClick={() => onRemove(party.id)}
                                className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-zinc-800 border-2 border-black dark:border-white flex items-center justify-center text-muted-foreground hover:text-red-600 hover:border-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                                title="Remove Party"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                        {index === 0 && (
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/10 text-[9px] font-bold uppercase text-muted-foreground flex items-center gap-1">
                                <ShieldCheck size={10} /> Owner
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="pt-4 mt-2 border-t-2 border-black/10 dark:border-white/10 shrink-0">
                <Button onClick={onAdd} className="w-full gap-2 border-2 border-dashed border-black/30 hover:border-black bg-transparent text-foreground hover:bg-black/5 shadow-none">
                    <Plus size={16} /> Add New Signer
                </Button>
            </div>
        </div>
    );
};
