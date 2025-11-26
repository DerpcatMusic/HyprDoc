<script lang="ts">
	import type { Term } from '$lib/types';
	import { Button, Input, Textarea, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui';
	import { Trash2, Plus, Book, Search } from 'lucide-svelte';
	import { LEGAL_DICTIONARY_DB } from '$lib/services/glossary';

	interface GlossaryManagerProps {
		terms: Term[];
		onAddTerm: (term: Term) => void;
		onDeleteTerm: (id: string) => void;
		onClose: () => void;
	}

	let { terms, onAddTerm, onDeleteTerm, onClose }: GlossaryManagerProps = $props();

	let newTerm = $state('');
	let newDef = $state('');
	let filter = $state('');
	let categoryFilter = $state('All');

	function handleAdd() {
		if (!newTerm || !newDef) return;
		onAddTerm({
			id: crypto.randomUUID(),
			term: newTerm,
			definition: newDef,
			source: 'user',
			color: '#6366f1' // default Indigo
		});
		newTerm = '';
		newDef = '';
	}

	// Dictionary Filtering
	const categories = ['All', ...Array.from(new Set(LEGAL_DICTIONARY_DB.map((t) => t.category || 'General')))];
	
	let dictionaryTerms = $derived(LEGAL_DICTIONARY_DB.filter((t) => {
		const matchesSearch = t.term.toLowerCase().includes(filter.toLowerCase());
		const matchesCategory = categoryFilter === 'All' || (t.category || 'General') === categoryFilter;
		return matchesSearch && matchesCategory;
	}));
</script>

<div class="flex h-full w-full flex-col bg-background">
	<div class="flex items-center justify-between border-b p-4 dark:border-zinc-800">
		<h2 class="flex items-center gap-2 font-bold"><Book size={18} /> Glossary</h2>
		<div class="text-xs text-muted-foreground">{terms.length} custom overrides</div>
	</div>

	<Tabs defaultValue="dictionary" class="flex flex-1 flex-col overflow-hidden">
		<div class="px-4 pt-2">
			<TabsList>
				<TabsTrigger value="dictionary">System Dictionary</TabsTrigger>
				<TabsTrigger value="custom">My Custom Terms</TabsTrigger>
			</TabsList>
		</div>

		<!-- SYSTEM DICTIONARY TAB -->
		<TabsContent value="dictionary" class="mt-0 flex flex-1 flex-col overflow-hidden">
			<div class="border-b bg-muted/5 p-4 pb-2">
				<div class="mb-3 text-xs text-muted-foreground">
					Universal terms automatically highlighted in your document.
				</div>
				<div class="mb-2 flex gap-2">
					<div class="relative flex-1">
						<div class="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground">
							<Search size={16} />
						</div>
						<Input
							placeholder="Search library..."
							class="pl-8"
							bind:value={filter}
						/>
					</div>
					<select
						class="h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm dark:border-zinc-800"
						bind:value={categoryFilter}
					>
						{#each categories as c}
							<option value={c}>{c}</option>
						{/each}
					</select>
				</div>
			</div>
			<div class="flex-1 space-y-2 overflow-y-auto p-4">
				{#each dictionaryTerms as item}
					{@const isOverridden = terms.some((t) => t.term.toLowerCase() === item.term.toLowerCase())}
					<div
						class="flex flex-col rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50 dark:border-zinc-800"
					>
						<div class="mb-1 flex items-center justify-between">
							<span class="text-sm font-bold">{item.term}</span>
							<div class="flex items-center gap-2">
								<Badge variant="outline" class="h-4 px-1 text-[9px] opacity-50"
									>{item.category || 'General'}</Badge
								>
								{#if isOverridden}
									<Badge
										variant="secondary"
										class="border-amber-200 bg-amber-100 text-amber-700 hover:bg-amber-100"
										>Overridden</Badge
									>
								{/if}
							</div>
						</div>
						<p class="line-clamp-2 text-xs text-muted-foreground" title={item.definition}>
							{item.definition}
						</p>
					</div>
				{/each}
				{#if dictionaryTerms.length === 0}
					<p class="py-4 text-center text-xs text-muted-foreground">No terms match your filter.</p>
				{/if}
			</div>
		</TabsContent>

		<!-- CUSTOM TERMS TAB -->
		<TabsContent value="custom" class="mt-0 flex flex-1 flex-col overflow-hidden">
			<div class="space-y-3 border-b bg-muted/10 p-4 dark:border-zinc-800">
				<h3 class="text-xs font-bold uppercase text-muted-foreground">Override / Add Definition</h3>
				<Input placeholder="Term (e.g. 'The Product')" bind:value={newTerm} />
				<Textarea
					placeholder="Definition..."
					class="min-h-[60px]"
					bind:value={newDef}
				/>
				<Button size="sm" onclick={handleAdd} disabled={!newTerm || !newDef} class="w-full">
					<Plus size={14} class="mr-2" /> Save Definition
				</Button>
			</div>

			<div class="flex-1 space-y-2 overflow-y-auto p-4 pt-4">
				{#if terms.length === 0}
					<p class="py-4 text-center text-sm text-muted-foreground">No custom overrides yet.</p>
				{/if}
				{#each terms as term (term.id)}
					<div
						class="group rounded-lg border bg-card p-3 transition-all hover:shadow-sm dark:border-zinc-800"
					>
						<div class="mb-1 flex items-start justify-between">
							<span class="text-sm font-bold" style="color: {term.color}">{term.term}</span>
							<button
								onclick={() => onDeleteTerm(term.id)}
								class="text-muted-foreground hover:text-destructive"
							>
								<Trash2 size={12} />
							</button>
						</div>
						<p class="text-xs leading-relaxed text-muted-foreground">{term.definition}</p>
					</div>
				{/each}
			</div>
		</TabsContent>
	</Tabs>
</div>
