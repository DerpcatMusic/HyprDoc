<script lang="ts">
	import {
		type DocBlock,
		type Party,
		BlockType,
		type DocumentSettings
	} from '$lib/types';
	import EditorBlock from './EditorBlock.svelte';
	import { Button, Input, Label } from '$lib/components/ui';
	import {
		Play,
		Send,
		Users,
		Grid,
		FileText,
		Link as LinkIcon,
		Plus,
		Trash2
	} from 'lucide-svelte';
	import { useDocument } from '$lib/stores/document.svelte';
	import gsap from 'gsap';
	import { Flip } from 'gsap/dist/Flip';
	import { onMount, tick } from 'svelte';
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from '$lib/components/ui';
	import { cn } from '$lib/utils';

	gsap.registerPlugin(Flip);

	interface EditorCanvasProps {
		docTitle: string;
		docSettings?: DocumentSettings;
		blocks: DocBlock[];
		parties: Party[];
		selectedBlockId: string | null;
		showPartyManager: boolean;
		onTitleChange: (t: string) => void;
		onTogglePartyManager: (show: boolean) => void;
		onPreview: () => void;
		onSend: () => void;
		onSelectBlock: (id: string) => void;
		onUpdateBlock: (id: string, u: Partial<DocBlock>) => void;
		onDeleteBlock: (id: string) => void;
		onAddBlock: (type: BlockType) => void;
		onDropBlock: (e: DragEvent, targetId?: string) => void;
		onUpdateParty: (index: number, p: Party) => void;
	}

	let {
		docTitle,
		docSettings,
		blocks,
		parties,
		selectedBlockId,
		showPartyManager,
		onTitleChange,
		onTogglePartyManager,
		onPreview,
		onSend,
		onSelectBlock,
		onUpdateBlock,
		onDeleteBlock,
		onAddBlock,
		onDropBlock,
		onUpdateParty
	}: EditorCanvasProps = $props();

	const docStore = useDocument();
	let showGrid = $state(false);
	let marginSnap = $state(10);
	let mirrorMargins = $state(false);

	let draggingMargin = $state<'top' | 'bottom' | 'left' | 'right' | null>(null);
	let dragValue = $state<number | null>(null);
	let canvasRef: HTMLDivElement;

	// GSAP Flip Logic
	$effect(() => {
		if (!canvasRef) return;
		// We need to capture state before updates, but in Svelte $effect runs after.
		// So we might need to rely on Svelte's built-in animations or just run Flip on every update.
		// For now, let's try running Flip on block changes if possible, or skip if too complex for initial migration.
		// Given the complexity, I'll skip GSAP Flip for now and rely on Svelte's layout engine,
		// as Flip requires careful state capture which is tricky in a reactive effect without beforeUpdate.
	});

	function handleDragStartBlock(e: DragEvent, id: string) {
		e.dataTransfer?.setData('application/hyprdoc-block-id', id);
		e.dataTransfer!.effectAllowed = 'move';

		// Create a ghost image
		const ghost = document.createElement('div');
		ghost.style.width = '1px';
		ghost.style.height = '1px';
		ghost.style.opacity = '0';
		document.body.appendChild(ghost);
		e.dataTransfer?.setDragImage(ghost, 0, 0);
		setTimeout(() => document.body.removeChild(ghost), 0);
	}

	function handleDropBlockInternal(
		e: DragEvent,
		targetId?: string,
		position?: 'left' | 'right' | 'top' | 'bottom' | 'inside'
	) {
		e.preventDefault();
		e.stopPropagation();

		const draggedBlockId = e.dataTransfer?.getData('application/hyprdoc-block-id');
		const newBlockType = e.dataTransfer?.getData(
			'application/hyprdoc-new'
		) as BlockType;

		// Column Creation Logic
		if (targetId && (position === 'left' || position === 'right')) {
			if (draggedBlockId && draggedBlockId !== targetId) {
				docStore.createColumnLayout(targetId, draggedBlockId, position);
			} else if (newBlockType) {
				docStore.createColumnLayout(targetId, newBlockType, position);
			}
			return;
		}

		// Standard Drop
		if (draggedBlockId && targetId && draggedBlockId !== targetId) {
			docStore.moveBlock(
				draggedBlockId,
				targetId,
				position === 'inside' ? 'inside' : 'after'
			);
		} else if (newBlockType) {
			docStore.addBlock(
				newBlockType,
				targetId,
				position === 'inside' ? 'inside' : 'after'
			);
		}
	}

	function handleMarginMouseDown(
		e: MouseEvent,
		type: 'top' | 'bottom' | 'left' | 'right'
	) {
		e.preventDefault();
		e.stopPropagation();
		draggingMargin = type;
	}

	function handleMouseMove(e: MouseEvent) {
		if (!draggingMargin || !canvasRef || !docSettings?.margins) return;

		const rect = canvasRef.getBoundingClientRect();
		let rawVal = 0;
		const MIN_MARGIN = 0;
		const MAX_MARGIN = 300;

		if (draggingMargin === 'top') {
			rawVal = e.clientY - rect.top;
		} else if (draggingMargin === 'bottom') {
			rawVal = rect.bottom - e.clientY;
		} else if (draggingMargin === 'left') {
			rawVal = e.clientX - rect.left;
		} else if (draggingMargin === 'right') {
			rawVal = rect.right - e.clientX;
		}

		const snap = marginSnap > 0 ? marginSnap : 1;
		let val = Math.round(rawVal / snap) * snap;
		val = Math.max(MIN_MARGIN, Math.min(MAX_MARGIN, val));

		dragValue = val;

		const newMargins = { ...docSettings.margins };
		newMargins[draggingMargin] = val;

		if (mirrorMargins) {
			newMargins.top = val;
			newMargins.bottom = val;
			newMargins.left = val;
			newMargins.right = val;
		}

		docStore.updateSettings({ ...docSettings, margins: newMargins });
	}

	function handleMouseUp() {
		draggingMargin = null;
		dragValue = null;
	}

	function handleManualMarginChange(
		key: keyof typeof docSettings.margins,
		val: string
	) {
		const num = parseInt(val) || 0;
		const newMargins = { ...docSettings?.margins, [key]: num };

		if (mirrorMargins && docSettings?.margins) {
			newMargins.top = num;
			newMargins.bottom = num;
			newMargins.left = num;
			newMargins.right = num;
		}

		docStore.updateSettings({ ...docSettings, margins: newMargins as any });
	}

	function handleAddParty() {
		docStore.addParty({
			id: crypto.randomUUID(),
			name: `Party ${parties.length + 1}`,
			color: '#000000',
			initials: `P${parties.length + 1}`
		});
	}

	function handleCanvasClick(e: MouseEvent) {
		if (e.target === e.currentTarget) {
			const lastBlock = blocks[blocks.length - 1];
			if (
				lastBlock &&
				lastBlock.type === BlockType.TEXT &&
				(!lastBlock.content || lastBlock.content.trim() === '')
			) {
				onSelectBlock(lastBlock.id);
			} else {
				onAddBlock(BlockType.TEXT);
			}
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="relative z-0 flex flex-1 flex-col bg-background"
	ondragover={(e) => e.preventDefault()}
	ondrop={(e) => handleDropBlockInternal(e)}
	onmousemove={draggingMargin ? handleMouseMove : undefined}
	onmouseup={draggingMargin ? handleMouseUp : undefined}
	onmouseleave={draggingMargin ? handleMouseUp : undefined}
>
	<!-- Header Bar -->
	<div
		class="z-30 flex h-16 items-center justify-between border-b-2 border-black bg-background px-6 shadow-sm transition-colors dark:border-zinc-800 dark:bg-zinc-950"
	>
		<div class="flex items-center gap-3">
			<div
				class="flex h-8 w-8 items-center justify-center border-2 border-black bg-primary dark:border-zinc-700"
			>
				<FileText size={16} class="text-white" />
			</div>
			<input
				value={docTitle}
				oninput={(e) => onTitleChange((e.target as HTMLInputElement).value)}
				class="w-auto bg-transparent font-mono text-lg font-bold uppercase tracking-tight text-foreground underline-offset-4 outline-none placeholder:text-muted-foreground/50 focus:underline focus:decoration-primary focus:decoration-2"
				placeholder="UNTITLED_DOC"
			/>
		</div>
		<div class="flex items-center gap-2">
			<Button
				variant={showGrid ? 'secondary' : 'ghost'}
				size="sm"
				onclick={() => (showGrid = !showGrid)}
				title="Adjust Margins"
				class="border-2 border-transparent font-mono hover:border-black hover:shadow-hypr-sm dark:text-foreground dark:hover:border-zinc-500"
			>
				<Grid size={14} class="mr-2" /> MARGINS
			</Button>
			<div class="mx-1 h-6 w-px bg-border"></div>
			<Button
				variant="outline"
				size="sm"
				onclick={() => onTogglePartyManager(true)}
				class="font-mono hover:shadow-hypr-sm dark:border-zinc-700 dark:text-foreground"
				><Users size={14} class="mr-2" /> PARTIES</Button
			>
			<Button
				onclick={onPreview}
				size="sm"
				variant="outline"
				class="font-mono hover:shadow-hypr-sm dark:border-zinc-700 dark:text-foreground"
				><Play size={14} class="mr-2" /> PREVIEW</Button
			>
			<Button
				onclick={onSend}
				size="sm"
				class="border-2 border-black bg-black font-mono text-white shadow-hypr-sm transition-all hover:bg-primary hover:text-black active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:border-zinc-700 dark:bg-zinc-100 dark:text-black dark:hover:bg-primary"
				><Send size={14} class="mr-2" /> SEND</Button
			>
		</div>
	</div>

	<!-- Margin Toolbar -->
	{#if showGrid && docSettings?.margins}
		<div
			class="z-20 flex animate-in slide-in-from-top-2 items-center gap-6 border-b-2 border-black bg-muted/30 p-2 px-6 dark:border-zinc-800 dark:bg-zinc-900"
		>
			<div
				class="flex items-center gap-2 border-r-2 border-black/20 pr-4 dark:border-zinc-700"
			>
				<Label
					class="flex items-center gap-1 font-mono text-xs font-bold text-muted-foreground"
					><Grid size={12} /> SNAP</Label
				>
				<Input
					class="h-8 w-16 border-black font-mono text-xs focus:shadow-hypr-sm dark:bg-black dark:border-zinc-600"
					type="number"
					value={String(marginSnap)}
					oninput={(e) =>
						(marginSnap = parseInt((e.target as HTMLInputElement).value))}
				/>
				<span class="font-mono text-xs text-muted-foreground">PX</span>
			</div>

			<div
				class="flex items-center gap-2 border-r-2 border-black/20 pr-4 dark:border-zinc-700"
			>
				<Label
					class="flex items-center gap-1 font-mono text-xs font-bold text-muted-foreground"
					><LinkIcon size={12} /> MIRROR</Label
				>
				<!-- Switch component needed, using checkbox for now -->
				<input
					type="checkbox"
					checked={mirrorMargins}
					onchange={(e) => (mirrorMargins = (e.target as HTMLInputElement).checked)}
				/>
			</div>

			<div class="flex items-center gap-3">
				<span class="font-mono text-xs font-bold text-muted-foreground"
					>DIMENSIONS:</span
				>
				{#each ['top', 'bottom', 'left', 'right'] as side}
					<div class="flex items-center gap-1">
						<span
							class="font-mono text-[10px] font-bold uppercase text-muted-foreground"
							>{side[0]}</span
						>
						<Input
							class="h-8 w-14 border-black text-center font-mono text-xs focus:shadow-hypr-sm dark:bg-black dark:border-zinc-600"
							value={String(docSettings.margins![side])}
							oninput={(e) =>
								handleManualMarginChange(
									side,
									(e.target as HTMLInputElement).value
								)}
						/>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<div
		class="bg-grid-pattern relative flex-1 overflow-y-auto bg-muted/10 p-8 dark:bg-zinc-950"
		style="font-family: {docSettings?.fontFamily}"
	>
		<!-- Party Manager Modal -->
		<Dialog open={showPartyManager} onOpenChange={onTogglePartyManager}>
			<DialogContent
				class="max-w-2xl rounded-none border-2 border-black shadow-hypr dark:border-zinc-700 dark:bg-zinc-900"
			>
				<DialogHeader
					class="mb-4 border-b-2 border-black/10 pb-4 dark:border-zinc-800"
				>
					<DialogTitle
						class="flex items-center gap-2 font-mono text-xl font-black uppercase dark:text-white"
					>
						<Users size={24} /> Party Management
					</DialogTitle>
				</DialogHeader>

				<div class="space-y-4">
					{#each parties as p, i (p.id)}
						<div
							class="flex items-center gap-3 border-2 border-black/10 bg-white p-3 transition-colors hover:border-black/30 dark:border-zinc-800 dark:bg-black dark:hover:border-zinc-600"
						>
							<input
								type="color"
								value={p.color}
								oninput={(e) =>
									onUpdateParty(i, {
										...p,
										color: (e.target as HTMLInputElement).value
									})}
								class="h-8 w-8 flex-shrink-0 cursor-pointer border-none p-0"
							/>
							<div class="grid flex-1 grid-cols-2 gap-2">
								<div class="flex flex-col gap-1">
									<span
										class="text-[10px] font-bold uppercase text-muted-foreground"
										>Role Name</span
									>
									<Input
										class="h-8 font-mono text-xs dark:bg-zinc-900 dark:border-zinc-700"
										value={p.name}
										oninput={(e) =>
											onUpdateParty(i, {
												...p,
												name: (e.target as HTMLInputElement).value
											})}
									/>
								</div>
								<div class="flex flex-col gap-1">
									<span
										class="text-[10px] font-bold uppercase text-muted-foreground"
										>Initials</span
									>
									<Input
										class="h-8 font-mono text-xs dark:bg-zinc-900 dark:border-zinc-700"
										value={p.initials}
										oninput={(e) =>
											onUpdateParty(i, {
												...p,
												initials: (e.target as HTMLInputElement).value
											})}
									/>
								</div>
							</div>
							{#if parties.length > 1}
								<Button
									variant="ghost"
									size="icon"
									onclick={() => docStore.removeParty(p.id)}
									class="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
									><Trash2 size={16} /></Button
								>
							{/if}
						</div>
					{/each}
					<Button
						onclick={handleAddParty}
						class="w-full gap-2 border-2 border-dashed border-black/20 py-4 font-mono text-xs uppercase hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-zinc-700 dark:text-zinc-400"
						variant="ghost"
					>
						<Plus size={16} /> Add New Party
					</Button>
				</div>
			</DialogContent>
		</Dialog>

		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			bind:this={canvasRef}
			class="group/page relative mx-auto box-border min-h-[1100px] max-w-4xl cursor-text border-2 border-black bg-white shadow-hypr transition-all dark:border-zinc-800 dark:bg-black"
			style="
                padding-top: {docSettings?.margins?.top || 80}px;
                padding-bottom: {docSettings?.margins?.bottom || 80}px;
                padding-left: {docSettings?.margins?.left || 80}px;
                padding-right: {docSettings?.margins?.right || 80}px;
                cursor: {draggingMargin
				? ['top', 'bottom'].includes(draggingMargin)
					? 'ns-resize'
					: 'ew-resize'
				: 'text'}
            "
			onclick={handleCanvasClick}
		>
			<!-- Margins Render -->
			{#if showGrid || draggingMargin}
				<div
					class="group/margin absolute left-0 right-0 top-0 z-50 border-b-2 border-dashed border-primary bg-primary/5 hover:bg-primary/10"
					style="height: {docSettings?.margins?.top || 80}px"
				>
					<div
						class="absolute bottom-[-6px] left-0 right-0 flex h-3 cursor-ns-resize items-center justify-center opacity-0 transition-opacity group-hover/margin:opacity-100"
						onmousedown={(e) => handleMarginMouseDown(e, 'top')}
					>
						<div class="h-2 w-10 border border-black bg-primary"></div>
					</div>
					{#if draggingMargin === 'top'}
						<div
							class="absolute left-2 top-2 bg-black px-2 py-1 font-mono text-xs text-white"
						>
							{dragValue ?? docSettings?.margins?.top}px
						</div>
					{/if}
				</div>
				<div
					class="group/margin absolute bottom-0 left-0 right-0 z-50 border-t-2 border-dashed border-primary bg-primary/5 hover:bg-primary/10"
					style="height: {docSettings?.margins?.bottom || 80}px"
				>
					<div
						class="absolute left-0 right-0 top-[-6px] flex h-3 cursor-ns-resize items-center justify-center opacity-0 transition-opacity group-hover/margin:opacity-100"
						onmousedown={(e) => handleMarginMouseDown(e, 'bottom')}
					>
						<div class="h-2 w-10 border border-black bg-primary"></div>
					</div>
					{#if draggingMargin === 'bottom'}
						<div
							class="absolute bottom-2 left-2 bg-black px-2 py-1 font-mono text-xs text-white"
						>
							{dragValue ?? docSettings?.margins?.bottom}px
						</div>
					{/if}
				</div>
				<div
					class="group/margin absolute bottom-0 left-0 top-0 z-50 border-r-2 border-dashed border-primary bg-primary/5 hover:bg-primary/10"
					style="width: {docSettings?.margins?.left || 80}px"
				>
					<div
						class="absolute right-[-6px] bottom-0 top-0 flex w-3 cursor-ew-resize items-center justify-center opacity-0 transition-opacity group-hover/margin:opacity-100"
						onmousedown={(e) => handleMarginMouseDown(e, 'left')}
					>
						<div class="h-10 w-2 border border-black bg-primary"></div>
					</div>
					{#if draggingMargin === 'left'}
						<div
							class="absolute left-2 top-2 bg-black px-2 py-1 font-mono text-xs text-white"
						>
							{dragValue ?? docSettings?.margins?.left}px
						</div>
					{/if}
				</div>
				<div
					class="group/margin absolute bottom-0 right-0 top-0 z-50 border-l-2 border-dashed border-primary bg-primary/5 hover:bg-primary/10"
					style="width: {docSettings?.margins?.right || 80}px"
				>
					<div
						class="absolute left-[-6px] bottom-0 top-0 flex w-3 cursor-ew-resize items-center justify-center opacity-0 transition-opacity group-hover/margin:opacity-100"
						onmousedown={(e) => handleMarginMouseDown(e, 'right')}
					>
						<div class="h-10 w-2 border border-black bg-primary"></div>
					</div>
					{#if draggingMargin === 'right'}
						<div
							class="absolute right-2 top-2 bg-black px-2 py-1 font-mono text-xs text-white"
						>
							{dragValue ?? docSettings?.margins?.right}px
						</div>
					{/if}
				</div>
			{/if}

			<div
				class="relative z-10 min-h-[200px] w-full space-y-1"
				style="transform-style: preserve-3d"
			>
				{#each blocks as block, index (block.id)}
					<EditorBlock
						{index}
						{block}
						allBlocks={blocks}
						{parties}
						formValues={{}}
						isSelected={selectedBlockId === block.id}
						onSelect={onSelectBlock}
						onUpdate={onUpdateBlock}
						onDelete={onDeleteBlock}
						onDragStart={handleDragStartBlock}
						onDrop={handleDropBlockInternal}
					/>
				{/each}
			</div>
			{#if blocks.length === 0}
				<div
					class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center opacity-30"
				>
					<div
						class="mb-4 flex h-24 w-24 items-center justify-center rounded-full border-4 border-dashed border-black/50 dark:border-white/20"
					>
						<FileText size={48} class="text-black/50 dark:text-white/50" />
					</div>
					<p class="font-mono text-sm uppercase tracking-widest dark:text-white">
						Drop Blocks Here
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
