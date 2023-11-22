'use client'

import { ReactNode, createContext, useCallback, useContext } from 'react'
import { Account } from '~/domain/account/account'
import { Client } from '~/domain/client/client'
import { Event } from '~/domain/events/event'
import { Record } from '~/domain/record/record'
import { match } from '~/utils/match'

let Context = createContext<Event[]>([])

export function EventsProvider({ events, children }: { events: Event[]; children: ReactNode }) {
  return <Context.Provider value={events}>{children}</Context.Provider>
}

export function useEventsBy(selector: (event: Event) => boolean) {
  let events = useContext(Context)
  if (events === null) {
    let err = new Error('useEventsBy() is used, but there is no parent <EventsProvider /> found.')
    if (Error.captureStackTrace) Error.captureStackTrace(err, useEventsBy)
    throw err
  }

  return events.filter(selector)
}

export function useEventsForAccount(account: Account) {
  let events = useContext(Context)
  if (events === null) {
    let err = new Error(
      'useEventsForAccount() is used, but there is no parent <EventsProvider /> found.',
    )
    if (Error.captureStackTrace) Error.captureStackTrace(err, useEventsBy)
    throw err
  }

  return events.filter((x) => {
    return (
      (x.tags.includes('account') || x.tags.includes('milestone')) &&
      'accountId' in x.context &&
      x.context.accountId === account.id
    )
  })
}

export function useEventsForClient(client: Client) {
  let events = useContext(Context)
  if (events === null) {
    let err = new Error(
      'useEventsForClient() is used, but there is no parent <EventsProvider /> found.',
    )
    if (Error.captureStackTrace) Error.captureStackTrace(err, useEventsBy)
    throw err
  }

  return events.filter((x) => {
    return (
      (x.tags.includes('client') || x.tags.includes('milestone')) &&
      'clientId' in x.context &&
      x.context.clientId === client.id
    )
  })
}

function filterEventsForRecord<T extends Record>(record: T, events: Event[]) {
  return events.filter((e) => {
    return match(record.type, {
      quote: () => {
        return (
          (e.tags.includes('quote') || e.tags.includes('milestone')) &&
          'quoteId' in e.context &&
          e.context.quoteId === record.id
        )
      },
      invoice: () => {
        return (
          (e.tags.includes('invoice') || e.tags.includes('milestone')) &&
          'invoiceId' in e.context &&
          e.context.invoiceId === record.id
        )
      },
      'credit-note': () => {
        return (
          (e.tags.includes('credit-note') || e.tags.includes('milestone')) &&
          'creditNoteId' in e.context &&
          e.context.creditNoteId === record.id
        )
      },
      receipt: () => {
        return (
          (e.tags.includes('receipt') || e.tags.includes('milestone')) &&
          'receiptId' in e.context &&
          e.context.receiptId === record.id
        )
      },
    })
  })
}

export function useEventsForRecord<T extends Record>(record: T) {
  let events = useContext(Context)
  if (events === null) {
    let err = new Error(
      'useEventsForRecord() is used, but there is no parent <EventsProvider /> found.',
    )
    if (Error.captureStackTrace) Error.captureStackTrace(err, useEventsBy)
    throw err
  }

  return filterEventsForRecord(record, events)
}

export function useLazyEventsForRecord() {
  let events = useContext(Context)
  if (events === null) {
    let err = new Error(
      'useLazyEventsForRecord() is used, but there is no parent <EventsProvider /> found.',
    )
    if (Error.captureStackTrace) Error.captureStackTrace(err, useEventsBy)
    throw err
  }

  return useCallback(
    <T extends Record>(record: T) => {
      return filterEventsForRecord(record, events)
    },
    [events],
  )
}
