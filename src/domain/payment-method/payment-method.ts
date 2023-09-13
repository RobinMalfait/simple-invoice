import { z } from 'zod'
import { ScopedIDGenerator } from '~/utils/id'
import { match } from '~/utils/match'

let scopedId = new ScopedIDGenerator('payment-method')

export let PaymentMethod = z.object({
  id: z.string().default(() => scopedId.next()),
  type: z.enum(['iban', 'paypal']),
  display: z.string(),
  value: z.string(),
})

export type PaymentMethod = z.infer<typeof PaymentMethod>

export class PaymentMethodBuilder {
  private _type: PaymentMethod['type'] | null = null
  private _value: string | null = null

  public build(): PaymentMethod {
    return PaymentMethod.parse({
      type: this._type,
      value: this._value,
      display: match(this._type!, {
        iban: () => `IBAN ${this._value}`,
        paypal: () => `${this._value}`,
      }),
    })
  }

  public type(type: PaymentMethod['type']): PaymentMethodBuilder {
    this._type = type
    return this
  }

  public value(value: PaymentMethod['value']): PaymentMethodBuilder {
    this._value = value
    return this
  }
}
