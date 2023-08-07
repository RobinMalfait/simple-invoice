import { addDays, subDays } from 'date-fns'
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
import { Quote, QuoteBuilder } from '~/domain/quote/quote'
import { Receipt, ReceiptBuilder } from '~/domain/receipt/receipt'
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
      .icon({ type: 'socials', name: 'GitHub' })
      .name('github')
      .value('https://github.com')
      .build(),
  )
  .tax(new TaxBuilder().value('BE 1234 567 890').build())
  .note('Gelieve te betalen binnen de 30 dagen.')
  .legal('Legal information for Acme Inc.')
  .build()

let Client1 = new ClientBuilder()
  .name('Client Inc #1')
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
  .name('Client Inc #2')
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

export const invoices: (Quote | Invoice | Receipt)[] = [
  // Single item invoice, drafted (issue date in the future)
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(addDays(new Date(), 10))
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .build(),

  // Single item invoice, drafted (issue date today!)
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(new Date())
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .build(),

  // Single item invoice, sent
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 10))
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .send(subDays(new Date(), 10))
    .build(),

  // Single item invoice, paid
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 10))
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .send(subDays(new Date(), 10))
    .pay(subDays(new Date(), 4))
    .build(),

  // Single item invoice, partially paid
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 10))
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .send(subDays(new Date(), 10))
    .pay(subDays(new Date(), 4), 25_00) // Partial Payment
    .pay(subDays(new Date(), 3), 50_00) // Partial Payment
    .build(),

  // Single item invoice, fully paid, via partial payments
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 10))
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .send(subDays(new Date(), 10))
    .pay(subDays(new Date(), 4), 25_00) // Partial Payment
    .pay(subDays(new Date(), 3), 50_00) // Partial Payment
    .pay(subDays(new Date(), 2), 25_00) // Partial Payment
    .build(),

  // Single item invoice, overdue
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 60))
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .send(subDays(new Date(), 60))
    .build(),

  // Single item invoice, closed
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 60))
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .send(subDays(new Date(), 60))
    .close(subDays(new Date(), 59))
    .build(),

  // Single item invoice, with multiple quantities
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 10))
    .item(
      new InvoiceItemBuilder().description('Item line #1').quantity(4).unitPrice(100_00).build(),
    )
    .send(subDays(new Date(), 10))
    .pay(subDays(new Date(), 5))
    .build(),

  // Single item invoice, with tax
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 10))
    .item(
      new InvoiceItemBuilder().description('Item line #1').taxRate(0.21).unitPrice(100_00).build(),
    )
    .send(subDays(new Date(), 10))
    .pay(subDays(new Date(), 5))
    .build(),

  // Single item invoice, with multiple quantities and tax
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 10))
    .item(
      new InvoiceItemBuilder()
        .description('Item line #1')
        .taxRate(0.21)
        .quantity(4)
        .unitPrice(100_00)
        .build(),
    )
    .send(subDays(new Date(), 10))
    .pay(subDays(new Date(), 5))
    .build(),

  // Multiple items invoice
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 10))
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .item(new InvoiceItemBuilder().description('Item line #2').unitPrice(100_00).build())
    .send(subDays(new Date(), 10))
    .pay(subDays(new Date(), 5))
    .build(),

  // Multiple items invoice, with multiple quantities
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 10))
    .item(
      new InvoiceItemBuilder().description('Item line #1').quantity(2).unitPrice(100_00).build(),
    )
    .item(
      new InvoiceItemBuilder().description('Item line #2').quantity(4).unitPrice(100_00).build(),
    )
    .item(
      new InvoiceItemBuilder().description('Item line #3').quantity(7).unitPrice(100_00).build(),
    )
    .send(subDays(new Date(), 10))
    .pay(subDays(new Date(), 5))
    .build(),

  // Multiple items invoice, with tax
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 10))
    .item(
      new InvoiceItemBuilder().description('Item line #1').taxRate(0.21).unitPrice(100_00).build(),
    )
    .item(
      new InvoiceItemBuilder().description('Item line #2').taxRate(0.21).unitPrice(100_00).build(),
    )
    .item(
      new InvoiceItemBuilder().description('Item line #2').taxRate(0.21).unitPrice(100_00).build(),
    )
    .send(subDays(new Date(), 10))
    .pay(subDays(new Date(), 5))
    .build(),

  // Multiple items invoice, with multiple quantities and tax
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 10))
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
    .send(subDays(new Date(), 10))
    .pay(subDays(new Date(), 5))
    .build(),

  // Multiple items invoice, with multiple quantities and multiple tax rates
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 10))
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
    .send(subDays(new Date(), 10))
    .pay(subDays(new Date(), 5))
    .build(),

  // Multiple items invoice, spreading over multiple pages
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 10))
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
    .send(subDays(new Date(), 10))
    .pay(subDays(new Date(), 5))
    .build(),

  // Single item invoice with notes
  new InvoiceBuilder()
    .account(me)
    .client(Client2)
    .issueDate(subDays(new Date(), 10))
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .note('This is a note for this specific invoice')
    .send(subDays(new Date(), 10))
    .pay(subDays(new Date(), 5))
    .build(),

  // Single item invoice, in the future
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 10))
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .send(subDays(new Date(), 10))
    .pay(subDays(new Date(), 5))
    .build(),

  // Single item invoice, with a fixed discount
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 10))
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(100_00).taxRate(0.21).build())
    .discount(new DiscountBuilder().type('fixed').value(2500).reason('25OFF').build())
    .send(subDays(new Date(), 10))
    .pay(subDays(new Date(), 5))
    .build(),

  // Single item invoice, with a percentage discount
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 10))
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(100_00).taxRate(0.21).build())
    .discount(new DiscountBuilder().type('percentage').value(0.1).reason('ABC').build())
    .send(subDays(new Date(), 10))
    .pay(subDays(new Date(), 5))
    .build(),

  // Single item invoice, with a combination of discounts
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 10))
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(100_00).taxRate(0.21).build())
    .discount(new DiscountBuilder().type('percentage').value(0.1).reason('ABC').build())
    .discount(new DiscountBuilder().type('percentage').value(0.1).reason('DEF').build())
    .discount(new DiscountBuilder().type('percentage').value(0.1).reason('HIJ').build())
    .discount(new DiscountBuilder().type('fixed').value(2500).reason('25OFF').quantity(2).build())
    .send(subDays(new Date(), 10))
    .pay(subDays(new Date(), 5))
    .build(),

  // Single item invoice, with a discount for an item
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(subDays(new Date(), 10))
    .item(
      new InvoiceItemBuilder()
        .description('Item #1')
        .unitPrice(315_00)
        .taxRate(0.21)
        .quantity(3)
        .discount(new DiscountBuilder().type('fixed').value(5_00).reason('5OFF').build())
        .build(),
    )
    .send(subDays(new Date(), 10))
    .pay(subDays(new Date(), 5))
    .build(),

  // Quote
  new QuoteBuilder()
    .account(me)
    .client(Client1)
    .quoteDate(subDays(new Date(), 2))
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(123).build())
    .build(),

  // Quote that is sent
  new QuoteBuilder()
    .account(me)
    .client(Client1)
    .quoteDate(subDays(new Date(), 2))
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(123).build())
    .send(subDays(new Date(), 1))
    .build(),

  // Quote that is accepted
  new QuoteBuilder()
    .account(me)
    .client(Client1)
    .quoteDate(subDays(new Date(), 2))
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(123).build())
    .send(subDays(new Date(), 1))
    .accept(subDays(new Date(), 0))
    .build(),

  // Quote that is rejected
  new QuoteBuilder()
    .account(me)
    .client(Client1)
    .quoteDate(subDays(new Date(), 2))
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(123).build())
    .send(subDays(new Date(), 1))
    .reject(subDays(new Date(), 0))
    .build(),

  // Quote that is expired
  new QuoteBuilder()
    .account(me)
    .client(Client1)
    .quoteDate(subDays(new Date(), 30))
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(123).build())
    .send(subDays(new Date(), 31))
    .build(),

  // Quote that is closed
  new QuoteBuilder()
    .account(me)
    .client(Client1)
    .quoteDate(subDays(new Date(), 30))
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(123).build())
    .send(subDays(new Date(), 31))
    .close(subDays(new Date(), 29))
    .build(),

  // Invoice from Quote
  InvoiceBuilder.fromQuote(
    new QuoteBuilder()
      .account(me)
      .client(Client1)
      .quoteDate(subDays(new Date(), 20))
      .item(new InvoiceItemBuilder().description('Item #1').unitPrice(60_00).build())
      .send(subDays(new Date(), 19))
      .accept(subDays(new Date(), 18))
      .build(),
  )
    .issueDate(subDays(new Date(), 17))
    .send(subDays(new Date(), 17))
    .pay(subDays(new Date(), 3), 10_00)
    .pay(subDays(new Date(), 2), 20_00)
    .pay(subDays(new Date(), 1), 30_00)
    .build(),

  // Receipt from Invoice from Quote
  ReceiptBuilder.fromInvoice(
    InvoiceBuilder.fromQuote(
      new QuoteBuilder()
        .account(me)
        .client(Client1)
        .quoteDate(subDays(new Date(), 20))
        .item(new InvoiceItemBuilder().description('Item #1').unitPrice(60_00).build())
        .send(subDays(new Date(), 19))
        .accept(subDays(new Date(), 18))
        .build(),
    )
      .issueDate(subDays(new Date(), 17))
      .send(subDays(new Date(), 17))
      .pay(subDays(new Date(), 3), 10_00)
      .pay(subDays(new Date(), 2), 20_00)
      .pay(subDays(new Date(), 1), 30_00)
      .build(),
  ).build(),
]
