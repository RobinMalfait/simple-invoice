import EventEmitter from 'node:events'

import { z } from 'zod'

import { Account } from '~/domain/account/account'
import { Address } from '~/domain/address/address'
import { Contact } from '~/domain/contact/contact'
import { Currency } from '~/domain/currency/currency'
import { bus as defaultBus } from '~/domain/event-bus/bus'
import { Event } from '~/domain/events/event'
import { Language } from '~/domain/language/language'
import { ScopedIDGenerator } from '~/utils/id'
import { tap } from '~/utils/tap'

let scopedId = new ScopedIDGenerator('supplier')

export let Supplier = z.object({
  kind: z.literal('supplier').default('supplier'),
  id: z.string().default(() => {
    return scopedId.next()
  }),
  account: z.lazy(() => {
    return Account
  }),
  name: z.string(),
  nickname: z.string(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  website: z.string().nullable(),
  imageUrl: z.string().nullable(),
  address: z.optional(Address).nullable(),
  currency: z.nativeEnum(Currency),
  language: z.nativeEnum(Language),
  timezone: z.string(),
})

export type Supplier = z.infer<typeof Supplier>

export class SupplierBuilder {
  private _id: Supplier['id'] | undefined = undefined
  private _account: Supplier['account'] | null = null
  private _name: Supplier['name'] | null = null
  private _nickname: Contact['nickname'] | null = null
  private _email: Supplier['email'] | null = null
  private _phone: Supplier['phone'] | null = null
  private _website: Supplier['website'] | null = null
  private _imageUrl: Supplier['imageUrl'] | null = null
  private _address: Supplier['address'] | null = null
  private _currency: Supplier['currency'] | null = Currency.EUR
  private _language: Supplier['language'] | null = Language.NL
  private _timezone: Supplier['timezone'] | null = Intl.DateTimeFormat().resolvedOptions().timeZone

  private _events: Partial<Event>[] = []

  public constructor(private bus: EventEmitter = defaultBus) {}

  private emit(event: Event) {
    this.bus.emit(event.type, event)
  }

  public build(): Supplier {
    let supplier = Supplier.parse({
      id: this._id,
      account: this._account,
      name: this._name,
      nickname: this._nickname ?? this._name,
      email: this._email,
      phone: this._phone,
      website: this._website,
      imageUrl: this._imageUrl,
      address: this._address,
      currency: this._currency,
      language: this._language,
      timezone: this._timezone,
    })

    for (let event of this._events) {
      this.emit(
        Event.parse({
          ...event,
          context: {
            ...event.context,
            supplierId: supplier.id,
          },
        }),
      )
    }

    return supplier
  }

  public static from(supplier: Supplier): SupplierBuilder {
    let builder = new SupplierBuilder()
    builder._account = supplier.account
    builder._name = supplier.name
    builder._nickname = supplier.nickname
    builder._email = supplier.email
    builder._phone = supplier.phone
    builder._website = supplier.website
    builder._imageUrl = supplier.imageUrl
    builder._address = supplier.address
    builder._currency = supplier.currency
    builder._language = supplier.language
    builder._timezone = supplier.timezone
    return builder
  }

  public static mutate(supplier: Supplier, mutator: (builder: SupplierBuilder) => void): Supplier {
    return Object.assign(
      supplier,
      tap(SupplierBuilder.from(supplier), (builder) => {
        builder._id = supplier.id
        mutator(builder)
      }).build(),
    )
  }

  public account(account: Supplier['account']): SupplierBuilder {
    this._account = account

    if (this._currency === null) {
      this._currency = account.currency
    }

    if (this._language === null) {
      this._language = account.language
    }

    return this
  }

  public name(name: Supplier['name']): SupplierBuilder {
    this._name = name
    return this
  }

  public nickname(nickname: Supplier['nickname']): SupplierBuilder {
    this._nickname = nickname
    return this
  }

  public email(email: Supplier['email']): SupplierBuilder {
    this._email = email
    return this
  }

  public phone(phone: Supplier['phone']): SupplierBuilder {
    this._phone = phone
    return this
  }

  public website(website: Supplier['website']): SupplierBuilder {
    this._website = website
    return this
  }

  public imageUrl(imageUrl: Supplier['imageUrl']): SupplierBuilder {
    this._imageUrl = imageUrl
    return this
  }

  public address(address: Supplier['address']): SupplierBuilder {
    this._address = address
    return this
  }

  public currency(currency: Supplier['currency']): SupplierBuilder {
    this._currency = currency
    return this
  }

  public language(language: Supplier['language']): SupplierBuilder {
    this._language = language
    return this
  }

  public timezone(timezone: Supplier['timezone']): SupplierBuilder {
    this._timezone = timezone
    return this
  }
}
