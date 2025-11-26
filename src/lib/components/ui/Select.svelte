<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import { ChevronDown } from 'lucide-svelte';
	import type { Snippet } from 'svelte';

	interface SelectProps {
		value?: string;
		onValueChange?: (value: string) => void;
		placeholder?: string;
		items?: { value: string; label: string }[];
		class?: string;
		disabled?: boolean;
	}

	let {
		value = $bindable(''),
		onValueChange,
		placeholder = 'Select an option',
		items = [],
		class: className,
		disabled = false
	}: SelectProps = $props();

	function handleValueChange(newValue: string) {
		value = newValue;
		onValueChange?.(newValue);
	}
</script>

<SelectPrimitive.Root {value} onValueChange={handleValueChange} {disabled}>
	<SelectPrimitive.Trigger
		class={cn(
			'flex h-10 w-full items-center justify-between border-2 border-black bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white',
			className
		)}
	>
		<SelectPrimitive.Value {placeholder} />
		<ChevronDown class="h-4 w-4 opacity-50" />
	</SelectPrimitive.Trigger>
	<SelectPrimitive.Portal>
		<SelectPrimitive.Content
			class="relative z-50 min-w-[8rem] overflow-hidden border-2 border-black bg-white text-popover-foreground shadow-hypr animate-in fade-in-80 dark:bg-zinc-950 dark:border-zinc-700 dark:text-white"
		>
			<SelectPrimitive.Viewport class="p-1">
				{#each items as item}
					<SelectPrimitive.Item
						value={item.value}
						label={item.label}
						class="relative flex w-full cursor-default select-none items-center py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
					>
						<div class="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
							<SelectPrimitive.ItemIndicator>
								<svg
									width="15"
									height="15"
									viewBox="0 0 15 15"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
								>
									<path
										d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z"
										fill="currentColor"
										fill-rule="evenodd"
										clip-rule="evenodd"
									></path>
								</svg>
							</SelectPrimitive.ItemIndicator>
						</div>
						<SelectPrimitive.ItemText>{item.label}</SelectPrimitive.ItemText>
					</SelectPrimitive.Item>
				{/each}
			</SelectPrimitive.Viewport>
		</SelectPrimitive.Content>
	</SelectPrimitive.Portal>
</SelectPrimitive.Root>
