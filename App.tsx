
import React, { useState, useEffect } from 'react';
import { BlockType, DocBlock, DocumentState, Party, AuditLogEntry } from './types';
import { Viewer } from './components/Viewer';
import { AccessGate } from './components/AccessGate';
import { Toolbox } from './components/Toolbox';
import { PropertiesPanel } from './components/PropertiesPanel';
import { SettingsView } from './components/views/SettingsView';
import { DashboardView } from './components/views/DashboardView';
import { EditorCanvas } from './components/EditorCanvas';
import { 
    FileText, Settings, LayoutTemplate, ArrowLeft, Share, 
    Moon, Sun, Users, PlusCircle
} from 'lucide-react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Sheet } from './components/ui-components';

// Initial Parties
const INITIAL_PARTIES: Party[] = [
    { id: 'p1', name: 'Me (Owner)', color: '#3b82f6', initials: 'ME' },
    { id: 'p2', name: 'Client', color: '#ec4899', initials: 'CL' }
];

const SAMPLE_DOC: DocumentState = {
  title: "Service Agreement",
  status: 'draft',
  parties: INITIAL_PARTIES,
  variables: [
      { id: 'v1', key: 'ClientName', value: 'Acme Corp', label: 'Client Name' },
  ],
  blocks: [
    { id: '1', type: BlockType.TEXT, content: "# Service Agreement\n\nThis agreement is made between **HyprDoc Inc.** and **{{ClientName}}**." },
    { id: '2', type: BlockType.INPUT, label: "Client Representative", variableName: "rep_name", assignedToPartyId: 'p2', required: true },
  ],
  auditLog: [
      { id: 'l1', timestamp: Date.now() - 100000, action: 'created', user: 'System' },
      { id: 'l2', timestamp: Date.now() - 50000, action: 'edited', user: 'Me (Owner)', details: 'Added text block' }
  ]
};

const App: React.FC = () => {
  const [doc, setDoc] = useState<DocumentState>(SAMPLE_DOC);
  const [mode, setMode] = useState<'edit' | 'preview' | 'dashboard' | 'settings' | 'recipient'>('dashboard');
  const [recipientEmail, setRecipientEmail] = useState<string | null>(null);
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPartyManager, setShowPartyManager] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // --- Actions ---

  const addAuditLog = (action: AuditLogEntry['action'], details?: string) => {
      const newEntry: AuditLogEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          action,
          user: 'Me (Owner)', // Hardcoded for demo
          details
      };
      setDoc(prev => ({ ...prev, auditLog: [newEntry, ...(prev.auditLog || [])] }));
  };

  const updateBlock = (id: string, updates: Partial<DocBlock>) => {
     const updateRecursive = (list: DocBlock[]): DocBlock[] => {
         return list.map(b => {
             if (b.id === id) return { ...b, ...updates };
             if (b.children) return { ...b, children: updateRecursive(b.children) };
             return b;
         })
     }
     setDoc(prev => ({ ...prev, blocks: updateRecursive(prev.blocks) }));
     addAuditLog('edited', `Updated block ${id}`);
  };

  const deleteBlock = (id: string) => {
      const deleteRecursive = (list: DocBlock[]): DocBlock[] => {
          return list.filter(b => b.id !== id).map(b => ({
              ...b,
              children: b.children ? deleteRecursive(b.children) : undefined
          }));
      }
      setDoc(prev => ({ ...prev, blocks: deleteRecursive(prev.blocks) }));
      if (selectedBlockId === id) setSelectedBlockId(null);
      addAuditLog('edited', 'Deleted block');
  };

  const addBlock = (type: BlockType, insertAfterId?: string) => {
    const newBlock: DocBlock = {
        id: crypto.randomUUID(),
        type,
        content: type === BlockType.TEXT ? '' : undefined,
        label: `New ${type}`,
        variableName: `field_${Date.now()}`,
        options: (type === BlockType.SELECT || type === BlockType.RADIO) ? ['Option 1'] : undefined,
        repeaterFields: type === BlockType.REPEATER ? [
            { id: crypto.randomUUID(), type: BlockType.INPUT, label: 'Item Name', variableName: 'col_1' },
            { id: crypto.randomUUID(), type: BlockType.NUMBER, label: 'Cost', variableName: 'col_2' }
        ] : undefined,
        children: type === BlockType.CONDITIONAL ? [] : undefined,
        condition: type === BlockType.CONDITIONAL ? { variableName: '', equals: '' } : undefined
    };

    setDoc(prev => {
        const blocks = [...prev.blocks];
        if (insertAfterId) {
            const idx = blocks.findIndex(b => b.id === insertAfterId);
            if (idx !== -1) blocks.splice(idx + 1, 0, newBlock);
            else blocks.push(newBlock);
        } else {
            blocks.push(newBlock);
        }
        return { ...prev, blocks };
    });
    setSelectedBlockId(newBlock.id);
    addAuditLog('edited', `Added ${type} block`);
  };

  // --- Drag and Drop Handlers ---
  const handleDragStartToolbox = (e: React.DragEvent, type: BlockType) => {
      e.dataTransfer.setData('application/hyprdoc-new', type);
      e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDropCanvas = (e: React.DragEvent, targetId?: string) => {
      e.preventDefault();
      const newType = e.dataTransfer.getData('application/hyprdoc-new') as BlockType;
      
      if (newType) {
          const newBlock: DocBlock = {
            id: crypto.randomUUID(),
            type: newType,
            label: `New ${newType}`,
            variableName: `field_${Date.now()}`,
            repeaterFields: newType === BlockType.REPEATER ? [
                { id: crypto.randomUUID(), type: BlockType.INPUT, label: 'Item Name', variableName: 'col_1' },
                { id: crypto.randomUUID(), type: BlockType.NUMBER, label: 'Qty', variableName: 'col_2' }
            ] : undefined,
            children: newType === BlockType.CONDITIONAL ? [] : undefined,
            condition: newType === BlockType.CONDITIONAL ? {variableName:'', equals:''} : undefined
          };

          setDoc(prev => {
              // 1. If dropping ONTO a conditional block (targetId is the ID of the conditional block)
              // We want to add this new block as a CHILD of that block
              
              // Helper to find and update nested blocks
              const addToChildren = (blocks: DocBlock[]): DocBlock[] => {
                  return blocks.map(b => {
                      if (b.id === targetId && b.type === BlockType.CONDITIONAL) {
                           // Target found! Add to children
                           return { ...b, children: [...(b.children || []), newBlock] };
                      }
                      if (b.children) {
                          return { ...b, children: addToChildren(b.children) };
                      }
                      return b;
                  });
              };
              
              // First check if target is a conditional block
              const isTargetConditional = (list: DocBlock[]): boolean => {
                  for (const b of list) {
                      if (b.id === targetId && b.type === BlockType.CONDITIONAL) return true;
                      if (b.children && isTargetConditional(b.children)) return true;
                  }
                  return false;
              }

              if (targetId && isTargetConditional(prev.blocks)) {
                   return { ...prev, blocks: addToChildren(prev.blocks) };
              }

              // 2. Default: Append or Insert After logic
              const blocks = [...prev.blocks];
              if (targetId) {
                  const idx = blocks.findIndex(b => b.id === targetId);
                  if (idx !== -1) blocks.splice(idx + 1, 0, newBlock);
                  else blocks.push(newBlock); // Fallback
              } else {
                  blocks.push(newBlock);
              }
              return { ...prev, blocks };
          });
          
          addAuditLog('edited', `Dropped ${newType}`);
      }
  };

  // Helper to find deep nested block
  const findBlockRecursive = (blocks: DocBlock[], id: string): DocBlock | null => {
      for (const b of blocks) {
          if (b.id === id) return b;
          if (b.children) {
              const found = findBlockRecursive(b.children, id);
              if (found) return found;
          }
      }
      return null;
  };

  const selectedBlock = selectedBlockId ? findBlockRecursive(doc.blocks, selectedBlockId) : null;

  // --- Routes ---

  if (mode === 'recipient') {
      if (!recipientEmail) {
          return <AccessGate documentTitle={doc.title} onAccessGranted={(email) => setRecipientEmail(email)} />;
      }
      return <Viewer blocks={doc.blocks} snapshot={doc.snapshot} settings={doc.settings} parties={doc.parties} />;
  }

  if (mode === 'preview') {
      return (
          <div className="min-h-screen bg-muted/30 dark:bg-zinc-950">
               <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b px-6 py-4 flex justify-between items-center shadow-sm dark:border-zinc-800">
                  <Button variant="ghost" onClick={() => setMode('edit')} className="gap-2"><ArrowLeft size={16} /> Back to Editor</Button>
                  <Button onClick={() => setMode('recipient')} className="bg-purple-600 hover:bg-purple-700 text-white gap-2"><Share size={16}/> Simulate Secure Link</Button>
               </div>
               <Viewer blocks={doc.blocks} settings={doc.settings} parties={doc.parties} variables={doc.variables} isPreview={true} />
          </div>
      )
  }

  return (
    <div className="flex h-screen w-screen bg-background text-foreground font-sans overflow-hidden">
        {/* Navigation Sidebar */}
        <div className="hidden md:flex w-16 md:w-20 border-r bg-muted/5 flex-col items-center py-6 gap-6 dark:border-zinc-800 z-30">
             <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/30">
                 <LayoutTemplate size={20} />
             </div>
             <div className="flex-1 flex flex-col gap-4 w-full px-2">
                 <Button variant={mode === 'dashboard' ? 'secondary' : 'ghost'} size="icon" className="w-full h-10 rounded-lg" onClick={() => setMode('dashboard')} title="Dashboard"><LayoutTemplate size={20} /></Button>
                 <Button variant={mode === 'edit' ? 'secondary' : 'ghost'} size="icon" className="w-full h-10 rounded-lg" onClick={() => setMode('edit')} title="Editor"><FileText size={20} /></Button>
                 <Button variant={mode === 'settings' ? 'secondary' : 'ghost'} size="icon" className="w-full h-10 rounded-lg" onClick={() => setMode('settings')} title="Settings"><Settings size={20} /></Button>
             </div>
             <div className="flex flex-col gap-4 w-full px-2">
                <Button variant="ghost" size="icon" className="w-full h-10" onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</Button>
             </div>
        </div>

        {/* Routes */}
        {mode === 'dashboard' && (
            <DashboardView 
                documents={[doc]} 
                auditLog={doc.auditLog} 
                onCreate={() => { setMode('edit'); addAuditLog('created'); }} 
                onSelect={() => setMode('edit')} 
            />
        )}

        {mode === 'settings' && (
            <SettingsView 
                settings={doc.settings} 
                onUpdate={(s) => setDoc(prev => ({ ...prev, settings: s }))} 
            />
        )}

        {mode === 'edit' && (
         <>
          {/* TOOLBOX */}
          <div className="hidden md:flex w-72 border-r bg-muted/10 flex-col z-20 dark:border-zinc-800">
            <div className="p-5 border-b bg-background h-16 flex items-center font-semibold text-sm">Toolbox</div>
            <Toolbox onDragStart={handleDragStartToolbox} onAddBlock={addBlock} />
          </div>

          {/* CANVAS */}
          <EditorCanvas 
              docTitle={doc.title}
              docSettings={doc.settings}
              blocks={doc.blocks}
              parties={doc.parties}
              selectedBlockId={selectedBlockId}
              showPartyManager={showPartyManager}
              onTitleChange={(t) => setDoc(prev => ({...prev, title: t}))}
              onTogglePartyManager={setShowPartyManager}
              onPreview={() => setMode('preview')}
              onSend={() => setShowSendModal(true)}
              onSelectBlock={setSelectedBlockId}
              onUpdateBlock={updateBlock}
              onDeleteBlock={deleteBlock}
              onAddBlock={addBlock}
              onDropBlock={handleDropCanvas}
              onUpdateParty={(i, p) => {
                  const newParties = [...doc.parties];
                  newParties[i] = p;
                  setDoc(d => ({...d, parties: newParties}));
              }}
          />

          {/* PROPERTIES PANEL */}
          {selectedBlock && (
              <PropertiesPanel 
                  block={selectedBlock}
                  parties={doc.parties}
                  onUpdate={updateBlock}
                  onDelete={deleteBlock}
                  onClose={() => setSelectedBlockId(null)}
              />
          )}
         </>
        )}
        
        {/* SEND MODAL */}
        <Dialog open={showSendModal} onOpenChange={setShowSendModal}>
            <DialogContent>
                <DialogHeader><DialogTitle>Secure Send</DialogTitle></DialogHeader>
                <div className="p-4 bg-muted/30 rounded border text-sm text-center">
                    <p className="font-mono text-xs mb-2 bg-background p-2 rounded select-all">https://hyprdoc.com/s/{doc.id || 'draft-id'}</p>
                    <p className="text-muted-foreground text-xs">Anyone with this link will need to verify their email.</p>
                </div>
                <DialogFooter>
                    <Button onClick={() => { 
                        setDoc(prev => ({ ...prev, status: 'sent', snapshot: prev.blocks })); 
                        setShowSendModal(false); 
                        addAuditLog('sent', 'Document snapshot created');
                    }}>Create Link & Snapshot</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
};

export default App;
