
import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Check } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'xs' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90 border-2 border-transparent shadow-none",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2 border-transparent",
      outline: "border-2 border-border bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-2 border-transparent",
      ghost: "hover:bg-accent hover:text-accent-foreground border-2 border-transparent",
      link: "text-primary underline-offset-4 hover:underline border-0",
    };
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-9 rounded-none px-3 text-xs",
      xs: "h-7 rounded-none px-2 text-[10px]",
      lg: "h-12 rounded-none px-8",
      icon: "h-9 w-9",
    };
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-none text-sm font-medium transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-mono tracking-tight uppercase",
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

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-none border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
    ({ className, ...props }, ref) => (
      <label
        ref={ref}
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-mono uppercase tracking-wider",
          className
        )}
        {...props}
      />
    )
  )
Label.displayName = "Label"

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
    ({ className, ...props }, ref) => {
      return (
        <textarea
          className={cn(
            "flex min-h-[60px] w-full rounded-none border-2 border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 font-mono",
            className
          )}
          ref={ref}
          {...props}
        />
      )
    }
  )
Textarea.displayName = "Textarea";

export const Badge = ({ children, className, variant = 'default' }: { children?: React.ReactNode, className?: string, variant?: 'default' | 'outline' | 'secondary' }) => {
    const variants = {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "text-foreground border-border",
    };
    return (
        <div className={cn(
            "inline-flex items-center rounded-none border-2 px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-mono uppercase",
            variants[variant],
            className
        )}>
            {children}
        </div>
    );
}

export const Checkbox = React.forwardRef<HTMLButtonElement, { checked?: boolean; onCheckedChange?: (checked: boolean) => void; disabled?: boolean; id?: string; className?: string }>(
  ({ className, checked, onCheckedChange, disabled, id, ...props }, ref) => (
    <button
      type="button"
      id={id}
      ref={ref}
      role="checkbox"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-none border-2 border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        checked ? "bg-primary text-primary-foreground" : "bg-transparent",
        className
      )}
      {...props}
    >
      {checked && <Check className="h-3 w-3 text-current font-bold" />}
    </button>
  )
)
Checkbox.displayName = "Checkbox"
