import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { me, records, stacks } from '~/data'
import Layout from '~/ui/layout/main'
import { env } from '~/utils/env'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: 'Simple Invoice',
  description: 'Generate simple invoices with ease.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  let data = { me, records, stacks }
  return (
    <html lang="en">
      <body className={inter.variable}>
        <Layout data={data} isClassified={env.CLASSIFIED_MODE}>
          {children}
        </Layout>
      </body>
    </html>
  )
}
