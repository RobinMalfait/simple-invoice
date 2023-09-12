import { Account, AccountBuilder } from '~/domain/account/account'
import { AddressBuilder } from '~/domain/address/address'
import { Client, ClientBuilder } from '~/domain/client/client'
import { configure } from '~/domain/configuration/configuration'
import { SuperEventEmitter } from '~/domain/event-bus/bus'
import { Event } from '~/domain/events/event'
import { InvoiceBuilder } from '~/domain/invoice/invoice'
import { InvoiceItemBuilder } from '~/domain/invoice/invoice-item'
import {
  anniversaryMilestones,
  clientCountMilestones,
  fastestAcceptedQuoteMilestones,
  fastestPaidInvoiceMilestones,
  internationalClientCountMilestones,
  invoiceCountMilestones,
  mostExpensiveInvoiceMilestones,
  revenueMilestones,
} from '~/domain/milestone/milestone'
import { QuoteBuilder } from '~/domain/quote/quote'

configure({
  invoice: {
    numberStrategy: (() => {
      let state = {
        id: 0,
      }

      beforeEach(() => {
        state.id = 0
      })

      return () => {
        return (++state.id).toString().padStart(4, '0')
      }
    })(),
  },
  quote: {
    numberStrategy: (() => {
      let state = {
        id: 0,
      }

      beforeEach(() => {
        state.id = 0
      })

      return () => {
        return (++state.id).toString().padStart(4, '0')
      }
    })(),
  },
})

describe('fastestAcceptedQuoteMilestones', () => {
  let events: Event[] = []
  let bus = new SuperEventEmitter()
  let account: Account = null as unknown as Account
  let client: Client = null as unknown as Client

  beforeEach(() => {
    bus.removeAllListeners()
    events.splice(0)
    bus.on('*', (e: Extract<Event, { type: `milestone:${string}` }>) => {
      if (e.tags.includes('milestone')) {
        events.push(e)
      }
    })

    fastestAcceptedQuoteMilestones(bus, { events })

    account = new AccountBuilder().name('Foo').billing(new AddressBuilder().build()).build()
    client = new ClientBuilder().name('Foo').billing(new AddressBuilder().build()).build()
  })

  afterEach(() => {
    bus.removeAllListeners()
  })

  function setupQuote() {
    return new QuoteBuilder(bus).account(account).client(client).quoteDate(new Date())
  }

  it('should not mark the first accepted quote as the fastest accepted quote yet', () => {
    setupQuote().send('2020-01-01 10:00').accept('2020-01-01 15:00').build()

    expect(events).toMatchSnapshot()
  })

  it('should emit a milestone event for the fastest accepted quote', () => {
    setupQuote().send('2020-01-01 10:00').accept('2020-01-01 15:00').build() // 5 hours
    setupQuote().send('2020-01-01 10:00').accept('2020-01-01 14:00').build() // 4 hours
    setupQuote().send('2020-01-01 10:00').accept('2020-01-01 13:00').build() // 3 hours
    setupQuote().send('2020-01-01 10:00').accept('2020-01-01 14:00').build() // 4 hours
    setupQuote().send('2020-01-01 10:00').accept('2020-01-01 11:00').build() // 1 hour

    expect(events).toMatchSnapshot([
      {
        id: expect.any(String),
        context: {
          accountId: expect.any(String),
          clientId: expect.any(String),
          quoteId: expect.any(String),
        },
      },
      {
        id: expect.any(String),
        context: {
          accountId: expect.any(String),
          clientId: expect.any(String),
          quoteId: expect.any(String),
        },
      },
      {
        id: expect.any(String),
        context: {
          accountId: expect.any(String),
          clientId: expect.any(String),
          quoteId: expect.any(String),
        },
      },
    ])
  })
})

describe('fastestPaidInvoiceMilestones', () => {
  let events: Event[] = []
  let bus = new SuperEventEmitter()
  let account: Account = null as unknown as Account
  let client: Client = null as unknown as Client

  beforeEach(() => {
    bus.removeAllListeners()
    events.splice(0)
    bus.on('*', (e: Extract<Event, { type: `milestone:${string}` }>) => {
      if (e.tags.includes('milestone')) {
        events.push(e)
      }
    })

    fastestPaidInvoiceMilestones(bus, { events })

    account = new AccountBuilder().name('Foo').billing(new AddressBuilder().build()).build()
    client = new ClientBuilder().name('Foo').billing(new AddressBuilder().build()).build()
  })

  afterEach(() => {
    bus.removeAllListeners()
  })

  function setupInvoice() {
    return new InvoiceBuilder(bus).account(account).client(client).issueDate(new Date())
  }

  it('should not mark the first paid invoice as the fastest paid invoice yet', () => {
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 15:00').build()

    expect(events).toMatchSnapshot()
  })

  it('should emit a milestone event for the fastest paid invoice', () => {
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 15:00').build() // 5 hours
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 14:00').build() // 4 hours
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 13:00').build() // 3 hours
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 14:00').build() // 4 hours
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 11:00').build() // 1 hour

    expect(events).toMatchSnapshot([
      {
        id: expect.any(String),
        context: {
          accountId: expect.any(String),
          clientId: expect.any(String),
          invoiceId: expect.any(String),
        },
      },
      {
        id: expect.any(String),
        context: {
          accountId: expect.any(String),
          clientId: expect.any(String),
          invoiceId: expect.any(String),
        },
      },
      {
        id: expect.any(String),
        context: {
          accountId: expect.any(String),
          clientId: expect.any(String),
          invoiceId: expect.any(String),
        },
      },
    ])
  })

  it('should skip paid invoices that have not been sent', () => {
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 15:00').build() // 5 hours
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 14:00').build() // 4 hours
    setupInvoice().pay('2020-01-01 13:00').build() // 3 hours
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 14:00').build() // 4 hours
    setupInvoice().pay('2020-01-01 11:00').build() // 1 hour

    expect(events).toMatchSnapshot([
      {
        id: expect.any(String),
        context: {
          accountId: expect.any(String),
          clientId: expect.any(String),
          invoiceId: expect.any(String),
        },
      },
    ])
  })
})

describe('invoiceCountMilestones', () => {
  let events: Event[] = []
  let bus = new SuperEventEmitter()
  let account: Account = null as unknown as Account
  let client: Client = null as unknown as Client

  beforeEach(() => {
    bus.removeAllListeners()
    events.splice(0)
    bus.on('*', (e: Extract<Event, { type: `milestone:${string}` }>) => {
      if (e.tags.includes('milestone')) {
        events.push(e)
      }
    })

    invoiceCountMilestones(bus, { events })

    account = new AccountBuilder().name('Foo').billing(new AddressBuilder().build()).build()
    client = new ClientBuilder().name('Foo').billing(new AddressBuilder().build()).build()
  })

  afterEach(() => {
    bus.removeAllListeners()
  })

  function setupInvoice() {
    return new InvoiceBuilder(bus).account(account).client(client).issueDate(new Date())
  }

  it('should track paid invoices', () => {
    setupInvoice().build() // Draft
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 11:00').build() // 1 -- First milestone
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 12:00').build() // 2
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 13:00').build() // 3
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 14:00').build() // 4
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 15:00').build() // 5 -- Second milestone
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 16:00').build() // 6

    expect(events).toMatchSnapshot([
      {
        id: expect.any(String),
        context: {
          accountId: expect.any(String),
        },
      },
      {
        id: expect.any(String),
        context: {
          accountId: expect.any(String),
        },
      },
    ])
  })

  it('should keep track of sent invoices as well', () => {
    setupInvoice().build() // Draft
    setupInvoice().send('2020-01-01 10:00').build() // 1 -- First milestone
    setupInvoice().send('2020-01-01 10:00').build() // 2
    setupInvoice().send('2020-01-01 10:00').build() // 3
    setupInvoice().send('2020-01-01 10:00').build() // 4
    setupInvoice().send('2020-01-01 10:00').build() // 5 -- Second milestone
    setupInvoice().send('2020-01-01 10:00').build() // 6

    expect(events).toMatchSnapshot([
      {
        id: expect.any(String),
        context: {
          accountId: expect.any(String),
        },
      },
      {
        id: expect.any(String),
        context: {
          accountId: expect.any(String),
        },
      },
    ])
  })

  it('should drop future events in favor of real milestone achievements', () => {
    setupInvoice().build() // Draft
    setupInvoice().send('2020-01-01 10:00').build() // 1 -- First milestone
    setupInvoice().send('2020-01-01 11:00').build() // 2
    setupInvoice().send('2020-01-01 12:00').build() // 3
    setupInvoice().send('2020-01-01 13:00').build() // 4
    setupInvoice().send('2020-01-01 14:00').build() // 5 -- Second milestone
    setupInvoice().send('2020-01-01 15:00').build() // 6

    setupInvoice().pay('2020-01-01 16:00').build() // 1 -- First milestone
    setupInvoice().pay('2020-01-01 17:00').build() // 2
    setupInvoice().pay('2020-01-01 18:00').build() // 3
    setupInvoice().pay('2020-01-01 19:00').build() // 4
    setupInvoice().pay('2020-01-01 20:00').build() // 5 -- Second milestone
    setupInvoice().pay('2020-01-01 21:00').build() // 6

    expect(events).toMatchSnapshot([
      {
        id: expect.any(String),
        context: {
          accountId: expect.any(String),
        },
      },
      {
        id: expect.any(String),
        context: {
          accountId: expect.any(String),
        },
      },
    ])
  })
})

describe('revenueMilestones', () => {
  let events: Event[] = []
  let bus = new SuperEventEmitter()
  let account: Account = null as unknown as Account
  let client: Client = null as unknown as Client

  beforeEach(() => {
    bus.removeAllListeners()
    events.splice(0)
    bus.on('*', (e: Extract<Event, { type: `milestone:${string}` }>) => {
      if (e.tags.includes('milestone')) {
        events.push(e)
      }
    })

    revenueMilestones(bus, { events })

    account = new AccountBuilder().name('Foo').billing(new AddressBuilder().build()).build()
    client = new ClientBuilder().name('Foo').billing(new AddressBuilder().build()).build()
  })

  afterEach(() => {
    bus.removeAllListeners()
  })

  function setupInvoice() {
    return new InvoiceBuilder(bus)
      .account(account)
      .client(client)
      .issueDate(new Date())
      .item(
        new InvoiceItemBuilder()
          .unitPrice(100_00)
          .quantity(5)
          .taxRate(0.21)
          .description('Expensive lollies')
          .build(),
      )
  }

  it('should track paid invoices', () => {
    setupInvoice().build() // Draft
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 11:00').build() // 1 -- First milestone
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 12:00').build() // 2 -- Second milestone
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 13:00').build() // 3
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 14:00').build() // 4
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 15:00').build() // 5
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 16:00').build() // 6
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 16:00').build() // 7
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 16:00').build() // 8
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 16:00').build() // 9 -- Third milestone

    expect(events).toMatchSnapshot([
      { id: expect.any(String), context: { accountId: expect.any(String) } },
      { id: expect.any(String), context: { accountId: expect.any(String) } },
      { id: expect.any(String), context: { accountId: expect.any(String) } },
    ])
  })

  it('should keep track of sent invoices as well', () => {
    setupInvoice().build() // Draft
    setupInvoice().send('2020-01-01 10:00').build() // 1 -- First milestone
    setupInvoice().send('2020-01-01 10:00').build() // 2 -- Second milestone
    setupInvoice().send('2020-01-01 10:00').build() // 3
    setupInvoice().send('2020-01-01 10:00').build() // 4
    setupInvoice().send('2020-01-01 10:00').build() // 5
    setupInvoice().send('2020-01-01 10:00').build() // 6
    setupInvoice().send('2020-01-01 10:00').build() // 7
    setupInvoice().send('2020-01-01 10:00').build() // 8
    setupInvoice().send('2020-01-01 10:00').build() // 9 -- Third milestone

    expect(events).toMatchSnapshot([
      { id: expect.any(String), context: { accountId: expect.any(String) } },
      { id: expect.any(String), context: { accountId: expect.any(String) } },
      { id: expect.any(String), context: { accountId: expect.any(String) } },
    ])
  })

  it('should drop future events in favor of real milestone achievements', () => {
    setupInvoice().build() // Draft
    setupInvoice().send('2020-01-01 10:00').build() // 1
    setupInvoice().send('2020-01-01 11:00').build() // 2 -- First milestone
    setupInvoice().send('2020-01-01 12:00').build() // 3
    setupInvoice().send('2020-01-01 13:00').build() // 4
    setupInvoice().send('2020-01-01 14:00').build() // 5
    setupInvoice().send('2020-01-01 15:00').build() // 6
    setupInvoice().send('2020-01-01 16:00').build() // 7
    setupInvoice().send('2020-01-01 17:00').build() // 8
    setupInvoice().send('2020-01-01 18:00').build() // 9 -- Second milestone

    setupInvoice().send('2020-01-01 19:00').pay('2020-01-01 20:00').build() // 1 -- First milestone
    setupInvoice().send('2020-01-01 20:00').pay('2020-01-01 22:00').build() // 2 -- Second milestone
    setupInvoice().send('2020-01-01 21:00').pay('2020-01-02 10:00').build() // 3
    setupInvoice().send('2020-01-01 22:00').pay('2020-01-02 11:00').build() // 4
    setupInvoice().send('2020-01-01 23:00').pay('2020-01-02 12:00').build() // 5
    setupInvoice().send('2020-01-02 10:00').pay('2020-01-02 13:00').build() // 6
    setupInvoice().send('2020-01-02 11:00').pay('2020-01-02 14:00').build() // 7
    setupInvoice().send('2020-01-02 12:00').pay('2020-01-02 15:00').build() // 8
    setupInvoice().send('2020-01-02 13:00').pay('2020-01-02 16:00').build() // 9 -- Third milestone

    expect(events).toMatchSnapshot([
      { id: expect.any(String), context: { accountId: expect.any(String) } },
      { id: expect.any(String), context: { accountId: expect.any(String) } },
      { id: expect.any(String), context: { accountId: expect.any(String) } },
    ])
  })
})

describe('clientCountMilestones', () => {
  let events: Event[] = []
  let bus = new SuperEventEmitter()
  let account: Account = null as unknown as Account

  beforeEach(() => {
    bus.removeAllListeners()
    events.splice(0)
    bus.on('*', (e: Extract<Event, { type: `milestone:${string}` }>) => {
      if (e.tags.includes('milestone')) {
        events.push(e)
      }
    })

    clientCountMilestones(bus, { events })

    account = new AccountBuilder().name('Foo').billing(new AddressBuilder().build()).build()
  })

  afterEach(() => {
    bus.removeAllListeners()
  })

  function setupInvoice() {
    return new InvoiceBuilder(bus)
      .account(account)
      .client(new ClientBuilder().name('Foo').billing(new AddressBuilder().build()).build())
      .issueDate(new Date())
      .item(new InvoiceItemBuilder().unitPrice(100_00).description('Expensive lollies').build())
  }

  it('should track paid invoices', () => {
    setupInvoice().build() // Draft
    setupInvoice().build() // Draft
    setupInvoice().build() // Draft

    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 11:00').build() // 1
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 12:00').build() // 2
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 13:00').build() // 3 -- First milestone
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 14:00').build() // 4
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 15:00').build() // 5 -- Second milestone
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 16:00').build() // 6

    expect(events).toMatchSnapshot([
      { id: expect.any(String), context: { accountId: expect.any(String) } },
      { id: expect.any(String), context: { accountId: expect.any(String) } },
    ])
  })

  it('should keep track of sent invoices as well', () => {
    setupInvoice().build() // Draft
    setupInvoice().build() // Draft
    setupInvoice().build() // Draft

    setupInvoice().send('2020-01-01 10:00').build() // 1
    setupInvoice().send('2020-01-01 11:00').build() // 2
    setupInvoice().send('2020-01-01 12:00').build() // 3 -- First milestone
    setupInvoice().send('2020-01-01 13:00').build() // 4
    setupInvoice().send('2020-01-01 14:00').build() // 5 -- Second milestone
    setupInvoice().send('2020-01-01 15:00').build() // 6

    expect(events).toMatchSnapshot([
      { id: expect.any(String), context: { accountId: expect.any(String) } },
      { id: expect.any(String), context: { accountId: expect.any(String) } },
    ])
  })

  it('should drop future events in favor of real milestone achievements', () => {
    setupInvoice().build() // Draft
    setupInvoice().build() // Draft
    setupInvoice().build() // Draft

    setupInvoice().send('2020-01-01 10:00').build() // 1
    setupInvoice().send('2020-01-01 11:00').build() // 2
    setupInvoice().send('2020-01-01 12:00').build() // 3
    setupInvoice().send('2020-01-01 13:00').build() // 4
    setupInvoice().send('2020-01-01 14:00').build() // 5 -- 1.5 milestone?

    setupInvoice().send('2020-01-01 15:00').pay('2020-01-01 15:30').build() // 7
    setupInvoice().send('2020-01-01 16:00').pay('2020-01-01 16:30').build() // 8
    setupInvoice().send('2020-01-01 17:00').pay('2020-01-01 17:30').build() // 9  -- First milestone
    setupInvoice().send('2020-01-01 18:00').pay('2020-01-01 18:30').build() // 10
    setupInvoice().send('2020-01-01 19:00').pay('2020-01-01 19:30').build() // 11 -- Second milestone
    setupInvoice().send('2020-01-01 20:00').pay('2020-01-01 20:30').build() // 12

    expect(events).toMatchSnapshot([
      { id: expect.any(String), context: { accountId: expect.any(String) } },
      { id: expect.any(String), context: { accountId: expect.any(String) } },
      { id: expect.any(String), context: { accountId: expect.any(String) } },
    ])
  })
})

describe('internationalClientCountMilestones', () => {
  let events: Event[] = []
  let bus = new SuperEventEmitter()
  let account: Account = null as unknown as Account

  beforeEach(() => {
    bus.removeAllListeners()
    events.splice(0)
    bus.on('*', (e: Extract<Event, { type: `milestone:${string}` }>) => {
      if (e.tags.includes('milestone')) {
        events.push(e)
      }
    })

    internationalClientCountMilestones(bus, { events })

    account = new AccountBuilder()
      .name('Foo')
      .billing(new AddressBuilder().country('Belgium').build())
      .build()
  })

  afterEach(() => {
    bus.removeAllListeners()
  })

  function setupInvoice() {
    return new InvoiceBuilder(bus)
      .account(account)
      .client(
        new ClientBuilder().name('Foo').billing(new AddressBuilder().country('US').build()).build(),
      )
      .issueDate(new Date())
      .item(new InvoiceItemBuilder().unitPrice(100_00).description('Expensive lollies').build())
  }

  it('should track paid invoices', () => {
    setupInvoice().build() // Draft
    setupInvoice().build() // Draft
    setupInvoice().build() // Draft

    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 11:00').build() // 1 -- First milestone
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 12:00').build() // 2
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 13:00').build() // 3 -- Second milestone
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 14:00').build() // 4
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 15:00').build() // 5 -- Third milestone
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 16:00').build() // 6

    expect(events).toMatchSnapshot([
      { id: expect.any(String), context: { accountId: expect.any(String) } },
      { id: expect.any(String), context: { accountId: expect.any(String) } },
      { id: expect.any(String), context: { accountId: expect.any(String) } },
    ])
  })

  it('should keep track of sent invoices as well', () => {
    setupInvoice().build() // Draft
    setupInvoice().build() // Draft
    setupInvoice().build() // Draft

    setupInvoice().send('2020-01-01 10:00').build() // 1 -- First milestone
    setupInvoice().send('2020-01-01 11:00').build() // 2
    setupInvoice().send('2020-01-01 12:00').build() // 3 -- Second milestone
    setupInvoice().send('2020-01-01 13:00').build() // 4
    setupInvoice().send('2020-01-01 14:00').build() // 5 -- Third milestone
    setupInvoice().send('2020-01-01 15:00').build() // 6

    expect(events).toMatchSnapshot([
      { id: expect.any(String), context: { accountId: expect.any(String) } },
      { id: expect.any(String), context: { accountId: expect.any(String) } },
      { id: expect.any(String), context: { accountId: expect.any(String) } },
    ])
  })

  it('should drop future events in favor of real milestone achievements', () => {
    setupInvoice().build() // Draft
    setupInvoice().build() // Draft
    setupInvoice().build() // Draft

    setupInvoice().send('2020-01-01 10:00').build() // 1
    setupInvoice().send('2020-01-01 11:00').build() // 2
    setupInvoice().send('2020-01-01 12:00').build() // 3
    setupInvoice().send('2020-01-01 13:00').build() // 4
    setupInvoice().send('2020-01-01 14:00').build() // 5 -- 1.5 milestone?

    setupInvoice().send('2020-01-01 15:00').pay('2020-01-01 15:30').build() // 7  -- First milestone
    setupInvoice().send('2020-01-01 16:00').pay('2020-01-01 16:30').build() // 8
    setupInvoice().send('2020-01-01 17:00').pay('2020-01-01 17:30').build() // 9  -- Second milestone
    setupInvoice().send('2020-01-01 18:00').pay('2020-01-01 18:30').build() // 10
    setupInvoice().send('2020-01-01 19:00').pay('2020-01-01 19:30').build() // 11 -- Third milestone
    setupInvoice().send('2020-01-01 20:00').pay('2020-01-01 20:30').build() // 12

    expect(events).toMatchSnapshot([
      { id: expect.any(String), context: { accountId: expect.any(String) } },
      { id: expect.any(String), context: { accountId: expect.any(String) } },
      { id: expect.any(String), context: { accountId: expect.any(String) } },
      { id: expect.any(String), context: { accountId: expect.any(String) } },
    ])
  })
})

describe('mostExpensiveInvoiceMilestones', () => {
  let events: Event[] = []
  let bus = new SuperEventEmitter()
  let account: Account = null as unknown as Account
  let client: Client = null as unknown as Client

  beforeEach(() => {
    bus.removeAllListeners()
    events.splice(0)
    bus.on('*', (e: Extract<Event, { type: `milestone:${string}` }>) => {
      if (e.tags.includes('milestone')) {
        events.push(e)
      }
    })

    mostExpensiveInvoiceMilestones(bus, { events })

    account = new AccountBuilder().name('Foo').billing(new AddressBuilder().build()).build()
    client = new ClientBuilder().name('Foo').billing(new AddressBuilder().build()).build()
  })

  afterEach(() => {
    bus.removeAllListeners()
  })

  function setupInvoice(multiplier = 1) {
    return new InvoiceBuilder(bus)
      .account(account)
      .client(client)
      .issueDate(new Date())
      .item(
        new InvoiceItemBuilder()
          .unitPrice(100_00)
          .quantity(multiplier)
          .description('Expensive lollies')
          .build(),
      )
  }

  it('should not track the first paid invoice', () => {
    setupInvoice(5).build() // Draft
    setupInvoice(4).build() // Draft

    setupInvoice(6).send('2020-01-01 10:00').pay('2020-01-01 15:00').build() // First paid

    expect(events).toMatchSnapshot()
  })

  it('should track paid invoices', () => {
    setupInvoice(5).build() // Draft
    setupInvoice(2).send('2020-01-01 10:00').pay('2020-01-01 11:00').build() // 1
    setupInvoice(3).send('2020-01-01 10:00').pay('2020-01-01 12:00').build() // 2 -- First milestone
    setupInvoice(2).send('2020-01-01 10:00').pay('2020-01-01 13:00').build() // 3
    setupInvoice(1).send('2020-01-01 10:00').pay('2020-01-01 14:00').build() // 4
    setupInvoice(1).send('2020-01-01 10:00').pay('2020-01-01 15:00').build() // 5
    setupInvoice(1).send('2020-01-01 10:00').pay('2020-01-01 16:00').build() // 6
    setupInvoice(3).send('2020-01-01 10:00').pay('2020-01-01 17:00').build() // 7
    setupInvoice(5).send('2020-01-01 10:00').pay('2020-01-01 18:00').build() // 8 -- Second milestone
    setupInvoice(1).send('2020-01-01 10:00').pay('2020-01-01 19:00').build() // 9

    expect(events).toMatchSnapshot([
      {
        id: expect.any(String),
        context: {
          accountId: expect.any(String),
          clientId: expect.any(String),
          invoiceId: expect.any(String),
        },
      },
      {
        id: expect.any(String),
        context: {
          accountId: expect.any(String),
          clientId: expect.any(String),
          invoiceId: expect.any(String),
        },
      },
    ])
  })

  it('should keep track of sent invoices as well', () => {
    setupInvoice(5).build() // Draft
    setupInvoice(2).send('2020-01-01 11:00').build() // 1
    setupInvoice(3).send('2020-01-01 12:00').build() // 2 -- First milestone
    setupInvoice(2).send('2020-01-01 13:00').build() // 3
    setupInvoice(1).send('2020-01-01 14:00').build() // 4
    setupInvoice(1).send('2020-01-01 15:00').build() // 5
    setupInvoice(1).send('2020-01-01 16:00').build() // 6
    setupInvoice(3).send('2020-01-01 17:00').build() // 7
    setupInvoice(5).send('2020-01-01 18:00').build() // 8 -- Second milestone
    setupInvoice(1).send('2020-01-01 19:00').build() // 9

    expect(events).toMatchSnapshot([
      {
        id: expect.any(String),
        context: {
          accountId: expect.any(String),
          clientId: expect.any(String),
          invoiceId: expect.any(String),
        },
      },
      {
        id: expect.any(String),
        context: {
          accountId: expect.any(String),
          clientId: expect.any(String),
          invoiceId: expect.any(String),
        },
      },
    ])
  })

  it('should drop future events in favor of real milestone achievements', () => {
    setupInvoice(5).build() // Draft
    setupInvoice(2).send('2020-01-01 11:00').build() // 1
    setupInvoice(3).send('2020-01-01 12:00').build() // 2 -- First milestone
    setupInvoice(2).send('2020-01-01 13:00').build() // 3
    setupInvoice(1).send('2020-01-01 14:00').build() // 4
    setupInvoice(1).send('2020-01-01 15:00').build() // 5
    setupInvoice(1).send('2020-01-01 16:00').build() // 6
    setupInvoice(3).send('2020-01-01 17:00').build() // 7
    setupInvoice(5).send('2020-01-01 18:00').build() // 8 -- Second milestone
    setupInvoice(1).send('2020-01-01 19:00').build() // 9

    setupInvoice(5).build() // Draft
    setupInvoice(2).send('2020-01-01 10:00').pay('2020-01-01 11:00').build() // 1
    setupInvoice(3).send('2020-01-01 10:00').pay('2020-01-01 12:00').build() // 2 -- First milestone
    setupInvoice(2).send('2020-01-01 10:00').pay('2020-01-01 13:00').build() // 3
    setupInvoice(1).send('2020-01-01 10:00').pay('2020-01-01 14:00').build() // 4
    setupInvoice(1).send('2020-01-01 10:00').pay('2020-01-01 15:00').build() // 5
    setupInvoice(1).send('2020-01-01 10:00').pay('2020-01-01 16:00').build() // 6
    setupInvoice(3).send('2020-01-01 10:00').pay('2020-01-01 17:00').build() // 7
    setupInvoice(5).send('2020-01-01 10:00').pay('2020-01-01 18:00').build() // 8 -- Second milestone
    setupInvoice(1).send('2020-01-01 10:00').pay('2020-01-01 19:00').build() // 9

    expect(events).toMatchSnapshot([
      {
        id: expect.any(String),
        context: {
          accountId: expect.any(String),
          clientId: expect.any(String),
          invoiceId: expect.any(String),
        },
      },
      {
        id: expect.any(String),
        context: {
          accountId: expect.any(String),
          clientId: expect.any(String),
          invoiceId: expect.any(String),
        },
      },
    ])
  })
})

describe('anniversaryMilestones', () => {
  let events: Event[] = []
  let bus = new SuperEventEmitter()
  let account: Account = null as unknown as Account
  let client: Client = null as unknown as Client

  beforeEach(() => {
    bus.removeAllListeners()
    events.splice(0)
    bus.on('*', (e: Extract<Event, { type: `milestone:${string}` }>) => {
      if (e.tags.includes('milestone')) {
        events.push(e)
      }
    })

    anniversaryMilestones(bus, { events })

    account = new AccountBuilder().name('Foo').billing(new AddressBuilder().build()).build()
    client = new ClientBuilder().name('Foo').billing(new AddressBuilder().build()).build()
  })

  afterEach(() => {
    bus.removeAllListeners()
  })

  function setupInvoice() {
    return new InvoiceBuilder(bus)
      .account(account)
      .client(client)
      .issueDate(new Date())
      .item(new InvoiceItemBuilder().unitPrice(100_00).description('Expensive lollies').build())
  }

  it('should result in an anniversary milestone every year', () => {
    setupInvoice().build() // Draft
    setupInvoice().build() // Draft

    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 15:00').build()

    setupInvoice().send('2021-01-01 10:00').build() // 1 year later
    setupInvoice().send('2021-02-01 10:00').build() // Same 1 year later
    setupInvoice().send('2021-03-01 10:00').build() // Same 1 year later
    setupInvoice().send('2022-04-01 10:00').build() // 2 yers later

    expect(events).toMatchSnapshot([
      { id: expect.any(String), context: { accountId: expect.any(String) } },
      { id: expect.any(String), context: { accountId: expect.any(String) } },
    ])
  })
})
