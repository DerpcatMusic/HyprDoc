<script lang="ts">
	import { cn } from '$lib/utils';

	interface TooltipTriggerProps {
		children?: any;
		class?: string;
		style?: string;
	}

	let {
		children,
		class: className,
		style,
		...restProps
	}: TooltipTriggerProps = $props();
</script>

<span 
	class={cn('cursor-help underline decoration-dotted underline-offset-4 decoration-primary/50', className)}
	style={style}
	{...restProps}
>
	{children}
</span>