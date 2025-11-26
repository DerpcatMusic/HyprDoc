<script lang="ts">
	import { Checkbox as CheckboxPrimitive } from 'bits-ui';
	import { Check } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	interface CheckboxProps {
		checked?: boolean;
		onCheckedChange?: (checked: boolean) => void;
		class?: string;
		disabled?: boolean;
	}

	let {
		checked = $bindable(false),
		onCheckedChange,
		class: className,
		disabled = false,
		...restProps
	}: CheckboxProps = $props();

	function handleCheckedChange(newChecked: boolean) {
		checked = newChecked;
		onCheckedChange?.(newChecked);
	}
</script>

<CheckboxPrimitive.Root
	bind:checked={checked}
	onCheckedChange={handleCheckedChange}
	disabled={disabled}
	class={cn(
		'peer h-4 w-4 shrink-0 rounded-sm border-2 border-black ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 relative',
		checked ? 'bg-primary text-primary-foreground dark:bg-white dark:text-black' : 'bg-white dark:bg-zinc-950',
		className
	)}
	{...restProps}
>
	{#if checked}
		<Check class="h-3 w-3 absolute top-0.5 left-0.5 text-current" />
	{/if}
</CheckboxPrimitive.Root>