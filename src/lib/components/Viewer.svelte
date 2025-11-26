<script lang="ts">
	import {
		BlockType,
		type DocBlock,
		type Party,
		type DocumentSettings,
		type Variable,
		type Term
	} from '$lib/types';
	import {
		ArrowRight,
		CheckCircle2,
		ChevronLeft,
		ChevronRight,
		Lock,
		DollarSign
	} from 'lucide-svelte';
	import { marked } from 'marked';
	import {
		Button,
		Input,
		Card,
		Label,
		Checkbox,
		Badge
	} from '$lib/components/ui';
	import SignatureWidget from './SignatureWidget.svelte';
	import { fetchExchangeRate, SUPPORTED_CURRENCIES } from '$lib/services/currency';
	import { LEGAL_DICTIONARY_DB } from '$lib/services/glossary';
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';

	interface ViewerProps {
		blocks: DocBlock[];
		snapshot?: DocBlock[];
		parties?: Party[];
		variables?: Variable[];
		terms?: Term[];
		isPreview?: boolean;
		settings?: DocumentSettings;
	}

	let {
		blocks,
		snapshot,
		parties = [],
		variables = [],
		terms = [],
		isPreview = false,
		settings
	}: ViewerProps = $props();

	let formValues = $state<Record<string, any>>({});
	let validationErrors = $state<Record<string, string>>({});
	let currencyRates = $state<Record<string, number>>({});
	let userCurrencyPreferences = $state<Record<string, string>>({});
	let simulatedPartyId = $state<string>(parties[0]?.id || 'p1');

	// Wizard State
	let activeFieldIndex = $state<number>(-1);
	let fieldRefs: Record<string, HTMLElement> = {};

	// Glossary Logic
	let glossaryMap = $derived.by(() => {
		const map = new Map<string, string>();
		LEGAL_DICTIONARY_DB.forEach((t) => map.set(t.term.toLowerCase(), t.definition));
		terms.forEach((t) => map.set(t.term.toLowerCase(), t.definition));
		return map;
	});

	let sortedGlossaryTerms = $derived(
		Array.from(glossaryMap.keys()).sort((a, b) => b.length - a.length)
	);

	// Configure marked
	marked.setOptions({
		breaks: true,
		gfm: true
	});

	function renderTextWithGlossary(text: string) {
		if (!text) return '';
		
		// Parse markdown to HTML first
		let html = marked.parse(text) as string;
		
		// Process glossary terms with basic highlighting
		// For now, we'll add simple styling without complex tooltips
		// This is a simpler approach compared to the React version
		sortedGlossaryTerms.forEach(term => {
			const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const regex = new RegExp(`\\b(${escapedTerm})\\b`, 'gi');
			html = html.replace(regex, `<span class="glossary-term bg-yellow-100 dark:bg-yellow-900/30 px-1 rounded border-b-2 border-yellow-300 text-yellow-800 dark:text-yellow-200">$1</span>`);
		});
		
		return html;
	}

	// Currency Logic
	async function getRate(base: string, target: string) {
		const key = `${base}-${target}`;
		if (currencyRates[key] !== undefined) return currencyRates[key];
		const rate = await fetchExchangeRate(base, target);
		if (rate !== null) {
			currencyRates[key] = rate;
		}
		return rate;
	}

	function handleInputChange(blockId: string, value: any) {
		formValues[blockId] = value;
		if (validationErrors[blockId]) {
			const newErrors = { ...validationErrors };
			delete newErrors[blockId];
			validationErrors = newErrors;
		}
	}

	// Wizard Navigation
	let progress = $derived.by(() => {
		const totalRequired = blocks.filter((b) => b.required).length;
		if (totalRequired === 0) return 100;
		const filledRequired = blocks.filter(
			(b) => b.required && formValues[b.id]
		).length;
		return Math.round((filledRequired / totalRequired) * 100);
	});

	function handleNextField() {
		const nextField = blocks.find(
			(b, i) => i > activeFieldIndex && b.required && !formValues[b.id]
		);
		if (nextField) {
			const index = blocks.findIndex((b) => b.id === nextField.id);
			activeFieldIndex = index;
			fieldRefs[nextField.id]?.scrollIntoView({
				behavior: 'smooth',
				block: 'center'
			});
		} else {
			const firstEmpty = blocks.find((b) => b.required && !formValues[b.id]);
			if (firstEmpty) {
				const index = blocks.findIndex((b) => b.id === firstEmpty.id);
				activeFieldIndex = index;
				fieldRefs[firstEmpty.id]?.scrollIntoView({
					behavior: 'smooth',
					block: 'center'
				});
			}
		}
	}
</script>

<div
	class="bg-grid-pattern relative min-h-screen max-w-5xl bg-muted/10 p-8 pb-32 pt-24 mx-auto"
>
	<!-- Simulator Controls -->
	{#if isPreview}
		<div
			class="pointer-events-none fixed left-1/2 top-20 z-40 w-full max-w-[850px] -translate-x-1/2 px-4"
		>
			<Card
				class="pointer-events-auto inline-block border-2 border-black bg-white p-2 shadow-sm dark:border-white dark:bg-black"
			>
				<div class="flex items-center gap-4">
					<span
						class="font-mono text-[10px] font-black uppercase tracking-wide text-black dark:text-white"
						>Viewing as:</span
					>
					<div class="flex gap-1">
						{#each parties as p}
							<button
								onclick={() => (simulatedPartyId = p.id)}
								class={cn(
									'border border-black px-2 py-0.5 font-mono text-[10px] font-bold uppercase transition-all dark:border-white',
									simulatedPartyId === p.id
										? 'bg-primary -translate-y-[1px] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]'
										: 'bg-transparent hover:bg-black/5 dark:text-white dark:hover:bg-white/10'
								)}
							>
								{p.name}
							</button>
						{/each}
					</div>
				</div>
			</Card>
		</div>
	{/if}

	<!-- Document Page View -->
	<div
		class="shadow-hypr dark:shadow-hypr-dark relative mx-auto min-h-[1100px] max-w-[850px] border-2 border-black bg-white p-16 transition-all dark:border-zinc-800 dark:bg-black"
	>
		<!-- Document Header -->
		<div
			class="mb-12 border-b-2 border-black/10 pb-6 text-center dark:border-white/10"
		>
			{#if settings?.logoUrl}
				<img
					src={settings.logoUrl}
					alt="Logo"
					class="mx-auto mb-4 h-12 object-contain"
				/>
			{/if}
			<h1
				class="mb-2 font-mono text-3xl font-black uppercase tracking-tight text-foreground dark:text-white"
			>
				{blocks[0]?.content ? '' : 'Untitled Document'}
			</h1>
			<div
				class="flex items-center justify-center gap-4 font-mono text-xs text-muted-foreground"
			>
				{#each parties as p}
					<span class="flex items-center gap-1.5">
						<span
							class="h-2 w-2 border border-black dark:border-white"
							style="background-color: {p.color}"
						></span>
						{p.name}
					</span>
				{/each}
			</div>
		</div>

		<!-- Blocks Renderer -->
		<div class="space-y-6">
			{#each blocks as block, i (block.id)}
				{@const isLocked =
					block.assignedToPartyId && block.assignedToPartyId !== simulatedPartyId}
				{@const assignedParty = parties.find(
					(p) => p.id === block.assignedToPartyId
				)}
				{@const isActive = i === activeFieldIndex}

				<div
					class={cn(
						'relative my-3 transition-all',
						assignedParty
							? 'scroll-mt-32 rounded-none border-l-4 pl-4'
							: 'group',
						isLocked && 'pointer-events-none opacity-40 grayscale'
					)}
					style={assignedParty ? `border-left-color: ${assignedParty.color}` : ''}
				>
					{#if isLocked}
						<div
							class="absolute inset-0 z-10 flex items-center justify-center"
						>
							<div
								class="flex items-center gap-2 rounded-none border border-muted bg-background/90 p-2 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground shadow-sm backdrop-blur-sm dark:bg-zinc-900/90"
							>
								<Lock size={12} /> Waiting for {assignedParty?.name}
							</div>
						</div>
					{/if}

					<div
						bind:this={fieldRefs[block.id]}
						class={cn(
							'mb-4 transition-all duration-500',
							isActive && 'scale-[1.02]'
						)}
					>
						{#if block.label && block.type !== BlockType.CHECKBOX && block.type !== BlockType.COLUMNS}
							<Label
								class="mb-1.5 flex justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground"
							>
								<span>
									{block.label}
									{#if block.required}<span class="ml-1 text-red-500"
											>*</span
										>{/if}
								</span>
								{#if validationErrors[block.id]}
									<span class="ml-auto text-[10px] font-normal text-red-500"
										>{validationErrors[block.id]}</span
									>
								{/if}
							</Label>
						{/if}

						{#if block.type === BlockType.TEXT}
							<div
								class="prose max-w-none font-serif text-sm leading-7 dark:prose-invert"
							>
								{@html renderTextWithGlossary(block.content || '')}
							</div>
						{:else if block.type === BlockType.INPUT}
							<Input
								value={formValues[block.id] || ''}
								oninput={(e) =>
									handleInputChange(block.id, (e.target as HTMLInputElement).value)}
								placeholder={block.placeholder ||
									`Enter ${block.label?.toLowerCase()}...`}
								disabled={isLocked}
								class={cn(isActive && 'ring-2 ring-primary ring-offset-2')}
							/>
						{:else if block.type === BlockType.NUMBER}
							<Input
								value={formValues[block.id] || ''}
								oninput={(e) => {
									const raw = (e.target as HTMLInputElement).value.replace(
										/[^0-9.]/g,
										''
									);
									handleInputChange(block.id, raw);
								}}
								placeholder={block.placeholder || '0.00'}
								disabled={isLocked}
								class={cn(isActive && 'ring-2 ring-primary ring-offset-2')}
								inputmode="decimal"
							/>
						{:else if block.type === BlockType.EMAIL}
							<Input
								value={formValues[block.id] || ''}
								oninput={(e) =>
									handleInputChange(block.id, (e.target as HTMLInputElement).value)}
								placeholder="user@example.com"
								disabled={isLocked}
								class={cn(isActive && 'ring-2 ring-primary ring-offset-2')}
								type="email"
								onblur={(e) => {
									const val = (e.target as HTMLInputElement).value;
									if (val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
										validationErrors[block.id] = 'Invalid email format';
									}
								}}
							/>
						{:else if block.type === BlockType.DATE}
							<div class="flex gap-2">
								<div class="relative flex-1">
									<input
										type="date"
										class={cn(
											'flex h-10 w-full rounded-none border-2 border-input bg-background px-3 py-2 font-mono text-sm uppercase ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900',
											isActive && 'ring-2 ring-primary ring-offset-2'
										)}
										value={formValues[block.id] || ''}
										oninput={(e) =>
											handleInputChange(
												block.id,
												(e.target as HTMLInputElement).value
											)}
										disabled={isLocked}
									/>
								</div>
								<Button
									variant="outline"
									size="sm"
									onclick={() =>
										handleInputChange(
											block.id,
											new Date().toISOString().split('T')[0]
										)}
									disabled={isLocked}>Today</Button
								>
							</div>
						{:else if block.type === BlockType.CHECKBOX}
							{#if block.options && block.options.length > 0}
								<div class="space-y-2">
									{#each block.options as opt}
										{@const isChecked = (formValues[block.id] || []).includes(
											opt
										)}
										<div class="flex items-center gap-2">
											<Checkbox
												checked={isChecked}
												onCheckedChange={(checked) => {
													let currentVals = (formValues[block.id] ||
														[]) as string[];
													if (block.allowMultiple === false) {
														handleInputChange(block.id, checked ? [opt] : []);
													} else {
														if (checked)
															handleInputChange(block.id, [...currentVals, opt]);
														else
															handleInputChange(
																block.id,
																currentVals.filter((v) => v !== opt)
															);
													}
												}}
												disabled={isLocked}
											/>
											<Label class="cursor-pointer font-normal">{opt}</Label>
										</div>
									{/each}
								</div>
							{:else}
								<div
									class="flex items-center gap-2 rounded-none border border-dashed border-zinc-300 p-2 transition-colors hover:bg-accent/50 dark:border-zinc-700"
								>
									<Checkbox
										checked={!!formValues[block.id]}
										onCheckedChange={(c) => handleInputChange(block.id, c)}
										disabled={isLocked}
									/>
									<Label
										class="cursor-pointer"
										onclick={() =>
											!isLocked &&
											handleInputChange(block.id, !formValues[block.id])}
									>
										{block.label || 'I agree'}
									</Label>
								</div>
							{/if}
						{:else if block.type === BlockType.SIGNATURE}
							<SignatureWidget
								initialValue={formValues[block.id]}
								onSign={(val) => handleInputChange(block.id, val)}
								signatureId={block.signatureId}
								signedAt={block.signedAt}
								disabled={isLocked}
							/>
						{:else if block.type === BlockType.CURRENCY}
							<!-- Simple Currency Display for now -->
							<div
								class="flex items-center gap-4 rounded-none border-2 border-black bg-muted/20 p-3 dark:border-zinc-700"
							>
								<div class="flex-1">
									<div class="font-mono text-2xl font-bold tracking-tighter">
										{new Intl.NumberFormat('en-US', {
											style: 'currency',
											currency:
												userCurrencyPreferences[block.id] ||
												block.currencySettings?.targetCurrency ||
												'USD'
										}).format(block.currencySettings?.amount || 0)}
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Wizard Bar -->
	<div
		class="fixed bottom-6 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4"
	>
		<div
			class="flex items-center justify-between gap-4 border-2 border-white/20 bg-black p-3 pl-5 pr-4 text-white shadow-2xl dark:bg-zinc-900"
		>
			<div class="flex flex-1 flex-col">
				<span
					class="mb-1 font-mono text-[9px] font-bold uppercase tracking-widest text-primary"
					>Progress</span
				>
				<div class="h-1.5 w-full overflow-hidden bg-white/20">
					<div
						class="h-full bg-primary transition-all duration-500 ease-out"
						style="width: {progress}%"
					></div>
				</div>
			</div>

			<div class="flex items-center gap-2">
				{#if activeFieldIndex === -1}
					<Button
						size="sm"
						class="h-8 bg-primary font-mono font-bold text-black hover:bg-white"
						onclick={handleNextField}
					>
						START <ArrowRight size={14} class="ml-1.5" />
					</Button>
				{:else}
					<Button
						size="icon"
						variant="ghost"
						class="h-8 w-8 rounded-none text-white hover:bg-white/20"
						onclick={() => {
							const prev = activeFieldIndex - 1;
							if (prev >= 0) {
								activeFieldIndex = prev;
								fieldRefs[blocks[prev].id]?.scrollIntoView({
									behavior: 'smooth',
									block: 'center'
								});
							}
						}}
					>
						<ChevronLeft size={16} />
					</Button>
					<Button
						size="sm"
						class={cn(
							'h-8 rounded-none border-white font-mono font-bold',
							progress === 100
								? 'bg-green-500 text-white hover:bg-green-600'
								: 'bg-primary text-black hover:bg-white'
						)}
						onclick={handleNextField}
					>
						{progress === 100 ? 'FINISH' : 'NEXT'}
						{#if progress === 100}
							<CheckCircle2 size={14} class="ml-1.5" />
						{:else}
							<ChevronRight size={14} class="ml-1.5" />
						{/if}
					</Button>
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.glossary-term {
		cursor: help;
		transition: all 0.2s ease;
	}
	
	.glossary-term:hover {
		background-color: rgb(254 249 195) !important;
	}
	
	:global(.dark) .glossary-term:hover {
		background-color: rgb(113 63 18 / 0.3) !important;
	}
</style>