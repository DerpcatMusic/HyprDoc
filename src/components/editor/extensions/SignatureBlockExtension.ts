import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { SignatureBlock } from '../nodes/SignatureBlock';

export const SignatureBlockExtension = Node.create({
  name: 'signatureBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        isRequired: true,
      },
      signer_email: {
        default: null,
      },
      signed_at: {
        default: null,
      },
      signature_hash: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'signature-block',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['signature-block', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SignatureBlock);
  },
});
