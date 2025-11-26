<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface LabelProps {
		class?: string;
		children?: Snippet;
		for?: string;
	}

	let { class: className, children, for: htmlFor }: LabelProps = $props();
</script>

<label
	for={htmlFor}
	class={cn(
		'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
		className
	)}
>
	{@render children?.()}
</label>
