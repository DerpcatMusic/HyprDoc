import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { BlockNodeView } from "../BlockNodeView"; // We will create this next

export const HyprBlock = Node.create({
  name: "hyprBlock",

  group: "block",

  content: "block+", // Container node: can contain other blocks

  draggable: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => ({
          "data-id": attributes.id,
        }),
      },
      type: {
        default: "text",
        parseHTML: (element) => element.getAttribute("data-type"),
        renderHTML: (attributes) => ({
          "data-type": attributes.type,
        }),
      },
      // Store other block metadata here if needed, but prefer keeping content in the node tree
      blockData: {
        default: {},
        parseHTML: (element) =>
          JSON.parse(element.getAttribute("data-block-data") || "{}"),
        renderHTML: (attributes) => ({
          "data-block-data": JSON.stringify(attributes.blockData),
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "hypr-block",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["hypr-block", mergeAttributes(HTMLAttributes), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BlockNodeView);
  },
});
