import React, { useState, useEffect } from "react";
import { DocumentState, AuditLogEntry } from "../../types";
import {
  Card,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Textarea,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../ui-components";
import {
  FileText,
  PlusCircle,
  MoreHorizontal,
  Clock,
  CheckCircle2,
  Eye,
  PenTool,
  ShieldCheck,
  Sparkles,
  Loader2,
  RefreshCw,
  LayoutTemplate,
  Copy,
  WifiOff,
  HardDrive,
} from "lucide-react";
import { generateAuditTrailPDF } from "../../services/auditTrail";
import { generateDocumentFromPrompt } from "../../services/gemini";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useDocument } from "../../context/DocumentContext";
import { StorageService } from "../../services/storage";
import { IS_OFFLINE } from "../../index";

interface DashboardViewProps {
  documents: DocumentState[];
  auditLog?: AuditLogEntry[];
  navigate: (hash: string) => void;
  onSelect: (id: string) => void;
  onImport?: (doc: DocumentState) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  auditLog = [],
  navigate,
  onSelect,
  onImport,
}) => {
  const { createNewDocument, setDoc, doc } = useDocument();
  const [isCreating, setIsCreating] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [localDocs, setLocalDocs] = useState<any[]>([]);

  // Fetch docs via Convex (or skip if offline)
  // We use skip: IS_OFFLINE to prevent attempting connection
  const docList = useQuery(api.documents.list, IS_OFFLINE ? "skip" : {});

  // Local Load Effect
  useEffect(() => {
    if (IS_OFFLINE) {
      const storedDocs = StorageService.listDocuments();
      setLocalDocs(storedDocs);
    }
  }, []);

  // Combine sources based on mode
  const displayDocs = IS_OFFLINE ? localDocs : docList || [];
  const isLoading = !IS_OFFLINE && docList === undefined;

  const createDocMutation = useMutation(api.documents.create);

  // Timeout warning only if NOT offline and still loading
  useEffect(() => {
    if (isLoading && !IS_OFFLINE) {
      const timer = setTimeout(() => setShowTimeoutWarning(true), 5000);
      return () => clearTimeout(timer);
    } else {
      setShowTimeoutWarning(false);
    }
  }, [isLoading]);

  const handleSelectDoc = (docId: string) => {
    if (IS_OFFLINE) {
      const loaded = StorageService.loadDocument(docId);
      if (loaded) {
        setDoc(loaded);
        onSelect(loaded.id!);
      }
    } else {
      const selected = docList?.find((d: any) => d._id === docId);
      if (selected) {
        setDoc({
          ...selected,
          id: selected._id,
          status: selected.status as any,
        });
        onSelect(selected._id);
      }
    }
  };

  const handleCreate = async () => {
    if (isCreating) return; // Prevent double-clicks
    setIsCreating(true);
    try {
      await createNewDocument();
      // If offline, refresh list manually
      if (IS_OFFLINE) {
        setLocalDocs(StorageService.listDocuments());
      }
      // Note: Navigation will happen via useEffect below after doc.id is set
    } finally {
      setIsCreating(false);
    }
  };

  // Navigate to document after creation
  useEffect(() => {
    if (
      doc.id &&
      isCreating === false &&
      doc.title === "Untitled Document" &&
      doc.blocks.length <= 1
    ) {
      // This is a newly created document, navigate to edit
      navigate(`#doc/${doc.id}/edit`);
    }
  }, [doc.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "template":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-zinc-100 text-zinc-700 border-zinc-200";
    }
  };

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const { title, blocks } = await generateDocumentFromPrompt(aiPrompt);
      let docId: string;

      const newDocBase = {
        title: title,
        status: "draft",
        parties: [
          { id: "p1", name: "Me (Owner)", color: "#3b82f6", initials: "ME" },
          { id: "p2", name: "Recipient", color: "#ec4899", initials: "RE" },
        ],
        variables: [],
        terms: [],
        blocks: blocks,
        updatedAt: Date.now(),
        auditLog: [
          {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            action: "created",
            user: "AI Assistant",
            details: "Generated from prompt",
          },
        ],
      };

      if (IS_OFFLINE) {
        docId = crypto.randomUUID();
        StorageService.saveDocument({
          ...newDocBase,
          id: docId,
        } as DocumentState);
        setLocalDocs(StorageService.listDocuments());
      } else {
        docId = await createDocMutation(newDocBase as any);
      }

      const newDoc: DocumentState = {
        ...newDocBase,
        id: docId,
      } as DocumentState;

      if (onImport) {
        onImport(newDoc);
      }
      setShowAIGenerator(false);
      setAiPrompt("");
    } catch (error) {
      alert("Failed to generate document. Please try again.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const myDocs = displayDocs.filter((d: any) => d.status !== "template");
  const templates = displayDocs.filter((d: any) => d.status === "template");

  return (
    <div className="flex-1 flex overflow-hidden bg-muted/10">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              Dashboard
              {isLoading && (
                <Loader2
                  size={20}
                  className="animate-spin text-muted-foreground"
                />
              )}
              {IS_OFFLINE && (
                <Badge
                  variant="secondary"
                  className="gap-1 bg-amber-100 text-amber-800"
                >
                  <HardDrive size={12} /> LOCAL MODE
                </Badge>
              )}
            </h1>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowAIGenerator(true)}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-800 shadow-hypr-sm"
              >
                <Sparkles size={16} /> Generate with AI
              </Button>
              <Button
                onClick={handleCreate}
                variant="outline"
                className="gap-2 bg-card border-2"
              >
                <PlusCircle size={16} /> New Blank
              </Button>
            </div>
          </div>

          {showTimeoutWarning && (
            <div className="p-4 bg-amber-50 border-2 border-amber-200 text-amber-900 flex items-start gap-3">
              <WifiOff size={20} className="mt-0.5" />
              <div className="text-sm">
                <p className="font-bold">Connection Slow or Failed</p>
                <p>Could not load documents from Convex. Please check that:</p>
                <ul className="list-disc pl-4 mt-1 space-y-1">
                  <li>
                    Your <code>convex/auth.config.ts</code> matches your Clerk
                    Issuer URL.
                  </li>
                  <li>
                    Your <code>VITE_CONVEX_URL</code> is correct.
                  </li>
                  <li>
                    You have run <code>npx convex dev</code>.
                  </li>
                </ul>
              </div>
            </div>
          )}

          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="documents" className="text-sm px-6">
                My Documents
              </TabsTrigger>
              <TabsTrigger value="templates" className="text-sm px-6">
                Templates
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documents">
              <div className="grid gap-4">
                {myDocs.map((doc: any) => (
                  <Card
                    key={doc.id || doc._id}
                    className="p-4 flex items-center justify-between hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => handleSelectDoc(doc.id || doc._id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{doc.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Updated {new Date(doc.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        className={getStatusColor(doc.status)}
                        variant="outline"
                      >
                        {doc.status.toUpperCase()}
                      </Badge>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal size={16} />
                      </Button>
                    </div>
                  </Card>
                ))}
                {!isLoading && myDocs.length === 0 && (
                  <div className="p-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground bg-card/50">
                    <Sparkles
                      size={48}
                      className="mb-4 text-indigo-400 opacity-50"
                    />
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      Create your first document
                    </h3>
                    <p className="text-center max-w-sm mb-6">
                      Start from scratch or use our Gemini AI engine to build a
                      contract in seconds.
                    </p>
                    <Button
                      onClick={() => setShowAIGenerator(true)}
                      className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                    >
                      <Sparkles size={16} /> Try AI Generator
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="templates">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((doc: any) => (
                  <Card
                    key={doc.id || doc._id}
                    className="p-6 hover:border-purple-500 transition-colors cursor-pointer group flex flex-col"
                    onClick={() => handleSelectDoc(doc.id || doc._id)}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 text-purple-600 flex items-center justify-center rounded-none border border-purple-200">
                        <LayoutTemplate size={20} />
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 border-purple-200"
                      >
                        TEMPLATE
                      </Badge>
                    </div>
                    <h3 className="font-bold text-lg mb-2">{doc.title}</h3>
                    <p className="text-xs text-muted-foreground mb-6 line-clamp-2">
                      Click to edit this template master.
                    </p>
                    <div className="mt-auto">
                      <Button
                        size="sm"
                        className="w-full bg-card text-card-foreground border-border hover:bg-purple-50 hover:text-purple-700"
                      >
                        <Copy size={14} className="mr-2" /> Create New
                      </Button>
                    </div>
                  </Card>
                ))}
                {!isLoading && templates.length === 0 && (
                  <div className="col-span-full p-12 text-center text-muted-foreground border-2 border-dashed">
                    <p>
                      No templates found. Go to Settings in any document to
                      "Save as Template".
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Audit Log Sidebar */}
      <div className="w-80 border-l bg-background hidden xl:flex flex-col border-border">
        <div className="p-6 border-b font-semibold text-sm flex items-center gap-2 border-border">
          <Clock size={16} /> Recent Activity
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Simplified for demo - logs are per document in DB */}
          <p className="text-xs text-muted-foreground text-center italic">
            Select a document to view history.
          </p>
        </div>
      </div>

      {/* AI Generator Modal */}
      <Dialog open={showAIGenerator} onOpenChange={setShowAIGenerator}>
        <DialogContent className="max-w-xl border-2 border-border shadow-hypr bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="text-indigo-500" /> AI Document Generator
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-900 dark:text-indigo-200 text-sm border-l-4 border-indigo-500">
              Describe the document you need. HyprDoc will generate the
              structure, text clauses, and required input fields automatically.
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold uppercase font-mono">
                Your Prompt
              </label>
              <Textarea
                placeholder="e.g. A freelance web design contract for a client paying $5000 upfront, with a 2-week delivery timeline and standard confidentiality clauses."
                className="min-h-[120px] resize-none text-base"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setShowAIGenerator(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!aiPrompt.trim() || isGenerating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white min-w-[140px]"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="animate-spin mr-2" size={16} />{" "}
                    Building...
                  </>
                ) : (
                  "Generate Doc"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
