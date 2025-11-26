<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface SlashMenuProps {
		isOpen?: boolean;
		onSelect?: (action: string) => void;
		onClose?: () => void;
		position?: { top: number; left: number };
		children?: Snippet;
	}

	let {
		isOpen = $bindable(false),
		onSelect,
		onClose,
		position = { top: 0, left: 0 },
		children
	}: SlashMenuProps = $props();

	const items = [
		{ label: 'Heading 1', id: 'h1', icon: 'H1' },
		{ label: 'Heading 2', id: 'h2', icon: 'H2' },
		{ label: 'Text Block', id: 'text', icon: 'T' },
		{ label: 'Input Field', id: 'input', icon: 'Input' },
		{ label: 'Number Field', id: 'number', icon: '#' },
		{ label: 'Signature', id: 'signature', icon: 'Sig' },
		{ label: 'Date Picker', id: 'date', icon: 'Cal' },
		{ label: 'Divider', id: 'section_break', icon: '—' }
	];

	let menuRef: HTMLDivElement;

	function handleClickOutside(event: MouseEvent) {
		if (menuRef && !menuRef.contains(event.target as Node)) {
			onClose?.();
		}
	}

	function handleItemSelect(action: string) {
		onSelect?.(action);
		onClose?.();
	}

	onMount(() => {
		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}
		
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	});

	$effect(() => {
		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		} else {
			document.removeEventListener('mousedown', handleClickOutside);
		}
	});
</script>

{#if isOpen}
	<div 
		bind:this={menuRef}
		class="absolute z-50 w-48 bg-zinc-900 text-white border border-zinc-700 shadow-2xl flex flex-col rounded-sm overflow-hidden animate-in fade-in zoom-in-95 duration-100"
		style:top={position.top + 'px'}
		style:left={position.left + 'px'}
	>
		<div class="px-2 py-1.5 text-[10px] font-mono uppercase text-zinc-500 bg-black border-b border-zinc-800">
			Insert Block
		</div>
		{#each items as item}
			<button
				type="button"
				onclick={() => handleItemSelect(item.id)}
				class="flex items-center gap-2 px-3 py-2 text-sm hover:bg-primary hover:text-black transition-colors text-left font-mono"
			>
				<span class="w-4 text-center opacity-50 font-bold text-xs">{item.icon}</span>
				{item.label}
			</button>
		{/each}
	</div>
{/if}