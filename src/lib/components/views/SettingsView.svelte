<script lang="ts">
	import type { DocumentSettings, Integration, Party } from '$lib/types';
	import {
		Card,
		Label,
		Input,
		Button,
		Tabs,
		TabsList,
		TabsTrigger,
		TabsContent,
		Badge
	} from '$lib/components/ui';
	import {
		CreditCard,
		Webhook,
		Database,
		Link as LinkIcon,
		CheckCircle2,
		ArrowUp,
		ArrowDown,
		Users,
		Shuffle
	} from 'lucide-svelte';

	interface SettingsViewProps {
		settings?: DocumentSettings;
		onUpdate: (settings: DocumentSettings) => void;
		parties?: Party[];
		onUpdateParties?: (parties: Party[]) => void;
	}

	let {
		settings,
		onUpdate,
		parties,
		onUpdateParties
	}: SettingsViewProps = $props();

	const INTEGRATIONS_MOCK: Integration[] = [
		{ id: '1', name: 'Salesforce CRM', type: 'crm', connected: false, icon: 'SF' },
		{ id: '2', name: 'HubSpot', type: 'crm', connected: true, icon: 'HS' },
		{ id: '3', name: 'Google Drive', type: 'storage', connected: false, icon: 'GD' },
		{ id: '4', name: 'AWS S3 Bucket', type: 'storage', connected: false, icon: 'S3' }
	];

	function handleChange(key: keyof DocumentSettings, value: any) {
		if (settings) {
			onUpdate({ ...settings, [key]: value });
		}
	}

	function moveParty(index: number, direction: 'up' | 'down') {
		if (!parties || !onUpdateParties) return;
		const newParties = [...parties];
		if (direction === 'up' && index > 0) {
			[newParties[index], newParties[index - 1]] = [
				newParties[index - 1],
				newParties[index]
			];
		} else if (direction === 'down' && index < newParties.length - 1) {
			[newParties[index], newParties[index + 1]] = [
				newParties[index + 1],
				newParties[index]
			];
		}
		onUpdateParties(newParties);
	}
</script>

<div class="flex-1 overflow-y-auto bg-muted/10 p-8 dark:bg-zinc-950">
	<div class="mx-auto max-w-4xl space-y-6">
		<h1 class="text-3xl font-bold">Document Settings</h1>

		<Tabs value="workflow" class="w-full">
			<TabsList>
				<TabsTrigger value="workflow">Workflow</TabsTrigger>
				<TabsTrigger value="branding">Branding</TabsTrigger>
				<TabsTrigger value="integrations">Integrations</TabsTrigger>
			</TabsList>

			<TabsContent value="workflow">
				<div class="grid gap-6">
					<Card class="space-y-4 p-6">
						<div class="flex items-center justify-between">
							<div class="space-y-1">
								<h3 class="flex items-center gap-2 text-lg font-semibold">
									<Shuffle size={18} /> Signing Order
								</h3>
								<p class="text-sm text-muted-foreground">
									Enforce a strict sequence for signing.
								</p>
							</div>
							<div class="flex items-center gap-2 rounded-lg bg-muted/50 p-1">
								<button
									onclick={() => handleChange('signingOrder', 'parallel')}
									class={`rounded-md px-3 py-1 text-xs transition-all ${settings?.signingOrder !== 'sequential' ? 'bg-background text-foreground shadow' : 'text-muted-foreground'}`}
								>
									Parallel
								</button>
								<button
									onclick={() => handleChange('signingOrder', 'sequential')}
									class={`rounded-md px-3 py-1 text-xs transition-all ${settings?.signingOrder === 'sequential' ? 'bg-background text-foreground shadow' : 'text-muted-foreground'}`}
								>
									Sequential
								</button>
							</div>
						</div>

						{#if settings?.signingOrder === 'sequential'}
							<div
								class="mt-4 overflow-hidden rounded-lg border dark:border-zinc-800"
							>
								<div
									class="border-b bg-muted/30 px-4 py-2 text-xs font-semibold text-muted-foreground dark:border-zinc-800"
								>
									Signing Sequence
								</div>
								<div class="divide-y dark:divide-zinc-800">
									{#each parties || [] as party, i (party.id)}
										<div class="flex items-center gap-3 bg-card p-3">
											<div
												class="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
												style="background-color: {party.color}"
											>
												{i + 1}
											</div>
											<span class="flex-1 text-sm font-medium">{party.name}</span>
											<div class="flex gap-1">
												<Button
													variant="ghost"
													size="icon"
													class="h-6 w-6"
													disabled={i === 0}
													onclick={() => moveParty(i, 'up')}
													><ArrowUp size={12} /></Button
												>
												<Button
													variant="ghost"
													size="icon"
													class="h-6 w-6"
													disabled={i === (parties?.length || 0) - 1}
													onclick={() => moveParty(i, 'down')}
													><ArrowDown size={12} /></Button
												>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					</Card>

					<Card class="space-y-6 p-6">
						<h3 class="text-lg font-semibold">Notifications & Expiry</h3>
						<div class="flex items-center justify-between">
							<div class="space-y-0.5">
								<Label class="text-base">Email Reminders</Label>
								<p class="text-xs text-muted-foreground">
									Automatically remind signers after inactivity.
								</p>
							</div>
							<input
								type="checkbox"
								checked={settings?.emailReminders || false}
								onchange={(e) =>
									handleChange(
										'emailReminders',
										(e.target as HTMLInputElement).checked
									)}
							/>
						</div>
						<div class="grid grid-cols-2 gap-4">
							<div class="space-y-2">
								<Label>Reminder Days</Label>
								<Input
									type="number"
									value={String(settings?.reminderDays || 3)}
									oninput={(e) =>
										handleChange(
											'reminderDays',
											parseInt((e.target as HTMLInputElement).value)
										)}
								/>
							</div>
							<div class="space-y-2">
								<Label>Expiration Days</Label>
								<Input
									type="number"
									value={String(settings?.expirationDays || 30)}
									oninput={(e) =>
										handleChange(
											'expirationDays',
											parseInt((e.target as HTMLInputElement).value)
										)}
								/>
							</div>
						</div>
					</Card>
				</div>
			</TabsContent>

			<TabsContent value="branding">
				<Card class="space-y-6 p-6">
					<div class="space-y-4">
						<h3 class="text-lg font-semibold">Visual Identity</h3>
						<p class="text-sm text-muted-foreground">
							Customize how the document looks for your recipients.
						</p>
						<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
							<div class="space-y-2">
								<Label>Font Family</Label>
								<select
									class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
									value={settings?.fontFamily || ''}
									onchange={(e) =>
										handleChange(
											'fontFamily',
											(e.target as HTMLSelectElement).value
										)}
								>
									<option value="Inter">Inter</option>
									<option value="Roboto">Roboto</option>
									<option value="Open Sans">Open Sans</option>
									<option value="Courier New">Courier New</option>
								</select>
							</div>
							<div class="space-y-2">
								<Label>Brand Primary Color</Label>
								<div class="flex gap-2">
									<input
										type="color"
										class="h-10 w-10 cursor-pointer rounded-md border border-input p-1"
										value={settings?.brandColor || '#000000'}
										oninput={(e) =>
											handleChange(
												'brandColor',
												(e.target as HTMLInputElement).value
											)}
									/>
									<Input
										value={settings?.brandColor || '#000000'}
										oninput={(e) =>
											handleChange(
												'brandColor',
												(e.target as HTMLInputElement).value
											)}
									/>
								</div>
							</div>
							<div class="space-y-2">
								<Label>Company Logo URL</Label>
								<Input
									value={settings?.logoUrl || ''}
									oninput={(e) =>
										handleChange(
											'logoUrl',
											(e.target as HTMLInputElement).value
										)}
									placeholder="https://..."
								/>
							</div>
							<div class="space-y-2">
								<Label>Company Name</Label>
								<Input
									value={settings?.companyName || ''}
									oninput={(e) =>
										handleChange(
											'companyName',
											(e.target as HTMLInputElement).value
										)}
									placeholder="Acme Corp"
								/>
							</div>
						</div>
					</div>
				</Card>
			</TabsContent>

			<TabsContent value="integrations">
				<div class="grid gap-4">
					<Card class="p-6">
						<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
							<Webhook size={20} /> Webhooks
						</h3>
						<div class="space-y-2">
							<Label>Event Callback URL</Label>
							<Input
								value={settings?.webhookUrl || ''}
								oninput={(e) =>
									handleChange(
										'webhookUrl',
										(e.target as HTMLInputElement).value
									)}
								placeholder="https://api.yourcompany.com/webhooks/hyprdoc"
								class="font-mono text-xs"
							/>
							<p class="text-[10px] text-muted-foreground">
								We will send POST requests on 'document.signed' events.
							</p>
						</div>
					</Card>

					<h3 class="mt-4 text-lg font-semibold">Connected Apps</h3>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						{#each INTEGRATIONS_MOCK as int (int.id)}
							<Card class="flex items-center justify-between p-4">
								<div class="flex items-center gap-3">
									<div
										class="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-bold text-muted-foreground"
									>
										{int.icon}
									</div>
									<div>
										<p class="text-sm font-medium">{int.name}</p>
										<p class="text-xs capitalize text-muted-foreground">
											{int.type}
										</p>
									</div>
								</div>
								{#if int.connected}
									<Badge
										class="border-green-200 bg-green-100 text-green-700 hover:bg-green-100"
										><CheckCircle2 size={12} class="mr-1" /> Active</Badge
									>
								{:else}
									<Button variant="outline" size="sm">Connect</Button>
								{/if}
							</Card>
						{/each}
					</div>
				</div>
			</TabsContent>
		</Tabs>
	</div>
</div>
