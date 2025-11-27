'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BlockType } from '@/lib/schemas/blocks';
import {
  Type,
  TextCursor,
  Hash,
  Mail,
  Calendar,
  PenLine,
  Image,
  FileUp,
  Code,
  Calculator,
  CreditCard,
  Video,
  DollarSign,
  Columns,
  GitBranch,
  Repeat,
  CheckSquare,
  Circle,
  List,
} from 'lucide-react';

interface ToolboxItem {
  type: BlockType;
  label: string;
  icon: React.ReactNode;
  category: 'input' | 'content' | 'logic' | 'media';
}

const toolboxItems: ToolboxItem[] = [
  // Input Category
  { type: BlockType.INPUT, label: 'Text Input', icon: <TextCursor size={16} />, category: 'input' },
  { type: BlockType.LONG_TEXT, label: 'Long Text', icon: <Type size={16} />, category: 'input' },
  { type: BlockType.NUMBER, label: 'Number', icon: <Hash size={16} />, category: 'input' },
  { type: BlockType.EMAIL, label: 'Email', icon: <Mail size={16} />, category: 'input' },
  { type: BlockType.DATE, label: 'Date', icon: <Calendar size={16} />, category: 'input' },
  { type: BlockType.SELECT, label: 'Select', icon: <List size={16} />, category: 'input' },
  { type: BlockType.RADIO, label: 'Radio', icon: <Circle size={16} />, category: 'input' },
  
  // Media Category
  { type: BlockType.IMAGE, label: 'Image', icon: <Image size={16} />, category: 'media' },
  { type: BlockType.VIDEO, label: 'Video', icon: <Video size={16} />, category: 'media' },
  { type: BlockType.FILE_UPLOAD, label: 'File Upload', icon: <FileUp size={16} />, category: 'media' },
  { type: BlockType.PAYMENT, label: 'Payment', icon: <CreditCard size={16} />, category: 'media' },
  { type: BlockType.CURRENCY, label: 'Currency', icon: <DollarSign size={16} />, category: 'media' },
];

interface ToolboxProps {
  onAddBlock: (type: BlockType) => void;
}

export const Toolbox = ({ onAddBlock }: ToolboxProps) => {
  const handleDragStart = (e: React.DragEvent, type: BlockType) => {
    e.dataTransfer.setData('application/hyprdoc-block', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const renderToolboxItem = (item: ToolboxItem) => (
    <div
      key={item.type}
      draggable
      onDragStart={(e) => handleDragStart(e, item.type)}
      onClick={() => onAddBlock(item.type)}
      className="flex items-center gap-3 p-3 border-2 border-zinc-800 hover:border-amber-500 hover:bg-zinc-900 cursor-grab active:cursor-grabbing transition-colors group"
    >
      <div className="text-zinc-500 group-hover:text-amber-500 transition-colors">
        {item.icon}
      </div>
      <span className="text-sm font-mono text-zinc-300 group-hover:text-zinc-100">
        {item.label}
      </span>
    </div>
  );

  const inputBlocks = toolboxItems.filter(item => item.category === 'input');
  const contentBlocks = toolboxItems.filter(item => item.category === 'content');
  const logicBlocks = toolboxItems.filter(item => item.category === 'logic');
  const mediaBlocks = toolboxItems.filter(item => item.category === 'media');

  return (
    <div className="w-72 border-r-2 border-zinc-800 bg-zinc-950 flex flex-col h-full">
      <div className="p-5 border-b-2 border-zinc-800 h-16 flex items-center justify-between">
        <span className="font-black font-mono text-sm tracking-widest uppercase text-zinc-200">
          Components
        </span>
        <Badge variant="outline" className="text-[10px] font-mono">
          {toolboxItems.length}
        </Badge>
      </div>

      <Tabs defaultValue="input" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b-2 border-zinc-800 bg-transparent p-0 h-auto">
          <TabsTrigger value="input" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-amber-500">
            Input
          </TabsTrigger>
          <TabsTrigger value="content" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-amber-500">
            Content
          </TabsTrigger>
          <TabsTrigger value="logic" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-amber-500">
            Logic
          </TabsTrigger>
          <TabsTrigger value="media" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-amber-500">
            Media
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="input" className="p-4 space-y-2 mt-0">
            {inputBlocks.map(renderToolboxItem)}
          </TabsContent>

          <TabsContent value="content" className="p-4 space-y-2 mt-0">
            {contentBlocks.map(renderToolboxItem)}
          </TabsContent>

          <TabsContent value="logic" className="p-4 space-y-2 mt-0">
            {logicBlocks.map(renderToolboxItem)}
          </TabsContent>

          <TabsContent value="media" className="p-4 space-y-2 mt-0">
            {mediaBlocks.map(renderToolboxItem)}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
};
