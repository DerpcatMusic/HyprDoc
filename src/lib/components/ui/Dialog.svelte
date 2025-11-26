<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface DialogProps {
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		children?: Snippet;
	}

	let { open = $bindable(false), onOpenChange, children }: DialogProps = $props();

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		onOpenChange?.(newOpen);
	}
</script>

<DialogPrimitive.Root {open} onOpenChange={handleOpenChange}>
	{@render children?.()}
</DialogPrimitive.Root>
