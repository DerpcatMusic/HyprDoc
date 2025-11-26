<script lang="ts">
	import { cn } from '$lib/utils';

	interface InputProps {
		type?: string;
		value?: string;
		placeholder?: string;
		class?: string;
		disabled?: boolean;
		required?: boolean;
		maxlength?: number;
		oninput?: (e: Event) => void;
		onchange?: (e: Event) => void;
	}

	let {
		type = 'text',
		value = $bindable(''),
		placeholder,
		class: className,
		disabled = false,
		required = false,
		maxlength,
		oninput,
		onchange,
		...restProps
	}: InputProps = $props();
</script>

<input
	{type}
	bind:value
	{placeholder}
	{disabled}
	{required}
	{maxlength}
	{oninput}
	{onchange}
	class={cn(
		'flex h-10 w-full border-2 border-black bg-white px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white',
		className
	)}
	{...restProps}
/>
