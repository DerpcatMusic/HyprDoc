<script lang="ts">
	import type { Snippet } from 'svelte';

	interface TooltipProps {
		children?: Snippet;
	}

	let {
		children
	}: TooltipProps = $props();
</script>

<div class="relative inline-block">
	{@render children?.()}
</div>