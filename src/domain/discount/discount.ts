import { z } from 'zod'

export let Discount = z
  .discriminatedUnion('type', [
    z.object({ type: z.literal('percentage'), value: z.number().min(0).max(1) }),
    z.object({
      type: z.literal('fixed'),
      value: z.number(),
      quantity: z.coerce.number().default(1),
      quantityType: z.enum(['explicit', 'implicit']),
    }),
  ])
  .and(
    z.object({
      reason: z.string().nullable().default(null),
    }),
  )

export type Discount = z.infer<typeof Discount>

export class DiscountBuilder {
  private _type: Discount['type'] | null = null
  private _value: Discount['value'] | null = null
  private _reason: Discount['reason'] = null
  private _quantity: number | null = null
  private _quantityType: 'explicit' | 'implicit' = 'implicit'

  public build(): Discount {
    return Discount.parse({
      type: this._type,
      value: this._value,
      reason: this._reason,
      quantity: this._type === 'fixed' ? this._quantity : undefined,
      quantityType: this._type === 'fixed' ? this._quantityType : undefined,
    })
  }

  public type(type: Discount['type']): DiscountBuilder {
    this._type = type
    return this
  }

  public value(value: Discount['value']): DiscountBuilder {
    this._value = value
    return this
  }

  public reason(reason: Discount['reason']): DiscountBuilder {
    this._reason = reason
    return this
  }

  public quantity(quantity: number | null): DiscountBuilder {
    if (this._type !== 'fixed') {
      throw new Error('Cannot set quantity on non-fixed discount')
    }

    this._quantity = quantity
    this._quantityType = 'explicit'

    return this
  }
}
