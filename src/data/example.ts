import { Account, AccountBuilder } from '~/domain/account/account'
import { AddressBuilder } from '~/domain/address/address'
import { ClientBuilder } from '~/domain/client/client'
import { Invoice, InvoiceBuilder, InvoiceItemBuilder } from '~/domain/invoice/invoice'
import { TaxBuilder } from '~/domain/tax/tax'

export const me: Account = new AccountBuilder()
  .name('Acme Inc.')
  .email('alice@acme.com')
  .phone('+32 123 45 67 89')
  .billing(
    new AddressBuilder()
      .street('Acme Street 123')
      .city('Acme City')
      .zip('1234')
      .country('Belgium')
      .build(),
  )
  .tax(new TaxBuilder().value('BE 1234 567 890').build())
  .note('Gelieve te betalen binnen de 30 dagen.')
  .legal('Legal information for Acme Inc.')
  .build()

let Client1 = new ClientBuilder()
  .name('Client Inc')
  .email('bob@client.com')
  .billing(
    new AddressBuilder()
      .street('Client Street 123')
      .city('Client City')
      .zip('1234')
      .country('Belgium')
      .build(),
  )
  .tax(new TaxBuilder().value('BE 9876 543 210').build())
  .build()

let Client2 = new ClientBuilder()
  .name('Client Inc')
  .email('bob@client.com')
  .billing(
    new AddressBuilder()
      .street('Client Street 123')
      .city('Client City')
      .zip('1234')
      .country('Belgium')
      .build(),
  )
  .tax(new TaxBuilder().value('BE 9876 543 210').build())
  .note('This note will always be present on every invoice for this client')
  .legal('Legal information for Client Inc')
  .build()

export const invoices: Invoice[] = [
  // Single item invoice
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate('2023-01-01')
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .build(),

  // Single item invoice, with multiple quantities
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate('2023-01-02')
    .item(
      new InvoiceItemBuilder().description('Item line #1').quantity(4).unitPrice(100_00).build(),
    )
    .build(),

  // Single item invoice, with tax
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate('2023-01-03')
    .item(
      new InvoiceItemBuilder().description('Item line #1').taxRate(0.21).unitPrice(100_00).build(),
    )
    .build(),

  // Single item invoice, with multiple quantities and tax
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate('2023-01-04')
    .item(
      new InvoiceItemBuilder()
        .description('Item line #1')
        .taxRate(0.21)
        .quantity(4)
        .unitPrice(100_00)
        .build(),
    )
    .build(),

  // Multiple items invoice
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate('2023-01-05')
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .item(new InvoiceItemBuilder().description('Item line #2').unitPrice(100_00).build())
    .build(),

  // Multiple items invoice, with multiple quantities
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate('2023-01-06')
    .item(
      new InvoiceItemBuilder().description('Item line #1').quantity(2).unitPrice(100_00).build(),
    )
    .item(
      new InvoiceItemBuilder().description('Item line #2').quantity(4).unitPrice(100_00).build(),
    )
    .item(
      new InvoiceItemBuilder().description('Item line #3').quantity(7).unitPrice(100_00).build(),
    )
    .build(),

  // Multiple items invoice, with tax
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate('2023-01-07')
    .item(
      new InvoiceItemBuilder().description('Item line #1').taxRate(0.21).unitPrice(100_00).build(),
    )
    .item(
      new InvoiceItemBuilder().description('Item line #2').taxRate(0.21).unitPrice(100_00).build(),
    )
    .item(
      new InvoiceItemBuilder().description('Item line #2').taxRate(0.21).unitPrice(100_00).build(),
    )
    .build(),

  // Multiple items invoice, with multiple quantities and tax
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate('2023-01-08')
    .item(
      new InvoiceItemBuilder()
        .description('Item line #1')
        .taxRate(0.21)
        .quantity(4)
        .unitPrice(100_00)
        .build(),
    )
    .item(
      new InvoiceItemBuilder()
        .description('Item line #2')
        .taxRate(0.21)
        .quantity(3)
        .unitPrice(100_00)
        .build(),
    )
    .build(),

  // Multiple items invoice, with multiple quantities and multiple tax rates
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate('2023-01-09')
    .item(
      new InvoiceItemBuilder()
        .description('Item line #1')
        .taxRate(0.21)
        .quantity(4)
        .unitPrice(100_00)
        .build(),
    )
    .item(
      new InvoiceItemBuilder()
        .description('Item line #2')
        .taxRate(0.18)
        .quantity(3)
        .unitPrice(100_00)
        .build(),
    )
    .build(),

  // Multiple items invoice, spreading over multiple pages
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate('2023-01-10')
    .item(
      new InvoiceItemBuilder().description('Item line #1').quantity(3).unitPrice(100_00).build(),
    )
    .item(
      new InvoiceItemBuilder().description('Item line #2').quantity(2).unitPrice(100_00).build(),
    )
    .item(
      new InvoiceItemBuilder()
        .description('Item line #3')
        .taxRate(0.21)
        .quantity(3)
        .unitPrice(100_00)
        .build(),
    )
    .item(
      new InvoiceItemBuilder().description('Item line #4').quantity(7).unitPrice(100_00).build(),
    )
    .item(
      new InvoiceItemBuilder().description('Item line #5').quantity(3).unitPrice(100_00).build(),
    )
    .item(new InvoiceItemBuilder().description('Item line #6').unitPrice(100_00).build())
    .item(new InvoiceItemBuilder().description('Item line #7').unitPrice(100_00).build())
    .item(
      new InvoiceItemBuilder().description('Item line #8').taxRate(0.18).unitPrice(100_00).build(),
    )
    .item(
      new InvoiceItemBuilder().description('Item line #9').taxRate(0.18).unitPrice(100_00).build(),
    )
    .item(new InvoiceItemBuilder().description('Item line #10').unitPrice(100_00).build())
    .item(new InvoiceItemBuilder().description('Item line #11').unitPrice(100_00).build())
    .item(
      new InvoiceItemBuilder().description('Item line #12').taxRate(0.06).unitPrice(100_00).build(),
    )
    .item(
      new InvoiceItemBuilder().description('Item line #13').taxRate(0.06).unitPrice(100_00).build(),
    )
    .item(new InvoiceItemBuilder().description('Item line #14').unitPrice(100_00).build())
    .build(),

  // Single item invoice with notes
  new InvoiceBuilder()
    .account(me)
    .client(Client2)
    .issueDate('2023-01-11')
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .note('This is a note for this specific invoice')
    .build(),

  // Single item invoice, in the future
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate('2024-01-01')
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .build(),
]
