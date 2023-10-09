import EventEmitter from 'node:events'

import { parseISO } from 'date-fns'
import { z } from 'zod'

import { Address } from '~/domain/address/address'
import { ContactField, ContactFieldBuilder } from '~/domain/contact-fields/contact-fields'
import { Currency } from '~/domain/currency/currency'
import { bus as defaultBus } from '~/domain/event-bus/bus'
import { Event } from '~/domain/events/event'
import { Language } from '~/domain/language/language'
import { PaymentMethod } from '~/domain/payment-method/payment-method'
import { Tax } from '~/domain/tax/tax'
import { ScopedIDGenerator } from '~/utils/id'
import { tap } from '~/utils/tap'

let scopedId = new ScopedIDGenerator('account')

export let Account = z.object({
  id: z.string().default(() => scopedId.next()),
  name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  billing: z.lazy(() => Address),
  currency: z.nativeEnum(Currency),
  language: z.nativeEnum(Language),
  tax: z.lazy(() => Tax.nullable()),
  timezone: z.string(),
  paymentMethods: z.array(z.lazy(() => PaymentMethod)),
  contactFields: z.array(z.lazy(() => ContactField)),
  note: z.string().nullable(),
  legal: z.string().nullable(),

  // Visual representation
  qr: z.boolean().nullable().default(true),
})

export type Account = z.infer<typeof Account>

export class AccountBuilder {
  private _id: Account['id'] | undefined = undefined
  private _name: Account['name'] | null = null
  private _email: Account['email'] | null = null
  private _phone: Account['phone'] | null = null
  private _imageUrl: Account['imageUrl'] | null = null
  private _billing: Account['billing'] | null = null
  private _currency: Account['currency'] | null = Currency.EUR
  private _language: Account['language'] | null = Language.NL
  private _tax: Account['tax'] | null = null
  private _timezone: Account['timezone'] | null = Intl.DateTimeFormat().resolvedOptions().timeZone
  private _paymentMethods: Account['paymentMethods'] = []
  private _contactFields: Account['contactFields'] = []
  private _note: Account['note'] | null = null
  private _legal: Account['legal'] | null = null
  private _qr: Account['qr'] | null = true

  private _events: Partial<Event>[] = []

  public constructor(private bus: EventEmitter = defaultBus) {}

  private emit(event: Event) {
    this.bus.emit(event.type, event)
  }

  public build(): Account {
    let account = Account.parse({
      id: this._id,
      name: this._name,
      email: this._email,
      phone: this._phone,
      imageUrl: this._imageUrl,
      billing: this._billing,
      currency: this._currency,
      language: this._language,
      tax: this._tax,
      timezone: this._timezone,
      paymentMethods: this._paymentMethods,
      contactFields: this._contactFields,
      note: this._note,
      legal: this._legal,
      qr: this._qr,
    })

    for (let event of this._events) {
      this.emit(
        Event.parse({
          ...event,
          context: {
            ...event.context,
            accountId: account.id,
          },
        }),
      )
    }

    return account
  }

  public static from(account: Account): AccountBuilder {
    let builder = new AccountBuilder()
    builder._name = account.name
    builder._email = account.email
    builder._phone = account.phone
    builder._imageUrl = account.imageUrl
    builder._billing = account.billing
    builder._currency = account.currency
    builder._language = account.language
    builder._tax = account.tax
    builder._timezone = account.timezone
    builder._paymentMethods = account.paymentMethods
    builder._contactFields = account.contactFields
    builder._note = account.note
    builder._legal = account.legal
    return builder
  }

  public static mutate(account: Account, mutator: (builder: AccountBuilder) => void): Account {
    return Object.assign(
      account,
      tap(AccountBuilder.from(account), (builder) => {
        builder._id = account.id
        mutator(builder)
      }).build(),
    )
  }

  public static rebrand(
    account: Account,
    handle: (builder: AccountBuilder) => void,
    { mutate = true, at }: { mutate?: boolean; at?: string | Date } = {},
  ): Account {
    let oldName = account.name
    function handler(builder: AccountBuilder) {
      handle(builder)

      builder._events.push({
        type: 'account:rebranded',
        payload: {
          from: oldName,
          to: builder._name!,
        },
        at: typeof at === 'string' ? parseISO(at) : at,
      })
    }

    return mutate
      ? AccountBuilder.mutate(account, handler)
      : tap(AccountBuilder.from(account), handler).build()
  }

  public static relocate(
    account: Account,
    handle: (builder: AccountBuilder) => void,
    { mutate = true, at }: { mutate?: boolean; at?: string | Date } = {},
  ): Account {
    let oldAddress = account.billing
    function handler(builder: AccountBuilder) {
      handle(builder)

      builder._events.push({
        type: 'account:relocated',
        payload: {
          from: oldAddress,
          to: builder._billing!,
        },
        at: typeof at === 'string' ? parseISO(at) : at,
      })
    }

    return mutate
      ? AccountBuilder.mutate(account, handler)
      : tap(AccountBuilder.from(account), handler).build()
  }

  public name(name: Account['name']): AccountBuilder {
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

  public imageUrl(imageUrl: Account['imageUrl']): AccountBuilder {
    this._imageUrl = imageUrl
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

  public qr(qr: Account['qr']): AccountBuilder {
    this._qr = qr
    return this
  }
}
