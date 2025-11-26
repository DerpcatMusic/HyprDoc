<script lang="ts">
	import { cn } from '$lib/utils';

	interface TextareaProps {
		value?: string;
		placeholder?: string;
		class?: string;
		disabled?: boolean;
		required?: boolean;
		oninput?: (e: Event) => void;
		onchange?: (e: Event) => void;
	}

	let {
		value = $bindable(''),
		placeholder,
		class: className,
		disabled = false,
		required = false,
		oninput,
		onchange,
		...restProps
	}: TextareaProps = $props();
</script>

<textarea
	bind:value
	{placeholder}
	{disabled}
	{required}
	{oninput}
	{onchange}
	class={cn(
		'flex min-h-[80px] w-full border-2 border-black bg-white px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white',
		className
	)}
	{...restProps}
></textarea>
