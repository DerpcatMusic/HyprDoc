'use client'

import { useState } from 'react'

export default function TestStyling() {
  const [isDark, setIsDark] = useState(false)

  return (
    <div className={`min-h-screen p-8 ${isDark ? 'dark' : ''}`}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="border-2 border-black p-6 bg-white dark:bg-gray-900">
          <h1 className="text-4xl font-black mb-4 font-signature">
            HyprDoc Brutalist Design System
          </h1>
          <p className="text-lg font-mono">
            Testing restored styling from original monolithic HTML
          </p>
          
          {/* Dark mode toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="mt-4 px-4 py-2 bg-tech-orange text-white font-mono hover:bg-tech-orange/80 transition-colors border-2 border-black"
          >
            Toggle {isDark ? 'Light' : 'Dark'} Mode
          </button>
        </div>

        {/* Color Palette */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-2 border-black p-4">
            <h3 className="font-mono font-bold mb-2">Primary Colors</h3>
            <div className="space-y-2">
              <div className="h-8 bg-primary border border-black"></div>
              <div className="h-8 bg-tech-orange border border-black"></div>
              <div className="h-8 bg-tech-blue border border-black"></div>
            </div>
          </div>
          
          <div className="border-2 border-black p-4">
            <h3 className="font-mono font-bold mb-2">Backgrounds</h3>
            <div className="space-y-2">
              <div className="h-8 bg-background border border-black"></div>
              <div className="h-8 bg-muted border border-black"></div>
              <div className="h-8 bg-card border border-black"></div>
            </div>
          </div>
          
          <div className="border-2 border-black p-4">
            <h3 className="font-mono font-bold mb-2">Accents</h3>
            <div className="space-y-2">
              <div className="h-8 bg-accent border border-black"></div>
              <div className="h-8 bg-destructive border border-black"></div>
              <div className="h-8 bg-secondary border border-black"></div>
            </div>
          </div>
        </div>

        {/* Typography Tests */}
        <div className="border-2 border-black p-6 bg-white dark:bg-gray-900">
          <h2 className="text-3xl font-bold mb-4">Typography Tests</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-sans font-bold">Sans Serif (Inter)</h3>
              <p className="font-sans">The quick brown fox jumps over the lazy dog.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-mono font-bold">Monospace (JetBrains Mono)</h3>
              <p className="font-mono">The quick brown fox jumps over the lazy dog.</p>
            </div>
            
            <div>
              <h3 className="text-xl font-signature font-bold">Signature (Dancing Script)</h3>
              <p className="font-signature text-2xl">The quick brown fox jumps over the lazy dog.</p>
            </div>
          </div>
        </div>

        {/* Shadow System */}
        <div className="border-2 border-black p-6 bg-white dark:bg-gray-900">
          <h2 className="text-3xl font-bold mb-4">Brutalist Shadow System</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="h-16 bg-gray-100 border border-black shadow-sharp flex items-center justify-center font-mono text-sm">
              shadow-sharp
            </div>
            <div className="h-16 bg-gray-100 border border-black shadow-sharp-sm flex items-center justify-center font-mono text-sm">
              shadow-sharp-sm
            </div>
            <div className="h-16 bg-gray-100 border border-black shadow-sharp-hover flex items-center justify-center font-mono text-sm hover:shadow-sharp-hover">
              shadow-sharp-hover
            </div>
            <div className="h-16 bg-gray-800 border-2 border-white shadow-sharp-dark flex items-center justify-center font-mono text-sm text-white">
              shadow-sharp-dark
            </div>
          </div>
          
          <div className="mt-4">
            <div className="h-16 bg-gray-100 border-4 border-black shadow-brutal flex items-center justify-center font-mono font-bold text-lg">
              SHADOW-BRUTAL (8px offset)
            </div>
          </div>
        </div>

        {/* Border Radius Test */}
        <div className="border-2 border-black p-6 bg-white dark:bg-gray-900">
          <h2 className="text-3xl font-bold mb-4">Sharp Edges (0px border radius)</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-16 bg-primary border border-black flex items-center justify-center text-white font-mono text-sm">
              lg: 0px
            </div>
            <div className="h-16 bg-secondary border border-black flex items-center justify-center font-mono text-sm">
              md: 0px
            </div>
            <div className="h-16 bg-accent border border-black flex items-center justify-center font-mono text-sm">
              sm: 0px
            </div>
            <div className="h-16 bg-muted border border-black flex items-center justify-center font-mono text-sm">
              default: 0px
            </div>
          </div>
        </div>

        {/* Background Patterns */}
        <div className="border-2 border-black p-6">
          <h2 className="text-3xl font-bold mb-4">Technical Background Patterns</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-grid-pattern border border-black flex items-center justify-center font-mono text-sm">
              bg-grid-pattern
            </div>
            <div className="h-32 bg-hatch-pattern border border-black flex items-center justify-center font-mono text-sm">
              bg-hatch-pattern (Safety Orange)
            </div>
          </div>
        </div>

        {/* Scrollbar Test */}
        <div className="border-2 border-black p-6 bg-white dark:bg-gray-900">
          <h2 className="text-3xl font-bold mb-4">Brutalist Scrollbar</h2>
          
          <div className="h-32 overflow-auto border border-black bg-muted p-4">
            <div className="space-y-2">
              {Array.from({ length: 20 }, (_, i) => (
                <div key={i} className="h-4 bg-background border border-black"></div>
              ))}
            </div>
            <p className="mt-4 font-mono">
              Scroll to test the brutalist scrollbar styling (12px with borders)
            </p>
          </div>
        </div>

        {/* ProseMirror Styles Test */}
        <div className="border-2 border-black p-6 bg-white dark:bg-gray-900">
          <h2 className="text-3xl font-bold mb-4">ProseMirror Typography</h2>
          
          <div className="prose prose-black dark:prose-invert max-w-none border border-black p-4">
            <h1>Heading 1 - Brutalist Style</h1>
            <h2>Heading 2 - Sharp Typography</h2>
            <p>
              This paragraph demonstrates the restored ProseMirror styles from your original HTML.
              The typography maintains the brutalist aesthetic with sharp edges and technical precision.
            </p>
            <ul>
              <li>Sharp list items</li>
              <li>Technical bullet points</li>
              <li>Brutalist design system</li>
            </ul>
            <blockquote>
              This is a blockquote with the restored styling from your original file.
            </blockquote>
          </div>
        </div>

      </div>
    </div>
  )
}