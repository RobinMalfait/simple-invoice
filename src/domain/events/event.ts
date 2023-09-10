import { z } from 'zod'
import { Address } from '~/domain/address/address'
import { ScopedIDGenerator } from '~/utils/id'

let scopedId = new ScopedIDGenerator('event')

export let Event = z
  .discriminatedUnion('type', [
    // Account
    z.object({
      type: z.literal('account-rebranded'),
      tags: z.array(z.string()).default(['account']),
      from: z.string(),
      to: z.string(),
    }),
    z.object({
      type: z.literal('account-relocated'),
      tags: z.array(z.string()).default(['account']),
      from: Address,
      to: Address,
    }),

    // Account — Milestones
    z.object({
      type: z.literal('account-milestone:fastest-accepted-quote'),
      tags: z.array(z.string()).default(['account', 'milestone']),
      quote: z.string(),
      client: z.object({ id: z.string(), name: z.string() }),
      durationInSeconds: z.number(),
    }),
    z.object({
      type: z.literal('account-milestone:invoices'),
      tags: z.array(z.string()).default(['account', 'milestone']),
      amount: z.number(),
      future: z.boolean().optional().default(false),
    }),
    z.object({
      type: z.literal('account-milestone:fastest-paid-invoice'),
      tags: z.array(z.string()).default(['account', 'milestone']),
      invoice: z.string(),
      client: z.object({ id: z.string(), name: z.string() }),
      durationInSeconds: z.number(),
    }),
    z.object({
      type: z.literal('account-milestone:revenue'),
      tags: z.array(z.string()).default(['account', 'milestone']),
      amount: z.number(),
      milestone: z.number(),
      future: z.boolean().optional().default(false),
    }),
    z.object({
      type: z.literal('account-milestone:most-expensive-invoice'),
      tags: z.array(z.string()).default(['account', 'milestone']),
      invoice: z.string(),
      amount: z.number(),
      increase: z.number(),
      future: z.boolean().optional().default(false),
    }),
    z.object({
      type: z.literal('account-milestone:clients'),
      tags: z.array(z.string()).default(['account', 'milestone']),
      amount: z.number(),
      future: z.boolean().optional().default(false),
    }),

    // Clients
    z.object({
      type: z.literal('client-rebranded'),
      tags: z.array(z.string()).default(['client']),
      from: z.string(),
      to: z.string(),
    }),
    z.object({
      type: z.literal('client-relocated'),
      tags: z.array(z.string()).default(['client']),
      from: Address,
      to: Address,
    }),

    // Quotes
    z.object({
      type: z.literal('quote-drafted'),
      tags: z.array(z.string()).default(['quote']),
      from: z.enum(['quote']).optional(),
    }),
    z.object({ type: z.literal('quote-sent'), tags: z.array(z.string()).default(['quote']) }),
    z.object({ type: z.literal('quote-accepted'), tags: z.array(z.string()).default(['quote']) }),
    z.object({ type: z.literal('quote-rejected'), tags: z.array(z.string()).default(['quote']) }),
    z.object({ type: z.literal('quote-expired'), tags: z.array(z.string()).default(['quote']) }),
    z.object({ type: z.literal('quote-closed'), tags: z.array(z.string()).default(['quote']) }),

    // Invoices
    z.object({
      type: z.literal('invoice-drafted'),
      tags: z.array(z.string()).default(['invoice']),
      from: z.enum(['quote']).optional(),
    }),
    z.object({ type: z.literal('invoice-sent'), tags: z.array(z.string()).default(['invoice']) }),
    z.object({
      type: z.literal('invoice-partially-paid'),
      tags: z.array(z.string()).default(['invoice']),
      amount: z.number(),
      outstanding: z.number(),
    }),
    z.object({
      type: z.literal('invoice-paid'),
      tags: z.array(z.string()).default(['invoice']),
      amount: z.number(),
      outstanding: z.number(),
    }),
    z.object({
      type: z.literal('invoice-overdue'),
      tags: z.array(z.string()).default(['invoice']),
    }),
    z.object({ type: z.literal('invoice-closed'), tags: z.array(z.string()).default(['invoice']) }),

    // Receipts
    z.object({
      type: z.literal('receipt-created'),
      tags: z.array(z.string()).default(['receipt']),
    }),
  ])
  .and(
    z.object({
      id: z.string().default(() => scopedId.next()),
      at: z.date().nullable().default(null),
    }),
  )

export type Event = z.infer<typeof Event>
