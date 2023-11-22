import { z } from 'zod'
import { Address } from '~/domain/address/address'
import { Invoice } from '~/domain/invoice/invoice'
import { ScopedIDGenerator } from '~/utils/id'

let scopedId = new ScopedIDGenerator('event')

export let Event = z
  .object({
    id: z.string().default(() => {
      return scopedId.next()
    }),
  })
  .and(
    z.discriminatedUnion('type', [
      // Account
      z.object({
        type: z.literal('account:rebranded'),
        tags: z.array(z.string()).default(['account']),
        context: z.object({
          accountId: z.string(),
        }),
        payload: z.object({
          from: z.string(),
          to: z.string(),
        }),
      }),
      z.object({
        type: z.literal('account:relocated'),
        tags: z.array(z.string()).default(['account']),
        context: z.object({
          accountId: z.string(),
        }),
        payload: z.object({
          from: Address,
          to: Address,
        }),
      }),

      // Milestones
      z.object({
        type: z.literal('milestone:custom'),
        tags: z.array(z.string()).default(['milestone']),
        context: z.object({
          accountId: z.string(),
        }),
        payload: z.object({
          title: z.string(),
          description: z.string().nullable(),
        }),
      }),
      z.object({
        type: z.literal('milestone:fastest-accepted-quote'),
        tags: z.array(z.string()).default(['milestone']),
        context: z.object({
          accountId: z.string(),
          clientId: z.string(),
          quoteId: z.string(),
        }),
        payload: z.object({
          best: z.boolean(),
          durationInSeconds: z.number(),
        }),
      }),
      z.object({
        type: z.literal('milestone:invoices'),
        tags: z.array(z.string()).default(['milestone']),
        context: z.object({
          accountId: z.string(),
        }),
        payload: z.object({
          amount: z.number(),
          future: z.boolean().optional().default(false),
        }),
      }),
      z.object({
        type: z.literal('milestone:fastest-paid-invoice'),
        tags: z.array(z.string()).default(['milestone']),
        context: z.object({
          accountId: z.string(),
          clientId: z.string(),
          invoiceId: z.string(),
        }),
        payload: z.object({
          best: z.boolean(),
          durationInSeconds: z.number(),
        }),
      }),
      z.object({
        type: z.literal('milestone:revenue'),
        tags: z.array(z.string()).default(['milestone']),
        context: z.object({
          accountId: z.string(),
        }),
        payload: z.object({
          amount: z.number(),
          milestone: z.number(),
          future: z.boolean().optional().default(false),
        }),
      }),
      z.object({
        type: z.literal('milestone:most-expensive-invoice'),
        tags: z.array(z.string()).default(['milestone']),
        context: z.object({
          accountId: z.string(),
          clientId: z.string(),
          invoiceId: z.string(),
        }),
        payload: z.object({
          amount: z.number(),
          increase: z.number(),
          future: z.boolean().optional().default(false),
          best: z.boolean(),
        }),
      }),
      z.object({
        type: z.literal('milestone:clients'),
        tags: z.array(z.string()).default(['milestone']),
        context: z.object({
          accountId: z.string(),
        }),
        payload: z.object({
          amount: z.number(),
          future: z.boolean().optional().default(false),
        }),
      }),
      z.object({
        type: z.literal('milestone:international-clients'),
        tags: z.array(z.string()).default(['milestone']),
        context: z.object({
          accountId: z.string(),
        }),
        payload: z.object({
          amount: z.number(),
          future: z.boolean().optional().default(false),
        }),
      }),
      z.object({
        type: z.literal('milestone:anniversary'),
        tags: z.array(z.string()).default(['milestone']),
        context: z.object({
          accountId: z.string(),
        }),
        payload: z.object({
          start: z.date(),
        }),
      }),

      // Clients
      z.object({
        type: z.literal('client:rebranded'),
        tags: z.array(z.string()).default(['client']),
        context: z.object({
          clientId: z.string(),
        }),
        payload: z.object({
          from: z.string(),
          to: z.string(),
        }),
      }),
      z.object({
        type: z.literal('client:relocated'),
        tags: z.array(z.string()).default(['client']),
        context: z.object({
          clientId: z.string(),
        }),
        payload: z.object({
          from: Address,
          to: Address,
        }),
      }),

      // Quotes
      z.object({
        type: z.literal('quote:drafted'),
        tags: z.array(z.string()).default(['quote']),
        context: z.object({
          accountId: z.string(),
          clientId: z.string(),
          quoteId: z.string(),
        }),
        payload: z.object({
          from: z.enum(['quote']).optional(),
        }),
      }),
      z.object({
        type: z.literal('quote:sent'),
        tags: z.array(z.string()).default(['quote']),
        context: z.object({
          accountId: z.string(),
          clientId: z.string(),
          quoteId: z.string(),
        }),
      }),
      z.object({
        type: z.literal('quote:accepted'),
        tags: z.array(z.string()).default(['quote']),
        context: z.object({
          accountId: z.string(),
          clientId: z.string(),
          quoteId: z.string(),
        }),
      }),
      z.object({
        type: z.literal('quote:cancelled'),
        tags: z.array(z.string()).default(['quote']),
        context: z.object({
          accountId: z.string(),
          clientId: z.string(),
          quoteId: z.string(),
        }),
        payload: z.object({
          cancelledBy: z.enum(['client', 'account']),
          reason: z.string(),
        }),
      }),
      z.object({
        type: z.literal('quote:rejected'),
        tags: z.array(z.string()).default(['quote']),
        context: z.object({
          accountId: z.string(),
          clientId: z.string(),
          quoteId: z.string(),
        }),
      }),
      z.object({
        type: z.literal('quote:expired'),
        tags: z.array(z.string()).default(['quote']),
        context: z.object({
          accountId: z.string(),
          clientId: z.string(),
          quoteId: z.string(),
        }),
      }),
      z.object({
        type: z.literal('quote:closed'),
        tags: z.array(z.string()).default(['quote']),
        context: z.object({
          accountId: z.string(),
          clientId: z.string(),
          quoteId: z.string(),
        }),
      }),

      // Invoices
      z.object({
        type: z.literal('invoice:drafted'),
        tags: z.array(z.string()).default(['invoice']),
        context: z.object({
          accountId: z.string(),
          clientId: z.string(),
          invoiceId: z.string(),
        }),
        payload: z.object({
          from: z.enum(['quote']).optional(),
          invoice: z.lazy(() => {
            return Invoice
          }),
        }),
      }),
      z.object({
        type: z.literal('invoice:sent'),
        tags: z.array(z.string()).default(['invoice']),
        context: z.object({
          accountId: z.string(),
          clientId: z.string(),
          invoiceId: z.string(),
        }),
        payload: z.object({
          invoice: z.lazy(() => {
            return Invoice
          }),
        }),
      }),
      z.object({
        type: z.literal('invoice:partially-paid'),
        tags: z.array(z.string()).default(['invoice']),
        context: z.object({
          accountId: z.string(),
          clientId: z.string(),
          invoiceId: z.string(),
        }),
        payload: z.object({
          amount: z.number(),
          outstanding: z.number(),
          invoice: z.lazy(() => {
            return Invoice
          }),
        }),
      }),
      z.object({
        type: z.literal('invoice:paid'),
        tags: z.array(z.string()).default(['invoice']),
        context: z.object({
          accountId: z.string(),
          clientId: z.string(),
          invoiceId: z.string(),
        }),
        payload: z.object({
          amount: z.number(),
          outstanding: z.number(),
          invoice: z.lazy(() => {
            return Invoice
          }),
        }),
      }),
      z.object({
        type: z.literal('invoice:overdue'),
        tags: z.array(z.string()).default(['invoice']),
        context: z.object({
          accountId: z.string(),
          clientId: z.string(),
          invoiceId: z.string(),
        }),
        payload: z.object({
          invoice: z.lazy(() => {
            return Invoice
          }),
        }),
      }),
      z.object({
        type: z.literal('invoice:closed'),
        tags: z.array(z.string()).default(['invoice']),
        context: z.object({
          accountId: z.string(),
          clientId: z.string(),
          invoiceId: z.string(),
        }),
        payload: z.object({
          invoice: z.lazy(() => {
            return Invoice
          }),
        }),
      }),
      z.object({
        type: z.literal('invoice:cancelled'),
        tags: z.array(z.string()).default(['invoice']),
        context: z.object({
          accountId: z.string(),
          clientId: z.string(),
          invoiceId: z.string(),
        }),
        payload: z.object({
          invoice: z.lazy(() => {
            return Invoice
          }),
          cancelledBy: z.enum(['client', 'account']),
          reason: z.string(),
        }),
      }),

      // Credit notes
      z.object({
        type: z.literal('credit-note:created'),
        tags: z.array(z.string()).default(['credit-note']),
        context: z.object({
          accountId: z.string(),
          clientId: z.string(),
          invoiceId: z.string(),
          creditNoteId: z.string(),
        }),
      }),

      // Receipts
      z.object({
        type: z.literal('receipt:created'),
        tags: z.array(z.string()).default(['receipt']),
        context: z.object({
          accountId: z.string(),
          clientId: z.string(),
          invoiceId: z.string(),
          receiptId: z.string(),
        }),
      }),
    ]),
  )
  .and(
    z.object({
      at: z.date().nullable().default(null),
    }),
  )

export type Event = z.infer<typeof Event>
