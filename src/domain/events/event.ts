import { z } from 'zod'

export let Event = z
  .discriminatedUnion('type', [
    // Quotes
    z.object({ type: z.literal('quote-drafted') }),
    z.object({ type: z.literal('quote-sent') }),
    z.object({ type: z.literal('quote-accepted') }),
    z.object({ type: z.literal('quote-rejected') }),
    z.object({ type: z.literal('quote-expired') }),

    // Invoices
    z.object({ type: z.literal('invoice-drafted'), from: z.enum(['quote']).optional() }),
    z.object({ type: z.literal('invoice-sent') }),
    z.object({
      type: z.literal('invoice-partially-paid'),
      amount: z.number(),
      outstanding: z.number(),
    }),
    z.object({ type: z.literal('invoice-paid'), amount: z.number(), outstanding: z.number() }),
    z.object({ type: z.literal('invoice-overdue') }),
    z.object({ type: z.literal('invoice-closed') }),

    // Receipts
    z.object({ type: z.literal('receipt-created') }),
  ])
  .and(
    z.object({
      id: z.string().default(() => crypto.randomUUID()),
      at: z.date().nullable().default(null),
    }),
  )

export type Event = z.infer<typeof Event>
