<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface TooltipContentProps {
		children?: Snippet;
		class?: string;
	}

	let {
		children,
		class: className
	}: TooltipContentProps = $props();
</script>

<div class={cn(
	'absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs p-2 text-xs text-popover-foreground bg-popover border-2 border-black rounded-none shadow-hypr z-[1000] font-mono dark:bg-zinc-900 dark:text-white dark:border-zinc-700',
	className
)}>
	{@render children?.()}
	<div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black dark:border-t-zinc-700"></div>
</div>