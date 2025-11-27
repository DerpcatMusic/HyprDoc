import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { SmartField } from '../nodes/SmartField';
import { SmartFieldAttrsSchema } from '@/lib/schemas/document';

export const SmartFieldExtension = Node.create({
  name: 'smartField',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    // We can infer default values from our Zod schema if we want, 
    // but for now we'll explicitly map them to Tiptap attributes.
    return {
      id: {
        default: null,
        isRequired: true,
      },
      label: {
        default: 'Field',
      },
      assigned_to: {
        default: null,
      },
      value: {
        default: null,
      },
      required: {
        default: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'smart-field',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['smart-field', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SmartField);
  },
});
