import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import * as data from '~/data'
import Layout from '~/ui/layout/main'
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
        <Layout data={data}>{children}</Layout>
      </body>
    </html>
  )
}
