import type { Metadata, Viewport } from 'next'
import { Inter, Shadows_Into_Light } from 'next/font/google'
import { events, me, records, stacks } from '~/data'
import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { CreditNote } from '~/domain/credit-note/credit-note'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { isCreditNote, isInvoice, isQuote, isReceipt } from '~/domain/record/filters'
import { classNames } from '~/ui/class-names'
import Layout from '~/ui/layout/main'
import { load } from './(db)/actions'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const shadwowsIntoLight = Shadows_Into_Light({
  weight: '400',
  subsets: [],
  variable: '--font-shadows-into-light',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Simple Invoice',
  description: 'Generate simple invoices with ease.',
  manifest: '/manifest.json',
  icons: [
    { url: '/favicon.ico', sizes: 'any' },
    { url: '/apple-touch-icon.png', rel: 'apple-touch-icon' },
  ],
}

export const viewport: Viewport = {
  themeColor: [
    { color: '#18181b', media: '(prefers-color-scheme: light)' },
    { color: '#18181b', media: '(prefers-color-scheme: dark)' },
  ],
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: 'cover',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let data = {
    events,
    me,
    records,
    stacks,

    clientById: records.map((r) => {
      return [r.client.id, r.client]
    }) as [string, Client][],
    accountById: records.map((r) => {
      return [r.account.id, r.account]
    }) as [string, Account][],
    quoteById: records.filter(isQuote).map((r) => {
      return [r.id, r]
    }) as [string, Quote][],
    invoiceById: records.filter(isInvoice).map((r) => {
      return [r.id, r]
    }) as [string, Invoice][],
    creditNoteById: records.filter(isCreditNote).map((r) => {
      return [r.id, r]
    }) as [string, CreditNote][],
    receiptById: records.filter(isReceipt).map((r) => {
      return [r.id, r]
    }) as [string, Receipt][],
  }
  let config = await load()
  return (
    <html lang="en" data-classified={config.ui.classified}>
      <body className={classNames(inter.variable, shadwowsIntoLight.variable)}>
        <Layout data={data} config={config}>
          {children}
        </Layout>
      </body>
    </html>
  )
}
