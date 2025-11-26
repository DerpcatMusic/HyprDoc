<script lang="ts">
	import { BlockType, type DocBlock, type FormValues, type Party } from '$lib/types';
	import {
		Trash2,
		GripVertical,
		List,
		Type,
		Hash,
		Mail,
		Calendar,
		CheckSquare,
		CircleDot,
		Image as ImageIcon,
		FileSignature,
		UploadCloud,
		FileText,
		CreditCard,
		Video,
		DollarSign,
		Columns,
		LayoutTemplate
	} from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import ConditionalZone from './editor/ConditionalZone.svelte';
	import { useDocument } from '$lib/stores/document.svelte';
	import { onMount } from 'svelte';

	interface EditorBlockProps {
		block: DocBlock;
		formValues: FormValues;
		isSelected: boolean;
		parties: Party[];
		allBlocks?: DocBlock[];
		onSelect: (id: string) => void;
		onUpdate: (id: string, updates: Partial<DocBlock>) => void;
		onDelete: (id: string) => void;
		onDragStart: (e: DragEvent, id: string) => void;
		onDrop: (
			e: DragEvent,
			id: string,
			position?: 'left' | 'right' | 'top' | 'bottom' | 'inside'
		) => void;
		depth?: number;
		index?: number;
	}

	let {
		block,
		formValues,
		isSelected,
		parties,
		allBlocks = [],
		onSelect,
		onUpdate,
		onDelete,
		onDragStart,
		onDrop,
		depth = 0,
		index
	}: EditorBlockProps = $props();

	const docStore = useDocument();
	let textareaRef: HTMLTextAreaElement;
	let blockRef: HTMLDivElement;
	let dropPosition = $state<'top' | 'bottom' | 'left' | 'right' | null>(null);
	let isEditingText = $state(false);

	$effect(() => {
		if (block.type === BlockType.TEXT && textareaRef) {
			textareaRef.style.height = 'auto';
			textareaRef.style.height = textareaRef.scrollHeight + 2 + 'px';
		}
	});

	$effect(() => {
		if (isSelected && block.type === BlockType.TEXT) {
			isEditingText = true;
			setTimeout(() => {
				if (textareaRef) {
					textareaRef.focus();
					textareaRef.setSelectionRange(
						textareaRef.value.length,
						textareaRef.value.length
					);
				}
			}, 10);
		} else {
			isEditingText = false;
		}
	});

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();

		if (block.type === BlockType.COLUMN) {
			return;
		}

		if (!blockRef) return;
		const rect = blockRef.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;

		const w = rect.width;
		const h = rect.height;

		if (x < w * 0.2) dropPosition = 'left';
		else if (x > w * 0.8) dropPosition = 'right';
		else if (y < h * 0.5) dropPosition = 'top';
		else dropPosition = 'bottom';
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		dropPosition = null;
	}

	function handleDropInternal(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();

		if (block.type === BlockType.COLUMN) {
			const newType = e.dataTransfer?.getData('application/hyprdoc-new') as BlockType;
			if (newType) {
				docStore.addBlock(newType, block.id, 'inside');
			} else {
				const existingId = e.dataTransfer?.getData('application/hyprdoc-block-id');
				if (existingId) onDrop(e, block.id, 'inside');
			}
			dropPosition = null;
			return;
		}

		if (dropPosition) {
			onDrop(e, block.id, dropPosition);
		}
		dropPosition = null;
	}

	function handleColumnResize(e: MouseEvent, index: number) {
		e.preventDefault();
		e.stopPropagation();

		const startX = e.clientX;
		const parentWidth = blockRef?.offsetWidth || 1;

		const leftCol = block.children![index];
		const rightCol = block.children![index + 1];

		const startLeftWidth =
			typeof leftCol.width === 'number' ? leftCol.width : 50;
		const startRightWidth =
			typeof rightCol.width === 'number' ? rightCol.width : 50;

		const onMove = (mv: MouseEvent) => {
			const deltaX = mv.clientX - startX;
			const deltaPercent = (deltaX / parentWidth) * 100;

			let newLeft = startLeftWidth + deltaPercent;
			let newRight = startRightWidth - deltaPercent;

			const minWidth = 5;
			const totalWidth = startLeftWidth + startRightWidth;

			if (newLeft < minWidth) {
				newLeft = minWidth;
				newRight = totalWidth - minWidth;
			}
			if (newRight < minWidth) {
				newRight = minWidth;
				newLeft = totalWidth - minWidth;
			}

			onUpdate(leftCol.id, { width: newLeft });
			onUpdate(rightCol.id, { width: newRight });
		};

		const onUp = () => {
			window.removeEventListener('mousemove', onMove);
			window.removeEventListener('mouseup', onUp);
		};

		window.addEventListener('mousemove', onMove);
		window.addEventListener('mouseup', onUp);
	}

	let assignedParty = $derived(
		parties.find((p) => p.id === block.assignedToPartyId) || parties[0]
	);
	let isText = $derived(block.type === BlockType.TEXT);
	let isConditional = $derived(block.type === BlockType.CONDITIONAL);
	let isColumns = $derived(block.type === BlockType.COLUMNS);
	let isColumn = $derived(block.type === BlockType.COLUMN);

	function getBlockCategoryClass(type: BlockType) {
		switch (type) {
			case BlockType.TEXT:
			case BlockType.INPUT:
			case BlockType.LONG_TEXT:
				return 'bg-zinc-50/50 border-zinc-200 dark:bg-zinc-900/50 dark:border-zinc-800';
			case BlockType.CHECKBOX:
			case BlockType.RADIO:
			case BlockType.SELECT:
			case BlockType.DATE:
			case BlockType.EMAIL:
			case BlockType.NUMBER:
				return 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30';
			case BlockType.FORMULA:
			case BlockType.PAYMENT:
			case BlockType.CURRENCY:
				return 'bg-purple-50/50 border-purple-200 dark:bg-purple-900/10 dark:border-purple-900/30';
			case BlockType.SIGNATURE:
			case BlockType.FILE_UPLOAD:
			case BlockType.IMAGE:
			case BlockType.VIDEO:
			case BlockType.SECTION_BREAK:
				return 'bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30';
			case BlockType.CONDITIONAL:
			case BlockType.REPEATER:
				return 'bg-rose-50/50 border-rose-200 dark:bg-rose-900/10 dark:border-rose-900/30';
			case BlockType.COLUMNS:
			case BlockType.COLUMN:
				return 'bg-transparent border-transparent';
			default:
				return 'bg-white border-gray-200 dark:bg-zinc-900 dark:border-zinc-700';
		}
	}

	let categoryClass = $derived(!isText ? getBlockCategoryClass(block.type) : '');

	function getIcon() {
		switch (block.type) {
			case BlockType.TEXT:
				return Type;
			case BlockType.INPUT:
				return FileText;
			case BlockType.SIGNATURE:
				return FileSignature;
			case BlockType.DATE:
				return Calendar;
			case BlockType.CHECKBOX:
				return CheckSquare;
			case BlockType.RADIO:
				return CircleDot;
			case BlockType.SELECT:
				return List;
			case BlockType.EMAIL:
				return Mail;
			case BlockType.NUMBER:
				return Hash;
			case BlockType.IMAGE:
				return ImageIcon;
			case BlockType.FILE_UPLOAD:
				return UploadCloud;
			case BlockType.PAYMENT:
				return CreditCard;
			case BlockType.CURRENCY:
				return DollarSign;
			case BlockType.VIDEO:
				return Video;
			case BlockType.COLUMNS:
				return Columns;
			default:
				return Type;
		}
	}

	let Icon = $derived(getIcon());
</script>

{#if isConditional}
	<ConditionalZone
		{block}
		{allBlocks}
		{formValues}
		{isSelected}
		{onUpdate}
		{onDelete}
		{onSelect}
		{onDrop}
		{parties}
		{onDragStart}
		{depth}
	/>
{:else if isColumns}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={blockRef}
		data-flip-id={block.id}
		class={cn(
			'group relative mb-4',
			isSelected && 'rounded-sm ring-2 ring-indigo-500/20'
		)}
		onclick={(e) => {
			e.stopPropagation();
			onSelect(block.id);
		}}
		draggable="true"
		ondragstart={(e) => onDragStart(e, block.id)}
	>
		{#if isSelected}
			<div
				class="shadow-hypr dark:shadow-hypr-dark absolute -right-0 -top-9 z-50 flex items-center gap-0 border-2 border-black bg-white dark:border-zinc-600 dark:bg-zinc-800"
			>
				<button
					class="flex h-full items-center gap-2 border-r-2 border-black px-3 py-1 font-mono text-xs font-bold uppercase text-black hover:bg-primary hover:text-white dark:border-zinc-600 dark:text-white"
					onclick={(e) => {
						e.stopPropagation();
						docStore.ungroupRow(block.id);
					}}
					title="Ungroup Columns (Flatten)"
				>
					<LayoutTemplate size={12} /> Ungroup
				</button>
				<button
					class="flex h-full items-center justify-center p-1.5 text-black transition-colors hover:bg-red-500 hover:text-white dark:text-white"
					onclick={(e) => {
						e.stopPropagation();
						onDelete(block.id);
					}}
					title="Delete Row"
				>
					<Trash2 size={12} />
				</button>
			</div>
		{/if}

		<div class="relative flex w-full">
			{#if block.children}
				{#each block.children as col, i (col.id)}
					<!-- Recursive Component -->
					<svelte:self
						block={col}
						index={i}
						isSelected={false}
						{allBlocks}
						{parties}
						formValues={{}}
						{onSelect}
						onUpdate={(id, u) => {
							const newChildren = block.children!.map((c) => {
								if (c.id === id) return { ...c, ...u };
								if (c.children) {
									const updateDeep = (list: DocBlock[]): DocBlock[] => {
										return list.map((gc) => {
											if (gc.id === id) return { ...gc, ...u };
											if (gc.children)
												return { ...gc, children: updateDeep(gc.children) };
											return gc;
										});
									};
									return { ...c, children: updateDeep(c.children) };
								}
								return c;
							});
							onUpdate(block.id, { children: newChildren });
						}}
						onDelete={(id) => {
							const newChildren = block.children!.map((c) => ({
								...c,
								children: c.children?.filter((gc) => gc.id !== id)
							}));
							onUpdate(block.id, { children: newChildren });
						}}
						{onDragStart}
						{onDrop}
					/>
					{#if i < (block.children?.length || 0) - 1}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="group/resizer absolute bottom-0 top-0 z-10 -ml-2 flex w-4 cursor-col-resize items-center justify-center transition-colors hover:bg-indigo-500/10"
							style="left: {block.children![i].width || 50}%"
							onmousedown={(e) => handleColumnResize(e, i)}
						>
							<div
								class="h-6 w-[2px] bg-black/20 transition-all group-hover/resizer:h-full group-hover/resizer:bg-indigo-500 dark:bg-white/20"
							></div>
						</div>
					{/if}
				{/each}
			{/if}
		</div>
	</div>
{:else if isColumn}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		style="width: {typeof block.width === 'number' && !isNaN(block.width)
			? block.width
			: 50}%"
		class="relative flex min-h-[50px] flex-col gap-2 px-2 transition-none"
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDropInternal}
	>
		{#if !block.children || block.children.length === 0}
			<div
				class="m-1 flex min-h-[80px] flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50/50 p-4 text-muted-foreground dark:border-zinc-800 dark:bg-zinc-900/20"
			>
				<span class="font-mono text-[10px] uppercase">Column</span>
			</div>
		{/if}
		{#if block.children}
			{#each block.children as child, i (child.id)}
				<svelte:self
					block={child}
					index={i}
					isSelected={false}
					{allBlocks}
					{parties}
					formValues={{}}
					{onSelect}
					onUpdate={(id, u) => onUpdate(id, u)}
					onDelete={(id) => onDelete(id)}
					{onDragStart}
					{onDrop}
				/>
			{/each}
		{/if}
	</div>
{:else}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={blockRef}
		data-flip-id={block.id}
		class={cn(
			'group relative mb-4 pb-2 transition-none',
			isSelected && 'z-20'
		)}
		style="margin-left: {depth * 24}px"
		ondragover={handleDragOver}
		ondragleave={handleDragLeave}
		ondrop={handleDropInternal}
		onclick={(e) => {
			e.stopPropagation();
			onSelect(block.id);
		}}
	>
		<!-- Drop Indicators -->
		{#if dropPosition === 'top'}
			<div
				class="pointer-events-none absolute -top-2 left-0 right-0 z-50 h-1 bg-primary"
			></div>
		{/if}
		{#if dropPosition === 'bottom'}
			<div
				class="pointer-events-none absolute bottom-0 left-0 right-0 z-50 h-1 bg-primary"
			></div>
		{/if}
		{#if dropPosition === 'left'}
			<div
				class="pointer-events-none absolute bottom-0 left-0 top-0 z-50 w-1 bg-primary"
			></div>
		{/if}
		{#if dropPosition === 'right'}
			<div
				class="pointer-events-none absolute bottom-0 right-0 top-0 z-50 w-1 bg-primary"
			></div>
		{/if}

		<!-- Floating Action Toolbar -->
		{#if isSelected && !isText}
			<div
				class="shadow-hypr dark:shadow-hypr-dark absolute -right-0 -top-9 z-50 flex items-center gap-0 border-2 border-black bg-white dark:border-zinc-600 dark:bg-zinc-800"
			>
				<!-- Party Selector Dropdown -->
				<div
					class="group/party relative h-full border-r-2 border-black dark:border-zinc-600"
				>
					<button
						class="flex h-full items-center gap-2 px-2 py-1 font-mono text-xs font-bold uppercase text-black hover:bg-primary hover:text-white dark:text-white"
						title="Assign to Party"
					>
						<div
							class="h-2 w-2 border border-black dark:border-white"
							style="background-color: {assignedParty?.color}"
						></div>
						<span class="max-w-[80px] truncate">{assignedParty?.name}</span>
					</button>
					<div
						class="shadow-hypr dark:shadow-hypr-dark absolute right-0 top-full mt-0 hidden w-40 border-2 border-black bg-white group-hover/party:block dark:border-zinc-600 dark:bg-zinc-900"
					>
						{#each parties as p}
							<div
								class="flex cursor-pointer items-center gap-2 border-b-2 border-black px-3 py-2 font-mono text-xs font-bold uppercase text-black last:border-0 hover:bg-primary hover:text-white dark:border-zinc-700 dark:text-white"
								onclick={(e) => {
									e.stopPropagation();
									onUpdate(block.id, { assignedToPartyId: p.id });
								}}
							>
								<div
									class="h-2 w-2 border border-black dark:border-white"
									style="background-color: {p.color}"
								></div>
								{p.name}
							</div>
						{/each}
					</div>
				</div>

				<!-- Required Toggle -->
				<button
					class={cn(
						'h-full border-r-2 border-black px-2 py-1 font-mono text-xs font-bold uppercase hover:bg-primary hover:text-white dark:border-zinc-600',
						block.required
							? 'bg-red-50 text-red-600 dark:bg-red-900/20'
							: 'text-black dark:text-white'
					)}
					onclick={(e) => {
						e.stopPropagation();
						onUpdate(block.id, { required: !block.required });
					}}
					title="Toggle Required"
				>
					{block.required ? 'REQ' : 'OPT'}
				</button>

				<!-- Delete -->
				<button
					class="flex h-full items-center justify-center p-1.5 text-black transition-colors hover:bg-red-500 hover:text-white dark:text-white"
					onclick={(e) => {
						e.stopPropagation();
						onDelete(block.id);
					}}
					title="Delete Field"
				>
					<Trash2 size={12} />
				</button>
			</div>
		{/if}

		<!-- Block Visuals -->
		<div
			class={cn(
				'relative flex flex-col justify-center transition-none',
				!isText ? 'min-h-[80px] border-2' : 'min-h-[24px]',
				!isSelected && !isText && categoryClass
			)}
			style={!isText
				? `
                border-color: ${isSelected ? (document.documentElement.classList.contains('dark') ? '#52525b' : 'black') : ''};
                background-color: ${isSelected ? (document.documentElement.classList.contains('dark') ? '#27272a' : '#f4f4f5') : ''};
                border-style: ${isSelected ? 'solid' : 'dashed'};
                border-width: 2px;
                box-shadow: ${isSelected ? (document.documentElement.classList.contains('dark') ? '4px 4px 0px 0px rgba(0,0,0,0.5)' : '4px 4px 0px 0px rgba(0,0,0,1)') : 'none'}
            `
				: ''}
		>
			<!-- Left Drag Handle -->
			<div
				class="absolute -left-6 bottom-0 top-0 z-10 flex w-6 cursor-grab items-center justify-center opacity-0 transition-none active:cursor-grabbing group-hover:opacity-100"
				draggable="true"
				ondragstart={(e) => onDragStart(e, block.id)}
				title="Drag to reorder"
			>
				<GripVertical
					size={16}
					class="text-black hover:text-primary dark:text-zinc-400"
				/>
			</div>

			<!-- Content Container -->
			<div class={cn('relative z-0 w-full', !isText ? 'p-4' : 'p-1')}>
				{#if isText}
					{#if isEditingText || isSelected}
						<textarea
							bind:this={textareaRef}
							value={block.content || ''}
							oninput={(e) => {
								onUpdate(block.id, {
									content: (e.target as HTMLTextAreaElement).value
								});
								(e.target as HTMLTextAreaElement).style.height = 'auto';
								(e.target as HTMLTextAreaElement).style.height =
									(e.target as HTMLTextAreaElement).scrollHeight + 2 + 'px';
							}}
							onblur={() => (isEditingText = false)}
							autofocus
							class="min-h-[24px] w-full resize-none overflow-hidden border-none bg-transparent px-1 py-1 font-sans text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:ring-0 outline-none dark:text-white"
							onclick={(e) => e.stopPropagation()}
							placeholder="Type '/' for commands..."
						></textarea>
					{:else}
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<div
							class="min-h-[24px] w-full cursor-text whitespace-pre-wrap px-1 py-1 font-sans text-sm leading-relaxed dark:text-zinc-100"
							onclick={(e) => {
								e.stopPropagation();
								onSelect(block.id);
								isEditingText = true;
							}}
						>
							{#if block.content}
								{block.content}
							{:else}
								<span class="italic text-muted-foreground/50"
									>Click to type...</span
								>
							{/if}
						</div>
					{/if}
				{:else}
					<!-- Field Area Visualization -->
					<div class="pointer-events-none flex w-full flex-col justify-center">
						<!-- Top Label Area -->
						<div
							class="mb-2 flex items-center justify-between border-b-2 border-black/5 pb-1 dark:border-white/10"
						>
							<span
								class={cn(
									'flex items-center gap-1.5 font-mono text-[10px] font-bold uppercase tracking-wider',
									block.required ? 'text-destructive' : 'text-muted-foreground'
								)}
							>
								<Icon size={12} class="text-black opacity-70 dark:text-white" />
								{block.type.replace('_', ' ')}
								{block.required && '*'}
							</span>
							{#if assignedParty}
								<div
									class="flex items-center gap-1 border border-black/20 bg-white px-1.5 py-0.5 shadow-sm dark:border-zinc-600 dark:bg-zinc-800"
								>
									<div
										class="h-2 w-2 border border-black dark:border-white"
										style="background-color: {assignedParty.color}"
									></div>
									<span
										class="font-mono text-[9px] font-bold uppercase text-black dark:text-white"
										>{assignedParty.name}</span
									>
								</div>
							{/if}
						</div>

						<!-- Main Content / Value Preview -->
						<div
							class="truncate border border-black/5 bg-white/80 p-1.5 font-mono text-sm font-bold text-foreground shadow-sm opacity-90 dark:border-white/5 dark:bg-zinc-900/80 dark:text-white"
						>
							{#if block.type === BlockType.DATE}
								<div class="flex items-center gap-2 opacity-60">
									<Calendar size={14} />
									<span>{block.placeholder || 'Date Selection'}</span>
								</div>
							{:else}
								{block.label || `LABEL_FOR_${block.type.toUpperCase()}`}
							{/if}
						</div>

						<!-- Options Preview (if applicable) -->
						{#if (block.type === BlockType.SELECT || block.type === BlockType.RADIO || block.type === BlockType.CHECKBOX) && block.options && block.options.length > 0}
							<div class="mt-1.5 flex flex-wrap gap-1">
								{#each block.options.slice(0, 3) as opt, i}
									<span
										class="border border-black/20 bg-white px-1 py-0.5 font-mono text-[9px] text-black dark:border-white/20 dark:bg-zinc-800 dark:text-white"
										>{opt}</span
									>
								{/each}
								{#if block.options.length > 3}
									<span
										class="font-mono text-[9px] text-muted-foreground"
										>+{block.options.length - 3}</span
									>
								{/if}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Corner Accent for Industrial Feel (Visible when selected) -->
			{#if !isText && isSelected}
				<div
					class="absolute -left-[2px] -top-[2px] h-1.5 w-1.5 border border-black bg-primary dark:border-white"
				></div>
				<div
					class="absolute -right-[2px] -top-[2px] h-1.5 w-1.5 border border-black bg-primary dark:border-white"
				></div>
				<div
					class="absolute -bottom-[2px] -left-[2px] h-1.5 w-1.5 border border-black bg-primary dark:border-white"
				></div>
				<div
					class="absolute -bottom-[2px] -right-[2px] h-1.5 w-1.5 border border-black bg-primary dark:border-white"
				></div>
			{/if}
		</div>
	</div>
{/if}
