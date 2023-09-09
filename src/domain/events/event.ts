import { z } from 'zod'
import { Address } from '~/domain/address/address'
import { ScopedIDGenerator } from '~/utils/id'

let scopedId = new ScopedIDGenerator('event')

export let Event = z
  .discriminatedUnion('type', [
    // Account
    z.object({ type: z.literal('account-rebranded'), from: z.string(), to: z.string() }),
    z.object({ type: z.literal('account-relocated'), from: Address, to: Address }),

    // Account — Milestones
    z.object({
      type: z.literal('account-milestone:invoices'),
      amount: z.number(),
      future: z.boolean().optional(),
    }),
    z.object({
      type: z.literal('account-milestone:fastest-paid-invoice'),
      invoice: z.string(),
      client: z.object({ id: z.string(), name: z.string() }),
      durationInSeconds: z.number(),
    }),
    z.object({
      type: z.literal('account-milestone:revenue'),
      amount: z.number(),
      milestone: z.number(),
      future: z.boolean().optional(),
    }),
    z.object({
      type: z.literal('account-milestone:most-expensive-invoice'),
      invoice: z.string(),
      amount: z.number(),
      increase: z.number(),
      future: z.boolean().optional(),
    }),
    z.object({
      type: z.literal('account-milestone:clients'),
      amount: z.number(),
      future: z.boolean().optional(),
    }),

    // Clients
    z.object({ type: z.literal('client-rebranded'), from: z.string(), to: z.string() }),
    z.object({ type: z.literal('client-relocated'), from: Address, to: Address }),

    // Quotes
    z.object({ type: z.literal('quote-drafted'), from: z.enum(['quote']).optional() }),
    z.object({ type: z.literal('quote-sent') }),
    z.object({ type: z.literal('quote-accepted') }),
    z.object({ type: z.literal('quote-rejected') }),
    z.object({ type: z.literal('quote-expired') }),
    z.object({ type: z.literal('quote-closed') }),

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
      id: z.string().default(() => scopedId.next()),
      at: z.date().nullable().default(null),
    }),
  )

export type Event = z.infer<typeof Event>
