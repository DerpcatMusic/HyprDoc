import { Extension } from "@tiptap/core";

// Field-aware Smart Select All Extension
// First Ctrl+A: Select text within current hyprBlock (field)
// Second Ctrl+A: Select entire document
const SmartSelectAll = Extension.create({
  name: "smartSelectAll",

  addStorage() {
    return {
      lastSelectAllTime: 0,
    };
  },

  addKeyboardShortcuts() {
    return {
      "Mod-a": ({ editor }) => {
        const { state } = editor;
        const { selection, doc } = state;
        const { from, to } = selection;
        const now = Date.now();

        // Check if double-tap (within 500ms)
        const isDoubleTap = now - this.storage.lastSelectAllTime < 500;
        this.storage.lastSelectAllTime = now;

        // If entire doc already selected, do nothing
        if (from === 0 && to === doc.content.size) return false;

        // Find the closest hyprBlock ancestor
        let hyprBlockPos: { start: number; end: number } | null = null;

        doc.nodesBetween(0, doc.content.size, (node, pos) => {
          if (node.type.name === "hyprBlock") {
            const nodeStart = pos;
            const nodeEnd = pos + node.nodeSize;
            // Check if cursor is within this block
            if (from >= nodeStart && from <= nodeEnd) {
              hyprBlockPos = { start: nodeStart, end: nodeEnd };
              return false; // Stop iterating
            }
          }
          return true;
        });

        if (hyprBlockPos && !isDoubleTap) {
          // First press: select within the hyprBlock
          const { start, end } = hyprBlockPos;
          if (from === start && to === end) {
            // Already selected this block, let it select all
            return false;
          }
          editor.commands.setTextSelection({ from: start, to: end });
          return true;
        }

        // Double-tap or no hyprBlock: select all
        editor.commands.selectAll();
        return true;
      },
    };
  },
});

export default SmartSelectAll;
