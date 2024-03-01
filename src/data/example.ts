import { addDays, startOfToday, subMonths } from 'date-fns'
import path from 'node:path'
import { Account, AccountBuilder } from '~/domain/account/account'
import { AddressBuilder } from '~/domain/address/address'
import { ClientBuilder } from '~/domain/client/client'
import { configure } from '~/domain/configuration/configuration'
import { ContactFieldBuilder } from '~/domain/contact-fields/contact-fields'
import { ContactBuilder } from '~/domain/contact/contact'
import { CreditNoteBuilder } from '~/domain/credit-note/credit-note'
import { Currency } from '~/domain/currency/currency'
import { DiscountBuilder } from '~/domain/discount/discount'
import { DocumentBuilder, md } from '~/domain/document/document'
import { Invoice, InvoiceBuilder } from '~/domain/invoice/invoice'
import { InvoiceItemBuilder } from '~/domain/invoice/invoice-item'
import { Language } from '~/domain/language/language'
import { MailTemplateBuilder } from '~/domain/mail-template/mail-template'
import { MilestoneBuilder } from '~/domain/milestone/milestone'
import { IncrementStrategy } from '~/domain/number-strategies'
import { PaymentMethodBuilder } from '~/domain/payment-method/payment-method'
import { Quote, QuoteBuilder } from '~/domain/quote/quote'
import { Receipt, ReceiptBuilder } from '~/domain/receipt/receipt'
import { isPaidRecord } from '~/domain/record/filters'
import type { Record } from '~/domain/record/record'
import { SupplierBuilder, type Supplier } from '~/domain/supplier/supplier'
import { TaxBuilder } from '~/domain/tax/tax'
import { parseTransactions } from '~/domain/transaction/import/import'
import { TransactionBuilder, type Transaction } from '~/domain/transaction/transaction'

configure({
  quote: {
    /**
     * The default net strategy, this will be used to calculate the quoteExpirationDate based on the
     * quoteDate.
     *
     * Typically this is 15 days after the quoteDate.
     */
    defaultNetStrategy: (quoteDate: Date) => {
      return addDays(quoteDate, 15)
    },

    /**
     * All quotes should have an quote number in ascending order. This is the strategy to
     * calculate the next quote number.
     */
    numberStrategy: new IncrementStrategy().next,

    /**
     * The configuration for PDF generation.
     */
    pdf: {
      /**
       *  The filename template for the PDF. You can use every property of the quote as a placeholder.
       *  - For example `{{number}}` will be replaced by the quote number.
       *  - You can also use nested properties, for example `{{client.name}}` will be replaced by the
       *    client name.
       *  - For dates, you can use a format string, for example `{{quoteDate:dd-MM-yyyy}}`
       */
      filename: 'quote-{{number}}.pdf',

      /**
       * When creating a backup, the PDFs will be stored in this folder.
       */
      folder: 'quotes/{{status}}/{{quoteDate:yyyy-QQ}}',
    },

    mail: {
      templates: [
        new MailTemplateBuilder<Quote>()
          .name('Default')
          .subject('Ready for some business, {{client.contacts|pick:nickname|and}}?')
          .body(md`
            Hi {{client.contacts|pick:nickname|and}},

            I hope you are doing well. I would like to do business with you. Please find attached a quote for **{{total|money}}**.

            Let me know if you have any questions.

            Kind regards,
            {{account.name}}
          `)
          .build(),
      ],
    },
  },

  invoice: {
    /**
     * The default net strategy, this will be used to calculate the dueDate based on the issueDate.
     *
     * Typically this is 30 days after the issueDate.
     */
    defaultNetStrategy: (issueDate: Date) => {
      return addDays(issueDate, 30)
    },

    /**
     * All invoices should have an invoice number in ascending order. This is the strategy to
     * calculate the next invoice number.
     */
    numberStrategy: new IncrementStrategy().next,

    /**
     * The configuration for PDF generation.
     */
    pdf: {
      /**
       *  The filename template for the PDF. You can use every property of the invoice as a placeholder.
       *  - For example `{{number}}` will be replaced by the invoice number.
       *  - You can also use nested properties, for example `{{client.name}}` will be replaced by the
       *    client name.
       *  - For dates, you can use a format string, for example `{{issueDate:dd-MM-yyyy}}`
       */
      filename: 'invoice-{{number}}.pdf',

      /**
       * When creating a backup, the PDFs will be stored in this folder.
       */
      folder: 'invoices/{{status}}/{{issueDate:yyyy-QQ}}',
    },

    mail: {
      templates: [
        new MailTemplateBuilder<Invoice>()
          .name('Default')
          .subject('Invoice — {{number}}')
          .body(md`
            Hi {{client.contacts|pick:nickname|and}},

            Attached you will find invoice **{{number}}**.

            Summary of the invoice:

            - Invoice number: **{{number}}**
            - Total amount to be paid: **{{total|money}}**
            - Issue date: **{{issueDate:PPP}}**
            - Due date: **{{dueDate:PPP}}**

            > **_Thank you for doing business together!_**

            Kind regards,
            {{account.name}}
          `)
          .build(),
      ],
    },
  },

  'credit-note': {
    /**
     * The configuration for PDF generation.
     */
    pdf: {
      /**
       *  The filename template for the PDF. You can use every property of the receipt as a placeholder.
       *  - For example `{{number}}` will be replaced by the receipt number.
       *  - You can also use nested properties, for example `{{client.name}}` will be replaced by the
       *    client name.
       *  - For dates, you can use a format string, for example `{{receiptDate:dd-MM-yyyy}}`
       */
      filename: 'credit-note-{{number}}.pdf',

      /**
       * When creating a backup, the PDFs will be stored in this folder.
       */
      folder: 'credit-notes/{{invoice.issueDate:yyyy-QQ}}',
    },

    mail: {
      templates: [
        new MailTemplateBuilder<Receipt>()
          .name('Default')
          .subject('I am devastated, {{client.contacts|pick:nickname|and}}')
          .body(md`
            Hi {{client.contacts|pick:nickname|and}},

            Attached you will find a credit note for invoice **{{invoice.number}}**.

            Hopefully we can do business together in the future.

            Kind regards,
            {{account.name}}
          `)
          .build(),
      ],
    },
  },

  receipt: {
    /**
     * The configuration for PDF generation.
     */
    pdf: {
      /**
       *  The filename template for the PDF. You can use every property of the receipt as a placeholder.
       *  - For example `{{number}}` will be replaced by the receipt number.
       *  - You can also use nested properties, for example `{{client.name}}` will be replaced by the
       *    client name.
       *  - For dates, you can use a format string, for example `{{receiptDate:dd-MM-yyyy}}`
       */
      filename: 'receipt-{{number}}.pdf',

      /**
       * When creating a backup, the PDFs will be stored in this folder.
       */
      folder: 'receipts/{{invoice.issueDate:yyyy-QQ}}',
    },

    mail: {
      templates: [
        new MailTemplateBuilder<Receipt>()
          .name('Default')
          .subject('Thanks for doing business, {{client.contacts|pick:nickname|and}}')
          .body(md`
            Hi {{client.contacts|pick:nickname|and}},

            Attached you will find a receipt for invoice **{{invoice.number}}**.

            > **_Thank you for doing business together!_**

            Kind regards,
            {{account.name}}
          `)
          .build(),
      ],
    },
  },
})

// ---

// Some small little helpers to make the examples below a bit more readable while ensuring that the
// data is spread out over time.
let state = {
  past: subMonths(startOfToday(), 12),
  future: startOfToday(),

  now: startOfToday(),
}
function inThePast(offset = 5) {
  state.past = addDays(state.past, offset)
  state.now = state.past
  return state.past
}
function today() {
  return startOfToday()
}
function sameDay() {
  return state.now
}
function nextDay() {
  state.now = addDays(state.now, 1)
  return state.now
}
function afterDays(days = 1) {
  state.now = addDays(state.now, days)
  return state.now
}
function inTheFuture(offset = 5) {
  state.future = addDays(state.future, offset)
  state.now = state.future
  return state.future
}

export let me: Account = new AccountBuilder()
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
      .name('Website')
      .value('https://acme.com')
      .build(),
  )
  .contactField(
    new ContactFieldBuilder()
      .icon({ type: 'socials', name: 'GitHub' })
      .name('GitHub')
      .value('https://github.com')
      .build(),
  )
  .tax(new TaxBuilder().value('BE 1234 567 890').build())
  .note('Gelieve te betalen binnen de 30 dagen.')
  .legal('Legal information for Acme Inc.')
  .build()

let Client1 = new ClientBuilder()
  .name('Client Inc #1')
  .nickname('Client #1')
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
  .contact(
    new ContactBuilder()
      .name('Alice Anderson')
      .nickname('Alice')
      .email('alice@example.org')
      .role('CEO')
      .build(),
  )
  .contact(
    new ContactBuilder()
      .name('Bob Bobson')
      .nickname('Bobby')
      .email('bob@example.org')
      .role('CTO')
      .build(),
  )
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

export let records: Record[] = []
export let transactions: Transaction[] = []
export let suppliers: Supplier[] = []

// Single item invoice, fully paid, via partial payments
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inThePast())
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .send(nextDay())
    .pay(nextDay(), 25_00) // Partial Payment
    .pay(nextDay(), 50_00) // Partial Payment
    .pay(nextDay(), 25_00) // Partial Payment
    .build(),
)

// Single item invoice, overdue
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inThePast(60))
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .send(nextDay())
    .build(),
)

// Single item invoice, closed
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inThePast(60))
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .send(sameDay())
    .close(afterDays(60))
    .build(),
)

// Single item invoice, with multiple quantities
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inThePast())
    .item(
      new InvoiceItemBuilder().description('Item line #1').quantity(4).unitPrice(100_00).build(),
    )
    .send(nextDay())
    .pay(nextDay())
    .build(),
)

// Single item invoice, with tax
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inThePast())
    .item(
      new InvoiceItemBuilder().description('Item line #1').taxRate(0.21).unitPrice(100_00).build(),
    )
    .send(nextDay())
    .pay(nextDay())
    .build(),
)

// Single item invoice, with multiple quantities and tax
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inThePast())
    .item(
      new InvoiceItemBuilder()
        .description('Item line #1')
        .taxRate(0.21)
        .quantity(4)
        .unitPrice(100_00)
        .build(),
    )
    .send(nextDay())
    .pay(nextDay())
    .build(),
)

// Multiple items invoice
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inThePast())
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .item(new InvoiceItemBuilder().description('Item line #2').unitPrice(100_00).build())
    .send(nextDay())
    .pay(nextDay())
    .build(),
)

// Multiple items invoice, with multiple quantities
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inThePast())
    .item(
      new InvoiceItemBuilder().description('Item line #1').quantity(2).unitPrice(100_00).build(),
    )
    .item(
      new InvoiceItemBuilder().description('Item line #2').quantity(4).unitPrice(100_00).build(),
    )
    .item(
      new InvoiceItemBuilder().description('Item line #3').quantity(7).unitPrice(100_00).build(),
    )
    .send(nextDay())
    .pay(nextDay())
    .build(),
)

// Multiple items invoice, with tax
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inThePast())
    .item(
      new InvoiceItemBuilder().description('Item line #1').taxRate(0.21).unitPrice(100_00).build(),
    )
    .item(
      new InvoiceItemBuilder().description('Item line #2').taxRate(0.21).unitPrice(100_00).build(),
    )
    .item(
      new InvoiceItemBuilder().description('Item line #2').taxRate(0.21).unitPrice(100_00).build(),
    )
    .send(nextDay())
    .pay(nextDay())
    .build(),
)

// Multiple items invoice, with multiple quantities and tax
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inThePast())
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
    .send(nextDay())
    .pay(nextDay())
    .build(),
)

// Multiple items invoice, with multiple quantities and multiple tax rates
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inThePast())
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
    .send(nextDay())
    .pay(nextDay())
    .build(),
)

// Multiple items invoice, spreading over multiple pages
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inThePast())
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
    .item(new InvoiceItemBuilder().description('Item line #15').unitPrice(100_00).build())
    .item(new InvoiceItemBuilder().description('Item line #16').unitPrice(100_00).build())
    .item(
      new InvoiceItemBuilder().description('Item line #17').unitPrice(100_00).taxRate(0.06).build(),
    )
    .item(new InvoiceItemBuilder().description('Item line #18').unitPrice(100_00).build())
    .item(new InvoiceItemBuilder().description('Item line #19').unitPrice(100_00).build())
    .item(new InvoiceItemBuilder().description('Item line #20').unitPrice(100_00).build())
    .item(
      new InvoiceItemBuilder().description('Item line #21').unitPrice(100_00).quantity(4).build(),
    )
    .item(new InvoiceItemBuilder().description('Item line #22').unitPrice(100_00).build())
    .item(
      new InvoiceItemBuilder().description('Item line #23').unitPrice(100_00).taxRate(0.12).build(),
    )
    .item(new InvoiceItemBuilder().description('Item line #24').unitPrice(100_00).build())
    .send(nextDay())
    .pay(nextDay())
    .build(),
)

// Single item invoice with notes
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client2)
    .issueDate(inThePast())
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .note('This is a note for this specific invoice')
    .send(nextDay())
    .pay(nextDay())
    .build(),
)

// Single item invoice, in the future
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inThePast())
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .send(nextDay())
    .pay(nextDay())
    .build(),
)

// Single item invoice, with a fixed discount
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inThePast())
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(100_00).taxRate(0.21).build())
    .discount(new DiscountBuilder().type('fixed').value(2500).reason('25OFF').build())
    .send(nextDay())
    .pay(nextDay())
    .build(),
)

// Single item invoice, with a percentage discount
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inThePast())
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(100_00).taxRate(0.21).build())
    .discount(new DiscountBuilder().type('percentage').value(0.1).reason('ABC').build())
    .send(nextDay())
    .pay(nextDay())
    .build(),
)

// Single item invoice, with a combination of discounts
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inThePast())
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(100_00).taxRate(0.21).build())
    .discount(new DiscountBuilder().type('percentage').value(0.1).reason('ABC').build())
    .discount(new DiscountBuilder().type('percentage').value(0.1).reason('DEF').build())
    .discount(new DiscountBuilder().type('percentage').value(0.1).reason('HIJ').build())
    .discount(new DiscountBuilder().type('fixed').value(2500).reason('25OFF').quantity(2).build())
    .send(nextDay())
    .pay(nextDay())
    .build(),
)

// Single item invoice, with a discount for an item
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inThePast())
    .item(
      new InvoiceItemBuilder()
        .description('Item #1')
        .unitPrice(315_00)
        .taxRate(0.21)
        .quantity(3)
        .discount(new DiscountBuilder().type('fixed').value(5_00).reason('5OFF').build())
        .build(),
    )
    .send(nextDay())
    .pay(nextDay())
    .build(),
)

// Quote
records.push(
  new QuoteBuilder()
    .account(me)
    .client(Client1)
    .quoteDate(inThePast(2))
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(123).build())
    .build(),
)

// Quote that is sent
records.push(
  new QuoteBuilder()
    .account(me)
    .client(Client1)
    .quoteDate(inThePast(2))
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(123).build())
    .send(nextDay())
    .build(),
)

// Quote that is accepted
records.push(
  new QuoteBuilder()
    .account(me)
    .client(Client1)
    .quoteDate(inThePast(2))
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(123).build())
    .send(nextDay())
    .accept(nextDay())
    .build(),
)

// Quote that is accepted, but then cancelled
records.push(
  new QuoteBuilder()
    .account(me)
    .client(Client1)
    .quoteDate(inThePast(2))
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(123).build())
    .send(nextDay())
    .accept(nextDay())
    .cancel(nextDay(), {
      by: 'client',
      reason: 'The weather is really bad today.',
    })
    .build(),
)

// Quote that is rejected
records.push(
  new QuoteBuilder()
    .account(me)
    .client(Client1)
    .quoteDate(inThePast(2))
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(123).build())
    .send(nextDay())
    .reject(nextDay())
    .build(),
)

// Quote that is expired
records.push(
  new QuoteBuilder()
    .account(me)
    .client(Client1)
    .quoteDate(inThePast(32))
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(123).build())
    .send(nextDay())
    .build(),
)

// Quote that is closed
records.push(
  new QuoteBuilder()
    .account(me)
    .client(Client1)
    .quoteDate(inThePast(30))
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(123).build())
    .send(nextDay())
    .close(nextDay())
    .build(),
)

// Quote with an attachment
records.push(
  new QuoteBuilder()
    .account(me)
    .client(Client1)
    .quoteDate(today())
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(123).build())
    .attachment(
      new DocumentBuilder()
        .type('markdown')
        .name('Example document')
        .value(md`
          ## Markdown documents

          ### Text

          ||Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin vel mi cursus, convallis lorem efficitur, commodo nibh. Morbi venenatis velit at bibendum pulvinar. Vivamus sollicitudin lacus in dui varius, id efficitur quam congue. Mauris non mauris molestie, ullamcorper dolor ut, fringilla nunc. Vivamus vulputate laoreet quam, blandit tincidunt mi condimentum vitae. Aenean interdum dolor vel tincidunt blandit. Maecenas facilisis imperdiet porta.||

          You can also use **bold** in your text, or _italic_ or even ~~strikethrough~~. Some people prefer some \`code\` highlights. Sometimes, you just require a good old [link](https://example.com).

          ### Code

          ~~~javascript
          const foo = 'bar'
          console.log(foo)
          ~~~

          ### Lists

          #### Ordered lists

          1. List items
          1. ||Can be used||
          1. They can also be used
             1. With nested numbers
             1. And more nesting

          #### Unordered lists

          - Or you can use
          - Bullet points
          - Instead
            - With nesting
            - And more nesting

          ### Tables

          | Column 1 | Column 2 | Column 3 |
          | -------- | -------- | -------- |
          | Row 1    | Row 1    | Row 1    |
          | Row 2    | Row 2    | Row 2    |
          | Row 3    | Row 3    | Row 3    |
          | Row 4    | Row 4    | Row 4    |

          ### Images

          ![Image of GitHub](https://github.com/github.png)
        `)
        .build(),
    )
    .attachment(
      new DocumentBuilder()
        .name('HTML Versie')
        .type('html')
        .value(
          String.raw`
            <h1>Title</h1>
            <ul>
              <li class="text-red-500">Foo</li>
              <li class="text-blue-500">Bar</li>
            </ul>
          `,
        )
        .build(),
    )
    .build(),
)

// Quote from another quote
records.push(
  QuoteBuilder.fromQuote(
    new QuoteBuilder()
      .account(me)
      .client(Client1)
      .quoteDate(inThePast(2))
      .item(new InvoiceItemBuilder().description('Item #1').unitPrice(123).build())
      .send(nextDay())
      .reject(nextDay())
      .build(),
  )
    .quoteDate(nextDay())
    .send(nextDay())
    .accept(nextDay())
    .build(),
)

// Invoice from Quote
records.push(
  InvoiceBuilder.fromQuote(
    new QuoteBuilder()
      .account(me)
      .client(Client1)
      .quoteDate(inThePast(20))
      .item(new InvoiceItemBuilder().description('Item #1').unitPrice(60_00).build())
      .send(nextDay())
      .accept(nextDay())
      .build(),
  )
    .issueDate(nextDay())
    .send(nextDay())
    .pay(nextDay(), 10_00)
    .pay(nextDay(), 20_00)
    .pay(nextDay(), 30_00)
    .build(),
)

// Invoice from quote with attachment(s)
records.push(
  InvoiceBuilder.fromQuote(
    new QuoteBuilder()
      .account(me)
      .client(Client1)
      .quoteDate(today())
      .item(new InvoiceItemBuilder().description('Item #1').unitPrice(123).build())
      .attachment(
        new DocumentBuilder()
          .name('Example document')
          .type('markdown')
          .value(md`
            ## Attachment

            1. Foo
            1. Bar
            1. Baz
          `)

          .build(),
      )
      .send(nextDay())
      .accept(nextDay())
      .build(),
  )
    .issueDate(nextDay())
    .send(nextDay())
    .pay(nextDay())
    .build(),
)

// Invoice from quote without inheritting the attachment(s)
records.push(
  InvoiceBuilder.fromQuote(
    new QuoteBuilder()
      .account(me)
      .client(Client1)
      .quoteDate(today())
      .item(new InvoiceItemBuilder().description('Item #1').unitPrice(123).build())
      .attachment(
        new DocumentBuilder()
          .name('Example document')
          .type('markdown')
          .value(md`
            ## Attachment

            1. Foo
            1. Bar
            1. Baz
          `)

          .build(),
      )
      .send(nextDay())
      .accept(nextDay())
      .build(),
    { withAttachments: false },
  )
    .issueDate(nextDay())
    .send(nextDay())
    .pay(nextDay())
    .build(),
)

// Receipt from Invoice from Quote
records.push(
  ReceiptBuilder.fromInvoice(
    InvoiceBuilder.fromQuote(
      new QuoteBuilder()
        .account(me)
        .client(Client1)
        .quoteDate(inThePast(20))
        .item(new InvoiceItemBuilder().description('Item #1').unitPrice(60_00).build())
        .send(nextDay())
        .accept(nextDay())
        .build(),
    )
      .issueDate(inThePast(17))
      .send(nextDay())
      .pay(nextDay(), 10_00)
      .pay(nextDay(), 20_00)
      .pay(nextDay(), 30_00)
      .build(),
  ).build(),
)

// Credit note from Invoice
records.push(
  CreditNoteBuilder.fromInvoice(
    new InvoiceBuilder()
      .account(me)
      .client(Client1)
      .issueDate(inThePast(20))
      .item(new InvoiceItemBuilder().description('Item #1').unitPrice(60_00).build())
      .send(nextDay())
      .build(),
  )
    .creditNoteDate(nextDay())
    .build(),
)

// Cancelled invoice, with a credit note
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inThePast(-20))
    .item(new InvoiceItemBuilder().description('Item #1').unitPrice(60_00).build())
    .send(nextDay())
    .cancel(nextDay(), {
      by: 'client',
      reason: 'Decided to buy a different product.',
    })
    .build(),
)

// Single item invoice, paid
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inThePast())
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .send(nextDay())
    .pay(nextDay())
    .build(),
)

// Single item invoice, sent
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(today())
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .send(sameDay())
    .build(),
)

// Single item invoice, partially paid
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(today())
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .send(nextDay())
    .pay(nextDay(), 25_00) // Partial Payment
    .pay(nextDay(), 50_00) // Partial Payment
    .build(),
)

// Single item invoice, drafted (issue date today!)
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(today())
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .build(),
)

// Single item invoice, drafted (issue date in the future)
records.push(
  new InvoiceBuilder()
    .account(me)
    .client(Client1)
    .issueDate(inTheFuture())
    .item(new InvoiceItemBuilder().description('Item line #1').unitPrice(100_00).build())
    .build(),
)

// Credit note from overdue Invoice
records.push(
  CreditNoteBuilder.fromInvoice(
    new InvoiceBuilder()
      .account(me)
      .client(Client1)
      .issueDate(inThePast(-80))
      .item(new InvoiceItemBuilder().description('Item #1').unitPrice(80_00).build())
      .send(nextDay())
      .build(),
  )
    .creditNoteDate(today())
    .build(),
)

// Create some custom milestones
new MilestoneBuilder()
  .account(me)
  .title('Custom **milestones**, are `here`!')
  .description('Thank ~~me~~, **_you_**!')
  .achievedAt(inTheFuture())
  .build()

// Track transactions and suppliers
function findOrCreateSupplier(name: string) {
  let supplier = suppliers.find((s) => {
    return s.name === name
  })

  if (!supplier) {
    supplier = new SupplierBuilder().account(me).name(name).build()
    suppliers.push(supplier)
  }

  return supplier
}

// Create an example supplier
suppliers.push(
  new SupplierBuilder()
    .account(me)
    .name('amazon.com')
    .nickname('Amazon')
    .website('https://amazon.com')
    .email('contact@amazon.com')
    .phone('+1 234 567 890')
    .address(
      new AddressBuilder().street1('38 avenue John F. Kennedy').country('Luxembourg').build(),
    )
    .imageUrl('https://www.google.com/s2/favicons?domain=amazon.com&sz=48')
    .build(),
)

// A new supplier
transactions.push(
  new TransactionBuilder()
    .account(me)
    .supplier(findOrCreateSupplier('My Bank'))
    .category('Investments')
    .summary('Bank')
    .date(today())
    .amount(-1000000)
    .build(),
)

// 2 transactions for the same supplier
transactions.push(
  new TransactionBuilder()
    .account(me)
    .supplier(findOrCreateSupplier('amazon.com'))
    .category('Office supplies')
    .summary('Keyboard')
    .date(today())
    .amount(-14999)
    .build(),
)

transactions.push(
  new TransactionBuilder()
    .account(me)
    .supplier(findOrCreateSupplier('amazon.com'))
    .category('Office supplies')
    .summary('Mouse')
    .date(today())
    .amount(-9999)
    .build(),
)

// Transaction where the supplier is a client
{
  let firstPaidRecord = records.find(isPaidRecord)!
  transactions.push(
    TransactionBuilder.forRecord(firstPaidRecord).date(today()).category('Income').build(),
  )
}

// Transactions imported from a CSV file
let parsedTransactions = parseTransactions(
  path.resolve(process.cwd(), 'src/data/transactions/example.csv'),
  (builder, record) => {
    builder.account(me).supplier(findOrCreateSupplier(record.supplier))
  },
)
for (let transaction of parsedTransactions) {
  transactions.push(transaction)
}
