import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Check } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- BUTTON ---
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'xs' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-black text-white hover:bg-primary hover:text-white border-2 border-black dark:border-white hover:border-black dark:hover:border-primary shadow-none hover:translate-y-[-2px] hover:shadow-sharp transition-all duration-100",
      destructive: "bg-destructive text-white hover:bg-red-600 border-2 border-transparent",
      outline: "border-2 border-black dark:border-white bg-transparent hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black shadow-none hover:shadow-sharp transition-all duration-100",
      secondary: "bg-zinc-100 text-black border-2 border-transparent hover:border-black",
      ghost: "hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border-2 border-transparent",
      link: "text-primary underline-offset-4 hover:underline border-0",
    };
    const sizes = {
      default: "h-10 px-6 py-2",
      sm: "h-9 px-4 text-xs",
      xs: "h-7 px-2 text-[10px]",
      lg: "h-12 px-8 text-base",
      icon: "h-9 w-9 p-0",
    };
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-mono tracking-wide uppercase rounded-none",
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

// --- INPUT ---
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full border-2 border-black/10 bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:bg-white disabled:cursor-not-allowed disabled:opacity-50 font-mono transition-colors rounded-none dark:border-white/20 dark:focus:border-primary dark:text-white invalid:border-red-500 invalid:text-red-600 focus-visible:invalid:border-red-500 invalid:bg-red-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

// --- LABEL ---
export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
    ({ className, ...props }, ref) => (
      <label
        ref={ref}
        className={cn(
          "text-[10px] font-black leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-mono uppercase tracking-widest text-muted-foreground mb-1 block",
          className
        )}
        {...props}
      />
    )
  )
Label.displayName = "Label"

// --- TEXTAREA ---
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => {
      return (
        <textarea
          className={cn(
            "flex min-h-[80px] w-full border-2 border-black/10 bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-primary focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 font-mono rounded-none resize-none dark:border-white/20 dark:text-white invalid:border-red-500 focus-visible:invalid:border-red-500",
            className
          )}
          ref={ref}
          {...props}
        />
      )
    }
  )
Textarea.displayName = "Textarea";

// --- BADGE ---
export const Badge = ({ children, className, variant = 'default', ...props }: { children?: React.ReactNode, className?: string, variant?: 'default' | 'outline' | 'secondary' } & React.HTMLAttributes<HTMLDivElement>) => {
    const variants = {
        default: "border-transparent bg-primary text-white",
        secondary: "border-transparent bg-zinc-100 text-black",
        outline: "text-foreground border-black dark:border-white",
    };
    return (
        <div className={cn(
            "inline-flex items-center border px-1.5 py-0.5 text-[10px] font-bold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono uppercase rounded-none tracking-wider",
            variants[variant],
            className
        )} {...props}>
            {children}
        </div>
    );
}

// --- CHECKBOX ---
export const Checkbox = React.forwardRef<HTMLButtonElement, { checked?: boolean | undefined; onCheckedChange?: (checked: boolean) => void; disabled?: boolean | undefined; id?: string; className?: string }>(
  ({ className, checked, onCheckedChange, disabled, id, ...props }, ref) => (
    <button
      type="button"
      id={id}
      ref={ref}
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange?.(!checked)}
      className={cn(
        "peer h-4 w-4 shrink-0 border-2 border-black ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-white transition-all rounded-none dark:border-white",
        checked ? "bg-primary text-white" : "bg-transparent",
        className
      )}
      {...props}
    >
      {checked && <Check className="h-3 w-3 text-current font-bold" />}
    </button>
  )
)
Checkbox.displayName = "Checkbox"