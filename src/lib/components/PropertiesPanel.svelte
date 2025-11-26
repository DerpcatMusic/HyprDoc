<script lang="ts">
	import { BlockType, type DocBlock, type Party } from '$lib/types';
	import { Input, Label, Textarea, Button } from '$lib/components/ui';
	import {
		X,
		HelpCircle,
		DollarSign,
		Settings
	} from 'lucide-svelte';
	import { SUPPORTED_CURRENCIES } from '$lib/services/currency';
	import { useDocument } from '$lib/stores/document.svelte';
	import { cn } from '$lib/utils';
	import { fly } from 'svelte/transition';

	interface PropertiesPanelProps {
		block: DocBlock | null;
		parties: Party[];
		onUpdate: (id: string, updates: Partial<DocBlock>) => void;
		onDelete: (id: string) => void;
		onClose: () => void;
	}

	let {
		block,
		parties,
		onUpdate,
		onDelete,
		onClose
	}: PropertiesPanelProps = $props();

	let newOption = $state('');
	const docStore = useDocument();

	function handleAddOption() {
		if (!block || !newOption.trim()) return;
		const currentOptions = block.options || [];
		onUpdate(block.id, { options: [...currentOptions, newOption.trim()] });
		newOption = '';
	}

	function handleRemoveOption(index: number) {
		if (!block) return;
		const newOptions = [...(block.options || [])];
		newOptions.splice(index, 1);
		onUpdate(block.id, { options: newOptions });
	}

	let numericBlocks = $derived(
		docStore.doc.blocks.filter(
			(b) => b.type === BlockType.NUMBER && block && b.id !== block.id
		)
	);
</script>

{#if block}
	<div
		transition:fly={{ x: 300, duration: 300 }}
		class="h-full w-80 overflow-hidden border-l-2 border-black bg-white shadow-2xl transition-all duration-300 ease-in-out dark:border-zinc-700 dark:bg-zinc-950"
	>
		<div class="flex h-full min-w-[320px] flex-col">
			<div
				class="flex h-12 items-center justify-between border-b-2 border-black bg-muted/10 px-4 dark:border-zinc-700 dark:bg-zinc-900"
			>
				<span
					class="flex flex-1 items-center gap-2 truncate font-mono text-xs font-bold uppercase text-foreground dark:text-white"
				>
					<Settings size={14} />
					{block.type.replace('_', ' ')}
				</span>
				<button
					class="flex h-6 w-6 items-center justify-center transition-colors hover:bg-red-500 hover:text-white"
					onclick={onClose}
				>
					<X size={16} />
				</button>
			</div>

			<div class="flex-1 space-y-6 overflow-y-auto p-6">
				<!-- Variable ID -->
				<div
					class="space-y-1 rounded-none border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs text-muted-foreground break-all dark:border-zinc-700 dark:bg-zinc-900"
				>
					<div class="mb-1 flex items-center justify-between">
						<span class="font-bold text-black dark:text-white">ID</span>
						<div
							title="Use this key in formulas or integrations"
							class="cursor-help"
						>
							<HelpCircle size={12} />
						</div>
					</div>
					<div class="select-all text-foreground dark:text-zinc-400">
						{block.variableName}
					</div>
				</div>

				<!-- Basic Props -->
				<div class="space-y-4">
					<div class="space-y-2">
						<Label>Label</Label>
						<Input
							class="font-sans dark:bg-black dark:border-zinc-700"
							value={block.label || ''}
							oninput={(e) =>
								onUpdate(block.id, { label: (e.target as HTMLInputElement).value })}
						/>
					</div>

					{#if block.type === BlockType.INPUT || block.type === BlockType.LONG_TEXT || block.type === BlockType.EMAIL || block.type === BlockType.NUMBER || block.type === BlockType.CHECKBOX}
						<div class="space-y-2">
							<Label>Placeholder</Label>
							<Input
								class="font-sans dark:bg-black dark:border-zinc-700"
								value={block.placeholder || ''}
								oninput={(e) =>
									onUpdate(block.id, {
										placeholder: (e.target as HTMLInputElement).value
									})}
							/>
						</div>
					{/if}

					{#if block.type === BlockType.CHECKBOX && block.options && block.options.length > 0}
						<div
							class="mt-2 flex items-center justify-between border-t border-black/10 pt-2 dark:border-zinc-800"
						>
							<Label>Allow Multiple</Label>
							<button
								role="switch"
								aria-checked={block.allowMultiple !== false}
								aria-label="Allow multiple selections"
								onclick={() =>
									onUpdate(block.id, {
										allowMultiple: block.allowMultiple === false ? true : false
									})}
								class={cn(
									'relative h-5 w-10 border-2 border-black transition-colors dark:border-zinc-500',
									block.allowMultiple !== false ? 'bg-primary' : 'bg-transparent'
								)}
							>
								<div
									class={cn(
										'absolute bottom-0 top-0 w-1/2 bg-black transition-transform dark:bg-white',
										block.allowMultiple !== false ? 'right-0' : 'left-0'
									)}
								></div>
							</button>
						</div>
					{/if}
				</div>

				<!-- Options Editor -->
				{#if block.type === BlockType.SELECT || block.type === BlockType.RADIO || block.type === BlockType.CHECKBOX}
					<div
						class="space-y-3 border-t-2 border-black/10 pt-4 dark:border-zinc-800"
					>
						<Label>Options</Label>
						<div class="space-y-2">
							{#each block.options || [] as opt, i}
								<div class="group flex items-center gap-2">
									<div
										class="flex-1 border border-black/10 bg-white px-2 py-1.5 font-mono text-xs dark:border-zinc-700 dark:bg-black"
									>
										{opt}
									</div>
									<button
										class="opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 text-muted-foreground"
										onclick={() => handleRemoveOption(i)}
									>
										<X size={14} />
									</button>
								</div>
							{/each}
						</div>
						<div class="flex gap-2">
							<Input
								bind:value={newOption}
								placeholder="Add option..."
								class="dark:bg-black dark:border-zinc-700"
								onkeydown={(e) => e.key === 'Enter' && handleAddOption()}
							/>
							<button
								class="border-2 border-transparent bg-black px-3 font-mono text-xs font-bold uppercase text-white hover:border-black hover:bg-primary hover:text-black dark:bg-white dark:text-black dark:hover:bg-primary"
								onclick={handleAddOption}>Add</button
							>
						</div>
					</div>
				{/if}

				<!-- Currency Settings -->
				{#if block.type === BlockType.CURRENCY}
					<div
						class="space-y-4 border-t-2 border-black/10 pt-4 dark:border-zinc-800"
					>
						<h4
							class="flex items-center gap-2 font-mono text-xs font-bold uppercase text-muted-foreground"
						>
							<DollarSign size={12} /> Conversion Logic
						</h4>

						<div
							class="grid grid-cols-2 gap-0 border-2 border-black dark:border-zinc-700"
						>
							<button
								class={cn(
									'py-1.5 text-[10px] font-bold uppercase transition-all',
									block.currencySettings?.amountType === 'fixed'
										? 'bg-primary text-black'
										: 'bg-transparent hover:bg-black/5 dark:text-white'
								)}
								onclick={() =>
									onUpdate(block!.id, {
										currencySettings: {
											...block!.currencySettings!,
											amountType: 'fixed'
										}
									})}
							>
								Fixed
							</button>
							<button
								class={cn(
									'border-l-2 border-black py-1.5 text-[10px] font-bold uppercase transition-all dark:border-zinc-700',
									block.currencySettings?.amountType === 'field'
										? 'bg-primary text-black'
										: 'bg-transparent hover:bg-black/5 dark:text-white'
								)}
								onclick={() =>
									onUpdate(block!.id, {
										currencySettings: {
											...block!.currencySettings!,
											amountType: 'field'
										}
									})}
							>
								From Field
							</button>
						</div>

						{#if block.currencySettings?.amountType === 'fixed'}
							<div class="space-y-2">
								<Label>Base Amount</Label>
								<Input
									type="number"
									value={String(block.currencySettings.amount || 0)}
									class="dark:bg-black dark:border-zinc-700"
									oninput={(e) =>
										onUpdate(block!.id, {
											currencySettings: {
												...block!.currencySettings!,
												amount: parseFloat((e.target as HTMLInputElement).value)
											}
										})}
								/>
							</div>
						{:else}
							<div class="space-y-2">
								<Label>Source Field</Label>
								<select
									class="h-9 w-full rounded-none border-2 border-black bg-transparent px-3 py-1 font-mono text-xs focus:ring-0 dark:border-zinc-700 dark:bg-black dark:text-white"
									value={block.currencySettings?.sourceFieldId || ''}
									onchange={(e) =>
										onUpdate(block!.id, {
											currencySettings: {
												...block!.currencySettings!,
												sourceFieldId: (e.target as HTMLSelectElement).value
											}
										})}
								>
									<option value="">Select Field...</option>
									{#each numericBlocks as b}
										<option value={b.id}>{b.label || b.variableName}</option>
									{/each}
								</select>
								{#if numericBlocks.length === 0}
									<p
										class="font-mono text-[10px] text-amber-600 dark:text-amber-400"
									>
										No number fields available.
									</p>
								{/if}
							</div>
						{/if}

						<div class="space-y-2">
							<Label>Base Currency</Label>
							<select
								class="h-9 w-full rounded-none border-2 border-black bg-transparent px-3 py-1 font-mono text-xs focus:ring-0 dark:border-zinc-700 dark:bg-black dark:text-white"
								value={block.currencySettings?.baseCurrency || 'USD'}
								onchange={(e) =>
									onUpdate(block!.id, {
										currencySettings: {
											...block!.currencySettings!,
											baseCurrency: (e.target as HTMLSelectElement).value
										}
									})}
							>
								{#each SUPPORTED_CURRENCIES as c}
									<option value={c.code}>{c.flag} {c.code}</option>
								{/each}
							</select>
						</div>

						<div class="space-y-2">
							<Label>Target Currency</Label>
							<select
								class="h-9 w-full rounded-none border-2 border-black bg-transparent px-3 py-1 font-mono text-xs focus:ring-0 dark:border-zinc-700 dark:bg-black dark:text-white"
								value={block.currencySettings?.targetCurrency || 'EUR'}
								onchange={(e) =>
									onUpdate(block!.id, {
										currencySettings: {
											...block!.currencySettings!,
											targetCurrency: (e.target as HTMLSelectElement).value
										}
									})}
							>
								{#each SUPPORTED_CURRENCIES as c}
									<option value={c.code}>{c.flag} {c.code}</option>
								{/each}
							</select>
						</div>
					</div>
				{/if}

				<div class="border-t-2 border-black/10 pt-6 dark:border-zinc-800">
					<button
						class="w-full border-2 border-red-200 py-3 font-mono text-xs font-bold uppercase text-red-600 transition-colors hover:border-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
						onclick={() => onDelete(block!.id)}
					>
						Delete Block
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
