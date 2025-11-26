
import React from 'react';
import { BlockType } from '../types';
import { 
    Type, AlignLeft, Minus, Image as ImageIcon, Code as CodeIcon,
    Settings, List, CheckSquare, Calendar, FileSignature, 
    Hash, Mail, CircleDot, UploadCloud, GripVertical, FileText,
    Calculator, CreditCard, Video, DollarSign, Columns
} from 'lucide-react';
import { cn } from './ui-components';

interface ToolboxProps {
    onDragStart: (e: React.DragEvent, type: BlockType) => void;
    onAddBlock: (type: BlockType) => void;
}

// Colors for categories - enhanced for dark mode
const CATEGORY_COLORS = {
    primitive: "bg-zinc-100 border-zinc-300 hover:bg-zinc-200 dark:bg-zinc-900 dark:border-zinc-700 dark:hover:bg-zinc-800",
    input: "bg-blue-50 border-blue-200 hover:bg-blue-100 dark:bg-blue-900/20 dark:border-blue-800 dark:hover:bg-blue-900/40",
    smart: "bg-purple-50 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:border-purple-800 dark:hover:bg-purple-900/40",
    media: "bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/20 dark:border-amber-800 dark:hover:bg-amber-900/40",
    logic: "bg-rose-50 border-rose-200 hover:bg-rose-100 dark:bg-rose-900/20 dark:border-rose-800 dark:hover:bg-rose-900/40",
    layout: "bg-indigo-50 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 dark:hover:bg-indigo-900/40"
};

const ToolItem = ({ type, icon: Icon, label, onDragStart, onClick, colorClass }: { type: BlockType, icon: any, label: string, onDragStart: any, onClick: any, colorClass: string }) => (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, type)}
      onClick={() => onClick(type)}
      className={cn(
          "flex items-center gap-3 p-2.5 border-2 cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden hover:-translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,0.2)]",
          colorClass,
          "border-black dark:border-zinc-600" 
      )}
    >
        <Icon className="w-4 h-4 text-black dark:text-zinc-100 transition-none relative z-10 opacity-70 group-hover:opacity-100" />
        <span className="text-[11px] font-bold font-mono uppercase tracking-wider leading-none relative z-10 text-black dark:text-zinc-100">{label}</span>
    </div>
);

const SectionHeader = ({ title, number }: { title: string, number: string }) => (
    <div className="mb-3 w-full flex justify-between items-center mt-2 border-b-2 border-black dark:border-zinc-700 pb-2">
        <span className="text-[10px] font-black font-mono uppercase tracking-widest text-foreground dark:text-white">
            {title}
        </span>
        <span className="text-[9px] font-mono font-bold opacity-50 border-2 border-black dark:border-zinc-600 px-1.5 bg-white dark:bg-zinc-800 text-black dark:text-white">
            {number}
        </span>
    </div>
);

export const Toolbox: React.FC<ToolboxProps> = ({ onDragStart, onAddBlock }) => {
    return (
        <div className="flex-1 overflow-y-auto p-5 space-y-8 bg-white dark:bg-zinc-950">
            {/* ESSENTIALS */}
            <div>
                <SectionHeader title="Primitives" number="01" />
                <div className="grid grid-cols-1 gap-2">
                    <ToolItem type={BlockType.TEXT} icon={Type} label="Text Block" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.primitive} />
                    <ToolItem type={BlockType.INPUT} icon={FileText} label="Short Answer" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.primitive} />
                    <ToolItem type={BlockType.LONG_TEXT} icon={AlignLeft} label="Paragraph" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.primitive} />
                </div>
            </div>

            {/* DATA COLLECTION */}
            <div>
                <SectionHeader title="Inputs" number="02" />
                <div className="grid grid-cols-1 gap-2">
                    <div className="grid grid-cols-2 gap-2">
                        <ToolItem type={BlockType.CHECKBOX} icon={CheckSquare} label="Check" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.input} />
                        <ToolItem type={BlockType.RADIO} icon={CircleDot} label="Radio" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.input} />
                    </div>
                    <ToolItem type={BlockType.SELECT} icon={List} label="Dropdown Select" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.input} />
                    <ToolItem type={BlockType.DATE} icon={Calendar} label="Date Picker" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.input} />
                    <ToolItem type={BlockType.EMAIL} icon={Mail} label="Email Address" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.input} />
                    <ToolItem type={BlockType.NUMBER} icon={Hash} label="Number Input" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.input} />
                </div>
            </div>

            {/* SMART BLOCKS */}
            <div>
                <SectionHeader title="Smart Mods" number="03" />
                <div className="grid grid-cols-1 gap-2">
                     <ToolItem type={BlockType.FORMULA} icon={Calculator} label="Calc / Formula" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.smart} />
                     <ToolItem type={BlockType.PAYMENT} icon={CreditCard} label="Payment Gateway" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.smart} />
                     <ToolItem type={BlockType.CURRENCY} icon={DollarSign} label="Currency Convert" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.smart} />
                </div>
            </div>

             {/* MEDIA & FILES */}
             <div>
                <SectionHeader title="Assets" number="04" />
                <div className="grid grid-cols-1 gap-2">
                     <ToolItem type={BlockType.SIGNATURE} icon={FileSignature} label="E-Signature" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.media} />
                     <ToolItem type={BlockType.FILE_UPLOAD} icon={UploadCloud} label="File Upload" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.media} />
                     <div className="grid grid-cols-2 gap-2">
                        <ToolItem type={BlockType.IMAGE} icon={ImageIcon} label="Img" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.media} />
                        <ToolItem type={BlockType.VIDEO} icon={Video} label="Vid" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.media} />
                     </div>
                     <ToolItem type={BlockType.SECTION_BREAK} icon={Minus} label="Divider Line" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.media} />
                </div>
            </div>

            {/* LAYOUT */}
            <div>
                <SectionHeader title="Layout" number="05" />
                <div className="space-y-2">
                    <ToolItem type={BlockType.COLUMNS} icon={Columns} label="2 Columns" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.layout} />
                </div>
            </div>

            {/* ADVANCED */}
            <div>
                 <SectionHeader title="Logic" number="06" />
                <div className="space-y-2">
                    <ToolItem type={BlockType.CONDITIONAL} icon={Settings} label="Conditional Branch" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.logic} />
                    <ToolItem type={BlockType.REPEATER} icon={List} label="Repeater Group" onDragStart={onDragStart} onClick={onAddBlock} colorClass={CATEGORY_COLORS.logic} />
                </div>
            </div>
        </div>
    );
};
