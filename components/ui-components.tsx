
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Calendar as CalendarIcon, X, Check, ChevronDown } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Button ---
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'xs' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm",
      outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground dark:border-zinc-700",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    };
    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      xs: "h-7 rounded px-2 text-[10px]",
      lg: "h-10 rounded-md px-8",
      icon: "h-9 w-9",
    };
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

// --- Input ---
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900/50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// --- Textarea ---
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => {
      return (
        <textarea
          className={cn(
            "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus:outline-none focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900/50",
            className
          )}
          ref={ref}
          {...props}
        />
      )
    }
  )
Textarea.displayName = "Textarea"

// --- Date Picker (Simulated Shadcn) ---
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
                "flex h-9 w-full items-center justify-start rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900/50",
                !value && "text-muted-foreground"
            )}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? value : <span>{label || "Pick a date"}</span>}
            </div>
        </div>
    )
}

// --- Label ---
export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
    ({ className, ...props }, ref) => (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          className
        )}
        {...props}
      />
    )
  )
Label.displayName = "Label"

// --- Card ---
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm dark:bg-zinc-900 dark:border-zinc-800", className)} {...props} />
));
Card.displayName = "Card";

// --- Badge ---
export const Badge = ({ children, className, variant = 'default' }: { children?: React.ReactNode, className?: string, variant?: 'default' | 'outline' | 'secondary' }) => {
    const variants = {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "text-foreground",
    };
    return (
        <div className={cn(
            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            variants[variant],
            className
        )}>
            {children}
        </div>
    );
}

// --- Switch ---
export const Switch = ({ checked, onCheckedChange }: { checked: boolean, onCheckedChange: (c: boolean) => void }) => (
    <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
            "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
            checked ? "bg-primary" : "bg-input"
        )}
    >
        <span
            className={cn(
                "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                checked ? "translate-x-4" : "translate-x-0"
            )}
        />
    </button>
);

// --- Tabs ---
export const Tabs = ({ children, defaultValue, className }: { children?: React.ReactNode, defaultValue: string, className?: string }) => {
    const [activeTab, setActiveTab] = React.useState(defaultValue);
    
    return (
        <div className={className} data-active-tab={activeTab}>
            {React.Children.map(children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, { activeTab, setActiveTab } as any);
                }
                return child;
            })}
        </div>
    )
}

export const TabsList = ({ children, activeTab, setActiveTab }: any) => (
    <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full justify-start dark:bg-zinc-800">
        {React.Children.map(children, child => {
             if (React.isValidElement(child)) {
                return React.cloneElement(child, { activeTab, setActiveTab } as any);
            }
            return child;
        })}
    </div>
)

export const TabsTrigger = ({ value, children, activeTab, setActiveTab }: any) => (
    <button
        onClick={() => setActiveTab(value)}
        className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            activeTab === value ? "bg-background text-foreground shadow-sm" : "hover:bg-background/50 hover:text-foreground"
        )}
    >
        {children}
    </button>
)

export const TabsContent = ({ value, children, activeTab }: any) => {
    if (value !== activeTab) return null;
    return <div className="mt-4 animate-in fade-in-50 duration-300">{children}</div>;
}

// --- Dialog/Modal ---
export const Dialog = ({ open, onOpenChange, children, className }: { open: boolean, onOpenChange: (o: boolean) => void, children?: React.ReactNode, className?: string }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div 
                className={cn("bg-background w-full max-w-lg rounded-lg shadow-lg border dark:border-zinc-800 animate-in zoom-in-95 duration-200 relative", className)}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    )
}

export const DialogHeader = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left p-6 border-b dark:border-zinc-800", className)}>
        {children}
    </div>
)

export const DialogTitle = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
    <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>{children}</h3>
)

export const DialogContent = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
    <div className={cn("p-6", className)}>{children}</div>
)

export const DialogFooter = ({ children, className }: { children?: React.ReactNode, className?: string }) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 border-t dark:border-zinc-800 bg-muted/10", className)}>
        {children}
    </div>
)

// --- Sheet (Mobile Drawer) ---
export const Sheet = ({ children, open, onOpenChange, side = 'right' }: { children: React.ReactNode, open: boolean, onOpenChange: (o: boolean) => void, side?: 'left' | 'right' }) => {
    if (!open) return null;
    
    return (
        <div className={cn("fixed inset-0 z-50 flex", side === 'right' ? 'justify-end' : 'justify-start')}>
             <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => onOpenChange(false)} />
             <div className={cn(
                 "relative z-50 w-[85%] max-w-sm bg-background p-0 shadow-xl transition-all duration-300 border-l dark:border-zinc-800 flex flex-col h-full",
                 side === 'right' ? "animate-in slide-in-from-right" : "animate-in slide-in-from-left"
             )}>
                 <div className="p-4 border-b flex justify-between items-center bg-muted/5 dark:border-zinc-800">
                    <span className="font-semibold text-sm">Menu</span>
                    <button onClick={() => onOpenChange(false)} className="rounded-sm opacity-70 hover:opacity-100 p-1 hover:bg-muted">
                        <X size={16} />
                    </button>
                 </div>
                 <div className="flex-1 overflow-y-auto">
                    {children}
                 </div>
             </div>
        </div>
    )
}

// --- Progress Bar ---
export const ProgressBar = ({ value, max, className }: { value: number, max: number, className?: string }) => {
    const percentage = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
    return (
        <div className={cn("h-1 w-full bg-secondary overflow-hidden rounded-full", className)}>
            <div 
                className="h-full bg-primary transition-all duration-300 ease-in-out" 
                style={{ width: `${percentage}%` }} 
            />
        </div>
    )
}

// --- Font Picker ---
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
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring appearance-none dark:border-zinc-700 dark:bg-zinc-900/50"
                value={value || 'Inter, sans-serif'}
                onChange={(e) => onChange(e.target.value)}
            >
                {fonts.map(f => <option key={f.value} value={f.value}>{f.name}</option>)}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                <ChevronDown size={14} />
            </div>
        </div>
    )
}

// --- Color Picker ---
export const ColorPicker = ({ value, onChange }: { value: string, onChange: (color: string) => void }) => {
    return (
        <div className="flex gap-2">
             <div className="relative w-10 h-9 rounded-md border overflow-hidden shadow-sm">
                 <input 
                    type="color" 
                    value={value} 
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute -top-1 -left-1 w-12 h-12 p-0 border-0 cursor-pointer"
                 />
             </div>
             <Input 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="font-mono"
            />
        </div>
    )
}
