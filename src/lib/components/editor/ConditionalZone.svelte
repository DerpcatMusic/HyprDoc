<script lang="ts">
	import { BlockType, type DocBlock, type FormValues } from '$lib/types';
	import { Trash2, CornerDownRight, GripVertical } from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { Button } from '$lib/components/ui';
	import EditorBlock from '../EditorBlock.svelte';
	import { useDocument } from '$lib/stores/document.svelte';

	interface ConditionalZoneProps {
		block: DocBlock;
		formValues: FormValues;
		allBlocks: DocBlock[];
		isSelected: boolean;
		onUpdate: (id: string, updates: Partial<DocBlock>) => void;
		onDelete: (id: string) => void;
		onSelect: (id: string) => void;
		parties: any[];
		onDragStart: (e: DragEvent, id: string) => void;
		onDrop: (e: DragEvent, id: string, position?: 'left' | 'right' | 'top' | 'bottom' | 'inside') => void;
		depth?: number;
	}

	let {
		block,
		formValues,
		allBlocks,
		isSelected,
		onUpdate,
		onDelete,
		onSelect,
		parties,
		onDragStart,
		onDrop,
		depth = 0
	}: ConditionalZoneProps = $props();

	const docStore = useDocument();

	// Find potential source variables
	let potentialSources = $derived(
		allBlocks.filter(
			(b) =>
				(b.type === BlockType.RADIO ||
					b.type === BlockType.SELECT ||
					b.type === BlockType.CHECKBOX) &&
				b.variableName &&
				b.id !== block.id
		)
	);

	let selectedTriggerBlock = $derived(
		potentialSources.find((b) => b.variableName === block.condition?.variableName)
	);

	function handleDropInside(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		(e.currentTarget as HTMLElement).classList.remove(
			'ring-2',
			'ring-primary/50',
			'bg-primary/5'
		);

		// Check if it's a new block from toolbox
		const newType = e.dataTransfer?.getData('application/hyprdoc-new') as BlockType;
		if (newType) {
			docStore.addBlock(newType, block.id, 'inside');
		}
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class={cn(
		'group/zone relative my-4 rounded-none border-2 transition-all',
		isSelected
			? 'bg-amber-50/10 border-amber-500 ring-0 dark:border-amber-500'
			: 'border-dashed border-amber-400/50 bg-amber-50/5 hover:border-amber-400 dark:border-amber-700'
	)}
	style="margin-left: {depth * 12}px"
	onclick={(e) => {
		e.stopPropagation();
		onSelect(block.id);
	}}
	ondragover={(e) => {
		e.preventDefault();
		e.stopPropagation();
		(e.currentTarget as HTMLElement).classList.add(
			'ring-2',
			'ring-primary/50',
			'bg-primary/5'
		);
	}}
	ondragleave={(e) => {
		(e.currentTarget as HTMLElement).classList.remove(
			'ring-2',
			'ring-primary/50',
			'bg-primary/5'
		);
	}}
	ondrop={handleDropInside}
>
	<!-- Drag Handle for the Zone itself -->
	<div
		class="absolute -left-5 top-4 cursor-grab text-amber-500 opacity-0 transition-opacity active:cursor-grabbing group-hover/zone:opacity-100"
		draggable="true"
		ondragstart={(e) => onDragStart(e, block.id)}
	>
		<GripVertical size={16} />
	</div>

	<!-- Header Logic Editor -->
	<div
		class="flex items-center gap-2 border-b-2 border-amber-400/20 bg-amber-100/20 p-2 dark:bg-amber-900/20"
	>
		<CornerDownRight size={16} class="text-amber-600 dark:text-amber-400" />
		<span
			class="font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400"
			>Logic:</span
		>

		<div class="flex flex-1 flex-wrap items-center gap-2 text-sm">
			<span class="font-mono text-xs uppercase opacity-70">IF</span>
			<select
				class="h-7 rounded-none border border-amber-200 bg-white px-2 font-mono text-xs font-medium focus:ring-0 dark:border-amber-900 dark:bg-black dark:text-white"
				value={block.condition?.variableName || ''}
				onchange={(e) =>
					onUpdate(block.id, {
						condition: {
							...block.condition!,
							variableName: (e.target as HTMLSelectElement).value
						}
					})}
			>
				<option value="">(Select Field)</option>
				{#each potentialSources as s}
					<option value={s.variableName}>{s.label || s.variableName}</option>
				{/each}
			</select>
			<span class="font-mono text-xs uppercase opacity-70">EQUALS</span>

			{#if selectedTriggerBlock?.options && selectedTriggerBlock.options.length > 0}
				<select
					class="h-7 min-w-[100px] rounded-none border border-amber-200 bg-white px-2 font-mono text-xs font-medium focus:ring-0 dark:border-amber-900 dark:bg-black dark:text-white"
					value={block.condition?.equals || ''}
					onchange={(e) =>
						onUpdate(block.id, {
							condition: {
								...block.condition!,
								equals: (e.target as HTMLSelectElement).value
							}
						})}
				>
					<option value="">(Select Value)</option>
					{#each selectedTriggerBlock.options as opt}
						<option value={opt}>{opt}</option>
					{/each}
				</select>
			{:else}
				<input
					class="h-7 w-32 rounded-none border border-amber-200 bg-white px-2 font-mono text-xs font-medium focus:outline-none dark:border-amber-900 dark:bg-black dark:text-white"
					placeholder="Value..."
					value={block.condition?.equals || ''}
					oninput={(e) =>
						onUpdate(block.id, {
							condition: {
								...block.condition!,
								equals: (e.target as HTMLInputElement).value
							}
						})}
				/>
			{/if}
		</div>

		<Button
			variant="ghost"
			size="icon"
			class="h-6 w-6 text-amber-700 hover:bg-amber-500 hover:text-white dark:text-amber-500"
			onclick={() => onDelete(block.id)}
		>
			<Trash2 size={12} />
		</Button>
	</div>

	<!-- Drop Zone Content -->
	<div class="relative min-h-[60px] bg-amber-50/5 p-4">
		<!-- Hazard stripes for empty state -->
		{#if !block.children || block.children.length === 0}
			<div
				class="absolute inset-2 flex flex-col items-center justify-center rounded-none border-2 border-dashed border-amber-500/20 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(245,158,11,0.05)_10px,rgba(245,158,11,0.05)_20px)] py-6 text-amber-800/40 transition-colors hover:bg-amber-100/10 dark:text-amber-500/40"
			>
				<p class="mb-2 font-mono text-xs font-bold uppercase">Zone Empty</p>
				<div class="flex gap-2">
					<Button
						size="sm"
						variant="outline"
						class="border-amber-200 bg-white font-mono text-[10px] uppercase text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:bg-black dark:text-amber-500"
						onclick={() => docStore.addBlock(BlockType.INPUT, block.id, 'inside')}
						>+ Field</Button
					>
					<Button
						size="sm"
						variant="outline"
						class="border-amber-200 bg-white font-mono text-[10px] uppercase text-amber-800 hover:bg-amber-50 dark:border-amber-800 dark:bg-black dark:text-amber-500"
						onclick={() => docStore.addBlock(BlockType.TEXT, block.id, 'inside')}
						>+ Text</Button
					>
				</div>
			</div>
		{/if}

		{#if block.children && block.children.length > 0}
			<div
				class="space-y-2 border-l border-amber-200/50 pl-2 dark:border-amber-800/50"
			>
				{#each block.children as child, i (child.id)}
					<EditorBlock
						block={child}
						index={i}
						onUpdate={(id, u) => {
							const newChildren = block.children!.map((c) =>
								c.id === id ? { ...c, ...u } : c
							);
							onUpdate(block.id, { children: newChildren });
						}}
						onDelete={(id) => {
							const newChildren = block.children!.filter((c) => c.id !== id);
							onUpdate(block.id, { children: newChildren });
						}}
						{onSelect}
						{onDrop}
						{onDragStart}
						isSelected={false}
						{allBlocks}
						{parties}
						formValues={{}}
						depth={0}
					/>
				{/each}
			</div>
		{/if}
	</div>
</div>
