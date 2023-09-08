import EventEmitter from 'node:events'
import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { Event } from '~/domain/events/event'
import { InvoiceStatus } from '~/domain/invoice/invoice-status'

type InvoicePaid = {
  client: Client
  account: Account
  invoice: {
    number: string
    total: number
  }
  status: InvoiceStatus
  at: Date
}
type InvoiceSent = InvoicePaid

type State = {
  paidInvoicesCount: number
  totalPaidAmount: number
  mostExpensiveInvoice: number | null
  clients: Set<string>
}

let invoiceCountMilestones = [1000, 750, 500, 300, 200, 150, 100, 50, 25, 10, 5, 1]
let revenueMilestones = [
  10_000_000_00, 5_000_000_00, 1_500_000_00, 1_000_000_00, 750_000_00, 500_000_00, 250_000_00,
  100_000_00, 50_000_00, 10_000_00, 5_000_00, 1_000_00,
]
let clientCountMilestones = [100, 75, 50, 25, 10, 5, 3]

export function trackMilestones(bus: EventEmitter) {
  let stateByAccount = new Map<Account['id'], State>()

  bus.on('invoice:sent', (e: InvoiceSent) => {
    let state =
      stateByAccount.get(e.account.id) ??
      stateByAccount
        .set(e.account.id, {
          paidInvoicesCount: 0,
          totalPaidAmount: 0,
          mostExpensiveInvoice: null,
          clients: new Set<string>(),
        })
        .get(e.account.id)!

    let totalPaidAmount = state.totalPaidAmount + e.invoice.total
    let paidInvoicesCount = state.paidInvoicesCount + 1
    let mostExpensiveInvoice = state.mostExpensiveInvoice
    let clients = new Set(state.clients)

    // Total paid invoices
    {
      let milestoneIdx = invoiceCountMilestones.findIndex((x) => paidInvoicesCount === x)
      if (milestoneIdx !== -1) {
        let milestone = invoiceCountMilestones[milestoneIdx]
        if (
          !e.account.events.some(
            (e) => e.type === 'account-milestone:invoices' && e.future && e.amount === milestone,
          )
        ) {
          e.account.events.push(
            Event.parse({
              type: 'account-milestone:invoices',
              amount: milestone,
              future: true,
            }),
          )
        }
      }
    }

    // Total clients
    {
      clients.add(e.client.id)
      let milestoneIdx = clientCountMilestones.findIndex((x) => clients.size >= x)
      if (milestoneIdx !== -1) {
        let milestone = clientCountMilestones[milestoneIdx]
        if (
          !e.account.events.some(
            (e) => e.type === 'account-milestone:clients' && e.future && e.amount === milestone,
          )
        ) {
          e.account.events.push(
            Event.parse({
              type: 'account-milestone:clients',
              amount: milestone,
              future: true,
            }),
          )
        }
      }
    }

    // Most expensive invoice
    {
      if (mostExpensiveInvoice === null) {
        mostExpensiveInvoice = e.invoice.total
      } else if (mostExpensiveInvoice < e.invoice.total) {
        let prev = mostExpensiveInvoice
        mostExpensiveInvoice = e.invoice.total
        if (
          !e.account.events.some(
            (e) =>
              e.type === 'account-milestone:most-expensive-invoice' &&
              e.amount >= mostExpensiveInvoice!,
          )
        ) {
          e.account.events.push(
            Event.parse({
              type: 'account-milestone:most-expensive-invoice',
              invoice: e.invoice.number,
              amount: e.invoice.total,
              increase: Number(((e.invoice.total / prev - 1) * 100).toFixed(0)),
              future: true,
            }),
          )
        }
      }
    }

    // Total revenue
    {
      let milestoneIdx = revenueMilestones.findIndex((x) => totalPaidAmount > x)
      if (milestoneIdx !== -1) {
        let milestone = revenueMilestones[milestoneIdx]
        if (
          !e.account.events.some(
            (e) => e.type === 'account-milestone:revenue' && e.future && e.milestone === milestone,
          )
        ) {
          e.account.events.push(
            Event.parse({
              type: 'account-milestone:revenue',
              amount: totalPaidAmount,
              milestone,
              future: true,
            }),
          )
        }
      }
    }
  })

  bus.on('invoice:paid', (e: InvoicePaid) => {
    let state =
      stateByAccount.get(e.account.id) ??
      stateByAccount
        .set(e.account.id, {
          paidInvoicesCount: 0,
          totalPaidAmount: 0,
          mostExpensiveInvoice: null,
          clients: new Set<string>(),
        })
        .get(e.account.id)!
    state.totalPaidAmount += e.invoice.total
    state.paidInvoicesCount++

    // Total paid invoices
    {
      let milestoneIdx = invoiceCountMilestones.findIndex((x) => state.paidInvoicesCount === x)
      if (milestoneIdx !== -1) {
        let milestone = invoiceCountMilestones[milestoneIdx]
        invoiceCountMilestones.splice(milestoneIdx)

        e.account.events = e.account.events.filter(
          (e) => !(e.type === 'account-milestone:invoices' && e.future && e.amount === milestone),
        )

        e.account.events.push(
          Event.parse({ type: 'account-milestone:invoices', amount: milestone, at: e.at }),
        )
      }
    }

    // Total clients
    {
      state.clients.add(e.client.id)
      let milestoneIdx = clientCountMilestones.findIndex((x) => state.clients.size >= x)
      if (milestoneIdx !== -1) {
        let milestone = clientCountMilestones[milestoneIdx]
        clientCountMilestones.splice(milestoneIdx)

        e.account.events = e.account.events.filter(
          (e) => !(e.type === 'account-milestone:clients' && e.future && e.amount === milestone),
        )

        e.account.events.push(
          Event.parse({ type: 'account-milestone:clients', amount: milestone, at: e.at }),
        )
      }
    }

    // Most expensive invoice
    {
      if (state.mostExpensiveInvoice === null) {
        state.mostExpensiveInvoice = e.invoice.total
      } else if (state.mostExpensiveInvoice < e.invoice.total) {
        let prev = state.mostExpensiveInvoice
        state.mostExpensiveInvoice = e.invoice.total

        e.account.events = e.account.events.filter(
          (_e) =>
            !(
              _e.type === 'account-milestone:most-expensive-invoice' &&
              _e.future &&
              _e.amount <= e.invoice.total
            ),
        )

        e.account.events.push(
          Event.parse({
            type: 'account-milestone:most-expensive-invoice',
            invoice: e.invoice.number,
            amount: e.invoice.total,
            increase: Number(((e.invoice.total / prev - 1) * 100).toFixed(0)),
            at: e.at,
          }),
        )
      }
    }

    // Total revenue
    {
      let milestoneIdx = revenueMilestones.findIndex((x) => state.totalPaidAmount > x)
      if (milestoneIdx !== -1) {
        let milestone = revenueMilestones[milestoneIdx]
        revenueMilestones.splice(milestoneIdx)

        e.account.events = e.account.events.filter(
          (e) => !(e.type === 'account-milestone:revenue' && e.future && e.milestone === milestone),
        )

        e.account.events.push(
          Event.parse({
            type: 'account-milestone:revenue',
            amount: state.totalPaidAmount,
            milestone,
            at: e.at,
          }),
        )
      }
    }
  })
}
