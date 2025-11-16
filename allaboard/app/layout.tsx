import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import 'reactflow/dist/style.css'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'CORTEX',
  description: 'Drop in a GitHub repo or website URL. We analyze your work, understand what you built, and generate a presentation that does your project justice. Slides for pitches. Videos for demos.',
  generator: 'v0.app',
  icons: {
    icon: '/cortex.png',
    apple: '/cortex.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
