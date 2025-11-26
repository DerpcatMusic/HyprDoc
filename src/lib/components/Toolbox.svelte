<script lang="ts">
	import { BlockType } from '$lib/types';
	import {
		Type,
		AlignLeft,
		Minus,
		Image as ImageIcon,
		Settings,
		List,
		CheckSquare,
		Calendar,
		FileSignature,
		Hash,
		Mail,
		CircleDot,
		UploadCloud,
		FileText,
		Calculator,
		CreditCard,
		Video,
		DollarSign
	} from 'lucide-svelte';
	import { cn } from '$lib/utils';

	interface ToolboxProps {
		onDragStart: (e: DragEvent, type: BlockType) => void;
		onAddBlock: (type: BlockType) => void;
	}

	let { onDragStart, onAddBlock }: ToolboxProps = $props();

	// Colors for categories - enhanced for dark mode
	const CATEGORY_COLORS = {
		primitive:
			'bg-zinc-100 border-zinc-300 hover:bg-zinc-200 dark:bg-zinc-900 dark:border-zinc-700 dark:hover:bg-zinc-800',
		input:
			'bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:hover:bg-blue-900/40',
		smart:
			'bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 dark:hover:bg-purple-900/40',
		media:
			'bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:hover:bg-amber-900/40',
		logic:
			'bg-rose-50 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:hover:bg-rose-900/40',
		layout:
			'bg-indigo-50 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 dark:hover:bg-indigo-900/40'
	};
</script>

{#snippet toolItem(type: BlockType, Icon: any, label: string, colorClass: string)}
	<div
		draggable="true"
		ondragstart={(e) => onDragStart(e, type)}
		onclick={() => onAddBlock(type)}
		role="button"
		tabindex="0"
		onkeydown={(e) => e.key === 'Enter' && onAddBlock(type)}
		class={cn(
			'group relative flex cursor-grab items-center gap-3 overflow-hidden border-2 p-2.5 transition-all active:cursor-grabbing hover:-translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]',
			colorClass,
			'border-black dark:border-zinc-600'
		)}
	>
		<Icon
			class="relative z-10 h-4 w-4 text-black opacity-70 transition-none group-hover:opacity-100 dark:text-zinc-100"
		/>
		<span
			class="relative z-10 font-mono text-[11px] font-bold uppercase leading-none tracking-wider text-black dark:text-zinc-100"
			>{label}</span
		>
	</div>
{/snippet}

{#snippet sectionHeader(title: string, number: string)}
	<div
		class="mb-3 mt-2 flex w-full items-center justify-between border-b-2 border-black pb-2 dark:border-zinc-700"
	>
		<span
			class="font-mono text-[10px] font-black uppercase tracking-widest text-foreground dark:text-white"
		>
			{title}
		</span>
		<span
			class="border-2 border-black bg-white px-1.5 font-mono text-[9px] font-bold text-black opacity-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white"
		>
			{number}
		</span>
	</div>
{/snippet}

<div class="flex-1 space-y-8 overflow-y-auto bg-white p-5 dark:bg-zinc-950">
	<!-- ESSENTIALS -->
	<div>
		{@render sectionHeader('Primitives', '01')}
		<div class="grid grid-cols-1 gap-2">
			{@render toolItem(BlockType.TEXT, Type, 'Text Block', CATEGORY_COLORS.primitive)}
			{@render toolItem(BlockType.INPUT, FileText, 'Short Answer', CATEGORY_COLORS.primitive)}
			{@render toolItem(BlockType.LONG_TEXT, AlignLeft, 'Paragraph', CATEGORY_COLORS.primitive)}
		</div>
	</div>

	<!-- DATA COLLECTION -->
	<div>
		{@render sectionHeader('Inputs', '02')}
		<div class="grid grid-cols-1 gap-2">
			<div class="grid grid-cols-2 gap-2">
				{@render toolItem(BlockType.CHECKBOX, CheckSquare, 'Check', CATEGORY_COLORS.input)}
				{@render toolItem(BlockType.RADIO, CircleDot, 'Radio', CATEGORY_COLORS.input)}
			</div>
			{@render toolItem(BlockType.SELECT, List, 'Dropdown Select', CATEGORY_COLORS.input)}
			{@render toolItem(BlockType.DATE, Calendar, 'Date Picker', CATEGORY_COLORS.input)}
			{@render toolItem(BlockType.EMAIL, Mail, 'Email Address', CATEGORY_COLORS.input)}
			{@render toolItem(BlockType.NUMBER, Hash, 'Number Input', CATEGORY_COLORS.input)}
		</div>
	</div>

	<!-- SMART BLOCKS -->
	<div>
		{@render sectionHeader('Smart Mods', '03')}
		<div class="grid grid-cols-1 gap-2">
			{@render toolItem(BlockType.FORMULA, Calculator, 'Calc / Formula', CATEGORY_COLORS.smart)}
			{@render toolItem(BlockType.PAYMENT, CreditCard, 'Payment Gateway', CATEGORY_COLORS.smart)}
			{@render toolItem(BlockType.CURRENCY, DollarSign, 'Currency Convert', CATEGORY_COLORS.smart)}
		</div>
	</div>

	<!-- MEDIA & FILES -->
	<div>
		{@render sectionHeader('Assets', '04')}
		<div class="grid grid-cols-1 gap-2">
			{@render toolItem(BlockType.SIGNATURE, FileSignature, 'E-Signature', CATEGORY_COLORS.media)}
			{@render toolItem(BlockType.FILE_UPLOAD, UploadCloud, 'File Upload', CATEGORY_COLORS.media)}
			<div class="grid grid-cols-2 gap-2">
				{@render toolItem(BlockType.IMAGE, ImageIcon, 'Img', CATEGORY_COLORS.media)}
				{@render toolItem(BlockType.VIDEO, Video, 'Vid', CATEGORY_COLORS.media)}
			</div>
			{@render toolItem(BlockType.SECTION_BREAK, Minus, 'Divider Line', CATEGORY_COLORS.media)}
		</div>
	</div>

	<!-- ADVANCED -->
	<div>
		{@render sectionHeader('Logic', '05')}
		<div class="space-y-2">
			{@render toolItem(BlockType.CONDITIONAL, Settings, 'Conditional Branch', CATEGORY_COLORS.logic)}
			{@render toolItem(BlockType.REPEATER, List, 'Repeater Group', CATEGORY_COLORS.logic)}
		</div>
	</div>
</div>
