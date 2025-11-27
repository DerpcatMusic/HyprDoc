---
description: initialize project foundation with bun
---


steps:
  - run: bun create next-app@latest hyprdoc --typescript --tailwind --eslint
  - run: cd hyprdoc
  - run: bun add zod @supabase/supabase-js @tiptap/react @tiptap/pm @tiptap/starter-kit yjs @hocuspocus/provider lucide-react clsx tailwind-merge
  - instruction: Create the folder structure `lib/schemas`, `components/editor`, `components/ui`, `app/api`.

---
name: create_smart_field
description: Create a new Dynamic Field for the Document Tree
steps:
  - instruction: Define the Node Schema in `lib/schemas/document.ts` using Zod.
  - instruction: Create the React Component in `components/editor/nodes/SmartField.tsx`.
  - instruction: Create the Tiptap Extension wrapper in `components/editor/extensions/SmartFieldExtension.ts` using `ReactNodeViewRenderer`.
  - instruction: Register the extension in the main `Editor.tsx` configuration.

---
name: implement_signing
description: Generate the Cryptographic Signature logic
steps:
  - instruction: Create `lib/crypto.ts` with a function `canonicalizeJSON(obj)` that sorts object keys recursively.
  - instruction: Implement `hashDocument(json)` using `crypto.subtle.digest('SHA-256')`.
  - instruction: Create a Server Action `verifySignature(docId, signature, publicKey)` that fetches the doc from Supabase, re-hashes it, and verifies the signature.

---
name: migration_check
description: Check if code is compatible with Next.js App Router
steps:
  - instruction: Scan the file for `window` or `document` usage.
  - instruction: If found, ensure the component is marked `use client`.
  - instruction: If the logic involves `useEffect` with Tiptap, ensure dependency arrays prevent infinite re-renders.