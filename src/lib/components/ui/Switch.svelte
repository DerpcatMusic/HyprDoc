<script lang="ts">
	import { Switch as SwitchPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';

	interface SwitchProps {
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
	}: SwitchProps = $props();

	function handleCheckedChange(newChecked: boolean) {
		checked = newChecked;
		onCheckedChange?.(newChecked);
	}
</script>

<SwitchPrimitive.Root
	bind:checked={checked}
	onCheckedChange={handleCheckedChange}
	disabled={disabled}
	class={cn(
		'peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50',
		checked ? 'bg-primary' : 'bg-zinc-300 dark:bg-zinc-700',
		className
	)}
	{...restProps}
>
	<SwitchPrimitive.Thumb
		class={cn(
			'pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform',
			checked ? 'translate-x-4' : 'translate-x-0'
		)}
	/>
</SwitchPrimitive.Root>