import React from "react";
import { Node } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import { EditorBlock } from "../EditorBlock";
import { DocBlock } from "../../types";

// Define the Tiptap Node Extension
export const BlockNodeExtension = Node.create({
  name: "hyprBlock",
  group: "block",
  atom: true,
  draggable: true, // Enable dragging for this node

  addAttributes() {
    return {
      id: {
        default: null,
      },
      block: {
        default: null,
        parseHTML: (element) =>
          JSON.parse(element.getAttribute("data-block") || "{}"),
        renderHTML: (attributes) => {
          return {
            "data-block": JSON.stringify(attributes.block),
          };
        },
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
    return ["hypr-block", HTMLAttributes];
  },

  addNodeView() {
    return ReactNodeViewRenderer(BlockNodeView);
  },
});

// Define the React Component for the Node View
const BlockNodeView = (props: any) => {
  const { node, updateAttributes, deleteNode, getPos, editor } = props;
  const blockData = node.attrs.block as DocBlock;

  const handleUpdate = (id: string, updates: Partial<DocBlock>) => {
    const updatedBlock = { ...blockData, ...updates };
    updateAttributes({ block: updatedBlock });
  };

  const handleDelete = (id: string) => {
    deleteNode();
  };

  const handleSelect = (id: string) => {
    // Selection is handled by Tiptap mostly, but we can sync if needed
  };

  const parties = (editor.storage as any).hyprGlobals?.parties || [];
  const docSettings = (editor.storage as any).hyprGlobals?.docSettings || {};

  const pos = getPos();
  const index = pos !== undefined ? pos : 0;

  return (
    <NodeViewWrapper className="react-renderer group relative my-4">
      <EditorBlock
        block={blockData}
        index={index}
        parties={parties}
        docSettings={docSettings}
        formValues={{}}
        isSelected={props.selected}
        onSelect={handleSelect}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onDragStart={() => {}}
        onDrop={() => {}}
        isTiptap={true}
      />
    </NodeViewWrapper>
  );
};
