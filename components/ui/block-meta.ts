// Centralized Block Metadata
import { 
    Type, AlignLeft, Minus, Image as ImageIcon,
    Settings, List, CheckSquare, Calendar, FileSignature, 
    Hash, Mail, CircleDot, UploadCloud, FileText,
    Calculator, CreditCard, Video, DollarSign, Box, Columns, Repeat,
    LayoutTemplate, Link as LinkIcon, PanelLeft, Plus, MoveVertical, AlertTriangle, Quote,
    Heading1, Heading2, ListOrdered, Bold, Italic, Strikethrough
} from 'lucide-react';
import { BlockType } from '../../types/block';

export interface BlockMetaItem {
    type: string;
    label: string;
    icon: any;
    keywords: string;
}

export const BLOCK_META: BlockMetaItem[] = [
    { type: BlockType.TEXT, label: 'Text', icon: Type, keywords: 'paragraph p writing words' },
    { type: BlockType.INPUT, label: 'Input Field', icon: FileText, keywords: 'form text field entry input' },
    { type: BlockType.LONG_TEXT, label: 'Long Text', icon: AlignLeft, keywords: 'textarea paragraph long description multiline' },
    { type: BlockType.NUMBER, label: 'Number', icon: Hash, keywords: 'count quantity math amount integer float' },
    { type: BlockType.EMAIL, label: 'Email', icon: Mail, keywords: 'contact address mail' },
    { type: BlockType.DATE, label: 'Date', icon: Calendar, keywords: 'calendar time schedule picker range' },
    { type: BlockType.CHECKBOX, label: 'Checkbox', icon: CheckSquare, keywords: 'tick multi select option bool check' },
    { type: BlockType.RADIO, label: 'Single Choice', icon: CircleDot, keywords: 'radio option select single choice' },
    { type: BlockType.SELECT, label: 'Dropdown', icon: List, keywords: 'select menu list options dropdown' },
    { type: BlockType.SIGNATURE, label: 'Signature', icon: FileSignature, keywords: 'sign draw autograph contract legal' },
    { type: BlockType.IMAGE, label: 'Image', icon: ImageIcon, keywords: 'picture photo upload media png jpg' },
    { type: BlockType.VIDEO, label: 'Video', icon: Video, keywords: 'movie embed youtube media play' },
    { type: BlockType.FILE_UPLOAD, label: 'File Upload', icon: UploadCloud, keywords: 'attachment document pdf file' },
    
    // Layout & Design
    { type: BlockType.SECTION_BREAK, label: 'Divider', icon: Minus, keywords: 'line break separator hr split' },
    { type: BlockType.COLUMNS, label: 'Columns', icon: Columns, keywords: 'layout grid split side by side' },
    { type: BlockType.SPACER, label: 'Spacer', icon: MoveVertical, keywords: 'gap whitespace empty' },
    { type: BlockType.ALERT, label: 'Alert Box', icon: AlertTriangle, keywords: 'callout info warning error success note' },
    { type: BlockType.QUOTE, label: 'Blockquote', icon: Quote, keywords: 'citation quote emphasis' },

    // Logic
    { type: BlockType.REPEATER, label: 'Repeater', icon: Repeat, keywords: 'loop list array collection group repeat' },
    { type: BlockType.CONDITIONAL, label: 'Conditional', icon: Settings, keywords: 'logic if else branch rules condition' },
    { type: BlockType.FORMULA, label: 'Formula', icon: Calculator, keywords: 'math calculate expression sum' },
    { type: BlockType.CURRENCY, label: 'Currency', icon: DollarSign, keywords: 'money exchange rate usd eur cash' },
    { type: BlockType.PAYMENT, label: 'Payment', icon: CreditCard, keywords: 'charge stripe money buy checkout' },
    
    // Tiptap Commands (Shortcuts)
    { type: 'h1', label: 'Heading 1', icon: Heading1, keywords: 'h1 title header' },
    { type: 'h2', label: 'Heading 2', icon: Heading2, keywords: 'h2 subtitle' },
    { type: 'bulletList', label: 'Bullet List', icon: List, keywords: 'ul list bullets' },
];