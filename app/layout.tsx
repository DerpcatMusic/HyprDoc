import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono, Dancing_Script } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

// Load fonts with proper configuration
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

const dancingScript = Dancing_Script({ 
  subsets: ['latin'],
  variable: '--font-signature',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'HyprDoc - Structuralist Builder',
  description: 'Hyper-Structuralist Document Builder with Brutalist Design System',
  keywords: ['document builder', 'structuralist design', 'brutalist UI', 'technical design'],
  authors: [{ name: 'HyprDoc Team' }],
  robots: {
    index: true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${jetbrainsMono.variable} ${dancingScript.variable}`}>
      <head>
        {/* Google Fonts - Original loading method for consistency */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;900&family=JetBrains+Mono:wght@400;500;700;800&family=Dancing+Script:wght@400;700&display=swap" 
          rel="stylesheet"
        />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}