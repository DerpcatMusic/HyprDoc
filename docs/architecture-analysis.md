# HyprDoc Architecture Analysis

_Generated: 2025-12-04_

## Executive Summary

This document provides a comprehensive analysis of the current HyprDoc architecture, identifying key patterns, dependencies, and pain points that need to be addressed during the upcoming refactoring. The analysis reveals a complex state management system with circular dependencies, performance bottlenecks, and type safety issues that are limiting scalability and maintainability.

## Current State Management Flow

### Data Flow Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Document      │    │   EditorCanvas  │    │   Convex        │
│   Context       │◄──►│   (Tiptap)      │◄──►│   Database      │
│                 │    │                 │    │                 │
│ • React State   │    │ • Editor Instance│   │ • Query/Mutation │
│ • Auto-save     │    │ • Sync Logic    │    │ • v.any() Schema│
│ • History Mgmt  │    │ • SlashMenu     │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   TreeManager   │    │   EditorBlock   │    │   LocalStorage  │
│   (Service)     │    │   Components    │    │   (Offline)     │
│                 │    │                 │    │                 │
│ • Tree Ops      │    │ • Individual    │    │ • Offline Fallback│
│ • Path Finding  │    │   Editor        │    │ • Caching       │
│ • Node Updates  │    │ • Block Render  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### State Synchronization Issues

The current implementation suffers from **circular data flow**:

1. **Context → Editor**: `selectedBlockId`, `blocks` updates trigger editor re-renders
2. **Editor → Context**: `syncContent` triggers block updates every 1 second
3. **Context → TreeManager**: Tree operations modify block structures
4. **TreeManager → Context**: Modified blocks trigger context updates

This creates multiple performance bottlenecks:

- **1-second debounced sync** causes delayed state propagation
- **Full tree cloning** for every update (see `TreeManager.cloneTree`)
- **Editor per block pattern** creates memory and performance issues
- **Hash-based change detection** adds computational overhead

## Identified Issues

### 1. Circular Dependencies

#### DocumentContext ↔ EditorCanvas

- **Problem**: Bidirectional state synchronization creates infinite loops
- **Evidence**: `syncContent` effect runs every 1 second based on `editor.getHTML()`
- **Impact**: Performance degradation, state inconsistencies

#### TreeManager Integration

- **Problem**: TreeManager is both imported by Context and exported for component use
- **Evidence**: `context/DocumentContext.tsx:18` imports TreeManager, but components also import it directly
- **Impact**: Unclear data ownership, potential state corruption

### 2. Performance Bottlenecks

#### Editor per Block Pattern

- **Problem**: Each block creates its own Tiptap editor instance
- **Evidence**: `components/tiptap/BlockNodeView.tsx:50-91` shows individual editor for each block
- **Impact**:
  - Memory consumption scales linearly with block count
  - Event listener duplication
  - Performance degradation in documents with many blocks

#### Auto-save Hash Calculation

- **Problem**: SHA-256 hashing of entire document state on every change
- **Evidence**: `context/DocumentContext.tsx:315-366` shows hash calculation effect
- **Impact**: Computational overhead on large documents

### 3. Type Safety Issues (v.any() Usage)

#### Convex Schema Weaknesses

Found **7 critical v.any() usages** in `convex/schema.ts`:

1. **Line 40**: `metadata: v.optional(v.any())` - Audit log metadata
2. **Line 50**: `attrs: v.optional(v.any())` - Tiptap attributes
3. **Line 55**: `condition: v.optional(v.any())` - Block conditions
4. **Line 56**: `children: v.optional(v.any())` - Recursive children
5. **Line 66**: `contentJson: v.optional(v.any())` - Tiptap JSON content
6. **Line 72**: `terms: v.array(v.any())` - Document terms
7. **Line 80**: `snapshot: v.optional(v.any())` - Document snapshots

**Impact**:

- Loss of compile-time type safety
- Runtime validation issues
- Difficult debugging and maintenance
- Potential data corruption

### 4. Component Dependency Graph

```
App.tsx
├── DocumentProvider (Context)
│   ├── EditorCanvas (Tiptap Editor)
│   │   ├── EditorToolbarEnhanced
│   │   ├── EditorContent (Tiptap)
│   │   │   ├── BlockNodeExtension
│   │   │   │   └── BlockNodeView
│   │   │   │       └── EditorBlock (Per Block)
│   │   │   │           ├── TextEditor (useEditor Pattern)
│   │   │   │           ├── PaymentEditor
│   │   │   │           └── [Other Block Types]
│   │   │   └── SlashMenu
│   │   └── SettingsView
│   ├── DashboardView
│   ├── Viewer (Preview Mode)
│   └── WizardBar
```

**Critical Dependencies**:

- **EditorCanvas depends on Context** for all state management
- **BlockNodeView depends on Editor instance** for storage access
- **EditorBlock components depend on both Context and Editor**
- **TextEditor has legacy useEditor pattern** that conflicts with main editor

## Tiptap Extension Analysis

### Current HyprBlock Structure

#### HyprBlock.ts (Container Node Pattern)

```typescript
export const HyprBlock = Node.create({
  name: "hyprBlock",
  group: "block",
  content: "block+", // ❌ CONTAINER NODE - can contain other blocks
  draggable: true,
  // ...
});
```

**Problems**:

1. **Container Node Pattern**: Claims to be atomic but allows child content
2. **Attribute Bloat**: Stores entire block data in attributes
3. **Parsing Complexity**: Custom HTML serialization/deserialization
4. **Performance**: Each block requires full NodeView re-render

#### BlockNodeView.tsx (Atom vs Container Confusion)

```typescript
export const BlockNodeExtension = Node.create({
  name: "hyprBlock",
  atom: true, // ❌ CONFLICT: atom=true but content="block+" above
  draggable: true,
  // ...
});
```

**Critical Issues**:

- **Conflicting configurations**: Container vs atom node
- **Storage Coupling**: Depends on `editor.storage.hyprGlobals`
- **Update Complexity**: Manual attribute synchronization

### Why Current Structure is Problematic

1. **Dual Purpose Conflict**: Tiptap nodes should be either atomic OR container, not both
2. **Performance**: NodeView re-renders on every attribute change
3. **Memory**: Each block maintains full editor instance
4. **State Management**: Sync complexity between Context and Editor

## Recommendations

### Priority 1: State Management Refactoring

#### 1.1 Eliminate Circular Dependencies

- **Separate Editor State from Context State**
- **Implement Unidirectional Data Flow**
- **Remove TreeManager from Context**

#### 1.2 Performance Optimizations

- **Replace Editor per Block with Single Editor**
- **Implement Incremental Sync**
- **Optimize Hash Calculation**

### Priority 2: Type Safety

#### 2.1 Convex Schema Strict Typing

Replace all `v.any()` usages:

```typescript
// Current (vulnerable)
attrs: v.optional(v.any());

// Proposed (type-safe)
attrs: v.optional(
  v.object({
    className: v.optional(v.string()),
    style: v.optional(v.object({})),
    dataAttributes: v.optional(v.record(v.string(), v.string())),
  })
);
```

#### 2.2 Block Type Definition

```typescript
// Define strict block type hierarchy
type BlockType =
  | { type: "text"; content: string }
  | { type: "input"; label: string; variableName: string }
  | { type: "conditional"; condition: Condition; children: Block[] };
// ... other specific types
```

### Priority 3: Tiptap Architecture

#### 3.1 Single Editor Pattern

- **Replace BlockNodeView with simple node**
- **Use decorations for block boundaries**
- **Implement block selection via ProseMirror selections**

#### 3.2 Node Structure Simplification

```typescript
// Clean atomic node
export const HyprBlock = Node.create({
  name: "hyprBlock",
  group: "block",
  atom: true, // ✅ True atomic node
  draggable: true,

  addAttributes() {
    return {
      blockId: { default: null },
      blockType: { default: "text" },
      // Minimal attributes only
    };
  },

  parseHTML() {
    return [{ tag: "hypr-block[data-block-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["hypr-block", HTMLAttributes];
  },
});
```

### Priority 4: TreeManager Removal

#### From Context Integration

```typescript
// Current (problematic)
import * as TreeManager from "../services/treeManager";

// Proposed (context handles its own tree)
const addBlock = (type: BlockType) => {
  const newBlock = createBlock(type);
  setDoc((prev) => ({
    ...prev,
    blocks: [...prev.blocks, newBlock], // Simple append
  }));
};
```

#### Direct Component Usage

Components needing tree operations should import TreeManager directly, not via Context.

### Priority 5: Legacy Pattern Cleanup

#### TextEditor useEditor Removal

- **Remove duplicate useEditor from TextEditor**
- **Use NodeViewContent for all text editing**
- **Centralize text editing in main editor**

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

1. **Fix Convex Schema Types**
   - Replace v.any() with strict types
   - Update all schema definitions
2. **Separate State Management**
   - Remove TreeManager from Context
   - Implement unidirectional data flow

### Phase 2: Performance (Week 3-4)

1. **Single Editor Implementation**
   - Remove Editor per Block pattern
   - Implement decoration-based selection
2. **Optimize Sync Logic**
   - Replace 1-second debounce with incremental sync
   - Implement change detection at component level

### Phase 3: Architecture (Week 5-6)

1. **Clean Tiptap Structure**
   - Fix atom vs container conflicts
   - Simplify NodeView implementations
2. **Legacy Pattern Cleanup**
   - Remove useEditor from TextEditor
   - Centralize all editing in main editor

### Phase 4: Optimization (Week 7-8)

1. **Performance Testing**
   - Measure memory usage
   - Test with large documents
2. **Type Safety Validation**
   - Ensure all code paths are type-safe
   - Remove remaining any types

## Conclusion

The current HyprDoc architecture, while functional, suffers from fundamental design issues that limit scalability and maintainability. The proposed refactoring addresses these core problems through:

- **Elimination of circular dependencies**
- **Performance optimizations**
- **Type safety improvements**
- **Simplified architecture**

The roadmap provides a clear path forward, prioritizing foundation work before performance optimizations and feature enhancements. Success depends on maintaining backward compatibility while gradually introducing the new architecture.

---

_This analysis serves as the foundation for the upcoming HyprDoc refactoring effort. All findings are based on static code analysis and architectural review performed on 2025-12-04._
