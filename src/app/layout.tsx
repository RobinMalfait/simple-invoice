import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { me, records, stacks } from '~/data'
import Layout from '~/ui/layout/main'
import { load } from './(db)/actions'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: 'Simple Invoice',
  description: 'Generate simple invoices with ease.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let data = { me, records, stacks }
  let config = await load()
  return (
    <html lang="en">
      <body className={inter.variable}>
        <Layout data={data} config={config}>
          {children}
        </Layout>
      </body>
    </html>
  )
}
