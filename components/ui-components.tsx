
// Re-export primitives
export * from './ui/primitives';

import React, { useRef, useEffect } from 'react';
import { cn, Input as PrimitiveInput } from './ui/primitives';
import { ChevronDown, Check, Search, Calendar as CalendarIcon, X, Command } from 'lucide-react';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-none border-2 border-black bg-card text-card-foreground shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100", className)} {...props} />
));
Card.displayName = "Card";

export const Switch = ({ checked, onCheckedChange, className, ...props }: { checked: boolean, onCheckedChange: (c: boolean) => void, className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
            "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
            checked ? "bg-primary" : "bg-zinc-300 dark:bg-zinc-700",
            className
        )}
        {...props}
    >
        <span
            className={cn(
                "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                checked ? "translate-x-4" : "translate-x-0"
            )}
        />
    </button>
);

export const ColorPicker = ({ value, onChange, className }: { value: string, onChange: (val: string) => void, className?: string }) => {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className="relative w-8 h-8 rounded-none overflow-hidden border-2 border-black dark:border-white shadow-sm">
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
                className="w-24 font-mono text-xs uppercase bg-white dark:bg-black text-black dark:text-white"
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
                className="flex h-9 w-full items-center justify-between rounded-none border-2 border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-white"
             >
                 <option value="" disabled>Select font...</option>
                 {fonts.map(f => (
                     <option key={f.value} value={f.value}>{f.label}</option>
                 ))}
             </select>
        </div>
    )
}

export const Combobox = ({ value, onChange, options = [], placeholder, className }: { value: string, onChange: (val: string) => void, options?: string[], placeholder?: string, className?: string }) => {
    return (
        <div className={cn("relative", className)}>
            <PrimitiveInput 
                list="combobox-options"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
            />
            <datalist id="combobox-options">
                {options.map((opt, i) => (
                    <option key={i} value={opt} />
                ))}
            </datalist>
        </div>
    )
}

// --- Slash Menu ---
interface SlashMenuProps {
    isOpen: boolean;
    onSelect: (action: string) => void;
    onClose: () => void;
    position?: { top: number, left: number };
}

export const SlashMenu = ({ isOpen, onSelect, onClose, position }: SlashMenuProps) => {
    const menuRef = useRef<HTMLDivElement>(null);

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

    const items = [
        { label: 'Heading 1', id: 'h1', icon: 'H1' },
        { label: 'Heading 2', id: 'h2', icon: 'H2' },
        { label: 'Text Block', id: 'text', icon: 'T' },
        { label: 'Input Field', id: 'input', icon: 'Input' },
        { label: 'Number Field', id: 'number', icon: '#' },
        { label: 'Signature', id: 'signature', icon: 'Sig' },
        { label: 'Date Picker', id: 'date', icon: 'Cal' },
        { label: 'Divider', id: 'section_break', icon: '—' },
    ];

    return (
        <div 
            ref={menuRef}
            className="absolute z-50 w-48 bg-zinc-900 text-white border border-zinc-700 shadow-2xl flex flex-col rounded-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={{ top: position?.top, left: position?.left }}
        >
            <div className="px-2 py-1.5 text-[10px] font-mono uppercase text-zinc-500 bg-black border-b border-zinc-800">
                Insert Block
            </div>
            {items.map(item => (
                <button
                    key={item.id}
                    onClick={() => onSelect(item.id)}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary hover:text-black transition-colors text-left font-mono"
                >
                    <span className="w-4 text-center opacity-50 font-bold text-xs">{item.icon}</span>
                    {item.label}
                </button>
            ))}
        </div>
    )
}


// --- Tabs (Context Based) ---
const TabsContext = React.createContext<{
  activeTab: string;
  setActiveTab: (v: string) => void;
} | null>(null);

export const Tabs = ({ children, defaultValue, className, onValueChange }: { children?: React.ReactNode, defaultValue: string, className?: string, onValueChange?: (value: string) => void }) => {
    const [activeTab, setActiveTab] = React.useState(defaultValue);
    
    const handleTabChange = (v: string) => {
        setActiveTab(v);
        onValueChange?.(v);
    }

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
            <div className={className} data-state={activeTab}>
                {children}
            </div>
        </TabsContext.Provider>
    )
}

export const TabsList = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-none bg-muted p-1 text-muted-foreground w-full justify-start dark:bg-zinc-900", className)}>
        {children}
    </div>
)

export const TabsTrigger = ({ value, children, className }: { value: string, children?: React.ReactNode, className?: string }) => {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error("TabsTrigger must be used within Tabs");
    const { activeTab, setActiveTab } = context;
    
    return (
        <button
            onClick={() => setActiveTab(value)}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-none px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-mono uppercase",
                activeTab === value ? "bg-background text-foreground shadow-sm border-b-2 border-primary dark:text-white" : "hover:bg-background/50 hover:text-foreground dark:text-zinc-400",
                className
            )}
            data-state={activeTab === value ? 'active' : 'inactive'}
        >
            {children}
        </button>
    )
}

export const TabsContent = ({ value, children, className }: { value: string, children?: React.ReactNode, className?: string }) => {
    const context = React.useContext(TabsContext);
    if (!context) throw new Error("TabsContent must be used within Tabs");
    if (context.activeTab !== value) return null;
    return <div className={cn("mt-4 animate-in fade-in-50 duration-300", className)}>{children}</div>;
}

export const DatePickerTrigger = ({ value, onChange, label }: { value: string, onChange: (val: string) => void, label?: string }) => {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="relative group cursor-pointer" onClick={() => inputRef.current?.showPicker()}>
            <input 
                ref={inputRef}
                type="date" 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer" 
            />
            <div className={cn(
                "flex h-9 w-full items-center justify-start rounded-none border-2 border-input bg-transparent px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:text-foreground font-mono group-hover:border-primary transition-colors bg-white dark:bg-zinc-900",
                !value && "text-muted-foreground"
            )}>
                <CalendarIcon className="mr-2 h-4 w-4 group-hover:text-primary" />
                {value ? value : <span>{label || "Pick a date"}</span>}
            </div>
        </div>
    )
}

// --- Tooltip ---
export const TooltipProvider = ({ children }: { children: React.ReactNode }) => <div className="relative">{children}</div>;

export const Tooltip = ({ children }: { children: React.ReactNode }) => <div className="relative inline-block">{children}</div>;

export const TooltipTrigger = ({ children, className, style, ...props }: { children: React.ReactNode, className?: string, style?: React.CSSProperties, [key:string]: any }) => (
    <span className={cn("cursor-help underline decoration-dotted underline-offset-4 decoration-primary/50", className)} style={style} {...props}>{children}</span>
);

export const TooltipContent = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-popover-foreground bg-popover border-2 border-black rounded-none shadow-hypr z-[1000] dark:border-zinc-700 font-mono dark:bg-zinc-900 dark:text-white", className)}>
        {children}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black dark:border-t-zinc-700"></div>
    </div>
);


// --- Dialog/Modal ---
export const Dialog = ({ open, onOpenChange, children, className }: { open: boolean, onOpenChange: (o: boolean) => void, children?: React.ReactNode, className?: string }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => onOpenChange(false)}>
            <div 
                className={cn("bg-background w-full max-w-lg rounded-none shadow-hypr-dark border-2 border-black dark:border-zinc-700 animate-in zoom-in-95 duration-200 relative dark:bg-zinc-900 dark:text-white", className)}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    )
}

export const DialogHeader = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left p-6 border-b border-black/10 dark:border-zinc-800", className)} {...props}>{children}</div>
)
export const DialogTitle = ({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn("text-lg font-semibold leading-none tracking-tight text-foreground dark:text-white", className)} {...props}>{children}</h3>
)
export const DialogContent = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("p-6", className)} {...props}>{children}</div>
)
export const DialogFooter = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 border-t border-black/10 dark:border-zinc-800 bg-muted/10 dark:bg-zinc-900/50", className)} {...props}>{children}</div>
)
