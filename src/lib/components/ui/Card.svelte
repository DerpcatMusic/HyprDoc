<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface CardProps {
		class?: string;
		children?: Snippet;
	}

	let { class: className, children }: CardProps = $props();
</script>

<div
	class={cn(
		'rounded-lg border-2 border-black bg-card text-card-foreground shadow-sm dark:border-zinc-800',
		className
	)}
>
	{@render children?.()}
</div>
