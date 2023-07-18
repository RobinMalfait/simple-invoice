import { Address } from '~/domain/address/address'
import { Currency } from '~/domain/currency/currency'
import { Language } from '~/domain/language/language'
import { Tax } from '~/domain/tax/tax'
import { required } from '~/utils/required'

export type Account = {
  id: string
  name: string
  email: string | null
  phone: string | null
  billing: Address
  currency: Currency
  language: Language
  tax: Tax | null
  timezone: string
  note: string | null
  legal: string | null
}

export class AccountBuilder {
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

  public build(): Account {
    return {
      id: crypto.randomUUID(),
      name: this._name ?? required('name'),
      email: this._email,
      phone: this._phone,
      billing: this._billing ?? required('billing'),
      currency: this._currency ?? required('currency'),
      language: this._language ?? required('language'),
      tax: this._tax,
      timezone: this._timezone ?? required('timezone'),
      note: this._note,
      legal: this._legal,
    }
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

  public note(note: string): AccountBuilder {
    this._note = note
    return this
  }

  public legal(legal: string): AccountBuilder {
    this._legal = legal
    return this
  }
}
