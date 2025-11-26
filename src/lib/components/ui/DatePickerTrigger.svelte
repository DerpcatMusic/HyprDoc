<script lang="ts">
	import { Calendar } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	interface DatePickerTriggerProps {
		value?: string;
		onChange?: (value: string) => void;
		label?: string;
		class?: string;
	}

	let {
		value = $bindable(''),
		onChange,
		label,
		class: className
	}: DatePickerTriggerProps = $props();

	let inputRef: HTMLInputElement;

	function handleClick() {
		inputRef?.showPicker();
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		value = target.value;
		onChange?.(target.value);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick();
		}
	}
</script>

<div 
	class={cn('relative group cursor-pointer', className)} 
	onclick={handleClick}
	onkeydown={handleKeydown}
	role="button"
	tabindex="0"
	aria-label={label || 'Pick a date'}
>
	<input 
		bind:this={inputRef}
		type="date" 
		bind:value
		oninput={handleInput}
		class="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer" 
	/>
	<div class={cn(
		'flex h-9 w-full items-center justify-start rounded-none border-2 border-input bg-transparent px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:text-foreground font-mono group-hover:border-primary transition-colors bg-white dark:bg-zinc-900',
		!value && 'text-muted-foreground'
	)}>
		<Calendar class="mr-2 h-4 w-4 group-hover:text-primary" />
		{#if value}
			{value}
		{:else}
			<span>{label || 'Pick a date'}</span>
		{/if}
	</div>
</div>