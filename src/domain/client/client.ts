import { z } from 'zod'
import { Address } from '~/domain/address/address'
import { Currency } from '~/domain/currency/currency'
import { Language } from '~/domain/language/language'
import { Tax } from '~/domain/tax/tax'

export let Client = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  billing: Address,
  currency: z.nativeEnum(Currency),
  language: z.nativeEnum(Language),
  tax: Tax.nullable(),
  timezone: z.string(),
  note: z.string().nullable(),
  legal: z.string().nullable(),
})

export type Client = z.infer<typeof Client>

export class ClientBuilder {
  private _name: string | null = null
  private _email: string | null = null
  private _phone: string | null = null
  private _billing: Address | null = null
  private _currency: Currency | null = Currency.EUR
  private _language: Language | null = Language.NL
  private _tax: Tax | null = null
  private _timezone: string | null = Intl.DateTimeFormat().resolvedOptions().timeZone
  private _note: string | null = null
  private _legal: string | null = null

  public build(): Client {
    return Client.parse({
      name: this._name,
      email: this._email,
      phone: this._phone,
      billing: this._billing,
      currency: this._currency,
      language: this._language,
      tax: this._tax,
      timezone: this._timezone,
      note: this._note,
      legal: this._legal,
    })
  }

  public name(name: string): ClientBuilder {
    this._name = name
    return this
  }

  public email(email: string): ClientBuilder {
    this._email = email
    return this
  }

  public phone(phone: string): ClientBuilder {
    this._phone = phone
    return this
  }

  public billing(billing: Address): ClientBuilder {
    this._billing = billing
    return this
  }

  public currency(currency: Currency): ClientBuilder {
    this._currency = currency
    return this
  }

  public language(language: Language): ClientBuilder {
    this._language = language
    return this
  }

  public tax(tax: Tax): ClientBuilder {
    this._tax = tax
    return this
  }

  public timezone(timezone: string): ClientBuilder {
    this._timezone = timezone
    return this
  }

  public note(note: string): ClientBuilder {
    this._note = note
    return this
  }

  public legal(legal: string): ClientBuilder {
    this._legal = legal
    return this
  }
}
