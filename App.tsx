import React, { useState, useEffect } from 'react';
import { BlockType, DocBlock, DocumentState, Template, Party } from './types';
import { EditorBlock } from './components/EditorBlock';
import { Viewer } from './components/Viewer';
import { parsePDFToModularDoc } from './services/gemini';
import { 
    FileText, Type, Settings, Play, Code, List, PlusCircle, 
    Upload, Wand2, Layout, ArrowLeft, Share, X, GripVertical,
    Hash, Mail, Calendar, CheckSquare, CircleDot, Image as ImageIcon,
    FileSignature, Sidebar, Download, AlignLeft, Minus, Save, LayoutTemplate,
    ChevronRight, MoreHorizontal, Moon, Sun, Users, UserPlus
} from 'lucide-react';
import { Button, Input, Label, Card, cn, Textarea, Switch } from './components/ui-components';

// Initial Parties
const INITIAL_PARTIES: Party[] = [
    { id: 'p1', name: 'Me (Owner)', color: '#3b82f6', initials: 'ME' },
    { id: 'p2', name: 'Client', color: '#ec4899', initials: 'CL' }
];

// Initial Template Data
const MUSIC_CONTRACT: DocumentState = {
  title: "Music Licensing Agreement",
  parties: INITIAL_PARTIES,
  blocks: [
    { id: '1', type: BlockType.TEXT, content: "# Music License Agreement\n\nThis agreement is made between the **Licensor** and **Licensee**." },
    { id: '2', type: BlockType.INPUT, label: "Full Name", variableName: "fullName", placeholder: "John Doe", assignedToPartyId: 'p2' },
    { id: '3', type: BlockType.RADIO, label: "Contract Type", variableName: "contractType", options: ["Single", "EP", "Album"], assignedToPartyId: 'p1' },
    { 
        id: '4', 
        type: BlockType.CONDITIONAL, 
        condition: { variableName: "contractType", equals: "Album" },
        children: [
            { id: '5', type: BlockType.TEXT, content: "### Album Details\nSince you selected **Album**, please list all tracks below." },
            { 
                id: '6', 
                type: BlockType.REPEATER, 
                label: "Tracklist", 
                variableName: "tracks", 
                assignedToPartyId: 'p2',
                repeaterFields: [
                    { id: 'r1', type: BlockType.INPUT, label: "Track Title", variableName: "title" },
                    { id: 'r2', type: BlockType.NUMBER, label: "Duration (Seconds)", variableName: "duration" }
                ]
            }
        ]
    },
    { id: '7', type: BlockType.DATE, label: "Effective Date", variableName: "date", assignedToPartyId: 'p1' },
    { id: '99', type: BlockType.SIGNATURE, variableName: "signature", assignedToPartyId: 'p2' }
  ]
};

const INITIAL_TEMPLATES: Template[] = [
    {
        id: 't1',
        name: 'Empty Contract',
        description: 'Start from scratch with a blank canvas.',
        blocks: [],
        parties: [],
        createdAt: Date.now()
    },
    {
        id: 't2',
        name: 'Music License',
        description: 'Standard music licensing agreement with tracklist.',
        blocks: MUSIC_CONTRACT.blocks,
        parties: INITIAL_PARTIES,
        createdAt: Date.now()
    }
];

const App: React.FC = () => {
  const [doc, setDoc] = useState<DocumentState>(MUSIC_CONTRACT);
  const [mode, setMode] = useState<'edit' | 'preview' | 'dashboard'>('edit');
  const [templates, setTemplates] = useState<Template[]>(INITIAL_TEMPLATES);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showPartyManager, setShowPartyManager] = useState(false);
  
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- Helpers ---
  const findBlock = (id: string, blocks: DocBlock[]): DocBlock | undefined => {
    for (const b of blocks) {
        if (b.id === id) return b;
        if (b.children) {
            const found = findBlock(id, b.children);
            if (found) return found;
        }
    }
    return undefined;
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
  };

  const addBlock = (type: BlockType, insertAfterId?: string) => {
    const newBlock: DocBlock = {
        id: crypto.randomUUID(),
        type,
        content: type === BlockType.TEXT ? '' : undefined,
        label: type !== BlockType.TEXT && type !== BlockType.SECTION_BREAK ? `New ${type === BlockType.INPUT ? 'Field' : type}` : (type === BlockType.SECTION_BREAK ? 'New Section' : undefined),
        variableName: (type !== BlockType.TEXT && type !== BlockType.SECTION_BREAK) ? `field_${Date.now()}` : undefined,
        options: (type === BlockType.SELECT || type === BlockType.RADIO) ? ['Option 1', 'Option 2'] : undefined,
        children: type === BlockType.CONDITIONAL ? [] : undefined,
        condition: type === BlockType.CONDITIONAL ? { variableName: '', equals: '' } : undefined,
        repeaterFields: type === BlockType.REPEATER ? [{id: 'rf1', type:BlockType.INPUT, label: 'Column 1', variableName: 'col1'}] : undefined
    };

    setDoc(prev => {
        let newBlocks = [...prev.blocks];
        if (insertAfterId) {
            const index = newBlocks.findIndex(b => b.id === insertAfterId);
            if (index !== -1) {
                newBlocks.splice(index + 1, 0, newBlock);
            } else {
                newBlocks.push(newBlock);
            }
        } else {
            newBlocks.push(newBlock);
        }
        return { ...prev, blocks: newBlocks };
    });
    setSelectedBlockId(newBlock.id);
  };

  const addParty = () => {
      const name = prompt("Enter Party Name (e.g., Client, Lawyer):");
      if (name) {
          const colors = ['#ef4444', '#f97316', '#84cc16', '#06b6d4', '#8b5cf6'];
          const randomColor = colors[Math.floor(Math.random() * colors.length)];
          setDoc(prev => ({
              ...prev,
              parties: [...(prev.parties || []), {
                  id: crypto.randomUUID(),
                  name,
                  color: randomColor,
                  initials: name.substring(0, 2).toUpperCase()
              }]
          }));
      }
  };

  // Click-to-Type Logic
  const handleCanvasClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
          addBlock(BlockType.TEXT);
      }
  };

  // --- Handlers ---
  const saveAsTemplate = () => {
      const name = prompt("Enter template name:", doc.title);
      if (name) {
          setTemplates(prev => [...prev, {
              id: crypto.randomUUID(),
              name,
              description: "Custom user template",
              blocks: doc.blocks,
              parties: doc.parties,
              createdAt: Date.now()
          }]);
          alert("Template saved!");
      }
  };

  const loadTemplate = (t: Template) => {
      setDoc({
          title: t.name,
          blocks: JSON.parse(JSON.stringify(t.blocks)),
          parties: JSON.parse(JSON.stringify(t.parties || []))
      });
      setMode('edit');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setIsProcessing(true);
          try {
              const blocks = await parsePDFToModularDoc(e.target.files[0]);
              // Add default signature if missing
              if (!blocks.find(b => b.type === BlockType.SIGNATURE)) {
                 blocks.push({ id: crypto.randomUUID(), type: BlockType.SIGNATURE, label: "Sign Below", variableName: "signature" });
              }
              setDoc(prev => ({ ...prev, title: e.target.files![0].name.replace('.pdf', ''), blocks }));
          } catch (err) {
              console.error(err);
              alert("Import completed with some errors. See console for details.");
          } finally {
              setIsProcessing(false);
          }
      }
  };

  // --- Drag and Drop Logic ---
  const handleDragStart = (e: React.DragEvent, id: string) => {
      setDraggedBlockId(id);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!draggedBlockId || draggedBlockId === targetId) return;

      setDoc(prev => {
          const blocks = [...prev.blocks];
          const draggedIndex = blocks.findIndex(b => b.id === draggedBlockId);
          const targetIndex = blocks.findIndex(b => b.id === targetId);

          if (draggedIndex > -1 && targetIndex > -1) {
              const [draggedItem] = blocks.splice(draggedIndex, 1);
              blocks.splice(targetIndex, 0, draggedItem);
              return { ...prev, blocks };
          }
          return prev;
      });
      setDraggedBlockId(null);
  };

  // --- Sidebar Panel for Selected Block Properties ---
  const selectedBlock = selectedBlockId ? findBlock(selectedBlockId, doc.blocks) : null;

  const renderPropertiesPanel = () => {
      if (!selectedBlock) return (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground p-6 text-center animate-in fade-in zoom-in-95 duration-300">
              <Settings className="w-10 h-10 mb-4 opacity-10" />
              <p className="text-sm">Select an element on the canvas to customize its properties.</p>
          </div>
      );

      return (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="pb-4 border-b dark:border-zinc-800">
                  <h3 className="text-sm font-semibold tracking-tight mb-1">Properties</h3>
                  <div className="flex items-center gap-2">
                       <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-mono uppercase">{selectedBlock.type}</span>
                       <span className="text-xs text-muted-foreground truncate max-w-[150px]">{selectedBlock.id}</span>
                  </div>
              </div>

              {selectedBlock.type !== BlockType.TEXT && selectedBlock.type !== BlockType.SECTION_BREAK && (
                  <div className="space-y-4">
                      <div>
                          <Label>Assigned To</Label>
                          <select 
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-zinc-800 dark:border-zinc-700"
                            value={selectedBlock.assignedToPartyId || ''}
                            onChange={(e) => updateBlock(selectedBlock.id, { assignedToPartyId: e.target.value })}
                          >
                              <option value="">Everyone (Unassigned)</option>
                              {doc.parties.map(p => (
                                  <option key={p.id} value={p.id}>{p.name}</option>
                              ))}
                          </select>
                      </div>
                      <div>
                          <Label>Field Label</Label>
                          <Input 
                            value={selectedBlock.label || ''} 
                            onChange={(e) => updateBlock(selectedBlock.id, { label: e.target.value })} 
                          />
                      </div>
                      <div>
                          <Label>ID (Internal Variable)</Label>
                          <Input 
                            value={selectedBlock.variableName || ''} 
                            onChange={(e) => updateBlock(selectedBlock.id, { variableName: e.target.value })} 
                            className="font-mono text-xs bg-muted/30"
                          />
                      </div>
                      {(selectedBlock.type === BlockType.INPUT || selectedBlock.type === BlockType.LONG_TEXT || selectedBlock.type === BlockType.EMAIL || selectedBlock.type === BlockType.NUMBER) && (
                          <div>
                              <Label>Placeholder</Label>
                              <Input 
                                value={selectedBlock.placeholder || ''} 
                                onChange={(e) => updateBlock(selectedBlock.id, { placeholder: e.target.value })} 
                              />
                          </div>
                      )}
                  </div>
              )}

              {selectedBlock.type === BlockType.SECTION_BREAK && (
                   <div>
                        <Label>Section Title</Label>
                        <Input 
                        value={selectedBlock.label || ''} 
                        onChange={(e) => updateBlock(selectedBlock.id, { label: e.target.value })} 
                        />
                    </div>
              )}

              {selectedBlock.type === BlockType.TEXT && (
                  <div>
                      <Label>Markdown Content</Label>
                      <Textarea 
                          className="min-h-[250px] font-mono text-xs leading-relaxed"
                          value={selectedBlock.content || ''}
                          onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                      />
                      <p className="text-[10px] text-muted-foreground mt-2">Supports Markdown: **bold**, # Heading, - list. Use / command in editor.</p>
                  </div>
              )}

              {(selectedBlock.type === BlockType.SELECT || selectedBlock.type === BlockType.RADIO) && (
                  <div>
                      <Label>Options (One per line)</Label>
                      <Textarea 
                        className="min-h-[120px]"
                        value={(selectedBlock.options || []).join('\n')}
                        onChange={(e) => updateBlock(selectedBlock.id, { options: e.target.value.split('\n') })}
                      />
                  </div>
              )}

              {selectedBlock.type === BlockType.REPEATER && (
                  <div className="space-y-4 pt-4 border-t dark:border-zinc-800">
                      <Label>Table Columns</Label>
                      <div className="space-y-2">
                          {selectedBlock.repeaterFields?.map((field, index) => (
                              <div key={field.id} className="flex gap-2 items-start p-2 border rounded-md bg-muted/20 dark:border-zinc-700">
                                  <div className="flex-1 space-y-2">
                                      <Input 
                                          value={field.label}
                                          onChange={(e) => {
                                              const newFields = [...(selectedBlock.repeaterFields || [])];
                                              newFields[index] = { ...newFields[index], label: e.target.value };
                                              updateBlock(selectedBlock.id, { repeaterFields: newFields });
                                          }}
                                          className="h-7 text-xs"
                                          placeholder="Column Label"
                                      />
                                      <Input 
                                          value={field.variableName}
                                          onChange={(e) => {
                                              const newFields = [...(selectedBlock.repeaterFields || [])];
                                              newFields[index] = { ...newFields[index], variableName: e.target.value };
                                              updateBlock(selectedBlock.id, { repeaterFields: newFields });
                                          }}
                                          className="h-7 text-xs font-mono"
                                          placeholder="key"
                                      />
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                    onClick={() => {
                                        const newFields = selectedBlock.repeaterFields?.filter((_, i) => i !== index);
                                        updateBlock(selectedBlock.id, { repeaterFields: newFields });
                                    }}
                                  >
                                      <X size={12} />
                                  </Button>
                              </div>
                          ))}
                      </div>
                      <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                              const newField: DocBlock = { 
                                  id: crypto.randomUUID(), 
                                  type: BlockType.INPUT, 
                                  label: 'New Col', 
                                  variableName: `col_${Date.now()}` 
                              };
                              updateBlock(selectedBlock.id, { 
                                  repeaterFields: [...(selectedBlock.repeaterFields || []), newField] 
                              });
                          }}
                      >
                          <PlusCircle size={14} className="mr-2" /> Add Column
                      </Button>
                  </div>
              )}
          </div>
      );
  };

  // --- Views ---

  if (mode === 'preview') {
      return (
          <div className="min-h-screen bg-muted/30 dark:bg-zinc-950">
              <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b px-6 py-4 flex justify-between items-center shadow-sm dark:border-zinc-800">
                  <Button variant="ghost" onClick={() => setMode('edit')} className="gap-2 text-muted-foreground hover:text-foreground">
                      <ArrowLeft size={16} /> Back to Editor
                  </Button>
                  <div className="flex items-center gap-3">
                      <div className="hidden md:flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-wider gap-1">
                          <Play size={10} fill="currentColor" /> Live Preview
                      </div>
                  </div>
              </div>
              <Viewer blocks={doc.blocks} parties={doc.parties} isPreview={true} />
          </div>
      )
  }

  if (mode === 'dashboard') {
      return (
          <div className="min-h-screen bg-muted/10 p-8 dark:bg-zinc-950">
              <div className="max-w-5xl mx-auto space-y-8">
                  <div className="flex items-center justify-between">
                      <div>
                          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                          <p className="text-muted-foreground">Manage your document templates.</p>
                      </div>
                      <div className="flex gap-2">
                          <Button variant="ghost" onClick={() => setIsDarkMode(!isDarkMode)}>
                              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                          </Button>
                          <Button onClick={() => setMode('edit')} className="gap-2">
                              <PlusCircle size={16} /> New Document
                          </Button>
                      </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {templates.map(t => (
                          <Card key={t.id} className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer" onClick={() => loadTemplate(t)}>
                              <div className="p-6">
                                  <div className="h-10 w-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                      <LayoutTemplate size={20} />
                                  </div>
                                  <h3 className="font-bold text-lg mb-1">{t.name}</h3>
                                  <p className="text-sm text-muted-foreground line-clamp-2">{t.description}</p>
                              </div>
                              <div className="px-6 py-3 bg-muted/30 border-t flex justify-between items-center text-xs text-muted-foreground dark:border-zinc-800">
                                  <span>{t.blocks.length} blocks</span>
                                  <span className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-primary font-medium">
                                      Use Template <ChevronRight size={12} />
                                  </span>
                              </div>
                          </Card>
                      ))}
                  </div>
              </div>
          </div>
      )
  }

  // --- Helpers for Toolbox ---
  const ToolItem = ({ type, icon: Icon, label }: { type: BlockType, icon: any, label: string }) => (
      <button 
        onClick={() => addBlock(type)}
        className="flex flex-col items-center justify-center p-3 h-20 bg-background border rounded-lg hover:border-primary hover:shadow-sm hover:-translate-y-0.5 transition-all group dark:border-zinc-800 dark:hover:border-primary"
      >
          <Icon className="w-5 h-5 mb-2 text-muted-foreground group-hover:text-primary transition-colors" />
          <span className="text-[10px] font-medium text-foreground text-center leading-tight">{label}</span>
      </button>
  );

  return (
    <div className="flex h-screen w-screen bg-background text-foreground font-sans overflow-hidden">
      
      {/* LEFT SIDEBAR: Tools */}
      <div className="w-72 border-r bg-muted/10 flex flex-col z-20 shadow-[1px_0_20px_rgba(0,0,0,0.03)] dark:border-zinc-800">
        <div className="p-5 border-b bg-background flex items-center justify-between dark:border-zinc-800">
            <div className="flex items-center gap-2 font-bold text-lg tracking-tight select-none cursor-pointer" onClick={() => setMode('dashboard')}>
                <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                    <Layout size={16} />
                </div>
                HyprDoc
            </div>
            <div className="flex items-center gap-1">
                 <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setIsDarkMode(!isDarkMode)}>
                    {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setMode('dashboard')}>
                    <MoreHorizontal size={16} />
                </Button>
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-8 scrollbar-thin">
            <div>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 pl-1">Structure</h3>
                <div className="grid grid-cols-2 gap-2">
                    <ToolItem type={BlockType.TEXT} icon={Type} label="Text Block" />
                    <ToolItem type={BlockType.SECTION_BREAK} icon={Minus} label="Divider" />
                    <ToolItem type={BlockType.IMAGE} icon={ImageIcon} label="Image" />
                </div>
            </div>

            <div>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 pl-1">Inputs</h3>
                <div className="grid grid-cols-2 gap-2">
                    <ToolItem type={BlockType.INPUT} icon={Code} label="Short Answer" />
                    <ToolItem type={BlockType.LONG_TEXT} icon={AlignLeft} label="Paragraph" />
                    <ToolItem type={BlockType.NUMBER} icon={Hash} label="Number" />
                    <ToolItem type={BlockType.EMAIL} icon={Mail} label="Email" />
                    <ToolItem type={BlockType.DATE} icon={Calendar} label="Date Picker" />
                </div>
            </div>

            <div>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 pl-1">Choices</h3>
                <div className="grid grid-cols-2 gap-2">
                    <ToolItem type={BlockType.SELECT} icon={List} label="Dropdown" />
                    <ToolItem type={BlockType.RADIO} icon={CircleDot} label="Single Choice" />
                    <ToolItem type={BlockType.CHECKBOX} icon={CheckSquare} label="Checkbox" />
                </div>
            </div>

            <div>
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 pl-1">Advanced</h3>
                <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2.5 text-xs font-medium" onClick={() => addBlock(BlockType.CONDITIONAL)}>
                        <Settings size={14} className="text-amber-500" /> Conditional Section
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2.5 text-xs font-medium" onClick={() => addBlock(BlockType.REPEATER)}>
                        <List size={14} className="text-indigo-500" /> Dynamic Repeater
                    </Button>
                    <Button variant="outline" className="w-full justify-start gap-2 h-auto py-2.5 text-xs font-medium" onClick={() => addBlock(BlockType.SIGNATURE)}>
                        <FileSignature size={14} className="text-green-600" /> E-Signature
                    </Button>
                </div>
            </div>

             <div className="pt-4 mt-2 border-t dark:border-zinc-800">
                <div className={`relative w-full border border-dashed rounded-lg p-4 flex flex-col items-center justify-center gap-2 text-center transition-all cursor-pointer group ${isProcessing ? 'border-primary bg-primary/5' : 'border-muted-foreground/20 hover:border-primary hover:bg-background dark:border-zinc-700'}`}>
                    <input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleFileUpload} disabled={isProcessing} />
                    {isProcessing ? (
                         <div className="flex flex-col items-center py-2">
                             <Wand2 className="w-5 h-5 text-primary mb-2 animate-spin" />
                             <span className="text-[10px] font-medium text-muted-foreground">Parsing...</span>
                         </div>
                    ) : (
                        <div className="py-2">
                            <div className="mx-auto mb-2 p-1.5 bg-purple-100 text-purple-600 rounded-md w-fit group-hover:scale-110 transition-transform">
                                <Wand2 size={16} />
                            </div>
                            <span className="text-xs font-medium block">Import PDF</span>
                            <span className="text-[9px] text-muted-foreground">Extract Fields</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>

      {/* CENTER: Canvas */}
      <div className="flex-1 flex flex-col bg-muted/10 relative z-0 dark:bg-zinc-950/50" onClick={handleCanvasClick}>
          <div className="h-16 bg-background border-b flex items-center justify-between px-6 shadow-sm dark:border-zinc-800">
              <div className="flex flex-col">
                  <input 
                    value={doc.title} 
                    onChange={(e) => setDoc(prev => ({ ...prev, title: e.target.value }))}
                    className="text-lg font-bold bg-transparent outline-none focus:ring-0 placeholder:text-muted-foreground text-foreground"
                    placeholder="Document Title"
                  />
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Auto-saving
                  </div>
              </div>
              <div className="flex items-center gap-2">
                   <Button variant="outline" size="sm" className="gap-2 hidden md:flex" onClick={() => setShowPartyManager(!showPartyManager)}>
                      <Users size={14} /> Parties ({doc.parties.length})
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2 hidden md:flex" onClick={saveAsTemplate}>
                      <Save size={14} /> Save Template
                  </Button>
                  <Button onClick={() => setMode('preview')} size="sm" className="gap-2 shadow-md shadow-primary/20">
                      <Play size={14} fill="currentColor" /> Preview
                  </Button>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-12 scrollbar-hide">
              {showPartyManager && (
                  <div className="mb-8 max-w-3xl mx-auto p-4 bg-background border rounded-lg shadow-sm animate-in slide-in-from-top-4 dark:border-zinc-800">
                      <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold text-sm">Manage Signing Parties</h3>
                          <Button size="xs" variant="ghost" onClick={() => setShowPartyManager(false)}><X size={14}/></Button>
                      </div>
                      <div className="space-y-2 mb-4">
                          {doc.parties.map(p => (
                              <div key={p.id} className="flex items-center justify-between p-2 bg-muted/30 rounded border dark:border-zinc-700">
                                  <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: p.color }}>
                                          {p.initials}
                                      </div>
                                      <span className="text-sm font-medium">{p.name}</span>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <Button size="sm" onClick={addParty} variant="outline" className="w-full border-dashed"><UserPlus size={14} className="mr-2"/> Add Party</Button>
                  </div>
              )}

              <div className="max-w-3xl mx-auto bg-background min-h-[850px] shadow-sm border rounded-xl p-8 md:p-12 transition-all dark:border-zinc-800 cursor-text" onClick={(e) => e.stopPropagation()}>
                  {doc.blocks.length === 0 ? (
                      <div className="h-[400px] flex flex-col items-center justify-center text-muted-foreground opacity-40 space-y-4 border-2 border-dashed border-muted rounded-xl dark:border-zinc-800" onClick={() => addBlock(BlockType.TEXT)}>
                          <FileText size={48} strokeWidth={1} />
                          <p className="text-sm font-medium">Click to start typing or drag blocks from sidebar</p>
                      </div>
                  ) : (
                    <div className="space-y-1">
                        {doc.blocks.map(block => (
                            <EditorBlock 
                                key={block.id} 
                                block={block} 
                                parties={doc.parties}
                                formValues={{}} 
                                isSelected={selectedBlockId === block.id}
                                onSelect={setSelectedBlockId}
                                onUpdate={updateBlock}
                                onDelete={deleteBlock}
                                onDragStart={handleDragStart}
                                onDrop={handleDrop}
                                onInsertAfter={addBlock}
                            />
                        ))}
                    </div>
                  )}
                  {/* Bottom area triggers new text block */}
                  <div className="h-40 cursor-text group" onClick={() => addBlock(BlockType.TEXT)}>
                      <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-10 transition-opacity">
                          <span className="text-xs text-muted-foreground">Click to append text...</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* RIGHT SIDEBAR: Properties */}
      <div className="w-80 bg-background border-l flex flex-col z-10 shadow-[-1px_0_20px_rgba(0,0,0,0.03)] dark:border-zinc-800">
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
              {renderPropertiesPanel()}
          </div>
          <div className="p-4 border-t bg-muted/5 text-center dark:border-zinc-800">
              <p className="text-[10px] text-muted-foreground">HyprDoc Builder v2.1</p>
          </div>
      </div>
    </div>
  );
};

export default App;