import { z } from 'zod'
import { Discount } from '~/domain/discount/discount'

export let InvoiceItem = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  description: z.string(),
  quantity: z.number(),
  unitPrice: z.number(),
  taxRate: z.number(),
  discounts: z.array(Discount),
})

export type InvoiceItem = z.infer<typeof InvoiceItem>

export class InvoiceItemBuilder {
  private _description: string | null = null
  private _quantity: number | null = 1
  private _unitPrice: number | null = null
  private _taxRate: number | null = 0
  private _discounts: Discount[] = []

  public build(): InvoiceItem {
    return InvoiceItem.parse({
      description: this._description,
      quantity: this._quantity,
      unitPrice: this._unitPrice,
      taxRate: this._taxRate,
      discounts: this._discounts.map((discount) => {
        // Default the quantity to the item quantity if it's a fixed discount
        // with no quantity set explicitly.
        if (discount.type === 'fixed' && discount.quantityType === 'implicit') {
          discount.quantityType = 'explicit'
          discount.quantity = this._quantity!
        }
        return discount
      }),
    })
  }

  public description(description: string): InvoiceItemBuilder {
    this._description = description
    return this
  }

  public quantity(quantity: number): InvoiceItemBuilder {
    this._quantity = quantity
    return this
  }

  public unitPrice(unitPrice: number): InvoiceItemBuilder {
    this._unitPrice = unitPrice
    return this
  }

  public taxRate(unitPrice: number): InvoiceItemBuilder {
    this._taxRate = unitPrice
    return this
  }

  public discount(discount: Discount): InvoiceItemBuilder {
    this._discounts.push(discount)
    return this
  }
}
