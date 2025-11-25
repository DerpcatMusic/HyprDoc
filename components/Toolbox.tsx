
import React from 'react';
import { BlockType } from '../types';
import { 
    Type, AlignLeft, Minus, Image as ImageIcon, Code as CodeIcon,
    Settings, List, CheckSquare, Calendar, FileSignature, 
    Hash, Mail, CircleDot, UploadCloud, GripVertical, FileText,
    Calculator, CreditCard, Video, DollarSign
} from 'lucide-react';
import { cn } from './ui-components';

interface ToolboxProps {
    onDragStart: (e: React.DragEvent, type: BlockType) => void;
    onAddBlock: (type: BlockType) => void;
}

const ToolItem = ({ type, icon: Icon, label, onDragStart, onClick }: { type: BlockType, icon: any, label: string, onDragStart: any, onClick: any }) => (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, type)}
      onClick={() => onClick(type)}
      className="flex flex-col items-center justify-center p-3 h-20 bg-background border rounded-lg hover:border-primary hover:shadow-sm cursor-grab active:cursor-grabbing transition-all group dark:border-zinc-800 dark:hover:border-primary"
    >
        <Icon className="w-5 h-5 mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="text-[10px] font-medium text-foreground text-center leading-tight">{label}</span>
    </div>
);

export const Toolbox: React.FC<ToolboxProps> = ({ onDragStart, onAddBlock }) => {
    return (
        <div className="flex-1 overflow-y-auto p-5 space-y-8">
            {/* ESSENTIALS */}
            <div>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 pl-1 flex items-center gap-2">
                    Essentials
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    <ToolItem type={BlockType.TEXT} icon={Type} label="Text Content" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.INPUT} icon={FileText} label="Short Answer" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.LONG_TEXT} icon={AlignLeft} label="Paragraph" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.SECTION_BREAK} icon={Minus} label="Divider" onDragStart={onDragStart} onClick={onAddBlock} />
                </div>
            </div>

            {/* SMART BLOCKS */}
            <div>
                <h3 className="text-[10px] font-bold text-purple-500 uppercase tracking-wider mb-3 pl-1 flex items-center gap-2">
                   Smart Blocks
                </h3>
                <div className="grid grid-cols-2 gap-2">
                     <ToolItem type={BlockType.FORMULA} icon={Calculator} label="Math Formula" onDragStart={onDragStart} onClick={onAddBlock} />
                     <ToolItem type={BlockType.PAYMENT} icon={CreditCard} label="Payment" onDragStart={onDragStart} onClick={onAddBlock} />
                     <ToolItem type={BlockType.VIDEO} icon={Video} label="Embed Video" onDragStart={onDragStart} onClick={onAddBlock} />
                     <ToolItem type={BlockType.CURRENCY} icon={DollarSign} label="Live Currency" onDragStart={onDragStart} onClick={onAddBlock} />
                </div>
            </div>

            {/* DATA COLLECTION */}
            <div>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 pl-1 flex items-center gap-2">
                   Data Inputs
                </h3>
                <div className="grid grid-cols-2 gap-2">
                    <ToolItem type={BlockType.CHECKBOX} icon={CheckSquare} label="Checkbox" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.RADIO} icon={CircleDot} label="Radio Group" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.SELECT} icon={List} label="Dropdown" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.DATE} icon={Calendar} label="Date Picker" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.EMAIL} icon={Mail} label="Email" onDragStart={onDragStart} onClick={onAddBlock} />
                    <ToolItem type={BlockType.NUMBER} icon={Hash} label="Number" onDragStart={onDragStart} onClick={onAddBlock} />
                </div>
            </div>

             {/* MEDIA & FILES */}
             <div>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 pl-1 flex items-center gap-2">
                   Media
                </h3>
                <div className="grid grid-cols-2 gap-2">
                     <ToolItem type={BlockType.SIGNATURE} icon={FileSignature} label="Signature" onDragStart={onDragStart} onClick={onAddBlock} />
                     <ToolItem type={BlockType.FILE_UPLOAD} icon={UploadCloud} label="File Upload" onDragStart={onDragStart} onClick={onAddBlock} />
                     <ToolItem type={BlockType.IMAGE} icon={ImageIcon} label="Image Embed" onDragStart={onDragStart} onClick={onAddBlock} />
                     <ToolItem type={BlockType.HTML} icon={CodeIcon} label="HTML / Embed" onDragStart={onDragStart} onClick={onAddBlock} />
                </div>
            </div>

            {/* ADVANCED */}
            <div>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 pl-1 flex items-center gap-2">
                   Advanced Logic
                </h3>
                <div className="space-y-2">
                    <div 
                        draggable 
                        onDragStart={(e) => onDragStart(e, BlockType.CONDITIONAL)}
                        onClick={() => onAddBlock(BlockType.CONDITIONAL)}
                        className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center gap-3 cursor-grab hover:shadow-md transition-all group dark:bg-amber-900/20 dark:border-amber-800"
                    >
                        <Settings className="text-amber-600" size={18} />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-amber-900 dark:text-amber-500">Conditional Branch</span>
                            <span className="text-[9px] text-amber-700/70">Show blocks based on rules</span>
                        </div>
                    </div>

                    <div 
                        draggable 
                        onDragStart={(e) => onDragStart(e, BlockType.REPEATER)}
                        onClick={() => onAddBlock(BlockType.REPEATER)}
                        className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg flex items-center gap-3 cursor-grab hover:shadow-md transition-all group dark:bg-indigo-900/20 dark:border-indigo-800"
                    >
                        <List className="text-indigo-600" size={18} />
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-500">Repeater Group</span>
                            <span className="text-[9px] text-indigo-700/70">Dynamic lists & line items</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
