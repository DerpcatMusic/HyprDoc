<script lang="ts">
	import type { DocumentState, AuditLogEntry } from '$lib/types';
	import { Card, Button, Badge } from '$lib/components/ui';
	import {
		FileText,
		PlusCircle,
		MoreHorizontal,
		Clock,
		CheckCircle2,
		Eye,
		PenTool
	} from 'lucide-svelte';

	interface DashboardViewProps {
		documents: DocumentState[];
		auditLog?: AuditLogEntry[];
		onCreate: () => void;
		onSelect: (id: string) => void;
	}

	let {
		documents,
		auditLog = [],
		onCreate,
		onSelect
	}: DashboardViewProps = $props();

	function getStatusColor(status: string) {
		switch (status) {
			case 'sent':
				return 'bg-blue-100 text-blue-700 border-blue-200';
			case 'completed':
				return 'bg-green-100 text-green-700 border-green-200';
			default:
				return 'bg-zinc-100 text-zinc-700 border-zinc-200';
		}
	}
</script>

<div class="flex flex-1 overflow-hidden bg-muted/10 dark:bg-zinc-950">
	<!-- Main Content -->
	<div class="flex-1 overflow-y-auto p-8">
		<div class="mx-auto max-w-5xl space-y-8">
			<div class="flex items-center justify-between">
				<h1 class="text-3xl font-bold">Dashboard</h1>
				<Button onclick={onCreate} class="gap-2"
					><PlusCircle size={16} /> New Document</Button
				>
			</div>

			<div class="grid gap-4">
				{#each documents as doc, i (i)}
					<!-- svelte-ignore a11y_click_events_have_key_events -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<Card
						class="flex cursor-pointer items-center justify-between p-4 transition-colors hover:border-primary/50"
						onclick={() => onSelect(doc.id || 'new')}
					>
						<div class="flex items-center gap-4">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary"
							>
								<FileText size={24} />
							</div>
							<div>
								<h3 class="text-lg font-semibold">{doc.title}</h3>
								<p class="text-sm text-muted-foreground">
									Updated {new Date(doc.updatedAt || Date.now()).toLocaleDateString()}
								</p>
							</div>
						</div>
						<div class="flex items-center gap-4">
							<Badge class={getStatusColor(doc.status)} variant="outline"
								>{doc.status.toUpperCase()}</Badge
							>
							<Button variant="ghost" size="icon"
								><MoreHorizontal size={16} /></Button
							>
						</div>
					</Card>
				{/each}
				{#if documents.length === 0}
					<div
						class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-muted-foreground"
					>
						<FileText size={48} class="mb-4 opacity-20" />
						<p>No documents found.</p>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Audit Log Sidebar -->
	<div
		class="hidden w-80 flex-col border-l bg-background dark:border-zinc-800 xl:flex"
	>
		<div
			class="flex items-center gap-2 border-b p-6 text-sm font-semibold dark:border-zinc-800"
		>
			<Clock size={16} /> Recent Activity
		</div>
		<div class="flex-1 space-y-6 overflow-y-auto p-6">
			{#if auditLog.length === 0}
				<p class="text-center text-xs italic text-muted-foreground">
					No activity recorded.
				</p>
			{:else}
				{#each auditLog as log (log.id)}
					<div class="relative border-l border-muted pb-6 pl-6 last:pb-0">
						<div
							class="absolute -left-1.5 top-0 h-3 w-3 rounded-full border-2 border-background bg-primary"
						></div>
						<div class="flex flex-col gap-1">
							<span class="font-mono text-xs text-muted-foreground"
								>{new Date(log.timestamp).toLocaleTimeString()}</span
							>
							<span class="flex items-center gap-2 text-sm font-medium">
								{#if log.action === 'created'}
									<PlusCircle size={12} class="text-blue-500" />
								{:else if log.action === 'signed'}
									<CheckCircle2 size={12} class="text-green-500" />
								{:else if log.action === 'viewed'}
									<Eye size={12} class="text-amber-500" />
								{:else if log.action === 'edited'}
									<PenTool size={12} class="text-zinc-500" />
								{/if}
								<span class="capitalize">{log.action}</span> by {log.user}
							</span>
							{#if log.details}
								<span
									class="rounded bg-muted/30 p-1.5 text-xs text-muted-foreground"
									>{log.details}</span
								>
							{/if}
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
