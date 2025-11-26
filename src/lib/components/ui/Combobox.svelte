<script lang="ts">
	import { cn } from '$lib/utils';

	interface ComboboxProps {
		value?: string;
		onChange?: (value: string) => void;
		options?: string[];
		placeholder?: string;
		class?: string;
	}

	let {
		value = $bindable(''),
		onChange,
		options = [],
		placeholder,
		class: className
	}: ComboboxProps = $props();

	const datalistId = `combobox-${Math.random().toString(36).substr(2, 9)}`;

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		value = target.value;
		onChange?.(target.value);
	}
</script>

<div class={cn('relative', className)}>
	<input 
		list={datalistId}
		bind:value
		oninput={handleInput}
		{placeholder}
		class="flex h-10 w-full border-2 border-black bg-white px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
	/>
	<datalist id={datalistId}>
		{#each options as option}
			<option value={option} />
		{/each}
	</datalist>
</div>