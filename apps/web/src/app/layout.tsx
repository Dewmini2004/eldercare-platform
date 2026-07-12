import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'ElderCare Sri Lanka — Find Trusted Elder Care Homes & Nurses',
  description:
    'Sri Lanka\'s first platform to discover verified elder care homes and SLNC-certified nurses. Search by location, get AI-matched recommendations, and stay connected with real-time alerts.',
  keywords: 'elder care, nursing home, Sri Lanka, elders home, nurse hiring, SLNC verified',
  openGraph: {
    title: 'ElderCare Sri Lanka',
    description: 'Find trusted care for your loved ones',
    locale: 'en_LK',
    type: 'website'
  }
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a2e',
                color: '#f0f0f0',
                border: '1px solid #2d6a4f'
              }
            }}
          />
        </Providers>
      </body>
    </html>
  )
}
