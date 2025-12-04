

import React from 'react';
import { BlockType } from '../types';
import { 
    Type, AlignLeft, Minus, Image as ImageIcon,
    Settings, List, CheckSquare, Calendar, FileSignature, 
    Hash, Mail, CircleDot, UploadCloud, FileText,
    Calculator, CreditCard, Video, DollarSign, Box, Columns,
    MoveVertical, AlertTriangle, Quote, LayoutTemplate
} from 'lucide-react';

interface ToolboxProps {
    onDragStart: (e: React.DragEvent, type: BlockType) => void;
    onAddBlock: (type: BlockType) => void;
}

const ToolItem = ({ type, icon: Icon, label, onDragStart, onClick }: { type: BlockType, icon: any, label: string, onDragStart: any, onClick: any }) => (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, type)}
      onClick={() => onClick(type)}
      className="group flex flex-col items-start gap-2 p-3 border-r border-b border-black/10 dark:border-white/10 bg-white dark:bg-black cursor-grab active:cursor-grabbing hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors min-h-[80px]"
    >
        <div className="w-full flex justify-between items-start">
            <Icon className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            <span className="text-[8px] font-mono opacity-30 group-hover:opacity-100">00</span>
        </div>
        <span className="text-[9px] font-bold font-mono uppercase tracking-widest mt-auto leading-tight">{label}</span>
    </div>
);

const SectionHeader = ({ title, number }: { title: string, number: string }) => (
    <div className="flex items-center justify-between bg-black text-white dark:bg-white dark:text-black px-2 py-1 mb-0 sticky top-0 z-10">
        <span className="text-[10px] font-black font-mono uppercase tracking-widest">{title}</span>
        <span className="text-[9px] font-mono font-bold opacity-50">{number}</span>
    </div>
);

export const Toolbox: React.FC<ToolboxProps> = ({ onDragStart, onAddBlock }) => {
    return (
        <div className="flex-1 overflow-y-auto bg-muted/10 dark:bg-zinc-950 scrollbar-hide flex flex-col border-r-2 border-black dark:border-white w-full h-full">
            
            {/* 1. CONTENT & STRUCTURE */}
            <div>
                <SectionHeader title="Content & Structure" number="01" />
                <div className="grid grid-cols-2 border-b border-black/10 dark:border-white/10">
                    <ToolItem type={BlockType.TEXT} icon={Type} label="Text Block" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.COLUMNS} icon={Columns} label="Columns" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.SECTION_BREAK} icon={Minus} label="Divider" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.SPACER} icon={MoveVertical} label="Spacer" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.ALERT} icon={AlertTriangle} label="Alert Box" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.QUOTE} icon={Quote} label="Blockquote" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.IMAGE} icon={ImageIcon} label="Image" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.VIDEO} icon={Video} label="Video" onDragStart={onDragStart} onClick={onAddBlock} />
                </div>
            </div>

            {/* 2. DATA INPUTS */}
            <div>
                <SectionHeader title="Data Inputs" number="02" />
                <div className="grid grid-cols-2 border-b border-black/10 dark:border-white/10">
                    <ToolItem type={BlockType.INPUT} icon={FileText} label="Short Text" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.LONG_TEXT} icon={AlignLeft} label="Long Text" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.EMAIL} icon={Mail} label="Email Address" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.NUMBER} icon={Hash} label="Number" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.DATE} icon={Calendar} label="Date Picker" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.FILE_UPLOAD} icon={UploadCloud} label="File Upload" onDragStart={onDragStart} onClick={onAddBlock} />
                </div>
            </div>

            {/* 3. CHOICE & SIGN */}
            <div>
                 <SectionHeader title="Choice & Sign" number="03" />
                 <div className="grid grid-cols-2 border-b border-black/10 dark:border-white/10">
                    <ToolItem type={BlockType.CHECKBOX} icon={CheckSquare} label="Checkbox" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.RADIO} icon={CircleDot} label="Radio Group" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.SELECT} icon={List} label="Dropdown" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.SIGNATURE} icon={FileSignature} label="Signature" onDragStart={onDragStart} onClick={onAddBlock} />
                 </div>
            </div>

            {/* 4. LOGIC & FLOW */}
            <div>
                 <SectionHeader title="Logic & Flow" number="04" />
                <div className="grid grid-cols-2 border-b border-black/10 dark:border-white/10">
                     <ToolItem type={BlockType.FORMULA} icon={Calculator} label="Formula" onDragStart={onDragStart} onClick={onAddBlock} />
                     <ToolItem type={BlockType.CONDITIONAL} icon={Settings} label="Branching" onDragStart={onDragStart} onClick={onAddBlock} />
                     <ToolItem type={BlockType.REPEATER} icon={Box} label="Loop / List" onDragStart={onDragStart} onClick={onAddBlock} />
                </div>
            </div>

            {/* 5. COMMERCE */}
            <div>
                <SectionHeader title="Commerce" number="05" />
                <div className="grid grid-cols-2 border-b border-black/10 dark:border-white/10">
                    <ToolItem type={BlockType.PAYMENT} icon={CreditCard} label="Payment" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.CURRENCY} icon={DollarSign} label="Exchange Rate" onDragStart={onDragStart} onClick={onAddBlock} />
                </div>
            </div>
        </div>
    );
};