import { describe, expect, test } from 'vitest'
import { AccountBuilder } from '~/domain/account/account'
import { AddressBuilder } from '~/domain/address/address'
import { ClientBuilder } from '~/domain/client/client'
import { DiscountBuilder } from '~/domain/discount/discount'
import { InvoiceBuilder } from '~/domain/invoice/invoice'
import { InvoiceItemBuilder } from '~/domain/invoice/invoice-item'
import { summary } from '~/domain/invoice/summary'

let account = new AccountBuilder().name('Account').billing(new AddressBuilder().build()).build()
let client = new ClientBuilder().name('Client').billing(new AddressBuilder().build()).build()

describe('basic', () => {
  test('single item', () => {
    let invoice = new InvoiceBuilder()
      .account(account)
      .client(client)
      .issueDate(new Date())
      .item(new InvoiceItemBuilder().description('Item #1').unitPrice(1000).build())
      .build()

    expect(summary(invoice)).toEqual([{ type: 'total', value: 1000 }])
  })

  test('single item, multiple quantity', () => {
    let invoice = new InvoiceBuilder()
      .account(account)
      .client(client)
      .issueDate(new Date())
      .item(new InvoiceItemBuilder().description('Item #1').quantity(3).unitPrice(1000).build())
      .build()

    expect(summary(invoice)).toEqual([{ type: 'total', value: 3000 }])
  })

  test('multiple items', () => {
    let invoice = new InvoiceBuilder()
      .account(account)
      .client(client)
      .issueDate(new Date())
      .item(new InvoiceItemBuilder().description('Item #1').unitPrice(1000).build())
      .item(new InvoiceItemBuilder().description('Item #2').unitPrice(1000).build())
      .build()

    expect(summary(invoice)).toEqual([{ type: 'total', value: 2000 }])
  })

  test('multiple items, multiple quantities', () => {
    let invoice = new InvoiceBuilder()
      .account(account)
      .client(client)
      .issueDate(new Date())
      .item(new InvoiceItemBuilder().description('Item #1').quantity(3).unitPrice(1000).build())
      .item(new InvoiceItemBuilder().description('Item #2').quantity(3).unitPrice(1000).build())
      .build()

    expect(summary(invoice)).toEqual([{ type: 'total', value: 6000 }])
  })
})

describe('with tax', () => {
  test('single item', () => {
    let invoice = new InvoiceBuilder()
      .account(account)
      .client(client)
      .issueDate(new Date())
      .item(new InvoiceItemBuilder().description('Item #1').taxRate(0.21).unitPrice(1000).build())
      .build()

    expect(summary(invoice)).toEqual([
      { type: 'subtotal', value: 1000 },
      { type: 'vat', rate: 0.21, value: 210 },
      { type: 'total', value: 1210 },
    ])
  })

  test('single item, multiple quantity', () => {
    let invoice = new InvoiceBuilder()
      .account(account)
      .client(client)
      .issueDate(new Date())
      .item(
        new InvoiceItemBuilder()
          .description('Item #1')
          .quantity(3)
          .taxRate(0.21)
          .unitPrice(1000)
          .build(),
      )
      .build()

    expect(summary(invoice)).toEqual([
      { type: 'subtotal', value: 3000 },
      { type: 'vat', rate: 0.21, value: 630 },
      { type: 'total', value: 3630 },
    ])
  })

  test('multiple items', () => {
    let invoice = new InvoiceBuilder()
      .account(account)
      .client(client)
      .issueDate(new Date())
      .item(new InvoiceItemBuilder().description('Item #1').taxRate(0.21).unitPrice(1000).build())
      .item(new InvoiceItemBuilder().description('Item #2').taxRate(0.21).unitPrice(1000).build())
      .build()

    expect(summary(invoice)).toEqual([
      { type: 'subtotal', value: 2000 },
      { type: 'vat', rate: 0.21, value: 420 },
      { type: 'total', value: 2420 },
    ])
  })

  test('multiple items, multiple quantities', () => {
    let invoice = new InvoiceBuilder()
      .account(account)
      .client(client)
      .issueDate(new Date())
      .item(
        new InvoiceItemBuilder()
          .description('Item #1')
          .taxRate(0.21)
          .quantity(3)
          .unitPrice(1000)
          .build(),
      )
      .item(
        new InvoiceItemBuilder()
          .description('Item #2')
          .taxRate(0.21)
          .quantity(3)
          .unitPrice(1000)
          .build(),
      )
      .build()

    expect(summary(invoice)).toEqual([
      { type: 'subtotal', value: 6000 },
      { type: 'vat', rate: 0.21, value: 1260 },
      { type: 'total', value: 7260 },
    ])
  })
})

describe('discounts', () => {
  describe('fixed', () => {
    test('single item', () => {
      let invoice = new InvoiceBuilder()
        .account(account)
        .client(client)
        .issueDate(new Date())
        .item(new InvoiceItemBuilder().description('Item #1').unitPrice(1000).build())
        .discount(new DiscountBuilder().type('fixed').value(100).quantity(1).build())
        .build()

      expect(summary(invoice)).toEqual([
        { type: 'subtotal', value: 1000 },
        {
          type: 'discount',
          discount: {
            type: 'fixed',
            reason: null,
            value: 100,
            quantity: 1,
            quantityType: 'explicit',
          },
        },
        { type: 'total', value: 900 },
      ])
    })

    test('single item, multiple quantity', () => {
      let invoice = new InvoiceBuilder()
        .account(account)
        .client(client)
        .issueDate(new Date())
        .item(new InvoiceItemBuilder().description('Item #1').quantity(3).unitPrice(1000).build())
        .discount(new DiscountBuilder().type('fixed').value(100).quantity(1).build())
        .build()

      expect(summary(invoice)).toEqual([
        { type: 'subtotal', value: 3000 },
        {
          type: 'discount',
          discount: {
            type: 'fixed',
            reason: null,
            value: 100,
            quantity: 1,
            quantityType: 'explicit',
          },
        },
        { type: 'total', value: 2900 },
      ])
    })

    test('multiple items', () => {
      let invoice = new InvoiceBuilder()
        .account(account)
        .client(client)
        .issueDate(new Date())
        .item(new InvoiceItemBuilder().description('Item #1').unitPrice(1000).build())
        .item(new InvoiceItemBuilder().description('Item #2').unitPrice(1000).build())
        .discount(new DiscountBuilder().type('fixed').value(100).quantity(1).build())
        .build()

      expect(summary(invoice)).toEqual([
        { type: 'subtotal', value: 2000 },
        {
          type: 'discount',
          discount: {
            type: 'fixed',
            reason: null,
            value: 100,
            quantity: 1,
            quantityType: 'explicit',
          },
        },
        { type: 'total', value: 1900 },
      ])
    })

    test('multiple items, multiple quantities', () => {
      let invoice = new InvoiceBuilder()
        .account(account)
        .client(client)
        .issueDate(new Date())
        .item(new InvoiceItemBuilder().description('Item #1').quantity(3).unitPrice(1000).build())
        .item(new InvoiceItemBuilder().description('Item #2').quantity(3).unitPrice(1000).build())
        .discount(new DiscountBuilder().type('fixed').value(100).quantity(1).build())
        .build()

      expect(summary(invoice)).toEqual([
        { type: 'subtotal', value: 6000 },
        {
          type: 'discount',
          discount: {
            type: 'fixed',
            value: 100,
            reason: null,
            quantity: 1,
            quantityType: 'explicit',
          },
        },
        { type: 'total', value: 5900 },
      ])
    })

    describe('with tax', () => {
      test('single item', () => {
        let invoice = new InvoiceBuilder()
          .account(account)
          .client(client)
          .issueDate(new Date())
          .item(
            new InvoiceItemBuilder().description('Item #1').taxRate(0.21).unitPrice(1000).build(),
          )
          .discount(new DiscountBuilder().type('fixed').value(100).quantity(1).build())
          .build()

        expect(summary(invoice)).toEqual([
          { type: 'subtotal', value: 1000 },
          {
            type: 'discount',
            discount: {
              type: 'fixed',
              reason: null,
              value: 100,
              quantity: 1,
              quantityType: 'explicit',
            },
          },
          { type: 'subtotal', value: 900 },
          { type: 'vat', rate: 0.21, value: 189 },
          { type: 'total', value: 1089 },
        ])
      })

      test('single item, multiple quantity', () => {
        let invoice = new InvoiceBuilder()
          .account(account)
          .client(client)
          .issueDate(new Date())
          .item(
            new InvoiceItemBuilder()
              .description('Item #1')
              .quantity(3)
              .taxRate(0.21)
              .unitPrice(1000)
              .build(),
          )
          .discount(new DiscountBuilder().type('fixed').value(100).quantity(1).build())
          .build()

        expect(summary(invoice)).toEqual([
          { type: 'subtotal', value: 3000 },
          {
            type: 'discount',
            discount: {
              type: 'fixed',
              reason: null,
              value: 100,
              quantity: 1,
              quantityType: 'explicit',
            },
          },
          { type: 'subtotal', value: 2900 },
          { type: 'vat', rate: 0.21, value: 609 },
          { type: 'total', value: 3509 },
        ])
      })

      test('multiple items', () => {
        let invoice = new InvoiceBuilder()
          .account(account)
          .client(client)
          .issueDate(new Date())
          .item(
            new InvoiceItemBuilder().description('Item #1').taxRate(0.21).unitPrice(1000).build(),
          )
          .item(
            new InvoiceItemBuilder().description('Item #2').taxRate(0.21).unitPrice(1000).build(),
          )
          .discount(new DiscountBuilder().type('fixed').value(100).quantity(1).build())
          .build()

        expect(summary(invoice)).toEqual([
          { type: 'subtotal', value: 2000 },
          {
            type: 'discount',
            discount: {
              type: 'fixed',
              reason: null,
              value: 100,
              quantity: 1,
              quantityType: 'explicit',
            },
          },
          { type: 'subtotal', value: 1900 },
          { type: 'vat', rate: 0.21, value: 399 },
          { type: 'total', value: 2299 },
        ])
      })

      test('multiple items, multiple quantities', () => {
        let invoice = new InvoiceBuilder()
          .account(account)
          .client(client)
          .issueDate(new Date())
          .item(
            new InvoiceItemBuilder()
              .description('Item #1')
              .taxRate(0.21)
              .quantity(3)
              .unitPrice(1000)
              .build(),
          )
          .item(
            new InvoiceItemBuilder()
              .description('Item #2')
              .taxRate(0.21)
              .quantity(3)
              .unitPrice(1000)
              .build(),
          )
          .discount(new DiscountBuilder().type('fixed').value(100).quantity(1).build())
          .build()

        expect(summary(invoice)).toEqual([
          { type: 'subtotal', value: 6000 },
          {
            type: 'discount',
            discount: {
              type: 'fixed',
              reason: null,
              value: 100,
              quantity: 1,
              quantityType: 'explicit',
            },
          },
          { type: 'subtotal', value: 5900 },
          { type: 'vat', rate: 0.21, value: 1239 },
          { type: 'total', value: 7139 },
        ])
      })
    })
  })

  describe('percentage', () => {
    test('single item', () => {
      let invoice = new InvoiceBuilder()
        .account(account)
        .client(client)
        .issueDate(new Date())
        .item(new InvoiceItemBuilder().description('Item #1').unitPrice(1000).build())
        .discount(new DiscountBuilder().type('percentage').value(0.3).build())
        .build()

      expect(summary(invoice)).toEqual([
        { type: 'subtotal', value: 1000 },
        { type: 'discount', discount: { type: 'percentage', reason: null, value: 0.3 } },
        { type: 'subtotal', subtype: 'discounts', value: 300 },
        { type: 'total', value: 700 },
      ])
    })

    test('single item, multiple quantity', () => {
      let invoice = new InvoiceBuilder()
        .account(account)
        .client(client)
        .issueDate(new Date())
        .item(new InvoiceItemBuilder().description('Item #1').quantity(3).unitPrice(1000).build())
        .discount(new DiscountBuilder().type('percentage').value(0.3).build())
        .build()

      expect(summary(invoice)).toEqual([
        { type: 'subtotal', value: 3000 },
        { type: 'discount', discount: { type: 'percentage', reason: null, value: 0.3 } },
        { type: 'subtotal', subtype: 'discounts', value: 900 },
        { type: 'total', value: 2100 },
      ])
    })

    test('multiple items', () => {
      let invoice = new InvoiceBuilder()
        .account(account)
        .client(client)
        .issueDate(new Date())
        .item(new InvoiceItemBuilder().description('Item #1').unitPrice(1000).build())
        .item(new InvoiceItemBuilder().description('Item #2').unitPrice(1000).build())
        .discount(new DiscountBuilder().type('percentage').value(0.3).build())
        .build()

      expect(summary(invoice)).toEqual([
        { type: 'subtotal', value: 2000 },
        { type: 'discount', discount: { type: 'percentage', reason: null, value: 0.3 } },
        { type: 'subtotal', subtype: 'discounts', value: 600 },
        { type: 'total', value: 1400 },
      ])
    })

    test('multiple items, multiple quantities', () => {
      let invoice = new InvoiceBuilder()
        .account(account)
        .client(client)
        .issueDate(new Date())
        .item(new InvoiceItemBuilder().description('Item #1').quantity(3).unitPrice(1000).build())
        .item(new InvoiceItemBuilder().description('Item #2').quantity(3).unitPrice(1000).build())
        .discount(new DiscountBuilder().type('percentage').value(0.3).build())
        .build()

      expect(summary(invoice)).toEqual([
        { type: 'subtotal', value: 6000 },
        { type: 'discount', discount: { type: 'percentage', reason: null, value: 0.3 } },
        { type: 'subtotal', subtype: 'discounts', value: 1800 },
        { type: 'total', value: 4200 },
      ])
    })

    describe('with tax', () => {
      test('single item', () => {
        let invoice = new InvoiceBuilder()
          .account(account)
          .client(client)
          .issueDate(new Date())
          .item(
            new InvoiceItemBuilder().description('Item #1').taxRate(0.21).unitPrice(1000).build(),
          )
          .discount(new DiscountBuilder().type('percentage').value(0.3).build())
          .build()

        expect(summary(invoice)).toEqual([
          { type: 'subtotal', value: 1000 },
          { type: 'discount', discount: { reason: null, type: 'percentage', value: 0.3 } },
          { type: 'subtotal', subtype: 'discounts', value: 300 },
          { type: 'subtotal', value: 700 },
          { type: 'vat', rate: 0.21, value: 147 },
          { type: 'total', value: 847 },
        ])
      })

      test('single item, multiple quantity', () => {
        let invoice = new InvoiceBuilder()
          .account(account)
          .client(client)
          .issueDate(new Date())
          .item(
            new InvoiceItemBuilder()
              .description('Item #1')
              .quantity(3)
              .taxRate(0.21)
              .unitPrice(1000)
              .build(),
          )
          .discount(new DiscountBuilder().type('percentage').value(0.3).build())
          .build()

        expect(summary(invoice)).toEqual([
          { type: 'subtotal', value: 3000 },
          { type: 'discount', discount: { reason: null, type: 'percentage', value: 0.3 } },
          { type: 'subtotal', subtype: 'discounts', value: 900 },
          { type: 'subtotal', value: 2100 },
          { type: 'vat', rate: 0.21, value: 441 },
          { type: 'total', value: 2541 },
        ])
      })

      test('multiple items', () => {
        let invoice = new InvoiceBuilder()
          .account(account)
          .client(client)
          .issueDate(new Date())
          .item(
            new InvoiceItemBuilder().description('Item #1').taxRate(0.21).unitPrice(1000).build(),
          )
          .item(
            new InvoiceItemBuilder().description('Item #2').taxRate(0.21).unitPrice(1000).build(),
          )
          .discount(new DiscountBuilder().type('percentage').value(0.3).build())
          .build()

        expect(summary(invoice)).toEqual([
          { type: 'subtotal', value: 2000 },
          { type: 'discount', discount: { reason: null, type: 'percentage', value: 0.3 } },
          { type: 'subtotal', subtype: 'discounts', value: 600 },
          { type: 'subtotal', value: 1400 },
          { type: 'vat', rate: 0.21, value: 294 },
          { type: 'total', value: 1694 },
        ])
      })

      test('multiple items, multiple quantities', () => {
        let invoice = new InvoiceBuilder()
          .account(account)
          .client(client)
          .issueDate(new Date())
          .item(
            new InvoiceItemBuilder()
              .description('Item #1')
              .taxRate(0.21)
              .quantity(3)
              .unitPrice(1000)
              .build(),
          )
          .item(
            new InvoiceItemBuilder()
              .description('Item #2')
              .taxRate(0.21)
              .quantity(3)
              .unitPrice(1000)
              .build(),
          )
          .discount(new DiscountBuilder().type('percentage').value(0.3).build())
          .build()

        expect(summary(invoice)).toEqual([
          { type: 'subtotal', value: 6000 },
          { type: 'discount', discount: { reason: null, type: 'percentage', value: 0.3 } },
          { type: 'subtotal', subtype: 'discounts', value: 1800 },
          { type: 'subtotal', value: 4200 },
          { type: 'vat', rate: 0.21, value: 882 },
          { type: 'total', value: 5082 },
        ])
      })
    })
  })

  describe('stacked percentages', () => {
    test('single item', () => {
      let invoice = new InvoiceBuilder()
        .account(account)
        .client(client)
        .issueDate(new Date())
        .item(new InvoiceItemBuilder().description('Item #1').unitPrice(1000).build())
        .discount(new DiscountBuilder().type('percentage').value(0.1).build())
        .discount(new DiscountBuilder().type('percentage').value(0.1).build())
        .build()

      expect(summary(invoice)).toEqual([
        { type: 'subtotal', value: 1000 },
        { type: 'discount', discount: { reason: null, type: 'percentage', value: 0.1 } },
        { type: 'discount', discount: { reason: null, type: 'percentage', value: 0.1 } },
        { type: 'subtotal', subtype: 'discounts', value: 190 },
        { type: 'total', value: 810 },
      ])
    })

    test('single item, multiple quantity', () => {
      let invoice = new InvoiceBuilder()
        .account(account)
        .client(client)
        .issueDate(new Date())
        .item(new InvoiceItemBuilder().description('Item #1').quantity(3).unitPrice(1000).build())
        .discount(new DiscountBuilder().type('percentage').value(0.1).build())
        .discount(new DiscountBuilder().type('percentage').value(0.1).build())
        .build()

      expect(summary(invoice)).toEqual([
        { type: 'subtotal', value: 3000 },
        { type: 'discount', discount: { type: 'percentage', value: 0.1, reason: null } },
        { type: 'discount', discount: { type: 'percentage', value: 0.1, reason: null } },
        { type: 'subtotal', subtype: 'discounts', value: 570 },
        { type: 'total', value: 2430 },
      ])
    })

    test('multiple items', () => {
      let invoice = new InvoiceBuilder()
        .account(account)
        .client(client)
        .issueDate(new Date())
        .item(new InvoiceItemBuilder().description('Item #1').unitPrice(1000).build())
        .item(new InvoiceItemBuilder().description('Item #2').unitPrice(1000).build())
        .discount(new DiscountBuilder().type('percentage').value(0.1).build())
        .discount(new DiscountBuilder().type('percentage').value(0.1).build())
        .build()

      expect(summary(invoice)).toEqual([
        { type: 'subtotal', value: 2000 },
        { type: 'discount', discount: { reason: null, type: 'percentage', value: 0.1 } },
        { type: 'discount', discount: { reason: null, type: 'percentage', value: 0.1 } },
        { type: 'subtotal', subtype: 'discounts', value: 380 },
        { type: 'total', value: 1620 },
      ])
    })

    test('multiple items, multiple quantities', () => {
      let invoice = new InvoiceBuilder()
        .account(account)
        .client(client)
        .issueDate(new Date())
        .item(new InvoiceItemBuilder().description('Item #1').quantity(3).unitPrice(1000).build())
        .item(new InvoiceItemBuilder().description('Item #2').quantity(3).unitPrice(1000).build())
        .discount(new DiscountBuilder().type('percentage').value(0.1).build())
        .discount(new DiscountBuilder().type('percentage').value(0.1).build())
        .build()

      expect(summary(invoice)).toEqual([
        { type: 'subtotal', value: 6000 },
        { type: 'discount', discount: { reason: null, type: 'percentage', value: 0.1 } },
        { type: 'discount', discount: { reason: null, type: 'percentage', value: 0.1 } },
        { type: 'subtotal', subtype: 'discounts', value: 1140 },
        { type: 'total', value: 4860 },
      ])
    })

    describe('with tax', () => {
      test('single item', () => {
        let invoice = new InvoiceBuilder()
          .account(account)
          .client(client)
          .issueDate(new Date())
          .item(
            new InvoiceItemBuilder().description('Item #1').taxRate(0.21).unitPrice(1000).build(),
          )
          .discount(new DiscountBuilder().type('percentage').value(0.1).build())
          .discount(new DiscountBuilder().type('percentage').value(0.1).build())
          .build()

        expect(summary(invoice)).toEqual([
          { type: 'subtotal', value: 1000 },
          { type: 'discount', discount: { reason: null, type: 'percentage', value: 0.1 } },
          { type: 'discount', discount: { reason: null, type: 'percentage', value: 0.1 } },
          { type: 'subtotal', subtype: 'discounts', value: 190 },
          { type: 'subtotal', value: 810 },
          { type: 'vat', rate: 0.21, value: 170.1 },
          { type: 'total', value: 980.1 },
        ])
      })

      test('single item, multiple quantity', () => {
        let invoice = new InvoiceBuilder()
          .account(account)
          .client(client)
          .issueDate(new Date())
          .item(
            new InvoiceItemBuilder()
              .description('Item #1')
              .quantity(3)
              .taxRate(0.21)
              .unitPrice(1000)
              .build(),
          )
          .discount(new DiscountBuilder().type('percentage').value(0.1).build())
          .discount(new DiscountBuilder().type('percentage').value(0.1).build())
          .build()

        expect(summary(invoice)).toEqual([
          { type: 'subtotal', value: 3000 },
          { type: 'discount', discount: { reason: null, type: 'percentage', value: 0.1 } },
          { type: 'discount', discount: { reason: null, type: 'percentage', value: 0.1 } },
          { type: 'subtotal', subtype: 'discounts', value: 570 },
          { type: 'subtotal', value: 2430 },
          { type: 'vat', rate: 0.21, value: 510.29999999999995 },
          { type: 'total', value: 2940.3 },
        ])
      })

      test('multiple items', () => {
        let invoice = new InvoiceBuilder()
          .account(account)
          .client(client)
          .issueDate(new Date())
          .item(
            new InvoiceItemBuilder().description('Item #1').taxRate(0.21).unitPrice(1000).build(),
          )
          .item(
            new InvoiceItemBuilder().description('Item #2').taxRate(0.21).unitPrice(1000).build(),
          )
          .discount(new DiscountBuilder().type('percentage').value(0.1).build())
          .discount(new DiscountBuilder().type('percentage').value(0.1).build())
          .build()

        expect(summary(invoice)).toEqual([
          { type: 'subtotal', value: 2000 },
          { type: 'discount', discount: { reason: null, type: 'percentage', value: 0.1 } },
          { type: 'discount', discount: { reason: null, type: 'percentage', value: 0.1 } },
          { type: 'subtotal', subtype: 'discounts', value: 380 },
          { type: 'subtotal', value: 1620 },
          { type: 'vat', rate: 0.21, value: 340.2 },
          { type: 'total', value: 1960.2 },
        ])
      })

      test('multiple items, multiple quantities', () => {
        let invoice = new InvoiceBuilder()
          .account(account)
          .client(client)
          .issueDate(new Date())
          .item(
            new InvoiceItemBuilder()
              .description('Item #1')
              .taxRate(0.21)
              .quantity(3)
              .unitPrice(1000)
              .build(),
          )
          .item(
            new InvoiceItemBuilder()
              .description('Item #2')
              .taxRate(0.21)
              .quantity(3)
              .unitPrice(1000)
              .build(),
          )
          .discount(new DiscountBuilder().type('percentage').value(0.1).build())
          .discount(new DiscountBuilder().type('percentage').value(0.1).build())
          .build()

        expect(summary(invoice)).toEqual([
          { type: 'subtotal', value: 6000 },
          { type: 'discount', discount: { reason: null, type: 'percentage', value: 0.1 } },
          { type: 'discount', discount: { reason: null, type: 'percentage', value: 0.1 } },
          { type: 'subtotal', subtype: 'discounts', value: 1140 },
          { type: 'subtotal', value: 4860 },
          { type: 'vat', rate: 0.21, value: 1020.5999999999999 },
          { type: 'total', value: 5880.6 },
        ])
      })
    })
  })
})

describe('discount on item', () => {
  describe('fixed', () => {
    test('single item', () => {
      let invoice = new InvoiceBuilder()
        .account(account)
        .client(client)
        .issueDate(new Date())
        .item(
          new InvoiceItemBuilder()
            .description('Item #1')
            .unitPrice(1000)
            .discount(new DiscountBuilder().type('fixed').value(100).build())
            .discount(new DiscountBuilder().type('percentage').value(0.18).build())
            .build(),
        )
        .build()

      expect(summary(invoice)).toEqual([{ type: 'total', value: 738 }])
    })

    test('single item, multiple quantity', () => {
      let invoice = new InvoiceBuilder()
        .account(account)
        .client(client)
        .issueDate(new Date())
        .item(
          new InvoiceItemBuilder()
            .description('Item #1')
            .quantity(3)
            .unitPrice(1000)
            .discount(new DiscountBuilder().type('fixed').value(100).quantity(1).build())
            .build(),
        )
        .build()

      expect(summary(invoice)).toEqual([{ type: 'total', value: 2900 }])
    })

    test('multiple items', () => {
      let invoice = new InvoiceBuilder()
        .account(account)
        .client(client)
        .issueDate(new Date())
        .item(new InvoiceItemBuilder().description('Item #1').unitPrice(1000).build())
        .item(
          new InvoiceItemBuilder()
            .description('Item #2')
            .unitPrice(1000)
            .discount(new DiscountBuilder().type('fixed').value(100).build())
            .build(),
        )
        .build()

      expect(summary(invoice)).toEqual([{ type: 'total', value: 1900 }])
    })

    test('multiple items, multiple quantities', () => {
      let invoice = new InvoiceBuilder()
        .account(account)
        .client(client)
        .issueDate(new Date())
        .item(new InvoiceItemBuilder().description('Item #1').quantity(3).unitPrice(1000).build())
        .item(
          new InvoiceItemBuilder()
            .description('Item #2')
            .quantity(3)
            .unitPrice(1000)
            .discount(new DiscountBuilder().type('fixed').value(100).quantity(1).build())
            .build(),
        )
        .build()

      expect(summary(invoice)).toEqual([{ type: 'total', value: 5900 }])
    })

    describe('with tax', () => {
      test('single item', () => {
        let invoice = new InvoiceBuilder()
          .account(account)
          .client(client)
          .issueDate(new Date())
          .item(
            new InvoiceItemBuilder()
              .description('Item #1')
              .taxRate(0.21)
              .unitPrice(1000)
              .discount(new DiscountBuilder().type('fixed').value(100).build())
              .build(),
          )
          .build()

        expect(summary(invoice)).toEqual([
          { type: 'subtotal', value: 900 },
          { type: 'vat', rate: 0.21, value: 189 },
          { type: 'total', value: 1089 },
        ])
      })

      test('single item, multiple quantity', () => {
        let invoice = new InvoiceBuilder()
          .account(account)
          .client(client)
          .issueDate(new Date())
          .item(
            new InvoiceItemBuilder()
              .description('Item #1')
              .quantity(3)
              .taxRate(0.21)
              .unitPrice(1000)
              .discount(new DiscountBuilder().type('fixed').value(100).quantity(1).build())
              .build(),
          )
          .build()

        expect(summary(invoice)).toEqual([
          { type: 'subtotal', value: 2900 },
          { type: 'vat', rate: 0.21, value: 609 },
          { type: 'total', value: 3509 },
        ])
      })

      test('multiple items', () => {
        let invoice = new InvoiceBuilder()
          .account(account)
          .client(client)
          .issueDate(new Date())
          .item(
            new InvoiceItemBuilder().description('Item #1').taxRate(0.21).unitPrice(1000).build(),
          )
          .item(
            new InvoiceItemBuilder()
              .description('Item #2')
              .taxRate(0.21)
              .unitPrice(1000)
              .discount(new DiscountBuilder().type('fixed').value(100).build())
              .build(),
          )
          .build()

        expect(summary(invoice)).toEqual([
          { type: 'subtotal', value: 1900 },
          { type: 'vat', rate: 0.21, value: 399 },
          { type: 'total', value: 2299 },
        ])
      })

      test('multiple items, multiple quantities', () => {
        let invoice = new InvoiceBuilder()
          .account(account)
          .client(client)
          .issueDate(new Date())
          .item(
            new InvoiceItemBuilder()
              .description('Item #1')
              .taxRate(0.21)
              .quantity(3)
              .unitPrice(1000)
              .build(),
          )
          .item(
            new InvoiceItemBuilder()
              .description('Item #2')
              .taxRate(0.21)
              .quantity(3)
              .unitPrice(1000)
              .discount(new DiscountBuilder().type('fixed').value(100).quantity(1).build())
              .build(),
          )
          .build()

        expect(summary(invoice)).toEqual([
          { type: 'subtotal', value: 5900 },
          { type: 'vat', rate: 0.21, value: 1239 },
          { type: 'total', value: 7139 },
        ])
      })
    })
  })
})
