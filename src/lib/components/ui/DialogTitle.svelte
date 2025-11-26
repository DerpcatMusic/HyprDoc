<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface DialogTitleProps {
		class?: string;
		children?: Snippet;
	}

	let { class: className, children }: DialogTitleProps = $props();
</script>

<DialogPrimitive.Title
	class={cn('text-xl font-black font-mono uppercase leading-none tracking-tight', className)}
>
	{@render children?.()}
</DialogPrimitive.Title>
