import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Navbar } from '~/ui/navbar'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Simple Invoice',
  description: 'Generate simple invoices with ease.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <div className="isolate">{children}</div>
      </body>
    </html>
  )
}
