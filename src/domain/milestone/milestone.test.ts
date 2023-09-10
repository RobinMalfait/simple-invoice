import EventEmitter from 'events'
import { Account, AccountBuilder } from '~/domain/account/account'
import { AddressBuilder } from '~/domain/address/address'
import { Client, ClientBuilder } from '~/domain/client/client'
import { configure } from '~/domain/configuration/configuration'
import {
  clientCountMilestones,
  fastestAcceptedQuoteMilestones,
  fastestPaidInvoiceMilestones,
  invoiceCountMilestones,
  mostExpensiveInvoiceMilestones,
  revenueMilestones,
} from '~/domain/milestone/milestone'
import { QuoteBuilder } from '~/domain/quote/quote'
import { InvoiceBuilder } from '../invoice/invoice'
import { InvoiceItemBuilder } from '../invoice/invoice-item'

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
  let bus = new EventEmitter()
  let account: Account = null as unknown as Account
  let client: Client = null as unknown as Client

  beforeEach(() => {
    bus.removeAllListeners()

    fastestAcceptedQuoteMilestones(bus)

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

    expect(account.events.filter((x) => !x.tombstone)).toMatchSnapshot()
  })

  it('should emit a milestone event for the fastest accepted quote', () => {
    setupQuote().send('2020-01-01 10:00').accept('2020-01-01 15:00').build() // 5 hours
    setupQuote().send('2020-01-01 10:00').accept('2020-01-01 14:00').build() // 4 hours
    setupQuote().send('2020-01-01 10:00').accept('2020-01-01 13:00').build() // 3 hours
    setupQuote().send('2020-01-01 10:00').accept('2020-01-01 14:00').build() // 4 hours
    setupQuote().send('2020-01-01 10:00').accept('2020-01-01 11:00').build() // 1 hour

    expect(account.events.filter((x) => !x.tombstone)).toMatchSnapshot([
      { id: expect.any(String), client: { id: expect.any(String) } },
      { id: expect.any(String), client: { id: expect.any(String) } },
      { id: expect.any(String), client: { id: expect.any(String) } },
    ])
  })
})

describe('fastestPaidInvoiceMilestones', () => {
  let bus = new EventEmitter()
  let account: Account = null as unknown as Account
  let client: Client = null as unknown as Client

  beforeEach(() => {
    bus.removeAllListeners()

    fastestPaidInvoiceMilestones(bus)

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

    expect(account.events.filter((x) => !x.tombstone)).toMatchSnapshot()
  })

  it('should emit a milestone event for the fastest paid invoice', () => {
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 15:00').build() // 5 hours
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 14:00').build() // 4 hours
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 13:00').build() // 3 hours
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 14:00').build() // 4 hours
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 11:00').build() // 1 hour

    expect(account.events.filter((x) => !x.tombstone)).toMatchSnapshot([
      { id: expect.any(String), client: { id: expect.any(String) } },
      { id: expect.any(String), client: { id: expect.any(String) } },
      { id: expect.any(String), client: { id: expect.any(String) } },
    ])
  })

  it('should skip paid invoices that have not been sent', () => {
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 15:00').build() // 5 hours
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 14:00').build() // 4 hours
    setupInvoice().pay('2020-01-01 13:00').build() // 3 hours
    setupInvoice().send('2020-01-01 10:00').pay('2020-01-01 14:00').build() // 4 hours
    setupInvoice().pay('2020-01-01 11:00').build() // 1 hour

    expect(account.events.filter((x) => !x.tombstone)).toMatchSnapshot([
      { id: expect.any(String), client: { id: expect.any(String) } },
    ])
  })
})

describe('invoiceCountMilestones', () => {
  let bus = new EventEmitter()
  let account: Account = null as unknown as Account
  let client: Client = null as unknown as Client

  beforeEach(() => {
    bus.removeAllListeners()

    invoiceCountMilestones(bus)

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

    expect(account.events.filter((x) => !x.tombstone)).toMatchSnapshot([
      { id: expect.any(String) },
      { id: expect.any(String) },
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

    expect(account.events.filter((x) => !x.tombstone)).toMatchSnapshot([
      { id: expect.any(String) },
      { id: expect.any(String) },
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

    expect(account.events.filter((x) => !x.tombstone)).toMatchSnapshot([
      { id: expect.any(String) },
      { id: expect.any(String) },
    ])
  })
})

describe('revenueMilestones', () => {
  let bus = new EventEmitter()
  let account: Account = null as unknown as Account
  let client: Client = null as unknown as Client

  beforeEach(() => {
    bus.removeAllListeners()

    revenueMilestones(bus)

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

    expect(account.events.filter((x) => !x.tombstone)).toMatchSnapshot([
      { id: expect.any(String) },
      { id: expect.any(String) },
      { id: expect.any(String) },
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

    expect(account.events.filter((x) => !x.tombstone)).toMatchSnapshot([
      { id: expect.any(String) },
      { id: expect.any(String) },
      { id: expect.any(String) },
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

    expect(account.events.filter((x) => !x.tombstone)).toMatchSnapshot([
      { id: expect.any(String) },
      { id: expect.any(String) },
      { id: expect.any(String) },
    ])
  })
})

describe('clientCountMilestones', () => {
  let bus = new EventEmitter()
  let account: Account = null as unknown as Account

  beforeEach(() => {
    bus.removeAllListeners()

    clientCountMilestones(bus)

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

    expect(account.events.filter((x) => !x.tombstone)).toMatchSnapshot([
      { id: expect.any(String) },
      { id: expect.any(String) },
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

    expect(account.events.filter((x) => !x.tombstone)).toMatchSnapshot([
      { id: expect.any(String) },
      { id: expect.any(String) },
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

    expect(account.events.filter((x) => !x.tombstone)).toMatchSnapshot([
      { id: expect.any(String) },
      { id: expect.any(String) },
      { id: expect.any(String) },
    ])
  })
})

describe('mostExpensiveInvoiceMilestones', () => {
  let bus = new EventEmitter()
  let account: Account = null as unknown as Account
  let client: Client = null as unknown as Client

  beforeEach(() => {
    bus.removeAllListeners()

    mostExpensiveInvoiceMilestones(bus)

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

    expect(account.events.filter((x) => !x.tombstone)).toMatchSnapshot()
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

    expect(account.events.filter((x) => !x.tombstone)).toMatchSnapshot([
      { id: expect.any(String) },
      { id: expect.any(String) },
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

    expect(account.events.filter((x) => !x.tombstone)).toMatchSnapshot([
      { id: expect.any(String) },
      { id: expect.any(String) },
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

    expect(account.events.filter((x) => !x.tombstone)).toMatchSnapshot([
      { id: expect.any(String) },
      { id: expect.any(String) },
    ])
  })
})
