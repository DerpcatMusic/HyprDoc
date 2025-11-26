<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface DialogFooterProps {
		class?: string;
		children?: Snippet;
	}

	let { class: className, children }: DialogFooterProps = $props();
</script>

<div class={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}>
	{@render children?.()}
</div>
