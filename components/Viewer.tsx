import React, { useState } from 'react';
import { BlockType, DocBlock, FormValues, Party } from '../types';
import { ChevronDown, Plus, Trash, Check, Calendar as CalendarIcon, Upload, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Button, Input, Card, Label, Switch, DatePickerTrigger, Textarea, cn } from './ui-components';
import { SignaturePad } from './SignaturePad';

interface ViewerProps {
  blocks: DocBlock[];
  parties?: Party[];
  isPreview?: boolean;
}

const PartyWrapper: React.FC<{ children: React.ReactNode; assignedTo?: Party }> = ({ children, assignedTo }) => {
    if (!assignedTo) return <div className="my-6">{children}</div>;
    return (
        <div className="my-6 relative pl-3 border-l-4 rounded-l-sm" style={{ borderLeftColor: assignedTo.color }}>
            {children}
            <div className="absolute -left-1 top-0 -translate-x-full pr-2 opacity-50 hover:opacity-100 transition-opacity">
                    <div 
                    className="text-[9px] font-bold uppercase tracking-widest text-right whitespace-nowrap"
                    style={{ color: assignedTo.color }}
                    >
                    {assignedTo.name}
                    </div>
            </div>
        </div>
    )
};

export const Viewer: React.FC<ViewerProps> = ({ blocks, parties = [], isPreview = false }) => {
  const [formValues, setFormValues] = useState<FormValues>({});

  const handleChange = (key: string, value: any) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const renderBlock = (block: DocBlock) => {
    // 1. Check Conditionals
    if (block.type === BlockType.CONDITIONAL && block.condition) {
      const parentValue = formValues[block.condition.variableName];
      // Simple strict equality check
      if (parentValue !== block.condition.equals) {
        return null;
      }
      return (
        <div key={block.id} className="my-6 pl-4 md:pl-6 border-l-2 border-primary/20 animate-in fade-in slide-in-from-top-2 duration-300">
           {block.children?.map(renderBlock)}
        </div>
      );
    }

    const value = formValues[block.variableName || ''] || '';
    const assignedTo = parties.find(p => p.id === block.assignedToPartyId);

    // 2. Render standard blocks
    switch (block.type) {
      case BlockType.TEXT:
        return (
          <div key={block.id} className="prose prose-neutral dark:prose-invert prose-sm md:prose-base max-w-none my-6 text-foreground">
            <ReactMarkdown>{block.content || ''}</ReactMarkdown>
          </div>
        );
        
      case BlockType.SECTION_BREAK:
        return (
            <div key={block.id} className="my-8 py-4 border-t border-border/60">
                {block.label && (
                    <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">{block.label}</h3>
                )}
            </div>
        )

      case BlockType.INPUT:
      case BlockType.EMAIL:
      case BlockType.NUMBER:
        return (
          <PartyWrapper key={block.id} assignedTo={assignedTo}>
            <div className="space-y-2">
                <Label>{block.label} {block.required && <span className="text-destructive">*</span>}</Label>
                <Input
                type={block.type === BlockType.NUMBER ? 'number' : block.type === BlockType.EMAIL ? 'email' : 'text'}
                placeholder={block.placeholder}
                value={value}
                onChange={(e) => handleChange(block.variableName || '', e.target.value)}
                />
            </div>
          </PartyWrapper>
        );

      case BlockType.LONG_TEXT:
          return (
            <PartyWrapper key={block.id} assignedTo={assignedTo}>
                <div className="space-y-2">
                    <Label>{block.label} {block.required && <span className="text-destructive">*</span>}</Label>
                    <Textarea 
                        placeholder={block.placeholder}
                        value={value}
                        onChange={(e) => handleChange(block.variableName || '', e.target.value)}
                    />
                </div>
            </PartyWrapper>
          );
        
      case BlockType.DATE:
         return (
          <PartyWrapper key={block.id} assignedTo={assignedTo}>
            <div className="space-y-2">
                <Label>{block.label}</Label>
                <DatePickerTrigger 
                    label={block.placeholder || "Pick a date"}
                    value={value}
                    onChange={(v) => handleChange(block.variableName || '', v)}
                />
            </div>
          </PartyWrapper>
        );

      case BlockType.SELECT:
        return (
          <PartyWrapper key={block.id} assignedTo={assignedTo}>
            <div className="space-y-2">
                <Label>{block.label}</Label>
                <div className="relative">
                <select
                    className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 appearance-none dark:bg-zinc-900/50 dark:border-zinc-700"
                    value={value}
                    onChange={(e) => handleChange(block.variableName || '', e.target.value)}
                >
                    <option value="">Select an option...</option>
                    {block.options?.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                    <ChevronDown size={14} />
                </div>
                </div>
            </div>
          </PartyWrapper>
        );

      case BlockType.RADIO:
        return (
            <PartyWrapper key={block.id} assignedTo={assignedTo}>
                <div className="space-y-3">
                    <Label>{block.label}</Label>
                    <div className="grid gap-2">
                        {block.options?.map(opt => (
                            <label key={opt} className={cn(
                                "flex items-center space-x-3 rounded-md border px-3 py-2 cursor-pointer transition-all hover:bg-muted/50 dark:hover:bg-zinc-800",
                                value === opt ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-input dark:border-zinc-700"
                            )}>
                                <input 
                                    type="radio" 
                                    name={block.variableName} 
                                    value={opt}
                                    checked={value === opt}
                                    onChange={(e) => handleChange(block.variableName || '', e.target.value)}
                                    className="h-4 w-4 border-primary text-primary shadow focus:ring-primary accent-primary"
                                />
                                <span className="text-sm font-medium">{opt}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </PartyWrapper>
        );
        
      case BlockType.CHECKBOX:
          return (
              <PartyWrapper key={block.id} assignedTo={assignedTo}>
                <div className="flex items-center space-x-3">
                    <Switch 
                        checked={!!value}
                        onCheckedChange={(c) => handleChange(block.variableName || '', c)}
                    />
                    <Label className="cursor-pointer" onClick={() => handleChange(block.variableName || '', !value)}>{block.label}</Label>
                </div>
              </PartyWrapper>
          );

      case BlockType.IMAGE:
          return (
              <div key={block.id} className="my-6">
                  {block.content ? (
                      <div className="rounded-lg overflow-hidden border bg-muted/20 dark:bg-zinc-900/50">
                          <img src={block.content} alt="Doc Asset" className="max-w-full h-auto mx-auto" />
                      </div>
                  ) : (
                       <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                           <Upload size={24} className="mb-2 opacity-50" />
                           <span className="text-xs">Image Placeholder</span>
                       </div>
                  )}
              </div>
          );

      case BlockType.REPEATER:
        const items = value || [];
        
        return (
            <PartyWrapper key={block.id} assignedTo={assignedTo}>
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm dark:border-zinc-800">
                    <div className="p-5 border-b bg-muted/10 dark:bg-zinc-900/50 dark:border-zinc-800">
                        <h4 className="text-sm font-bold uppercase tracking-wide">{block.label}</h4>
                    </div>
                    
                    <div className="p-5 space-y-4">
                        <div className="grid gap-2 border-b pb-2 mb-4 dark:border-zinc-800" 
                             style={{ gridTemplateColumns: `30px repeat(${block.repeaterFields?.length || 1}, 1fr) 40px` }}>
                            <div className="text-[10px] uppercase text-muted-foreground font-bold">#</div>
                            {block.repeaterFields?.map(f => (
                                <div key={f.id} className="text-[10px] uppercase text-muted-foreground font-bold">{f.label}</div>
                            ))}
                        </div>

                        {items.length === 0 && (
                        <div className="text-sm text-muted-foreground italic text-center py-6 bg-muted/20 rounded-md border border-dashed dark:border-zinc-800">
                            List is empty. Add a new item below.
                        </div>
                        )}
                        {items.map((item: any, index: number) => (
                            <div key={index} className="grid gap-2 items-center animate-in fade-in slide-in-from-left-2 relative group"
                            style={{ gridTemplateColumns: `30px repeat(${block.repeaterFields?.length || 1}, 1fr) 40px` }}>
                                <div className="text-xs font-mono text-muted-foreground">{index + 1}</div>
                                {block.repeaterFields?.map(field => (
                                    <div key={field.id}>
                                        <Input
                                            className="h-8 text-sm"
                                            value={item[field.variableName || ''] || ''}
                                            placeholder={field.label}
                                            onChange={(e) => {
                                                const newItems = [...items];
                                                newItems[index] = { ...newItems[index], [field.variableName || '']: e.target.value };
                                                handleChange(block.variableName || '', newItems);
                                            }}
                                        />
                                    </div>
                                ))}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        const newItems = items.filter((_: any, i: number) => i !== index);
                                        handleChange(block.variableName || '', newItems);
                                    }}
                                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                                >
                                    <Trash size={12} />
                                </Button>
                            </div>
                        ))}
                    
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                const newItems = [...items, {}];
                                handleChange(block.variableName || '', newItems);
                            }}
                            className="w-full border-dashed text-muted-foreground hover:text-foreground mt-4"
                        >
                            <Plus size={14} className="mr-2" /> Add {block.label ? `to ${block.label}` : 'Row'}
                        </Button>
                    </div>
                </div>
            </PartyWrapper>
        );

      case BlockType.SIGNATURE:
         return (
            <PartyWrapper key={block.id} assignedTo={assignedTo}>
                <div className="pt-6 border-t dark:border-zinc-800">
                    <Label className="text-base mb-4 block font-semibold">Signature Required</Label>
                    {value ? (
                        <div className="relative border-2 border-primary/20 bg-primary/5 rounded-lg p-6 flex flex-col items-center justify-center gap-3">
                            <img src={value} alt="Signature" className="h-24 object-contain mix-blend-multiply dark:mix-blend-normal dark:invert" />
                            <div className="flex items-center gap-2 text-primary font-medium text-xs uppercase tracking-widest">
                                <Check size={14} /> Signed Electronically
                            </div>
                            <Button variant="ghost" size="xs" onClick={() => handleChange(block.variableName || '', '')} className="absolute top-2 right-2 text-xs">
                                Clear
                            </Button>
                        </div>
                    ) : (
                        <SignaturePad onSign={(data) => handleChange(block.variableName || '', data)} />
                    )}
                </div>
            </PartyWrapper>
         )

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted/20 dark:bg-zinc-950 text-foreground font-sans selection:bg-primary/10">
         <div className="max-w-4xl mx-auto bg-card shadow-xl min-h-screen p-8 md:p-20 border-x border-border/50 dark:border-zinc-800">
            <div className="mb-16 space-y-4">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">{blocks.find(b => b.type === 'text')?.content?.split('\n')[0].replace('# ', '') || 'Document'}</h1>
                {parties.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                        {parties.map(p => (
                            <span key={p.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border dark:border-zinc-700">
                                <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }}></span>
                                {p.name}
                            </span>
                        ))}
                    </div>
                )}
                <div className="h-1 w-20 bg-primary/20 rounded-full"></div>
            </div>
            
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                {blocks.map(renderBlock)}
                
                {!isPreview && (
                    <div className="mt-20 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 dark:border-zinc-800">
                        <div className="text-xs text-muted-foreground">
                            By clicking "Finalize", you agree to the terms herein.
                        </div>
                        <Button 
                            size="lg"
                            className="w-full md:w-auto text-base px-10 h-12 shadow-lg shadow-primary/20"
                        >
                            Finalize Document
                        </Button>
                    </div>
                )}
            </form>
        </div>
    </div>
  );
};