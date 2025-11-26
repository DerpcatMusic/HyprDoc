import type { DocumentState, DocBlock, BlockType, AuditLogEntry, Party, DocumentSettings } from '$lib/types';

const INITIAL_PARTIES: Party[] = [
	{ id: 'p1', name: 'Me (Owner)', color: '#3b82f6', initials: 'ME' },
	{ id: 'p2', name: 'Client', color: '#ec4899', initials: 'CL' },
	{ id: 'p3', name: 'Legal Dept', color: '#10b981', initials: 'LG' }
];

const SAMPLE_DOC: DocumentState = {
	id: 'doc_123',
	title: 'Service Agreement',
	status: 'draft',
	parties: INITIAL_PARTIES,
	variables: [{ id: 'v1', key: 'ClientName', value: 'Acme Corp', label: 'Client Name' }],
	settings: {
		signingOrder: 'parallel',
		brandColor: '#000000',
		fontFamily: 'Inter, sans-serif',
		margins: { top: 60, bottom: 60, left: 60, right: 60 }
	},
	terms: [],
	blocks: [
		{
			id: '1',
			type: 'text' as BlockType,
			content:
				'# Service Agreement\n\nThis agreement is made between **HyprDoc Inc.** and **{{ClientName}}**.\n\nThe Supplier shall indemnify the Client against all Liability arising from any breach of Confidentiality.'
		},
		{
			id: '2',
			type: 'input' as BlockType,
			label: 'Client Representative',
			variableName: 'rep_name',
			assignedToPartyId: 'p2',
			required: true
		},
		{
			id: '3',
			type: 'number' as BlockType,
			label: 'Hourly Rate',
			variableName: 'rate',
			assignedToPartyId: 'p1',
			required: true
		}
	],
	auditLog: [{ id: 'l1', timestamp: Date.now() - 100000, action: 'created', user: 'System' }]
};

// Helper for nice default labels
function getNiceLabel(type: BlockType): string {
	switch (type) {
		case 'text':
			return 'Text Content';
		case 'input':
			return 'Short Answer';
		case 'long_text':
			return 'Long Answer';
		case 'number':
			return 'Number Input';
		case 'email':
			return 'Email Address';
		case 'select':
			return 'Dropdown Menu';
		case 'radio':
			return 'Single Choice';
		case 'checkbox':
			return 'Checkbox';
		case 'date':
			return 'Date Picker';
		case 'signature':
			return 'Signature';
		case 'image':
			return 'Image Upload';
		case 'file_upload':
			return 'File Attachment';
		case 'section_break':
			return 'Section Break';
		case 'payment':
			return 'Payment Request';
		case 'currency':
			return 'Currency Value';
		case 'video':
			return 'Video Embed';
		case 'conditional':
			return 'Conditional Branch';
		case 'repeater':
			return 'Repeater Group';
		case 'formula':
			return 'Formula Calculation';
		default:
			return 'New Field';
	}
}

// Create a block object
function createBlockObject(type: BlockType): DocBlock {
	return {
		id: crypto.randomUUID(),
		type,
		content: type === 'text' ? '' : undefined,
		label: getNiceLabel(type),
		variableName: `field_${Date.now()}`,
		options:
			type === 'select' || type === 'radio' || type === 'checkbox' ? ['Option 1'] : undefined,
		children: type === 'conditional' || type === 'columns' || type === 'column' ? [] : undefined,
		condition: type === 'conditional' ? { variableName: '', equals: '' } : undefined,
		width: type === 'column' ? 50 : undefined
	};
}

class DocumentStore {
	doc = $state<DocumentState>(SAMPLE_DOC);
	mode = $state<'edit' | 'preview' | 'dashboard' | 'settings' | 'recipient'>('dashboard');
	selectedBlockId = $state<string | null>(null);

	// Audit Log
	addAuditLog(action: AuditLogEntry['action'], details?: string) {
		const newEntry: AuditLogEntry = {
			id: crypto.randomUUID(),
			timestamp: Date.now(),
			action,
			user: 'Me (Owner)',
			details
		};
		this.doc.auditLog = [newEntry, ...(this.doc.auditLog || [])];
	}

	// Recursive Update
	updateBlock(id: string, updates: Partial<DocBlock>) {
		const updateRecursive = (list: DocBlock[]): DocBlock[] => {
			return list.map((b) => {
				if (b.id === id) return { ...b, ...updates };
				if (b.children) return { ...b, children: updateRecursive(b.children) };
				return b;
			});
		};
		this.doc.blocks = updateRecursive(this.doc.blocks);
	}

	// Recursive Delete
	deleteBlock(id: string) {
		const deleteRecursive = (list: DocBlock[]): DocBlock[] => {
			return list
				.filter((b) => b.id !== id)
				.map((b) => ({
					...b,
					children: b.children ? deleteRecursive(b.children) : undefined
				}));
		};
		this.doc.blocks = deleteRecursive(this.doc.blocks);
		if (this.selectedBlockId === id) this.selectedBlockId = null;
	}

	// Ungroup/Unsplit a Row
	ungroupRow(rowId: string) {
		const newBlocks = [...this.doc.blocks];
		const rowIndex = newBlocks.findIndex((b) => b.id === rowId);
		if (rowIndex === -1) return;

		const rowBlock = newBlocks[rowIndex];
		if (rowBlock.type !== 'columns' || !rowBlock.children) return;

		// Extract all children from all columns
		const extractedBlocks: DocBlock[] = [];
		rowBlock.children.forEach((col) => {
			if (col.children) {
				extractedBlocks.push(...col.children);
			}
		});

		// Replace the row block with the extracted blocks
		newBlocks.splice(rowIndex, 1, ...extractedBlocks);
		this.doc.blocks = newBlocks;
		this.addAuditLog('edited', 'Ungrouped columns');
	}

	// Handle Splitting (Columns)
	createColumnLayout(targetBlockId: string, source: string | BlockType, direction: 'left' | 'right') {
		let newBlocks = JSON.parse(JSON.stringify(this.doc.blocks));
		let sourceBlock: DocBlock;

		// If source is a string, it's an ID (move operation)
		if (typeof source === 'string' && !['text', 'input', 'number', 'email', 'select', 'radio', 'checkbox', 'date', 'signature', 'image', 'file_upload', 'section_break', 'payment', 'currency', 'video', 'conditional', 'repeater', 'formula', 'long_text', 'html', 'columns', 'column'].includes(source)) {
			// Find and remove source block from tree
			let found: DocBlock | null = null;
			const removeSource = (list: DocBlock[]): DocBlock[] => {
				const filtered = [];
				for (const b of list) {
					if (b.id === source) {
						found = b;
						continue;
					}
					if (b.children) b.children = removeSource(b.children);
					filtered.push(b);
				}
				return filtered;
			};
			newBlocks = removeSource(newBlocks);
			if (found) sourceBlock = found;
			else return;
		} else {
			// Source is a new BlockType
			sourceBlock = createBlockObject(source as BlockType);
		}

		// Find Target and Replace with Columns
		const replaceRecursive = (list: DocBlock[]): DocBlock[] => {
			return list.map((b) => {
				if (b.id === targetBlockId) {
					// Create Column Structure
					const col1: DocBlock = { ...createBlockObject('column' as BlockType), width: 50 };
					const col2: DocBlock = { ...createBlockObject('column' as BlockType), width: 50 };

					// If direction is left, new/source block goes left
					if (direction === 'left') {
						col1.children = [sourceBlock];
						col2.children = [b]; // Target block
					} else {
						col1.children = [b]; // Target block
						col2.children = [sourceBlock];
					}

					return {
						...createBlockObject('columns' as BlockType),
						children: [col1, col2]
					};
				}
				if (b.children) {
					return { ...b, children: replaceRecursive(b.children) };
				}
				return b;
			});
		};

		newBlocks = replaceRecursive(newBlocks);
		this.doc.blocks = newBlocks;
		this.addAuditLog('edited', 'Created split layout');
	}

	// Move Block
	moveBlock(draggedId: string, targetId: string, position: 'after' | 'inside') {
		const newBlocks = [...this.doc.blocks];
		let draggedBlock: DocBlock | null = null;

		const removeRecursive = (list: DocBlock[]): DocBlock[] => {
			const filtered = [];
			for (const b of list) {
				if (b.id === draggedId) {
					draggedBlock = b;
					continue;
				}
				if (b.children) {
					b.children = removeRecursive(b.children);
				}
				filtered.push(b);
			}
			return filtered;
		};

		const blocksWithoutDragged = removeRecursive(newBlocks);
		if (!draggedBlock) return;

		// Insert at new location
		const insertRecursive = (list: DocBlock[]): boolean => {
			if (position === 'inside') {
				const target = list.find((b) => b.id === targetId);
				if (target) {
					target.children = target.children || [];
					target.children.push(draggedBlock!);
					return true;
				}
			}

			if (position === 'after') {
				const idx = list.findIndex((b) => b.id === targetId);
				if (idx !== -1) {
					list.splice(idx + 1, 0, draggedBlock!);
					return true;
				}
			}

			for (const b of list) {
				if (b.children) {
					if (insertRecursive(b.children)) return true;
				}
			}
			return false;
		};

		if (!insertRecursive(blocksWithoutDragged)) {
			blocksWithoutDragged.push(draggedBlock);
		}

		this.doc.blocks = blocksWithoutDragged;
	}

	// Recursive Add
	addBlock(type: BlockType, targetId?: string, position: 'after' | 'inside' = 'after') {
		const safeTargetId = typeof targetId === 'string' ? targetId : undefined;
		const newBlock = createBlockObject(type);

		const newBlocks = JSON.parse(JSON.stringify(this.doc.blocks));

		const insertRecursive = (list: DocBlock[]): boolean => {
			if (position === 'inside') {
				const target = list.find((b) => b.id === safeTargetId);
				if (target) {
					target.children = target.children || [];
					target.children.push(newBlock);
					return true;
				}
			} else {
				const idx = list.findIndex((b) => b.id === safeTargetId);
				if (idx !== -1) {
					list.splice(idx + 1, 0, newBlock);
					return true;
				}
			}

			for (const b of list) {
				if (b.children && insertRecursive(b.children)) return true;
			}
			return false;
		};

		if (safeTargetId) {
			if (!insertRecursive(newBlocks)) {
				newBlocks.push(newBlock); // Fallback if target not found
			}
		} else {
			newBlocks.push(newBlock);
		}

		this.doc.blocks = newBlocks;
		this.selectedBlockId = newBlock.id;
		this.addAuditLog('edited', `Added ${getNiceLabel(type)} block`);
	}

	// Settings
	updateSettings(settings: DocumentSettings) {
		this.doc.settings = settings;
		this.addAuditLog('edited', 'Updated settings');
	}

	// Party Management
	updateParties(parties: Party[]) {
		this.doc.parties = parties;
	}

	updateParty(index: number, party: Party) {
		const newParties = [...this.doc.parties];
		newParties[index] = party;
		this.doc.parties = newParties;
	}

	addParty(party: Party) {
		this.doc.parties = [...this.doc.parties, party];
	}

	removeParty(id: string) {
		this.doc.parties = this.doc.parties.filter((p) => p.id !== id);
	}

	// Document setters
	setDoc(doc: DocumentState) {
		this.doc = doc;
	}

	setMode(mode: 'edit' | 'preview' | 'dashboard' | 'settings' | 'recipient') {
		this.mode = mode;
	}

	setSelectedBlockId(id: string | null) {
		this.selectedBlockId = id;
	}
}

export const documentStore = new DocumentStore();

export function useDocument() {
	return documentStore;
}
