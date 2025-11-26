<script lang="ts">
	import { cn } from '$lib/utils';

	interface FontPickerProps {
		value?: string;
		onChange?: (value: string) => void;
		class?: string;
	}

	const fonts = [
		{ label: 'Inter (Default)', value: 'Inter, sans-serif' },
		{ label: 'Serif', value: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif' },
		{ label: 'Mono', value: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' },
		{ label: 'Comic Sans', value: '"Comic Sans MS", "Comic Sans", cursive' }
	];

	let {
		value = $bindable(''),
		onChange,
		class: className
	}: FontPickerProps = $props();

	function handleChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		value = target.value;
		onChange?.(target.value);
	}
</script>

<div class={cn('relative', className)}>
	<select 
		bind:value
		onchange={handleChange}
		class="flex h-9 w-full items-center justify-between rounded-none border-2 border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-white"
	>
		<option value="" disabled>Select font...</option>
		{#each fonts as font}
			<option value={font.value}>{font.label}</option>
		{/each}
	</select>
</div>