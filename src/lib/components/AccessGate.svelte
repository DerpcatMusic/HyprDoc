<script lang="ts">
	import { Button, Input, Label, Card } from '$lib/components/ui';
	import { ShieldCheck, Mail, Lock, ArrowRight } from 'lucide-svelte';

	interface AccessGateProps {
		documentTitle: string;
		onAccessGranted: (email: string) => void;
	}

	let { documentTitle, onAccessGranted }: AccessGateProps = $props();

	let step = $state<'email' | 'otp'>('email');
	let email = $state('');
	let otp = $state('');
	let isLoading = $state(false);

	function handleEmailSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;
		// Simulate API call to send OTP
		setTimeout(() => {
			isLoading = false;
			step = 'otp';
		}, 1500);
	}

	function handleOtpSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;
		// Simulate OTP verification
		setTimeout(() => {
			if (otp === '123456') {
				// Mock OTP
				isLoading = false;
				onAccessGranted(email);
			} else {
				alert('Invalid Code (Try 123456)');
				isLoading = false;
			}
		}, 1500);
	}
</script>

<div
	class="flex min-h-screen items-center justify-center bg-zinc-50 p-4 dark:bg-zinc-950"
>
	<Card class="w-full max-w-md space-y-8 p-8 shadow-2xl dark:border-zinc-800">
		<div class="space-y-2 text-center">
			<div
				class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary"
			>
				<ShieldCheck size={32} />
			</div>
			<h1 class="text-2xl font-bold tracking-tight">Secure Access</h1>
			<p class="text-sm text-muted-foreground">
				You have been invited to view and sign <br />
				<span class="font-semibold text-foreground">{documentTitle}</span>
			</p>
		</div>

		{#if step === 'email'}
			<form
				onsubmit={handleEmailSubmit}
				class="animate-in slide-in-from-right duration-300 space-y-4"
			>
				<div class="space-y-2">
					<Label>Email Address</Label>
					<div class="relative">
						<div class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground">
							<Mail size={16} />
						</div>
						<Input
							type="email"
							placeholder="name@company.com"
							class="pl-9"
							required
							bind:value={email}
						/>
					</div>
				</div>
				<Button class="w-full" disabled={isLoading}>
					{isLoading ? 'Sending Code...' : 'Send Verification Code'}
				</Button>
			</form>
		{:else}
			<form
				onsubmit={handleOtpSubmit}
				class="animate-in slide-in-from-right duration-300 space-y-4"
			>
				<div class="space-y-2">
					<Label>Verification Code</Label>
					<div class="relative">
						<div class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground">
							<Lock size={16} />
						</div>
						<Input
							placeholder="123456"
							class="pl-9 text-center font-mono text-lg tracking-widest"
							required
							maxlength={6}
							bind:value={otp}
						/>
					</div>
					<p class="text-center text-[10px] text-muted-foreground">
						Check your email for the code.
					</p>
				</div>
				<Button class="w-full" disabled={isLoading}>
					{isLoading ? 'Verifying...' : 'Access Document'}
					<ArrowRight size={16} class="ml-2" />
				</Button>
				<button
					type="button"
					onclick={() => (step = 'email')}
					class="w-full text-center text-xs text-muted-foreground hover:underline"
				>
					Change Email
				</button>
			</form>
		{/if}

		<div class="border-t pt-6 text-center dark:border-zinc-800">
			<p
				class="flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground"
			>
				<Lock size={10} /> End-to-End Encrypted
			</p>
		</div>
	</Card>
</div>
