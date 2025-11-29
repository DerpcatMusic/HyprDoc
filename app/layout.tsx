import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HyprDoc - Dynamic Document Signing Platform',
  description: 'SOC2-compliant, dynamic document signing platform. Next-gen DocuSign.',
  keywords: ['document signing', 'contracts', 'legal tech', 'DocuSign alternative'],
  authors: [{ name: 'HyprDoc Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#000000',
  robots: {
    index: true,
    follow: true,
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}