<script lang="ts">
	import Input from './Input.svelte';
	import { cn } from '$lib/utils';

	interface ColorPickerProps {
		value?: string;
		onChange?: (value: string) => void;
		class?: string;
	}

	let {
		value = $bindable('#000000'),
		onChange,
		class: className
	}: ColorPickerProps = $props();

	function handleChange(newValue: string) {
		value = newValue;
		onChange?.(newValue);
	}

	function handleColorInput(e: Event) {
		const target = e.target as HTMLInputElement;
		handleChange(target.value);
	}
</script>

<div class={cn('flex items-center gap-2', className)}>
	<div class="relative w-8 h-8 rounded-none overflow-hidden border-2 border-black dark:border-white shadow-sm">
		<input 
			type="color" 
			value={value} 
			oninput={handleColorInput}
			class="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] cursor-pointer p-0 border-0 opacity-0" 
		/>
		<div class="w-full h-full" style:background-color={value} />
	</div>
	<Input 
		bind:value
		oninput={(e: Event) => handleChange((e.target as HTMLInputElement).value)} 
		class="w-24 font-mono text-xs uppercase bg-white dark:bg-black text-black dark:text-white"
		maxlength={7}
	/>
</div>