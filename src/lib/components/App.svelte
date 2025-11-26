<script lang="ts">
	import { useDocument } from '$lib/stores/document.svelte';
	import Viewer from '$lib/components/Viewer.svelte';
	import AccessGate from '$lib/components/AccessGate.svelte';
	import Toolbox from '$lib/components/Toolbox.svelte';
	import PropertiesPanel from '$lib/components/PropertiesPanel.svelte';
	import SettingsView from '$lib/components/views/SettingsView.svelte';
	import DashboardView from '$lib/components/views/DashboardView.svelte';
	import EditorCanvas from '$lib/components/EditorCanvas.svelte';
	import GlossaryManager from '$lib/components/GlossaryManager.svelte';
	import {
		FileText,
		Settings,
		LayoutTemplate,
		ArrowLeft,
		Share,
		Moon,
		Sun,
		Book,
		Package
	} from 'lucide-svelte';
	import {
		Button,
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogFooter
	} from '$lib/components/ui';
	import { onMount } from 'svelte';

	const docStore = useDocument();

	let recipientEmail = $state<string | null>(null);
	let isDarkMode = $state(false);
	let showPartyManager = $state(false);
	let showGlossary = $state(false);
	let showSendModal = $state(false);

	// Toggle Dark Mode
	$effect(() => {
		if (isDarkMode) document.documentElement.classList.add('dark');
		else document.documentElement.classList.remove('dark');
	});

	function handleDragStartToolbox(e: DragEvent, type: any) {
		e.dataTransfer?.setData('application/hyprdoc-new', type);
		e.dataTransfer!.effectAllowed = 'copy';
	}

	function handleDropCanvas(e: DragEvent, targetId?: string) {
		e.preventDefault();
		const newType = e.dataTransfer?.getData('application/hyprdoc-new') as any;
		if (newType) {
			docStore.addBlock(newType, targetId);
		}
	}
</script>

{#if docStore.mode === 'recipient'}
	{#if !recipientEmail}
		<AccessGate
			documentTitle={docStore.doc.title}
			onAccessGranted={(email) => (recipientEmail = email)}
		/>
	{:else}
		<Viewer
			blocks={docStore.doc.blocks}
			snapshot={docStore.doc.snapshot}
			settings={docStore.doc.settings}
			parties={docStore.doc.parties}
			terms={docStore.doc.terms}
		/>
	{/if}
{:else if docStore.mode === 'preview'}
	<div class="min-h-screen bg-background font-sans transition-colors">
		<div
			class="sticky top-0 z-50 flex items-center justify-between border-b-2 border-black bg-background/80 px-6 py-4 shadow-none backdrop-blur-md dark:border-zinc-700"
		>
			<Button
				variant="ghost"
				onclick={() => docStore.setMode('edit')}
				class="gap-2 font-mono hover:bg-black hover:text-white dark:text-white dark:hover:bg-white dark:hover:text-black"
				><ArrowLeft size={16} /> BACK TO EDITOR</Button
			>
			<div class="flex gap-2">
				<Button
					variant="ghost"
					size="icon"
					onclick={() => (isDarkMode = !isDarkMode)}
					class="hover:bg-black hover:text-white dark:text-white dark:hover:bg-white dark:hover:text-black"
					>{#if isDarkMode}<Sun size={18} />{:else}<Moon size={18} />{/if}</Button
				>
				<Button
					onclick={() => docStore.setMode('recipient')}
					class="gap-2 border-2 border-black bg-primary font-mono text-white shadow-hypr-sm transition-all hover:bg-primary/90 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:border-zinc-700"
					><Share size={16} /> SHARE LINK</Button
				>
			</div>
		</div>
		<Viewer
			blocks={docStore.doc.blocks}
			settings={docStore.doc.settings}
			parties={docStore.doc.parties}
			variables={docStore.doc.variables}
			terms={docStore.doc.terms}
			isPreview={true}
		/>
	</div>
{:else}
	<div
		class="flex h-screen w-screen overflow-hidden bg-background font-sans text-foreground"
	>
		<!-- Navigation Sidebar -->
		<div
			class="z-30 hidden w-16 flex-shrink-0 flex-col items-center gap-6 border-r-2 border-black bg-white py-6 shadow-md dark:border-zinc-800 dark:bg-zinc-950 md:flex md:w-20"
		>
			<div
				class="flex h-10 w-10 items-center justify-center border-2 border-black bg-primary text-xl font-bold text-white shadow-hypr-sm dark:border-zinc-700"
			>
				H
			</div>
			<div class="flex w-full flex-1 flex-col items-center gap-4 px-2">
				<Button
					variant={docStore.mode === 'dashboard' ? 'secondary' : 'ghost'}
					size="icon"
					class="h-10 w-10 rounded-none border-2 border-transparent transition-colors hover:border-black hover:bg-black hover:text-white dark:text-zinc-400 dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
					onclick={() => docStore.setMode('dashboard')}
					title="Dashboard"><LayoutTemplate size={20} /></Button
				>
				<Button
					variant={docStore.mode === 'edit' ? 'secondary' : 'ghost'}
					size="icon"
					class="h-10 w-10 rounded-none border-2 border-transparent transition-colors hover:border-black hover:bg-black hover:text-white dark:text-zinc-400 dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
					onclick={() => docStore.setMode('edit')}
					title="Editor"><Package size={20} /></Button
				>
				<Button
					variant={docStore.mode === 'settings' ? 'secondary' : 'ghost'}
					size="icon"
					class="h-10 w-10 rounded-none border-2 border-transparent transition-colors hover:border-black hover:bg-black hover:text-white dark:text-zinc-400 dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
					onclick={() => docStore.setMode('settings')}
					title="Settings"><Settings size={20} /></Button
				>
			</div>
			<div class="flex w-full flex-col items-center gap-4 px-2">
				<Button
					variant={showGlossary ? 'secondary' : 'ghost'}
					size="icon"
					class="h-10 w-10 rounded-none border-2 border-transparent transition-colors hover:border-black hover:bg-black hover:text-white dark:text-zinc-400 dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
					onclick={() => (showGlossary = !showGlossary)}
					title="Glossary"><Book size={20} /></Button
				>
				<Button
					variant="ghost"
					size="icon"
					class="h-10 w-10 rounded-none border-2 border-transparent transition-colors hover:border-black hover:bg-black hover:text-white dark:text-zinc-400 dark:hover:border-white dark:hover:bg-white dark:hover:text-black"
					onclick={() => (isDarkMode = !isDarkMode)}
					>{#if isDarkMode}<Sun size={20} />{:else}<Moon
							size={20}
						/>{/if}</Button
				>
			</div>
		</div>

		<!-- Glossary Sidebar -->
		{#if showGlossary}
			<div
				class="shadow-hypr z-20 w-80 flex-shrink-0 animate-in slide-in-from-left duration-300 border-r-2 border-black bg-background dark:border-zinc-800"
			>
				<GlossaryManager
					terms={docStore.doc.terms}
					onAddTerm={(t) =>
						docStore.setDoc((p) => ({ ...p, terms: [...p.terms, t] }))}
					onDeleteTerm={(id) =>
						docStore.setDoc((p) => ({
							...p,
							terms: p.terms.filter((t) => t.id !== id)
						}))}
					onClose={() => (showGlossary = false)}
				/>
			</div>
		{/if}

		<!-- Routes -->
		{#if docStore.mode === 'dashboard'}
			<DashboardView
				documents={[docStore.doc]}
				auditLog={docStore.doc.auditLog}
				onCreate={() => {
					docStore.setMode('edit');
					docStore.addAuditLog('created');
				}}
				onSelect={() => docStore.setMode('edit')}
			/>
		{/if}

		{#if docStore.mode === 'settings'}
			<SettingsView
				settings={docStore.doc.settings}
				onUpdate={(s) =>
					docStore.setDoc((prev) => ({ ...prev, settings: s }))}
				parties={docStore.doc.parties}
				onUpdateParties={(p) =>
					docStore.setDoc((prev) => ({ ...prev, parties: p }))}
			/>
		{/if}

		{#if docStore.mode === 'edit'}
			<!-- TOOLBOX -->
			<div
				class="z-20 hidden w-72 flex-shrink-0 flex-col border-r-2 border-black bg-background shadow-sm dark:border-zinc-800 md:flex"
			>
				<div
					class="flex h-16 items-center justify-between border-b-2 border-black bg-muted/20 p-5 dark:border-zinc-800"
				>
					<span class="font-mono text-sm font-black uppercase tracking-widest"
						>Components</span
					>
					<span class="font-mono text-xs opacity-50">LIB_V2</span>
				</div>
				<Toolbox
					onDragStart={handleDragStartToolbox}
					onAddBlock={docStore.addBlock}
				/>
			</div>

			<!-- MAIN EDITOR AREA - FLEX CONTAINER -->
			<div class="relative flex min-w-0 flex-1">
				<!-- CANVAS -->
				<EditorCanvas
					docTitle={docStore.doc.title}
					docSettings={docStore.doc.settings}
					blocks={docStore.doc.blocks}
					parties={docStore.doc.parties}
					selectedBlockId={docStore.selectedBlockId}
					{showPartyManager}
					onTitleChange={(t) =>
						docStore.setDoc((prev) => ({ ...prev, title: t }))}
					onTogglePartyManager={(show) => (showPartyManager = show)}
					onPreview={() => docStore.setMode('preview')}
					onSend={() => (showSendModal = true)}
					onSelectBlock={docStore.setSelectedBlockId}
					onUpdateBlock={docStore.updateBlock}
					onDeleteBlock={docStore.deleteBlock}
					onAddBlock={docStore.addBlock}
					onDropBlock={handleDropCanvas}
					onUpdateParty={(i, p) => {
						const newParties = [...docStore.doc.parties];
						newParties[i] = p;
						docStore.setDoc((d) => ({ ...d, parties: newParties }));
					}}
				/>

				<!-- PROPERTIES PANEL (Relative Flex Item) -->
				<PropertiesPanel
					block={docStore.doc.blocks.find(
						(b) => b.id === docStore.selectedBlockId
					) || null}
					parties={docStore.doc.parties}
					onUpdate={docStore.updateBlock}
					onDelete={docStore.deleteBlock}
					onClose={() => docStore.setSelectedBlockId(null)}
				/>
			</div>
		{/if}

		<!-- SEND MODAL -->
		<Dialog open={showSendModal} onOpenChange={(v) => (showSendModal = v)}>
			<DialogContent
				class="border-2 border-black bg-white shadow-hypr dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
			>
				<DialogHeader
					><DialogTitle class="font-mono text-xl font-black uppercase"
						>Secure Transmission</DialogTitle
					></DialogHeader
				>
				<div
					class="border-2 border-dashed border-black/20 bg-muted/10 p-6 text-center text-sm dark:border-zinc-700"
				>
					<p
						class="mb-4 flex items-center justify-between border-2 border-black bg-white p-3 font-mono text-xs shadow-sm select-all dark:border-zinc-700 dark:bg-black"
					>
						<span class="mr-2 truncate"
							>https://hyprdoc.com/s/{docStore.doc.id || 'draft-id'}</span
						>
						<span
							class="cursor-pointer bg-primary px-1 font-bold text-white hover:bg-primary/80"
							>COPY</span
						>
					</p>
					<p
						class="font-mono text-xs uppercase tracking-wide text-muted-foreground"
					>
						Recipient will require email verification
					</p>
				</div>
				<DialogFooter>
					<Button
						onclick={() => {
							docStore.setDoc((prev) => ({
								...prev,
								status: 'sent',
								snapshot: prev.blocks
							}));
							showSendModal = false;
							docStore.addAuditLog('sent', 'Document snapshot created');
						}}
						class="border-2 border-black bg-black font-mono text-white shadow-hypr-sm transition-all hover:bg-primary hover:text-white active:translate-x-[2px] active:translate-y-[2px] active:shadow-none dark:border-zinc-700 dark:bg-white dark:text-black dark:hover:bg-primary"
						>GENERATE LINK & SNAPSHOT</Button
					>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</div>
{/if}
