import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  BlockType,
  DocBlock,
  FormValues,
  Party,
  DocumentSettings,
  Variable,
  Term,
} from "../types";
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  BookOpen,
  PenTool,
  CheckCircle2,
  ChevronRight,
  Menu,
} from "lucide-react";
import { Button, cn, Badge, getContrastColor } from "./ui-components";
import { SignatureWidget } from "./SignatureWidget";
import { fetchExchangeRate, SUPPORTED_CURRENCIES } from "../services/currency";
import {
  LEGAL_DICTIONARY_DB,
  highlightGlossaryTerms,
} from "../services/glossary";
import { SafeFormula } from "../services/formula";
import { PaymentService, formatCurrency } from "../services/payments";
import { WizardBar } from "./WizardBar";
import { BlockRenderer } from "./BlockRenderer";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { generateUUID } from "../lib/idUtils";

interface ViewerProps {
  blocks: DocBlock[];
  snapshot?: DocBlock[];
  parties?: Party[];
  variables?: Variable[];
  terms?: Term[];
  isPreview?: boolean;
  settings?: DocumentSettings;
  docHash?: string;
  onSigningComplete?: (docId: string) => void;
  status?: "draft" | "sent" | "completed" | "archived";
  verifiedIdentifier?: string;
  contentHtml?: string; // Tiptap HTML content
  onExitPreview?: () => void;
  // We can pass docId via props or rely on it being simulated in viewer for preview
  docId?: string;
}

// --- Tiptap HTML Parser & Renderer (Kept same) ---
const TiptapRenderer: React.FC<{
  html: string;
  renderBlock: (block: DocBlock) => React.ReactNode;
  terms: Term[];
  onTermsFound: (terms: string[]) => void;
}> = ({ html, renderBlock, terms, onTermsFound }) => {
  // Extract found terms on first render/change
  useEffect(() => {
    if (!html) return;

    // Scan text content for terms (regex match instead of DOM selection)
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    // Get all text content recursively
    const textContent = doc.body.innerText || doc.body.textContent || "";

    const found = new Set<string>();
    const allTerms = [...LEGAL_DICTIONARY_DB, ...terms];

    allTerms.forEach((t) => {
      // Whole word match, case insensitive
      // Escape term for regex
      const escapedTerm = t.term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escapedTerm}\\b`, "i");
      if (regex.test(textContent)) {
        found.add(t.term);
      }
    });

    onTermsFound(Array.from(found));
  }, [html, terms]);

  const processedNodes = useMemo(() => {
    if (!html) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const nodes: React.ReactNode[] = [];

    // Helper to process standard nodes
    const processNode = (domNode: Node, index: number): React.ReactNode => {
      if (domNode.nodeType === Node.ELEMENT_NODE) {
        const element = domNode as HTMLElement;

        // 1. Check for HYPR-BLOCK (The Interactive Elements)
        if (element.tagName.toLowerCase() === "hypr-block") {
          const blockData = element.getAttribute("data-block");
          if (blockData) {
            try {
              const block = JSON.parse(blockData);
              return (
                <React.Fragment key={`block-${block.id}-${index}`}>
                  {renderBlock(block)}
                </React.Fragment>
              );
            } catch (e) {
              return (
                <div key={index} className="text-red-500 text-xs">
                  Error parsing block
                </div>
              );
            }
          }
        }

        // 2. Standard HTML Tags (Text, Lists, etc.)
        const props: any = {
          key: index,
          className: element.className,
          style: { ...element.style },
        };

        // Handle task lists specially
        if (element.getAttribute("data-type") === "taskList") {
          props.className = cn(props.className, "list-none pl-0");
        }
        if (element.getAttribute("data-type") === "taskItem") {
          const isChecked = element.getAttribute("data-checked") === "true";
          return (
            <li key={index} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isChecked}
                readOnly
                className="h-4 w-4"
              />
              <span>
                {Array.from(element.childNodes).map((child, i) =>
                  processNode(child, i)
                )}
              </span>
            </li>
          );
        }

        // Handle glossary terms (just for React props safety, although standard span is fine)
        if (element.classList.contains("glossary-term")) {
          props["data-term"] = element.getAttribute("data-term");
          props["data-tooltip"] = element.getAttribute("data-tooltip");
        }

        // Check background color for contrast (from text highlighting)
        if (element.style.backgroundColor) {
          if (!element.style.color) {
          }
        }

        const children = Array.from(element.childNodes).map((child, i) =>
          processNode(child, i)
        );

        // Special handling for text content to apply Glossary Highlighting
        const hasElementChildren = Array.from(element.childNodes).some(
          (n) => n.nodeType === Node.ELEMENT_NODE
        );

        // Define void elements that cannot have children or dangerouslySetInnerHTML
        const voidElements = [
          "br",
          "hr",
          "img",
          "input",
          "area",
          "base",
          "col",
          "embed",
          "link",
          "meta",
          "param",
          "source",
          "track",
          "wbr",
        ];

        if (
          !hasElementChildren &&
          element.textContent &&
          element.textContent.trim().length > 0 &&
          !element.classList.contains("glossary-term") &&
          !voidElements.includes(element.tagName.toLowerCase())
        ) {
          const highlightedHtml = highlightGlossaryTerms(
            element.innerHTML,
            terms
          );
          return React.createElement(element.tagName.toLowerCase(), {
            ...props,
            dangerouslySetInnerHTML: { __html: highlightedHtml },
          });
        }

        return React.createElement(
          element.tagName.toLowerCase(),
          props,
          children
        );
      }

      // 3. Text Nodes
      if (domNode.nodeType === Node.TEXT_NODE) {
        return domNode.textContent;
      }

      return null;
    };

    doc.body.childNodes.forEach((node, i) => {
      nodes.push(processNode(node, i));
    });

    return nodes;
  }, [html, renderBlock, terms]);

  return (
    <div className="tiptap prose dark:prose-invert max-w-none prose-p:my-2 prose-headings:my-4">
      {processedNodes}
    </div>
  );
};

// --- Main Viewer Component ---

export const Viewer: React.FC<ViewerProps> = ({
  blocks,
  snapshot,
  parties = [],
  variables = [],
  terms = [],
  isPreview = false,
  settings,
  docHash,
  onSigningComplete,
  status,
  verifiedIdentifier,
  contentHtml,
  onExitPreview,
  docId: propDocId,
}) => {
  const [formValues, setFormValues] = useState<FormValues>({});
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [userCurrencyPreferences, setUserCurrencyPreferences] = useState<
    Record<string, string>
  >({});
  const [simulatedPartyId, setSimulatedPartyId] = useState<string>(
    parties[0]?.id || "p1"
  );
  const [isCompleted, setIsCompleted] = useState(status === "completed");
  const [docId] = useState(propDocId || "doc_session");
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(true);
  const [foundTerms, setFoundTerms] = useState<string[]>([]);

  // Convex Mutation
  const signBlockMutation = useMutation(api.documents.signBlock);

  // Update completion state if status changes from prop
  useEffect(() => {
    if (status === "completed") setIsCompleted(true);
  }, [status]);

  // Flatten blocks for navigation logic
  const allBlocksFlat = useMemo(() => {
    const flat: DocBlock[] = [];
    const traverse = (list: DocBlock[]) => {
      list.forEach((b) => {
        flat.push(b);
        if (b.children) traverse(b.children);
        if (b.elseChildren) traverse(b.elseChildren);
      });
    };
    traverse(blocks);
    return flat;
  }, [blocks]);

  // Calculate Action Items (Signatures needed for current party)
  const actionItems = useMemo(() => {
    return allBlocksFlat.filter(
      (b) =>
        b.type === BlockType.SIGNATURE &&
        b.assignedToPartyId === simulatedPartyId
    );
  }, [allBlocksFlat, simulatedPartyId]);

  // Sync initial form values
  useEffect(() => {
    const initial: FormValues = {};
    allBlocksFlat.forEach((b) => {
      if (
        b.content &&
        b.type !== BlockType.TEXT &&
        b.type !== BlockType.ALERT
      ) {
        initial[b.id] = b.content;
      }
    });
    setFormValues(initial);
  }, [allBlocksFlat]);

  const handleInputChange = (id: string, val: any) => {
    setFormValues((prev) => ({ ...prev, [id]: val }));
    setActiveFieldId(id); // Set focus for wizard
    if (validationErrors[id]) {
      setValidationErrors((p) => {
        const n = { ...p };
        delete n[id];
        return n;
      });
    }
  };

  const handleSignBlock = async (blockId: string, url: string) => {
    handleInputChange(blockId, url);

    if (url && !isPreview) {
      try {
        const userAgent = navigator.userAgent;

        let locationString = "";
        try {
          // Optional geo logic
        } catch (e) {}

        // Call Convex Mutation
        // Important: We need a real doc ID for this to work in production.
        // In preview, propDocId is undefined or mock.
        if (docId && docId !== "doc_session") {
          const result = await signBlockMutation({
            id: docId as any,
            blockId,
            signatureUrl: url,
            partyId: simulatedPartyId,
            logEntry: {
              id: generateUUID(),
              timestamp: Date.now(),
              action: "signed",
              user: verifiedIdentifier || "Signer",
              details: "Signed via Widget",
              ipAddress: "127.0.0.1", // Mock IP, typically retrieved by server
            },
          });

          if (result.success && result.updatedDoc?.status === "completed") {
            setIsCompleted(true);
            if (onSigningComplete) onSigningComplete(docId);
          }
        }
      } catch (e) {
        console.error("Signing failed", e);
      }
    }
  };

  // --- RENDER CALLBACK ---
  const renderBlockCallback = (block: DocBlock) => (
    <BlockRenderer
      key={block.id}
      block={block}
      index={0}
      idPrefix={""}
      formValues={formValues}
      handleInputChange={handleInputChange}
      parties={parties}
      simulatedPartyId={simulatedPartyId}
      activeFieldId={activeFieldId}
      allBlocksFlat={allBlocksFlat}
      renderRecursive={(b, i, p) => renderBlockCallback(b)}
      userCurrencyPreferences={userCurrencyPreferences}
      setUserCurrencyPreferences={setUserCurrencyPreferences}
      validationErrors={validationErrors}
      globalVariables={variables}
      docHash={docHash}
      docSettings={settings}
      onSignBlock={handleSignBlock}
      documentCompleted={isCompleted}
      terms={terms}
    />
  );

  // Find definitions for sidebar based on what was found in text
  const activeDefinitions = useMemo(() => {
    const allDefinitions = [
      ...LEGAL_DICTIONARY_DB,
      ...terms.map((t) => ({
        term: t.term,
        definition: t.definition,
        category: "Custom",
      })),
    ];
    const uniqueFound = Array.from(new Set(foundTerms));

    return uniqueFound
      .map((term: string) => {
        const def = allDefinitions.find(
          (d) => d.term.toLowerCase() === term.toLowerCase()
        );
        return def ? { term: def.term, def: def.definition } : null;
      })
      .filter(Boolean) as { term: string; def: string }[];
  }, [foundTerms, terms]);

  return (
    <div className="flex bg-muted/10 bg-grid-pattern min-h-screen relative font-sans">
      {/* SIDEBAR GUIDE */}
      {(isPreview || !isCompleted) && (
        <div
          className={cn(
            "fixed left-0 top-20 bottom-0 w-80 bg-white dark:bg-black border-r-2 border-black dark:border-white z-40 transition-transform duration-300 transform",
            isGuideOpen ? "translate-x-0" : "-translate-x-80"
          )}
        >
          <button
            onClick={() => setIsGuideOpen(!isGuideOpen)}
            className="absolute -right-8 top-4 w-8 h-8 bg-black text-white dark:bg-white dark:text-black flex items-center justify-center border-y-2 border-r-2 border-black dark:border-white rounded-r-md"
          >
            {isGuideOpen ? (
              <ChevronRight className="rotate-180" size={16} />
            ) : (
              <BookOpen size={16} />
            )}
          </button>

          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-4 border-b-2 border-black/10 dark:border-white/10 bg-muted/10">
              <h3 className="font-bold uppercase font-mono tracking-wider flex items-center gap-2">
                <PenTool size={16} /> Action Items
              </h3>
            </div>
            <div className="p-4 space-y-3 overflow-y-auto max-h-[40%] border-b-2 border-black/10 dark:border-white/10">
              {actionItems.length === 0 ? (
                <div className="text-xs text-muted-foreground italic">
                  No signatures required for this party.
                </div>
              ) : (
                actionItems.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center gap-2 text-xs p-2 border bg-card cursor-pointer hover:bg-black hover:text-white transition-colors"
                    onClick={() => {
                      document.getElementById(b.id)?.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                      setActiveFieldId(b.id);
                    }}
                  >
                    {formValues[b.id] ? (
                      <CheckCircle2 size={14} className="text-green-500" />
                    ) : (
                      <div className="w-3.5 h-3.5 border rounded-full" />
                    )}
                    <span className="font-bold">{b.label || "Signature"}</span>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-b-2 border-black/10 dark:border-white/10 bg-muted/10">
              <h3 className="font-bold uppercase font-mono tracking-wider flex items-center gap-2">
                <BookOpen size={16} /> Key Terms
              </h3>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {activeDefinitions.length === 0 ? (
                <div className="text-xs text-muted-foreground italic">
                  No glossary terms found in document text.
                </div>
              ) : (
                activeDefinitions.map((d, i) => (
                  <div key={i} className="text-xs space-y-1">
                    <div className="font-bold text-primary border-b border-dashed border-primary inline-block">
                      {d.term}
                    </div>
                    <div className="text-muted-foreground">{d.def}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          "flex-1 transition-all duration-300",
          isGuideOpen && (isPreview || !isCompleted) ? "ml-80" : "ml-0"
        )}
      >
        {/* Completion Overlay */}
        {isCompleted && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-zinc-900 p-8 border-2 border-black dark:border-white shadow-2xl max-w-md text-center">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-200">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2 uppercase font-mono tracking-tight">
                Document Finalized
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                All parties have signed. A secure audit trail has been generated
                and emailed to all participants.
              </p>
              <Button onClick={() => setIsCompleted(false)} className="w-full">
                View Signed Document
              </Button>
            </div>
          </div>
        )}

        {/* Preview Header */}
        {isPreview && (
          <div className="sticky top-0 z-50 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b-2 border-black dark:border-white px-8 py-4 flex justify-between items-center shadow-lg h-20">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={onExitPreview}
                className="gap-2 font-mono h-8 border-black hover:bg-black hover:text-white dark:border-white dark:hover:bg-white dark:hover:text-black"
              >
                <ArrowLeft size={16} /> BACK TO EDITOR
              </Button>
              <div className="h-8 w-px bg-black/10 dark:bg-white/10 mx-2" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono text-[10px] uppercase font-bold tracking-wider">
                  Viewing as:
                </span>
                <div className="flex gap-1 flex-wrap">
                  {parties.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSimulatedPartyId(p.id)}
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-bold font-mono uppercase border border-black dark:border-white transition-all",
                        simulatedPartyId === p.id
                          ? "shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] -translate-y-[1px]"
                          : "bg-transparent hover:bg-black/5 text-muted-foreground opacity-50 hover:opacity-100"
                      )}
                      style={{
                        backgroundColor:
                          simulatedPartyId === p.id ? p.color : "transparent",
                        color:
                          simulatedPartyId === p.id
                            ? getContrastColor(p.color)
                            : undefined,
                        borderColor:
                          simulatedPartyId === p.id ? "black" : undefined,
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {docHash && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                <Lock size={10} /> SHA-256: {docHash.substring(0, 12)}...
              </div>
            )}
          </div>
        )}

        {/* Paper Container - Added more padding-top to avoid overlap */}
        <div
          className={cn(
            "max-w-[850px] mx-auto bg-white dark:bg-black border-2 border-black dark:border-zinc-800 shadow-hypr dark:shadow-hypr-dark relative transition-all p-16 min-h-[1100px]",
            isPreview ? "mt-8 mb-24 pt-32" : "mt-8"
          )}
          dir={settings?.direction || "ltr"}
          style={{
            fontFamily: settings?.fontFamily || "inherit",
            paddingTop: isPreview ? "100px" : settings?.margins?.top, // Override top padding in preview to clear nav
            paddingBottom: settings?.margins?.bottom,
            paddingLeft: settings?.margins?.left,
            paddingRight: settings?.margins?.right,
          }}
        >
          {/* Header / Logo */}
          <div className="mb-12 text-center border-b-2 border-black/10 dark:border-white/10 pb-6">
            {settings?.logoUrl && (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="h-16 mx-auto mb-6 object-contain"
              />
            )}
            {/* We don't show title block here if it's already in the contentHtml as H1 */}
            {!contentHtml?.includes("<h1") && (
              <h1 className="text-4xl font-black tracking-tight mb-2 uppercase text-foreground dark:text-white">
                {blocks[0]?.content?.includes("# ") ? "" : "Untitled Document"}
              </h1>
            )}
            {isCompleted && (
              <Badge
                variant="default"
                className="bg-green-600 border-green-700 text-white mt-2"
              >
                LEGALLY BINDING & LOCKED
              </Badge>
            )}
          </div>

          {/* Content Renderer */}
          <div className="space-y-6">
            {contentHtml ? (
              <TiptapRenderer
                html={contentHtml}
                renderBlock={renderBlockCallback}
                terms={terms}
                onTermsFound={setFoundTerms}
              />
            ) : (
              // Fallback for old documents without HTML content
              blocks.map((block, i) => renderBlockCallback(block))
            )}
          </div>
        </div>

        {/* Wizard Command Bar */}
        <WizardBar
          allBlocks={allBlocksFlat}
          formValues={formValues}
          onChange={handleInputChange}
          activePartyId={simulatedPartyId}
          onFocus={(id) => {
            setActiveFieldId(id);
            const el = document.getElementById(id);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
          isCompleted={isCompleted}
          activeFieldId={activeFieldId}
        />
      </div>
    </div>
  );
};
