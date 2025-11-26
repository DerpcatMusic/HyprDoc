
import React, { useState } from 'react';
import { Term } from '../types';
import { Button, Input, Textarea, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from './ui-components';
import { Trash2, Plus, Book, Search, Download, Filter } from 'lucide-react';
import { LEGAL_DICTIONARY_DB } from '../services/glossary';

interface GlossaryManagerProps {
    terms: Term[];
    onAddTerm: (term: Term) => void;
    onDeleteTerm: (id: string) => void;
    onClose: () => void;
}

export const GlossaryManager: React.FC<GlossaryManagerProps> = ({ terms, onAddTerm, onDeleteTerm, onClose }) => {
    const [newTerm, setNewTerm] = useState('');
    const [newDef, setNewDef] = useState('');
    const [filter, setFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('All');

    const handleAdd = () => {
        if (!newTerm || !newDef) return;
        onAddTerm({
            id: crypto.randomUUID(),
            term: newTerm,
            definition: newDef,
            source: 'user',
            color: '#6366f1' // default Indigo
        });
        setNewTerm('');
        setNewDef('');
    };

    // Dictionary Filtering
    const categories = ['All', ...Array.from(new Set(LEGAL_DICTIONARY_DB.map(t => t.category || 'General')))];
    const dictionaryTerms = LEGAL_DICTIONARY_DB.filter(t => {
        const matchesSearch = t.term.toLowerCase().includes(filter.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || (t.category || 'General') === categoryFilter;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="w-full h-full flex flex-col bg-background">
            <div className="p-4 border-b flex items-center justify-between dark:border-zinc-800">
                <h2 className="font-bold flex items-center gap-2"><Book size={18} /> Glossary</h2>
                <div className="text-xs text-muted-foreground">{terms.length} custom overrides</div>
            </div>

            <Tabs defaultValue="dictionary" className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 pt-2">
                    <TabsList>
                        <TabsTrigger value="dictionary">System Dictionary</TabsTrigger>
                        <TabsTrigger value="custom">My Custom Terms</TabsTrigger>
                    </TabsList>
                </div>

                {/* SYSTEM DICTIONARY TAB */}
                <TabsContent value="dictionary" className="flex-1 flex flex-col overflow-hidden mt-0">
                    <div className="p-4 pb-2 border-b bg-muted/5">
                        <div className="mb-3 text-xs text-muted-foreground">Universal terms automatically highlighted in your document.</div>
                        <div className="flex gap-2 mb-2">
                             <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search library..." 
                                    className="pl-8" 
                                    value={filter}
                                    onChange={e => setFilter(e.target.value)}
                                />
                            </div>
                             <select 
                                className="h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm dark:border-zinc-800"
                                value={categoryFilter}
                                onChange={e => setCategoryFilter(e.target.value)}
                             >
                                 {categories.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {dictionaryTerms.map((item, i) => {
                            const isOverridden = terms.some(t => t.term.toLowerCase() === item.term.toLowerCase());
                            return (
                                <div key={i} className="flex flex-col p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors dark:border-zinc-800">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-sm">{item.term}</span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-[9px] h-4 px-1 opacity-50">{item.category || 'General'}</Badge>
                                            {isOverridden && (
                                                <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200">Overridden</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2" title={item.definition}>{item.definition}</p>
                                </div>
                            );
                        })}
                        {dictionaryTerms.length === 0 && <p className="text-center text-xs text-muted-foreground py-4">No terms match your filter.</p>}
                    </div>
                </TabsContent>
                
                {/* CUSTOM TERMS TAB */}
                <TabsContent value="custom" className="flex-1 flex flex-col overflow-hidden mt-0">
                    <div className="p-4 border-b space-y-3 bg-muted/10 dark:border-zinc-800">
                        <h3 className="text-xs font-bold uppercase text-muted-foreground">Override / Add Definition</h3>
                        <Input 
                            placeholder="Term (e.g. 'The Product')" 
                            value={newTerm} 
                            onChange={e => setNewTerm(e.target.value)} 
                        />
                        <Textarea 
                            placeholder="Definition..." 
                            className="min-h-[60px]"
                            value={newDef} 
                            onChange={e => setNewDef(e.target.value)}
                        />
                        <Button size="sm" onClick={handleAdd} disabled={!newTerm || !newDef} className="w-full">
                            <Plus size={14} className="mr-2" /> Save Definition
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 pt-4">
                        {terms.length === 0 && (
                            <p className="text-center text-muted-foreground text-sm py-4">No custom overrides yet.</p>
                        )}
                        {terms.map(term => (
                            <div key={term.id} className="group p-3 border rounded-lg bg-card hover:shadow-sm transition-all dark:border-zinc-800">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-sm" style={{ color: term.color }}>{term.term}</span>
                                    <button onClick={() => onDeleteTerm(term.id)} className="text-muted-foreground hover:text-destructive">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">{term.definition}</p>
                            </div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};
