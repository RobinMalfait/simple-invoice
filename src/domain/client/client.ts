import { z } from 'zod'
import { Address } from '~/domain/address/address'
import { Currency } from '~/domain/currency/currency'
import { Language } from '~/domain/language/language'
import { Tax } from '~/domain/tax/tax'
import { ScopedIDGenerator } from '~/utils/id'

let scopedId = new ScopedIDGenerator('client')

export let Client = z.object({
  id: z.string().default(() => scopedId.next()),
  name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  imageUrl: z.string().nullable(),
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
  private _name: Client['name'] | null = null
  private _email: Client['email'] | null = null
  private _phone: Client['phone'] | null = null
  private _imageUrl: Client['imageUrl'] | null = null
  private _billing: Client['billing'] | null = null
  private _currency: Client['currency'] | null = Currency.EUR
  private _language: Client['language'] | null = Language.NL
  private _tax: Client['tax'] | null = null
  private _timezone: Client['timezone'] | null = Intl.DateTimeFormat().resolvedOptions().timeZone
  private _note: Client['note'] | null = null
  private _legal: Client['legal'] | null = null

  public build(): Client {
    return Client.parse({
      name: this._name,
      email: this._email,
      phone: this._phone,
      imageUrl: this._imageUrl,
      billing: this._billing,
      currency: this._currency,
      language: this._language,
      tax: this._tax,
      timezone: this._timezone,
      note: this._note,
      legal: this._legal,
    })
  }

  public static from(client: Client): ClientBuilder {
    let builder = new ClientBuilder()
    builder._name = client.name
    builder._email = client.email
    builder._phone = client.phone
    builder._imageUrl = client.imageUrl
    builder._billing = client.billing
    builder._currency = client.currency
    builder._language = client.language
    builder._tax = client.tax
    builder._timezone = client.timezone
    builder._note = client.note
    builder._legal = client.legal
    return builder
  }

  public name(name: Client['name']): ClientBuilder {
    this._name = name
    return this
  }

  public email(email: Client['email']): ClientBuilder {
    this._email = email
    return this
  }

  public phone(phone: Client['phone']): ClientBuilder {
    this._phone = phone
    return this
  }

  public imageUrl(imageUrl: Client['imageUrl']): ClientBuilder {
    this._imageUrl = imageUrl
    return this
  }

  public billing(billing: Client['billing']): ClientBuilder {
    this._billing = billing
    return this
  }

  public currency(currency: Client['currency']): ClientBuilder {
    this._currency = currency
    return this
  }

  public language(language: Client['language']): ClientBuilder {
    this._language = language
    return this
  }

  public tax(tax: Client['tax']): ClientBuilder {
    this._tax = tax
    return this
  }

  public timezone(timezone: Client['timezone']): ClientBuilder {
    this._timezone = timezone
    return this
  }

  public note(note: Client['note']): ClientBuilder {
    this._note = note
    return this
  }

  public legal(legal: Client['legal']): ClientBuilder {
    this._legal = legal
    return this
  }
}
