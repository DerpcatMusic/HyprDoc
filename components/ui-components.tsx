
// Re-export primitives
export * from './ui/primitives';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { cn, Input as PrimitiveInput } from './ui/primitives';
import { 
    Type, AlignLeft, Minus, Image as ImageIcon,
    Settings, List, CheckSquare, Calendar, FileSignature, 
    Hash, Mail, CircleDot, UploadCloud, FileText,
    Calculator, CreditCard, Video, DollarSign, Box, Columns, Repeat,
    LayoutTemplate, Link as LinkIcon, PanelLeft, Plus, MoveVertical, AlertTriangle, Quote,
    Heading1, Heading2, ListOrdered, Bold, Italic, Strikethrough
} from 'lucide-react';
import { BlockType } from '../types';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-none border-2 border-black bg-card text-card-foreground shadow-sharp dark:border-white dark:shadow-sharp-dark dark:bg-black", className)} {...props} />
));
Card.displayName = "Card";

export const Switch = ({ checked, onCheckedChange, className, ...props }: { checked: boolean, onCheckedChange: (c: boolean) => void, className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
            "peer inline-flex h-6 w-10 shrink-0 cursor-pointer items-center border-2 border-black transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 rounded-none dark:border-white",
            checked ? "bg-primary" : "bg-transparent",
            className
        )}
        {...props}
    >
        <span
            className={cn(
                "pointer-events-none block h-4 w-4 bg-black dark:bg-white shadow-none ring-0 transition-transform rounded-none border border-transparent",
                checked ? "translate-x-4 bg-white dark:bg-black" : "translate-x-0.5"
            )}
        />
    </button>
);

// --- Toggle ---
export const Toggle = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { pressed?: boolean }>(
  ({ className, pressed, ...props }, ref) => (
    <button
      ref={ref}
      aria-pressed={pressed}
      className={cn(
        "inline-flex items-center justify-center rounded-none text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 h-8 w-8 p-0",
        pressed ? "bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90" : "bg-transparent",
        className
      )}
      {...props}
    />
  )
);
Toggle.displayName = "Toggle";

// --- Popover ---
export const Popover = ({ trigger, content, open, onOpenChange }: { trigger: React.ReactNode, content: React.ReactNode, open: boolean, onOpenChange: (o: boolean) => void }) => {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                onOpenChange(false);
            }
        };
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, onOpenChange]);

    return (
        <div className="relative inline-block" ref={ref}>
            <div onClick={() => onOpenChange(!open)}>{trigger}</div>
            {open && (
                <div className="absolute top-full left-0 z-50 mt-2 w-max bg-white dark:bg-black border-2 border-black dark:border-white shadow-sharp p-2 animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                    {content}
                </div>
            )}
        </div>
    );
};

export const getContrastColor = (hexcolor: string) => {
    // If invalid hex, default to black
    if (!hexcolor || hexcolor.length < 4) return '#000000';
    
    // Normalize hex
    const hex = hexcolor.replace('#', '');
    const r = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.substring(0, 2), 16);
    const g = parseInt(hex.length === 3 ? hex[1] + hex[1] : hex.substring(2, 4), 16);
    const b = parseInt(hex.length === 3 ? hex[2] + hex[2] : hex.substring(4, 6), 16);
    
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? '#000000' : '#ffffff';
};


export const ColorPicker = ({ value, onChange, className }: { value: string, onChange: (val: string) => void, className?: string }) => {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="relative w-8 h-8 overflow-hidden border-2 border-black dark:border-white shadow-sharp-sm">
                <input 
                    type="color" 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer p-0 border-0 opacity-0" 
                />
                 <div className="w-full h-full" style={{ backgroundColor: value }} />
            </div>
            <PrimitiveInput 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                className="w-24 font-mono text-xs uppercase bg-white dark:bg-black text-black dark:text-white border-b-2 border-black dark:border-white h-8"
                maxLength={7}
            />
        </div>
    );
};

export const FontPicker = ({ value, onChange, className }: { value: string, onChange: (val: string) => void, className?: string }) => {
    const fonts = [
        { label: 'Inter (Default)', value: 'Inter, sans-serif' },
        { label: 'Serif', value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
        { label: 'Mono', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' },
        { label: 'Comic Sans', value: '"Comic Sans MS", "Comic Sans", cursive' },
    ];

    return (
        <div className={cn("relative", className)}>
             <select 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                className="flex h-9 w-full items-center justify-between rounded-none border-2 border-input bg-transparent px-3 py-2 text-sm shadow-none ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:bg-black dark:text-white"
             >
                 <option value="" disabled>Select font...</option>
                 {fonts.map(f => (
                     <option key={f.value} value={f.value}>{f.label}</option>
                 ))}
             </select>
        </div>
    )
}

// --- Centralized Block Metadata ---

export const BLOCK_META = [
    { type: BlockType.TEXT, label: 'Text', icon: Type, keywords: 'paragraph p writing words' },
    { type: BlockType.INPUT, label: 'Input Field', icon: FileText, keywords: 'form text field entry input' },
    { type: BlockType.LONG_TEXT, label: 'Long Text', icon: AlignLeft, keywords: 'textarea paragraph long description multiline' },
    { type: BlockType.NUMBER, label: 'Number', icon: Hash, keywords: 'count quantity math amount integer float' },
    { type: BlockType.EMAIL, label: 'Email', icon: Mail, keywords: 'contact address mail' },
    { type: BlockType.DATE, label: 'Date', icon: Calendar, keywords: 'calendar time schedule picker range' },
    { type: BlockType.CHECKBOX, label: 'Checkbox', icon: CheckSquare, keywords: 'tick multi select option bool check' },
    { type: BlockType.RADIO, label: 'Single Choice', icon: CircleDot, keywords: 'radio option select single choice' },
    { type: BlockType.SELECT, label: 'Dropdown', icon: List, keywords: 'select menu list options dropdown' },
    { type: BlockType.SIGNATURE, label: 'Signature', icon: FileSignature, keywords: 'sign draw autograph contract legal' },
    { type: BlockType.IMAGE, label: 'Image', icon: ImageIcon, keywords: 'picture photo upload media png jpg' },
    { type: BlockType.VIDEO, label: 'Video', icon: Video, keywords: 'movie embed youtube media play' },
    { type: BlockType.FILE_UPLOAD, label: 'File Upload', icon: UploadCloud, keywords: 'attachment document pdf file' },
    
    // Layout & Design
    { type: BlockType.SECTION_BREAK, label: 'Divider', icon: Minus, keywords: 'line break separator hr split' },
    { type: BlockType.COLUMNS, label: 'Columns', icon: Columns, keywords: 'layout grid split side by side' },
    { type: BlockType.SPACER, label: 'Spacer', icon: MoveVertical, keywords: 'gap whitespace empty' },
    { type: BlockType.ALERT, label: 'Alert Box', icon: AlertTriangle, keywords: 'callout info warning error success note' },
    { type: BlockType.QUOTE, label: 'Blockquote', icon: Quote, keywords: 'citation quote emphasis' },

    // Logic
    { type: BlockType.REPEATER, label: 'Repeater', icon: Repeat, keywords: 'loop list array collection group repeat' },
    { type: BlockType.CONDITIONAL, label: 'Conditional', icon: Settings, keywords: 'logic if else branch rules condition' },
    { type: BlockType.FORMULA, label: 'Formula', icon: Calculator, keywords: 'math calculate expression sum' },
    { type: BlockType.CURRENCY, label: 'Currency', icon: DollarSign, keywords: 'money exchange rate usd eur cash' },
    { type: BlockType.PAYMENT, label: 'Payment', icon: CreditCard, keywords: 'charge stripe money buy checkout' },
    
    // Tiptap Commands (Shortcuts)
    { type: 'h1', label: 'Heading 1', icon: Heading1, keywords: 'h1 title header' },
    { type: 'h2', label: 'Heading 2', icon: Heading2, keywords: 'h2 subtitle' },
    { type: 'bulletList', label: 'Bullet List', icon: List, keywords: 'ul list bullets' },
];

// --- Slash Menu ---
interface SlashMenuProps {
    isOpen: boolean;
    filter?: string;
    onSelect: (action: string) => void;
    onClose: () => void;
    position?: { top: number, left: number };
    selectedIndex?: number;
}

export const SlashMenu = ({ isOpen, filter = '', onSelect, onClose, position, selectedIndex = 0 }: SlashMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);

    // Filter blocks based on user input
    const filteredItems = useMemo(() => {
        const query = filter.toLowerCase();
        if (!query) return BLOCK_META;
        return BLOCK_META.filter(b => 
            b.label.toLowerCase().includes(query) || 
            b.keywords.toLowerCase().includes(query)
        );
    }, [filter]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    if (filteredItems.length === 0) {
        return (
             <div 
                ref={menuRef}
                className="fixed z-[9999] w-56 bg-white dark:bg-black text-foreground border-2 border-black dark:border-white shadow-sharp flex flex-col rounded-none overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                style={{ top: position?.top, left: position?.left }}
            >
                <div className="px-3 py-2 text-xs text-muted-foreground italic font-mono">No blocks match '{filter}'</div>
            </div>
        )
    }

    return (
        <div 
            ref={menuRef}
            className="fixed z-[9999] w-64 bg-white dark:bg-black text-foreground border-2 border-black dark:border-white shadow-sharp flex flex-col rounded-none overflow-hidden max-h-[300px] overflow-y-auto animate-in fade-in zoom-in-95 duration-100"
            style={{ top: position?.top, left: position?.left }}
        >
            <div className="px-3 py-2 text-[10px] font-black font-mono uppercase bg-black text-white dark:bg-white dark:text-black sticky top-0 z-10">
                {filter ? `Filtering: "${filter}"` : 'Basic Blocks'}
            </div>
            {filteredItems.map((item, index) => (
                <button
                    key={item.type}
                    onClick={() => onSelect(item.type)}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm text-left font-mono transition-colors border-b border-muted last:border-0",
                        selectedIndex === index ? "bg-primary text-white" : "hover:bg-muted"
                    )}
                >
                    <span className={cn(
                        "w-6 h-6 flex items-center justify-center opacity-70 font-bold text-xs border border-current p-0.5 rounded-sm",
                        selectedIndex === index ? "border-white" : "border-black/20 dark:border-white/20"
                    )}>
                        <item.icon size={14} />
                    </span>
                    <div className="flex flex-col">
                        <span className="leading-none">{item.label}</span>
                    </div>
                </button>
            ))}
        </div>
    );
};

// --- Tabs Component ---
const TabsContext = React.createContext<{ activeTab: string; setActiveTab: (v: string) => void } | null>(null);

export const Tabs = ({ defaultValue, onValueChange, className, children }: { defaultValue: string, onValueChange?: (v: string) => void, className?: string, children?: React.ReactNode }) => {
    const [activeTab, setActiveTab] = React.useState(defaultValue);
    const handleTabChange = (v: string) => {
        setActiveTab(v);
        if (onValueChange) onValueChange(v);
    };
    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
            <div className={cn("w-full", className)}>{children}</div>
        </TabsContext.Provider>
    );
};

export const TabsList = ({ className, children }: { className?: string, children?: React.ReactNode }) => (
    <div className={cn("flex items-center border-b border-black dark:border-white overflow-x-auto", className)}>
        {children}
    </div>
);

export const TabsTrigger = ({ value, className, children }: { value: string, className?: string, children?: React.ReactNode }) => {
    const ctx = React.useContext(TabsContext);
    if (!ctx) throw new Error("TabsTrigger must be used within Tabs");
    const isActive = ctx.activeTab === value;
    return (
        <button
            onClick={() => ctx.setActiveTab(value)}
            className={cn(
                "px-4 py-2 text-xs font-bold font-mono uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap -mb-[2px]",
                isActive ? "border-primary text-primary bg-primary/5" : "border-transparent text-muted-foreground hover:text-foreground",
                className
            )}
        >
            {children}
        </button>
    );
};

export const TabsContent = ({ value, className, children }: { value: string, className?: string, children?: React.ReactNode }) => {
    const ctx = React.useContext(TabsContext);
    if (!ctx) throw new Error("TabsContent must be used within Tabs");
    if (ctx.activeTab !== value) return null;
    return (
        <div className={cn("mt-4 animate-in fade-in duration-200", className)}>
            {children}
        </div>
    );
};

// --- Dialog Component (NATIVE HTML5) ---

export const Dialog = ({ open, onOpenChange, children }: { open: boolean, onOpenChange: (open: boolean) => void, children?: React.ReactNode }) => {
    const ref = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        if (open) {
            ref.current?.showModal();
        } else {
            ref.current?.close();
        }
    }, [open]);

    const handleClose = () => {
        onOpenChange(false);
    };

    const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
        if (e.target === ref.current) {
            handleClose();
        }
    };

    return (
        <dialog
            ref={ref}
            onClose={handleClose}
            onClick={handleBackdropClick}
            className="backdrop:bg-black/50 backdrop:backdrop-blur-sm bg-transparent p-0 m-auto shadow-none outline-none open:animate-in open:fade-in open:zoom-in-95 duration-200"
        >
            <div className="relative z-50">
                {children}
            </div>
        </dialog>
    );
};

export const DialogContent = ({ className, children }: { className?: string, children?: React.ReactNode }) => (
    <div className={cn("bg-white dark:bg-zinc-950 border-2 border-black dark:border-white shadow-sharp p-6 w-full max-w-lg relative", className)}>
        {children}
    </div>
);

export const DialogHeader = ({ className, children }: { className?: string, children?: React.ReactNode }) => (
    <div className={cn("mb-4 space-y-1.5 text-center sm:text-left", className)}>
        {children}
    </div>
);

export const DialogTitle = ({ className, children }: { className?: string, children?: React.ReactNode }) => (
    <h2 className={cn("text-lg font-bold leading-none tracking-tight font-mono uppercase", className)}>
        {children}
    </h2>
);

export const DialogFooter = ({ className, children }: { className?: string, children?: React.ReactNode }) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6", className)}>
        {children}
    </div>
);