import { required } from '~/utils/required'

export type PaymentMethod = {
  id: string
  type: 'iban' | 'paypal'
  value: string
}

export class PaymentMethodBuilder {
  private _type: PaymentMethod['type'] | null = null
  private _value: string | null = null

  public build(): PaymentMethod {
    return {
      id: crypto.randomUUID(),
      type: this._type ?? required('type'),
      value: this._value ?? required('value'),
    }
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
