<script lang="ts">
	import { onMount } from 'svelte';
	import SignaturePad from 'signature_pad';
	import { Button } from '$lib/components/ui';
	import { Eraser, CheckCircle2 } from 'lucide-svelte';
	import { cn } from '$lib/utils';

	interface SignatureWidgetProps {
		initialValue?: string;
		onSign: (value: string) => void;
		signatureId?: string;
		signedAt?: number;
		disabled?: boolean;
	}

	let {
		initialValue,
		onSign,
		signatureId,
		signedAt,
		disabled = false
	}: SignatureWidgetProps = $props();

	let canvas = $state<HTMLCanvasElement>();
	let signaturePad: SignaturePad | null = null;
	let isEmpty = $state(true);
	let signatureData = $state(initialValue || '');

	onMount(() => {
		if (canvas) {
			signaturePad = new SignaturePad(canvas, {
				backgroundColor: 'rgba(255, 255, 255, 0)',
				penColor: 'black'
			});

			signaturePad.addEventListener('endStroke', () => {
				if (signaturePad && !signaturePad.isEmpty()) {
					isEmpty = false;
					const data = signaturePad.toDataURL();
					signatureData = data;
					onSign(data);
				}
			});

			// Resize canvas correctly
			const resizeCanvas = () => {
				if (!canvas) return;
				const ratio = Math.max(window.devicePixelRatio || 1, 1);
				canvas.width = canvas.offsetWidth * ratio;
				canvas.height = canvas.offsetHeight * ratio;
				canvas.getContext('2d')?.scale(ratio, ratio);
				if (signatureData) {
					signaturePad?.fromDataURL(signatureData);
				}
			};

			window.addEventListener('resize', resizeCanvas);
			resizeCanvas();

			if (initialValue) {
				signaturePad.fromDataURL(initialValue);
				isEmpty = false;
			}

			if (disabled) {
				signaturePad.off();
			}

			return () => {
				window.removeEventListener('resize', resizeCanvas);
				signaturePad?.off();
			};
		}
	});

	function clear() {
		if (disabled) return;
		signaturePad?.clear();
		isEmpty = true;
		signatureData = '';
		onSign('');
	}
</script>

<div class="w-full max-w-md">
	{#if signatureData && disabled}
		<div
			class="relative rounded-lg border-2 border-green-600 bg-green-50 p-4 dark:border-green-500 dark:bg-green-900/20"
		>
			<img src={signatureData} alt="Signature" class="h-24 object-contain" />
			<div
				class="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] font-bold uppercase text-green-700 dark:text-green-400"
			>
				<CheckCircle2 size={12} />
				Signed {signedAt ? new Date(signedAt).toLocaleDateString() : ''}
			</div>
		</div>
	{:else}
		<div
			class={cn(
				'relative overflow-hidden rounded-lg border-2 border-dashed border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900',
				!isEmpty && 'border-solid border-black dark:border-white'
			)}
		>
			<canvas
				bind:this={canvas}
				class="block h-40 w-full touch-none cursor-crosshair"
			></canvas>

			{#if isEmpty}
				<div
					class="pointer-events-none absolute inset-0 flex items-center justify-center text-muted-foreground opacity-50"
				>
					<span class="font-handwriting text-2xl">Sign Here</span>
				</div>
			{/if}

			<div class="absolute bottom-2 right-2 flex gap-2">
				<Button
					size="sm"
					variant="ghost"
					class="h-7 px-2 text-xs"
					onclick={clear}
					disabled={isEmpty || disabled}
				>
					<Eraser size={12} class="mr-1" /> Clear
				</Button>
			</div>
		</div>
		<p class="mt-1 text-[10px] text-muted-foreground">
			By signing, you agree to the terms set forth in this document.
		</p>
	{/if}
</div>
