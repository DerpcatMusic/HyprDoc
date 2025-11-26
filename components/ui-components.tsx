
// Re-export primitives
export * from './ui/primitives';

// Inline simple layout components for now, or split further if needed.
// Keeping these here to avoid too many files in one go, but updated with better dark mode support.

import React from 'react';
import { cn, Input } from './ui/primitives';
import { ChevronDown, Check, Search, Calendar as CalendarIcon, X } from 'lucide-react';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm dark:border-zinc-800 dark:bg-zinc-950", className)} {...props} />
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
            checked ? "bg-primary" : "bg-input",
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

export const Combobox = ({ options, value, onChange, placeholder = "Select..." }: { options: { label: string; value: string }[], value: string, onChange: (val: string) => void, placeholder?: string }) => {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const wrapperRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filtered = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()) || opt.value.toLowerCase().includes(search.toLowerCase()));
    const selectedLabel = options.find(o => o.value === value)?.label;

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div 
                className={cn(
                    "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer dark:border-zinc-800 dark:text-foreground",
                    !value && "text-muted-foreground"
                )}
                onClick={() => setOpen(!open)}
            >
                <span className="truncate">{selectedLabel || placeholder}</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
            {open && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 dark:border-zinc-800 dark:bg-zinc-950">
                    <div className="flex items-center border-b px-3 dark:border-zinc-800">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 dark:text-foreground"
                            placeholder="Search..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="p-1">
                        {filtered.length === 0 && <div className="py-6 text-center text-sm text-muted-foreground">No matches found.</div>}
                        {filtered.map(opt => (
                            <div
                                key={opt.value}
                                className={cn(
                                    "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                                    value === opt.value && "bg-accent text-accent-foreground"
                                )}
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                    setSearch("");
                                }}
                            >
                                <Check className={cn("mr-2 h-4 w-4", value === opt.value ? "opacity-100" : "opacity-0")} />
                                {opt.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export const ColorPicker = ({ value, onChange }: { value: string, onChange: (color: string) => void }) => {
    return (
        <div className="flex gap-2">
             <div className="relative w-10 h-9 rounded-md border overflow-hidden shadow-sm dark:border-zinc-800">
                 <input 
                    type="color" 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute -top-1 -left-1 w-12 h-12 p-0 border-0 cursor-pointer"
                 />
             </div>
             <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="#000000" className="font-mono"/>
        </div>
    )
}

export const FontPicker = ({ value, onChange }: { value: string, onChange: (font: string) => void }) => {
    const fonts = [
        { name: 'Inter (Sans)', value: 'Inter, sans-serif' },
        { name: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
        { name: 'Serif (Classic)', value: 'serif' },
        { name: 'Arial (Standard)', value: 'Arial, sans-serif' },
        { name: 'Courier New', value: '"Courier New", monospace' },
    ];
    return (
        <div className="relative">
            <select
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-foreground"
                value={value || 'Inter, sans-serif'}
                onChange={(e) => onChange(e.target.value)}
            >
                {fonts.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-3 opacity-50" />
        </div>
    )
}

// --- Tabs (Context Based) ---
const TabsContext = React.createContext<{
  activeTab: string;
  setActiveTab: (v: string) => void;
} | null>(null);

export const Tabs = ({ children, defaultValue, className }: { children?: React.ReactNode, defaultValue: string, className?: string }) => {
    const [activeTab, setActiveTab] = React.useState(defaultValue);
    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={className} data-state={activeTab}>
                {children}
            </div>
        </TabsContext.Provider>
    )
}

export const TabsList = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full justify-start dark:bg-zinc-900", className)}>
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
                "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                activeTab === value ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50 hover:text-foreground",
                className
            )}
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
    return (
        <div className="relative">
            <input 
                type="date" 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer" 
            />
            <div className={cn(
                "flex h-9 w-full items-center justify-start rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm dark:border-zinc-800 dark:text-foreground",
                !value && "text-muted-foreground"
            )}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? value : <span>{label || "Pick a date"}</span>}
            </div>
        </div>
    )
}

// --- Tooltip ---
export const TooltipProvider = ({ children }: { children: React.ReactNode }) => <div className="relative group/tooltip-provider">{children}</div>;

export const Tooltip = ({ children }: { children: React.ReactNode }) => <div className="relative inline-block group">{children}</div>;

export const TooltipTrigger = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <span className={cn("cursor-help underline decoration-dotted underline-offset-4 decoration-primary/50", className)}>{children}</span>
);

export const TooltipContent = ({ children }: { children: React.ReactNode }) => (
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-popover-foreground bg-popover border rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-[1000] pointer-events-none dark:border-zinc-800">
        {children}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover dark:border-t-zinc-800"></div>
    </div>
);


// --- Dialog/Modal ---
export const Dialog = ({ open, onOpenChange, children, className }: { open: boolean, onOpenChange: (o: boolean) => void, children?: React.ReactNode, className?: string }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div 
                className={cn("bg-background w-full max-w-lg rounded-lg shadow-lg border dark:border-zinc-800 animate-in zoom-in-95 duration-200 relative", className)}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    )
}

export const DialogHeader = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left p-6 border-b dark:border-zinc-800", className)} {...props}>{children}</div>
)
export const DialogTitle = ({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)} {...props}>{children}</h3>
)
export const DialogContent = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("p-6", className)} {...props}>{children}</div>
)
export const DialogFooter = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 border-t dark:border-zinc-800 bg-muted/10", className)} {...props}>{children}</div>
)

// --- Sheet (Mobile Drawer) ---
export const Sheet = ({ children, open, onOpenChange, side = 'right' }: { children: React.ReactNode, open: boolean, onOpenChange: (o: boolean) => void, side?: 'left' | 'right' }) => {
    if (!open) return null;
    return (
        <div className={cn("fixed inset-0 z-50 flex", side === 'right' ? 'justify-end' : 'justify-start')}>
             <div className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => onOpenChange(false)} />
             <div className={cn(
                 "relative z-50 w-[85%] max-w-sm bg-background p-0 shadow-xl transition-all duration-300 border-l dark:border-zinc-800 flex flex-col h-full",
                 side === 'right' ? "animate-in slide-in-from-right" : "animate-in slide-in-from-left"
             )}>
                 <div className="p-4 border-b flex justify-between items-center bg-muted/5 dark:border-zinc-800">
                    <span className="font-semibold text-sm">Menu</span>
                    <button onClick={() => onOpenChange(false)} className="rounded-sm opacity-70 hover:opacity-100 p-1 hover:bg-muted"><X size={16} /></button>
                 </div>
                 <div className="flex-1 overflow-y-auto">{children}</div>
             </div>
        </div>
    )
}
