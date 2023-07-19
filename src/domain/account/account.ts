import { z } from 'zod'
import { Address, addressSchema } from '~/domain/address/address'
import { Currency } from '~/domain/currency/currency'
import { Language } from '~/domain/language/language'
import { PaymentMethod, paymentMethodSchema } from '~/domain/payment-method/payment-method'
import { Tax, taxSchema } from '~/domain/tax/tax'

export let accountSchema = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  billing: addressSchema,
  currency: z.nativeEnum(Currency),
  language: z.nativeEnum(Language),
  tax: taxSchema.nullable(),
  timezone: z.string(),
  paymentMethods: z.array(paymentMethodSchema),
  note: z.string().nullable(),
  legal: z.string().nullable(),
})

export type Account = z.infer<typeof accountSchema>

export class AccountBuilder {
  private _name: string | null = null
  private _email: string | null = null
  private _phone: string | null = null
  private _billing: Address | null = null
  private _currency: Currency | null = Currency.EUR
  private _language: Language | null = Language.NL
  private _tax: Tax | null = null
  private _timezone: string | null = Intl.DateTimeFormat().resolvedOptions().timeZone
  private _paymentMethods: PaymentMethod[] = []
  private _note: string | null = null
  private _legal: string | null = null

  public build(): Account {
    return accountSchema.parse({
      name: this._name,
      email: this._email,
      phone: this._phone,
      billing: this._billing,
      currency: this._currency,
      language: this._language,
      tax: this._tax,
      timezone: this._timezone,
      paymentMethods: this._paymentMethods,
      note: this._note,
      legal: this._legal,
    })
  }

  public name(name: string): AccountBuilder {
    this._name = name
    return this
  }

  public email(email: string): AccountBuilder {
    this._email = email
    return this
  }

  public phone(phone: string): AccountBuilder {
    this._phone = phone
    return this
  }

  public billing(billing: Address): AccountBuilder {
    this._billing = billing
    return this
  }

  public currency(currency: Currency): AccountBuilder {
    this._currency = currency
    return this
  }

  public language(language: Language): AccountBuilder {
    this._language = language
    return this
  }

  public tax(tax: Tax): AccountBuilder {
    this._tax = tax
    return this
  }

  public timezone(timezone: string): AccountBuilder {
    this._timezone = timezone
    return this
  }

  public paymentMethods(paymentMethods: PaymentMethod[]): AccountBuilder {
    this._paymentMethods = paymentMethods
    return this
  }

  public note(note: string): AccountBuilder {
    this._note = note
    return this
  }

  public legal(legal: string): AccountBuilder {
    this._legal = legal
    return this
  }

  public paymentMethod(paymentMethod: PaymentMethod): AccountBuilder {
    this._paymentMethods.push(paymentMethod)
    return this
  }
}
