<script lang="ts">
	import { Tabs as TabsPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface TabsProps {
		value?: string;
		onValueChange?: (value: string) => void;
		defaultValue?: string;
		class?: string;
		children?: Snippet;
	}

	let {
		value = $bindable(),
		onValueChange,
		defaultValue,
		class: className,
		children
	}: TabsProps = $props();

	function handleValueChange(newValue: string) {
		value = newValue;
		onValueChange?.(newValue);
	}
</script>

<TabsPrimitive.Root
	{value}
	onValueChange={handleValueChange}
	{defaultValue}
	class={cn('w-full', className)}
>
	{@render children?.()}
</TabsPrimitive.Root>
