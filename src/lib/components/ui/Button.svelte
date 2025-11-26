<script lang="ts">
	import { Button as ButtonPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type ButtonVariant = 'default' | 'ghost' | 'secondary' | 'destructive';
	type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

	interface ButtonProps {
		variant?: ButtonVariant;
		size?: ButtonSize;
		class?: string;
		children?: Snippet;
		onclick?: (e: MouseEvent) => void;
		disabled?: boolean;
		type?: 'button' | 'submit' | 'reset';
	}

	let {
		variant = 'default',
		size = 'default',
		class: className,
		children,
		onclick,
		disabled = false,
		type = 'button',
		...restProps
	}: ButtonProps = $props();

	const variants: Record<ButtonVariant, string> = {
		default:
			'bg-black text-white hover:bg-primary/90 border-2 border-black shadow-hypr-sm active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all dark:bg-white dark:text-black dark:border-zinc-700',
		ghost:
			'hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black dark:text-white border-2 border-transparent hover:border-black dark:hover:border-white transition-colors',
		secondary:
			'bg-secondary text-secondary-foreground hover:bg-secondary/80 border-2 border-black dark:border-zinc-700',
		destructive:
			'bg-destructive text-destructive-foreground hover:bg-destructive/90 border-2 border-black shadow-hypr-sm dark:border-zinc-700'
	};

	const sizes: Record<ButtonSize, string> = {
		default: 'h-10 px-4 py-2',
		sm: 'h-9 px-3 text-sm',
		lg: 'h-11 px-8',
		icon: 'h-10 w-10'
	};

	const buttonClass = cn(
		'inline-flex items-center justify-center font-mono font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
		variants[variant],
		sizes[size],
		className
	);
</script>

<ButtonPrimitive.Root
	class={buttonClass}
	{onclick}
	{disabled}
	{type}
	{...restProps}
>
	{@render children?.()}
</ButtonPrimitive.Root>
