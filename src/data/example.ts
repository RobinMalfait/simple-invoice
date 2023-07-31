import { Account, AccountBuilder } from '~/domain/account/account'
import { AddressBuilder } from '~/domain/address/address'
import { ClientBuilder } from '~/domain/client/client'
import { ContactFieldBuilder } from '~/domain/contact-fields/contact-fields'
import { Currency } from '~/domain/currency/currency'
import { DiscountBuilder } from '~/domain/discount/discount'
import { Invoice, InvoiceBuilder } from '~/domain/invoice/invoice'
import { InvoiceItemBuilder } from '~/domain/invoice/invoice-item'
import { Language } from '~/domain/language/language'
import { PaymentMethodBuilder } from '~/domain/payment-method/payment-method'
import { TaxBuilder } from '~/domain/tax/tax'

export const me: Account = new AccountBuilder()
  .name('Acme Inc.')
  .email('alice@acme.com')
  .phone('+32 123 45 67 89')
  .billing(
    new AddressBuilder()
      .street1('Acme Street 123')
      .city('Acme City')
      .postcode('1234')
      .country('Belgium')
      .build(),
  )
  .paymentMethod(new PaymentMethodBuilder().type('iban').value('BE32 1234 5678 9012').build())
  .paymentMethod(new PaymentMethodBuilder().type('paypal').value('alice@acme.com').build())
  .contactField(
    new ContactFieldBuilder()
      .icon({ type: 'heroicon', heroicon: 'GlobeAltIcon' })
      .name('website')
      .value('https://acme.com')
      .build(),
  )
  .contactField(
    new ContactFieldBuilder()
      .icon({
        type: 'image',
        imageUrl: 'https://www.google.com/s2/favicons?domain=github.com&sz=16',
      })
      .name('github')
      .value('https://github.com')
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
      .street1('Client Street 123')
      .city('Client City')
      .postcode('1234')
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
      .street1('Client Street 123')
      .city('Client City')
      .postcode('1234')
      .country('Belgium')
      .build(),
  )
  .tax(new TaxBuilder().value('BE 9876 543 210').build())
  .note('This note will always be present on every invoice for this client')
  .legal('Legal information for Client Inc')
  .language(Language.EN)
  .currency(Currency.USD)
  .build()

export const invoices: Invoice[] = [
  // Single item invoice
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate('2023-01-01')
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .send('2023-01-01')
    .pay('2023-01-06', 25_00) // Partial Payment
    .pay('2023-01-07', 50_00) // Partial Payment
    .pay('2023-01-08', 25_00) // Partial Payment
    .build(),

  // Single item invoice, with multiple quantities
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate('2023-01-02')
    .item(
      new InvoiceItemBuilder().description('Item line #1').quantity(4).unitPrice(100_00).build(),
    )
    .send('2023-01-02')
    .pay('2023-02-15')
    .build(),

  // Single item invoice, with tax
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate('2023-01-03')
    .item(
      new InvoiceItemBuilder().description('Item line #1').taxRate(0.21).unitPrice(100_00).build(),
    )
    .send('2023-01-03')
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

  // Single item invoice, with a fixed discount
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate('2024-01-01')
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(100_00).taxRate(0.21).build())
    .discount(new DiscountBuilder().type('fixed').value(2500).reason('25OFF').build())
    .build(),

  // Single item invoice, with a percentage discount
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate('2024-01-01')
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(100_00).taxRate(0.21).build())
    .discount(new DiscountBuilder().type('percentage').value(0.1).reason('ABC').build())
    .build(),

  // Single item invoice, with a combination of discounts
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate('2024-01-01')
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(100_00).taxRate(0.21).build())
    .discount(new DiscountBuilder().type('percentage').value(0.1).reason('ABC').build())
    .discount(new DiscountBuilder().type('percentage').value(0.1).reason('DEF').build())
    .discount(new DiscountBuilder().type('percentage').value(0.1).reason('HIJ').build())
    .discount(new DiscountBuilder().type('fixed').value(2500).reason('25OFF').build())
    .build(),

  // Single item invoice, with a discount for an item
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate('2024-01-01')
    .item(
      new InvoiceItemBuilder()
        .description('Item #1')
        .unitPrice(315_00)
        .taxRate(0.21)
        .discount(new DiscountBuilder().type('fixed').value(5_00).reason('5OFF').build())
        .build(),
    )
    .build(),
]
