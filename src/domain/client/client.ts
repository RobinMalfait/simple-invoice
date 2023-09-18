import EventEmitter from 'node:events'

import { parseISO } from 'date-fns'
import { z } from 'zod'

import { Address } from '~/domain/address/address'
import { Contact } from '~/domain/contact/contact'
import { Currency } from '~/domain/currency/currency'
import { bus as defaultBus } from '~/domain/event-bus/bus'
import { Event } from '~/domain/events/event'
import { Language } from '~/domain/language/language'
import { Tax } from '~/domain/tax/tax'
import { ScopedIDGenerator } from '~/utils/id'
import { tap } from '~/utils/tap'

let scopedId = new ScopedIDGenerator('client')

export let Client = z.object({
  id: z.string().default(() => scopedId.next()),
  name: z.string(),
  nickname: z.string(),
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
  contacts: z.array(Contact).default([]),
})

export type Client = z.infer<typeof Client>

export class ClientBuilder {
  private _id: Client['id'] | undefined = undefined
  private _name: Client['name'] | null = null
  private _nickname: Contact['nickname'] | null = null
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
  private _contacts: Client['contacts'] = []

  private _events: Partial<Event>[] = []

  public constructor(private bus: EventEmitter = defaultBus) {}

  private emit(event: Event) {
    this.bus.emit(event.type, event)
  }

  public build(): Client {
    let client = Client.parse({
      id: this._id,
      name: this._name,
      nickname: this._nickname ?? this._name,
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
      contacts: this._contacts,
    })

    for (let event of this._events) {
      this.emit(
        Event.parse({
          ...event,
          context: {
            ...event.context,
            clientId: client.id,
          },
        }),
      )
    }

    return client
  }

  public static from(client: Client): ClientBuilder {
    let builder = new ClientBuilder()
    builder._name = client.name
    builder._nickname = client.nickname
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
    builder._contacts = client.contacts.slice()
    return builder
  }

  public static mutate(client: Client, mutator: (builder: ClientBuilder) => void): Client {
    return Object.assign(
      client,
      tap(ClientBuilder.from(client), (builder) => {
        builder._id = client.id
        mutator(builder)
      }).build(),
    )
  }

  public static rebrand(
    client: Client,
    handle: (builder: ClientBuilder) => void,
    { mutate = true, at }: { mutate?: boolean; at?: string | Date } = {},
  ): Client {
    let oldName = client.name
    let oldNickname = client.nickname
    function handler(builder: ClientBuilder) {
      handle(builder)

      if (oldName === oldNickname && builder._nickname === oldNickname) {
        builder._nickname = builder._name
      }

      builder._events.push({
        type: 'client:rebranded',
        payload: {
          from: oldName,
          to: builder._name!,
        },
        at: typeof at === 'string' ? parseISO(at) : at,
      })
    }

    return mutate
      ? ClientBuilder.mutate(client, handler)
      : tap(ClientBuilder.from(client), handler).build()
  }

  public static relocate(
    client: Client,
    handle: (builder: ClientBuilder) => void,
    { mutate = true, at }: { mutate?: boolean; at?: string | Date } = {},
  ): Client {
    let oldAddress = client.billing
    function handler(builder: ClientBuilder) {
      handle(builder)

      builder._events.push({
        type: 'client:relocated',
        payload: {
          from: oldAddress,
          to: builder._billing!,
        },
        at: typeof at === 'string' ? parseISO(at) : at,
      })
    }

    return mutate
      ? ClientBuilder.mutate(client, handler)
      : tap(ClientBuilder.from(client), handler).build()
  }

  public name(name: Client['name']): ClientBuilder {
    this._name = name
    return this
  }

  public nickname(nickname: Client['nickname']): ClientBuilder {
    this._nickname = nickname
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

  public contacts(contacts: Client['contacts']): ClientBuilder {
    this._contacts = contacts.slice()
    return this
  }

  public contact(contact: Client['contacts'][number]): ClientBuilder {
    this._contacts.push(contact)
    return this
  }
}
