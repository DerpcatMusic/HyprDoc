<script lang="ts">
	import type { Snippet } from 'svelte';

	interface TooltipProviderProps {
		children?: Snippet;
	}

	let {
		children
	}: TooltipProviderProps = $props();
</script>

<div class="relative">
	{@render children?.()}
</div>