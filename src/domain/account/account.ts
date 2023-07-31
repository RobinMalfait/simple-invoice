import { z } from 'zod'
import { Address } from '~/domain/address/address'
import { Currency } from '~/domain/currency/currency'
import { Language } from '~/domain/language/language'
import { PaymentMethod } from '~/domain/payment-method/payment-method'
import { Tax } from '~/domain/tax/tax'
import { ContactField, ContactFieldBuilder } from '../contact-fields/contact-fields'

export let Account = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  billing: Address,
  currency: z.nativeEnum(Currency),
  language: z.nativeEnum(Language),
  tax: Tax.nullable(),
  timezone: z.string(),
  paymentMethods: z.array(PaymentMethod),
  contactFields: z.array(ContactField),
  note: z.string().nullable(),
  legal: z.string().nullable(),
})

export type Account = z.infer<typeof Account>

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
  private _contactFields: ContactField[] = []
  private _note: string | null = null
  private _legal: string | null = null

  public build(): Account {
    return Account.parse({
      name: this._name,
      email: this._email,
      phone: this._phone,
      billing: this._billing,
      currency: this._currency,
      language: this._language,
      tax: this._tax,
      timezone: this._timezone,
      paymentMethods: this._paymentMethods,
      contactFields: this._contactFields,
      note: this._note,
      legal: this._legal,
    })
  }

  public name(name: string): AccountBuilder {
    this._name = name
    return this
  }

  public email(email: string, { includeInContactFields = true } = {}): AccountBuilder {
    this._email = email
    if (includeInContactFields) {
      this.contactField(
        new ContactFieldBuilder()
          .name('Email')
          .value(email)
          .icon({ type: 'heroicon', heroicon: 'EnvelopeIcon' })
          .build(),
      )
    }
    return this
  }

  public phone(phone: string, { includeInContactFields = true } = {}): AccountBuilder {
    this._phone = phone
    if (includeInContactFields) {
      this.contactField(
        new ContactFieldBuilder()
          .name('Phone')
          .value(phone)
          .icon({ type: 'heroicon', heroicon: 'PhoneIcon' })
          .build(),
      )
    }
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

  public contactFields(contactFields: ContactField[]): AccountBuilder {
    this._contactFields = contactFields
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

  public contactField(contactField: ContactField): AccountBuilder {
    this._contactFields.push(contactField)
    return this
  }
}
