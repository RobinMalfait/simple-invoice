import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { events, me, records, stacks } from '~/data'
import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { isInvoice, isQuote, isReceipt } from '~/domain/record/filters'
import Layout from '~/ui/layout/main'
import { load } from './(db)/actions'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: 'Simple Invoice',
  description: 'Generate simple invoices with ease.',
  manifest: '/manifest.json',
  themeColor: [
    { color: '#fff', media: '(prefers-color-scheme: light)' },
    { color: '#000', media: '(prefers-color-scheme: dark)' },
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1.0,
    maximumScale: 1.0,
    userScalable: false,
    viewportFit: 'cover',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let data = {
    events,
    me,
    records,
    stacks,

    clientById: records.map((r) => [r.client.id, r.client]) as [string, Client][],
    accountById: records.map((r) => [r.account.id, r.account]) as [string, Account][],
    quoteById: records.filter((r) => isQuote(r)).map((r) => [r.id, r]) as [string, Quote][],
    invoiceById: records.filter((r) => isInvoice(r)).map((r) => [r.id, r]) as [string, Invoice][],
    receiptById: records.filter((r) => isReceipt(r)).map((r) => [r.id, r]) as [string, Receipt][],
  }
  let config = await load()
  return (
    <html lang="en" data-classified={config.ui.classified}>
      <body className={inter.variable}>
        <Layout data={data} config={config}>
          {children}
        </Layout>
      </body>
    </html>
  )
}
