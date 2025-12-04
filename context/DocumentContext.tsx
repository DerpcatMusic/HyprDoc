import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  DocumentState,
  DocBlock,
  BlockType,
  AuditLogEntry,
  Party,
  DocumentSettings,
  EventType,
} from "../types";
import * as TreeManager from "../services/treeManager";
import { logEvent } from "../services/eventLogger";
import { hashDocument } from "../services/crypto";
import { useMutation, useConvex } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "./AuthContext";
import { StorageService } from "../services/storage";
import { IS_OFFLINE } from "../index"; // Flag detected in index
import {
  createDocumentId,
  generateUUID,
  validateDocumentId,
} from "../lib/idUtils";

interface DocumentContextType {
  doc: DocumentState;
  saveStatus: "saved" | "saving" | "unsaved" | "error";
  selectedBlockId: string | null;
  mode: "edit" | "preview" | "dashboard" | "settings" | "recipient";

  setDoc: React.Dispatch<React.SetStateAction<DocumentState>>;
  loadDocument: (id: string) => Promise<void>;
  createNewDocument: () => Promise<void>;
  setMode: (
    mode: "edit" | "preview" | "dashboard" | "settings" | "recipient"
  ) => void;
  setSelectedBlockId: (id: string | null) => void;

  getBlock: (id: string) => DocBlock | null;
  addBlock: (
    type: BlockType,
    targetId?: string,
    position?: "after" | "before" | "inside" | "inside-false"
  ) => void;
  updateBlock: (
    id: string,
    updates: Partial<DocBlock>,
    saveHistory?: boolean
  ) => void;
  deleteBlock: (id: string) => void;
  moveBlock: (
    draggedId: string,
    targetId: string | null | undefined,
    position: "after" | "before" | "inside" | "inside-false"
  ) => void;
  ungroupBlock: (id: string) => void;

  updateSettings: (settings: DocumentSettings) => void;
  addAuditLog: (action: EventType, details?: string, data?: any) => void;

  updateParties: (parties: Party[]) => void;
  updateParty: (index: number, party: Party) => void;
  addParty: (party: Party) => void;
  removeParty: (id: string) => void;

  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  uploadAsset: (file: Blob, path: string) => Promise<string | null>;
  saveNow: () => Promise<void>;
}

const DocumentContext = createContext<DocumentContextType | undefined>(
  undefined
);

const INITIAL_PARTIES: Party[] = [
  { id: "p1", name: "Me (Owner)", color: "#3b82f6", initials: "ME" },
  { id: "p2", name: "Client", color: "#ec4899", initials: "CL" },
];

const DEFAULT_DOC: DocumentState = {
  id: "",
  title: "Untitled Document",
  status: "draft",
  parties: INITIAL_PARTIES,
  variables: [],
  settings: {
    signingOrder: "parallel",
    brandColor: "#000000",
    fontFamily: "Inter, sans-serif",
    margins: { top: 60, bottom: 60, left: 60, right: 60 },
    direction: "ltr",
  },
  terms: [],
  blocks: [],
  auditLog: [],
};

const getNiceLabel = (type: BlockType): string => {
  return type.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  // Hook convex only if not offline, otherwise it might error if client is missing
  const convex = !IS_OFFLINE ? useConvex() : null;
  const [doc, setDoc] = useState<DocumentState>(DEFAULT_DOC);
  const [mode, setMode] = useState<
    "edit" | "preview" | "dashboard" | "settings" | "recipient"
  >("dashboard");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "unsaved" | "error"
  >("saved");

  // Convex Mutations (Only used if !IS_OFFLINE)
  const createDocument = !IS_OFFLINE
    ? useMutation(api.documents.create)
    : async () => {};
  const updateDocument = !IS_OFFLINE
    ? useMutation(api.documents.update)
    : async () => {};

  // History State
  const [past, setPast] = useState<DocumentState[]>([]);
  const [future, setFuture] = useState<DocumentState[]>([]);

  // Function to perform save with error recovery
  const performSave = async (
    documentState: DocumentState,
    retryCount: number = 0
  ) => {
    const MAX_SAVE_RETRIES = 3;

    // Don't save default empty doc or if ID is missing
    if (!documentState.id) return;

    try {
      if (IS_OFFLINE) {
        // Offline fallback: Save to LocalStorage
        StorageService.saveDocument(documentState);
        console.log("Document saved to local storage:", documentState.id);
        return;
      }

      // Online Mode: Save to Convex
      if (updateDocument) {
        await updateDocument({
          id: documentState.id as any, // ID type handled by Convex Client
          title: documentState.title,
          status: documentState.status,
          blocks: documentState.blocks,
          parties: documentState.parties,
          variables: documentState.variables,
          terms: documentState.terms,
          settings: documentState.settings,
          auditLog: documentState.auditLog,
          updatedAt: Date.now(),
          contentHtml: documentState.contentHtml,
          snapshot: documentState.snapshot,
          sha256: documentState.sha256,
        });
        console.log("Document saved to Convex:", documentState.id);
      }
    } catch (e: any) {
      console.error("Save failed:", e);

      // Handle specific save errors
      if (e.message && e.message.includes("Network")) {
        if (retryCount < MAX_SAVE_RETRIES) {
          console.log("Network error during save, retrying...", retryCount + 1);
          setTimeout(() => performSave(documentState, retryCount + 1), 2000);
          return;
        } else {
          console.log(
            "Max save retries reached, falling back to local storage"
          );
          // Fallback to local storage
          StorageService.saveDocument(documentState);
          return;
        }
      } else if (e.message && e.message.includes("ArgumentValidationError")) {
        console.error(
          "ID validation error during save, attempting ID conversion"
        );
        // Try with a fresh ID
        const newDocId = createDocumentId("online");
        const updatedDoc = { ...documentState, id: newDocId };
        setDoc(updatedDoc);
        StorageService.saveDocument(updatedDoc);
        return;
      } else {
        throw e;
      }
    }
  };

  // Auto-Save Logic (Debounced Sync)
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!doc.id) return;

    setSaveStatus("saving");
    const timer = setTimeout(async () => {
      try {
        await performSave(doc);
        setSaveStatus("saved");
      } catch (e) {
        console.error(e);
        setSaveStatus("error");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [doc]);

  const saveNow = async () => {
    if (!doc.id) return;
    setSaveStatus("saving");

    // Debug logging for ID issues
    if (doc.id) {
      console.log("Saving document with ID:", doc.id, {
        idLength: doc.id.length,
        idFormat:
          doc.id.length === 25
            ? "convext"
            : doc.id.includes("-")
              ? "uuid"
              : "unknown",
      });
    }

    try {
      await performSave(doc);
      setSaveStatus("saved");
    } catch (e) {
      console.error("Save operation failed:", e);
      setSaveStatus("error");
    }
  };

  // Hashing Logic
  useEffect(() => {
    let isMounted = true;
    const calculateHash = async () => {
      if (!doc.blocks) return;
      const hash = await hashDocument(doc);
      if (isMounted && hash !== doc.sha256) {
        setDoc((prev) => ({ ...prev, sha256: hash }));
      }
    };
    const timer = setTimeout(calculateHash, 500);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [doc.blocks, doc.settings, doc.parties]);

  // --- Loading Logic with Enhanced Error Handling ---
  const loadDocument = async (id: string, retryCount: number = 0) => {
    const MAX_RETRIES = 2;
    setSaveStatus("saving");

    try {
      if (IS_OFFLINE) {
        const localDoc = StorageService.loadDocument(id);
        if (localDoc) {
          setDoc(localDoc);
          setSaveStatus("saved");
          console.log("Successfully loaded document from local storage:", id);
        } else {
          console.warn("Document not found locally:", id);
          setSaveStatus("error");
        }
        return;
      }

      // Online Mode
      if (convex) {
        try {
          console.log(
            "Loading document with ID:",
            id,
            "(attempt",
            retryCount + 1,
            ")"
          );

          // Handle both Convex IDs and regular UUIDs for backwards compatibility
          const validation = validateDocumentId(id);
          if (!validation.isValid) {
            console.error("Invalid document ID format:", validation.error);
            if (retryCount < MAX_RETRIES) {
              console.log("Retrying with fallback...");
              setTimeout(
                () => loadDocument(crypto.randomUUID(), retryCount + 1),
                1000
              );
              return;
            } else {
              console.log("Max retries reached, creating new document...");
              await createNewDocument();
              return;
            }
          }

          const fetchedDoc = await convex.query(api.documents.get, {
            id: validation.normalizedId as any,
          });
          if (fetchedDoc) {
            const loadedDoc: DocumentState = {
              ...fetchedDoc,
              id: fetchedDoc._id,
              status: (fetchedDoc.status as any) || "draft",
            };
            setDoc(loadedDoc);
            setSaveStatus("saved");
            console.log(
              "Successfully loaded document from Convex:",
              fetchedDoc._id
            );
          } else {
            if (retryCount < MAX_RETRIES) {
              console.log("Document not found, retrying...", retryCount + 1);
              setTimeout(() => loadDocument(id, retryCount + 1), 2000);
              return;
            }
            console.log("Document not found in DB, creating new document...");
            await createNewDocument();
          }
        } catch (queryError: any) {
          console.error("Convex query error:", queryError);

          // Handle specific Convex validation errors
          if (
            queryError.message &&
            (queryError.message.includes("Value does not match validator") ||
              queryError.message.includes("v.id") ||
              queryError.message.includes("ArgumentValidationError"))
          ) {
            console.log("Invalid document ID format, creating new document...");
            await createNewDocument();
          } else if (
            queryError.message &&
            queryError.message.includes("Document not found")
          ) {
            console.log("Document not found, creating new document...");
            await createNewDocument();
          } else if (
            queryError.message &&
            queryError.message.includes("Network")
          ) {
            // Network error - retry
            if (retryCount < MAX_RETRIES) {
              console.log(
                "Network error, retrying in 2 seconds...",
                retryCount + 1
              );
              setTimeout(() => loadDocument(id, retryCount + 1), 2000);
              return;
            } else {
              console.log(
                "Max network retries reached, creating new document..."
              );
              await createNewDocument();
            }
          } else {
            // For other errors, if it's a document not found, create new, else error
            if (retryCount < MAX_RETRIES) {
              console.log("Unknown error, retrying...", retryCount + 1);
              setTimeout(() => loadDocument(id, retryCount + 1), 1000);
              return;
            } else {
              console.error(
                "Unexpected error loading document after retries:",
                queryError
              );
              setSaveStatus("error");
            }
          }
        }
      }
    } catch (e) {
      console.error("Failed to load document:", e);
      if (retryCount < MAX_RETRIES) {
        console.log("General error, retrying...", retryCount + 1);
        setTimeout(() => loadDocument(id, retryCount + 1), 2000);
      } else {
        setSaveStatus("error");
      }
    }
  };

  const createNewDocument = async () => {
    setSaveStatus("saving");
    try {
      let docId: string;

      // Base new doc data
      const timestamp = Date.now();
      const newDocBase = {
        title: "Untitled Document",
        status: "draft",
        blocks: [
          {
            id: generateUUID(),
            type: BlockType.TEXT,
            content: "# Untitled\nStart typing...",
          },
        ],
        parties: INITIAL_PARTIES,
        variables: [],
        terms: [],
        settings: DEFAULT_DOC.settings,
        auditLog: [
          {
            id: generateUUID(),
            timestamp,
            action: "created",
            user: user?.firstName || "Me",
          },
        ],
        updatedAt: timestamp,
      };

      if (IS_OFFLINE) {
        docId = createDocumentId("offline");
        StorageService.saveDocument({
          ...newDocBase,
          id: docId,
        } as DocumentState);
      } else {
        try {
          const convexDocId = await createDocument(newDocBase);
          docId = convexDocId
            ? convexDocId.toString()
            : createDocumentId("online");
        } catch (error: any) {
          console.error("Failed to create document in Convex:", error);
          // Fallback to local creation with UUID
          docId = createDocumentId("offline");
          StorageService.saveDocument({
            ...newDocBase,
            id: docId,
          } as DocumentState);
        }
      }

      const newDoc = {
        ...newDocBase,
        id: docId,
        ownerId: user?.id,
      } as DocumentState;

      setDoc(newDoc);
      setPast([]);
      setFuture([]);
      setSaveStatus("saved");
    } catch (e) {
      console.error("Failed to create document", e);
      setSaveStatus("error");
    }
  };

  // --- History Management ---
  const saveSnapshot = useCallback(() => {
    setPast((prev) => [...prev, doc]);
    setFuture([]);
    setSaveStatus("unsaved");
  }, [doc]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setPast(newPast);
    setFuture((prev) => [doc, ...prev]);
    setDoc(previous);
  }, [doc, past]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    setPast((prev) => [...prev, doc]);
    setFuture(newFuture);
    setDoc(next);
  }, [doc, future]);

  const addAuditLog = async (
    action: EventType,
    details?: string,
    data?: any
  ) => {
    const newEntry = await logEvent(
      doc.auditLog || [],
      action,
      user?.firstName || "Me",
      details,
      data
    );
    setDoc((prev) => ({
      ...prev,
      auditLog: [newEntry, ...(prev.auditLog || [])],
    }));
  };

  const createBlockObject = (type: BlockType): DocBlock => {
    const base: DocBlock = {
      id: generateUUID(),
      type,
      content: type === BlockType.TEXT ? "" : undefined,
      label: getNiceLabel(type),
      variableName: `field_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      options: ["select", "radio", "checkbox"].includes(type)
        ? ["Option 1"]
        : undefined,
      children: ["conditional", "repeater"].includes(type) ? [] : undefined,
      condition:
        type === BlockType.CONDITIONAL
          ? { variableName: "", operator: "equals", value: "" }
          : undefined,
    };

    if (type === BlockType.COLUMNS) {
      base.children = [
        {
          id: generateUUID(),
          type: BlockType.COLUMN,
          width: 50,
          children: [],
        },
        {
          id: generateUUID(),
          type: BlockType.COLUMN,
          width: 50,
          children: [],
        },
      ];
    }

    if (type === BlockType.COLUMN) {
      base.width = 50;
      base.children = [];
    }

    if (type === BlockType.SPACER) base.height = 32;
    if (type === BlockType.ALERT) {
      base.variant = "info";
      base.content = "Important Information";
    }
    if (type === BlockType.QUOTE) base.content = "Citation or quote text here.";

    return base;
  };

  const getBlock = (id: string): DocBlock | null => {
    return TreeManager.findNode(doc.blocks, id);
  };

  const addBlock = (
    type: BlockType,
    targetId?: string,
    position: "after" | "before" | "inside" | "inside-false" = "after"
  ) => {
    saveSnapshot();
    const newBlock = createBlockObject(type);
    setDoc((prev) => ({
      ...prev,
      blocks: TreeManager.insertNode(prev.blocks, newBlock, targetId, position),
    }));
    setSelectedBlockId(newBlock.id);
    addAuditLog("edited", `Added ${type}`);
  };

  const updateBlock = (
    id: string,
    updates: Partial<DocBlock>,
    recordHistory = true
  ) => {
    if (recordHistory) saveSnapshot();
    setDoc((prev) => {
      // Find and update - simpler to clone whole tree for React state
      const newBlocks = TreeManager.cloneTree(prev.blocks);
      const node = TreeManager.findNode(newBlocks, id);
      if (node) {
        Object.assign(node, updates);
      }
      return { ...prev, blocks: newBlocks };
    });
  };

  const deleteBlock = (id: string) => {
    saveSnapshot();
    setDoc((prev) => {
      const { tree } = TreeManager.removeNode(prev.blocks, id);
      return { ...prev, blocks: tree };
    });
    setSelectedBlockId(null);
    addAuditLog("edited", "Deleted block");
  };

  const moveBlock = (
    draggedId: string,
    targetId: string | null | undefined,
    position: "after" | "before" | "inside" | "inside-false"
  ) => {
    saveSnapshot();
    setDoc((prev) => {
      // 1. Remove
      const { tree: tempTree, removed } = TreeManager.removeNode(
        prev.blocks,
        draggedId
      );
      if (!removed) return prev;

      // 2. Insert
      const finalTree = TreeManager.insertNode(
        tempTree,
        removed,
        targetId || undefined,
        position
      );
      return { ...prev, blocks: finalTree };
    });
  };

  const ungroupBlock = (id: string) => {
    saveSnapshot();
    setDoc((prev) => {
      const container = TreeManager.findNode(prev.blocks, id);
      if (!container || !container.children) return prev;

      // Gather all children from all columns
      let allItems: DocBlock[] = [];
      if (container.type === BlockType.COLUMNS) {
        container.children.forEach((col) => {
          if (col.children) allItems = [...allItems, ...col.children];
        });
      } else {
        allItems = container.children;
      }

      // Replace container with items
      const newBlocks = TreeManager.replaceNode(prev.blocks, id, allItems);
      return { ...prev, blocks: newBlocks };
    });
    addAuditLog("edited", "Ungrouped columns");
  };

  const updateSettings = (settings: DocumentSettings) => {
    saveSnapshot();
    setDoc((prev) => ({ ...prev, settings }));
  };

  // Party Management
  const updateParties = (parties: Party[]) => {
    saveSnapshot();
    setDoc((prev) => ({ ...prev, parties }));
  };

  const updateParty = (index: number, party: Party) => {
    saveSnapshot();
    const newParties = [...doc.parties];
    newParties[index] = party;
    setDoc((prev) => ({ ...prev, parties: newParties }));
  };

  const addParty = (party: Party) => {
    saveSnapshot();
    setDoc((prev) => ({ ...prev, parties: [...prev.parties, party] }));
  };

  const removeParty = (id: string) => {
    saveSnapshot();
    setDoc((prev) => ({
      ...prev,
      parties: prev.parties.filter((p) => p.id !== id),
    }));
  };

  // Asset Management
  const uploadAsset = async (
    file: Blob,
    path: string
  ): Promise<string | null> => {
    // Simple base64 fallback for offline or quick demo
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  return (
    <DocumentContext.Provider
      value={{
        doc,
        setDoc,
        saveStatus,
        selectedBlockId,
        mode,
        loadDocument,
        createNewDocument,
        setMode,
        setSelectedBlockId,
        getBlock,
        addBlock,
        updateBlock,
        deleteBlock,
        moveBlock,
        ungroupBlock,
        updateSettings,
        addAuditLog,
        updateParties,
        updateParty,
        addParty,
        removeParty,
        undo,
        redo,
        canUndo: past.length > 0,
        canRedo: future.length > 0,
        uploadAsset,
        saveNow,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocument = () => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error("useDocument must be used within a DocumentProvider");
  }
  return context;
};
