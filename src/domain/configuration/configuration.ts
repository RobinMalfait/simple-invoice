import {
  defaultConfiguration as defaultCreditNoteConfiguration,
  type Configuration as CreditNoteConfiguration,
} from '~/domain/credit-note/configuration'
import {
  defaultConfiguration as defaultInvoiceConfiguration,
  type Configuration as InvoiceConfiguration,
} from '~/domain/invoice/configuration'
import {
  defaultConfiguration as defaultQuoteConfiguration,
  type Configuration as QuoteConfiguration,
} from '~/domain/quote/configuration'
import {
  defaultConfiguration as defaultReceiptConfiguration,
  type Configuration as ReceiptConfiguration,
} from '~/domain/receipt/configuration'
import { merge } from '~/utils/merge'

export type Configuration = {
  quote: QuoteConfiguration
  invoice: InvoiceConfiguration
  'credit-note': CreditNoteConfiguration
  receipt: ReceiptConfiguration
}

let defaultConfiguration: Configuration = {
  quote: defaultQuoteConfiguration,
  invoice: defaultInvoiceConfiguration,
  'credit-note': defaultCreditNoteConfiguration,
  receipt: defaultReceiptConfiguration,
}

let state = {
  configuration: defaultConfiguration,
}

type DeepPartial<T> = T extends (...args: any[]) => void
  ? T
  : T extends object
    ? { [P in keyof T]?: DeepPartial<T[P]> }
    : T

export function configure(configuration: DeepPartial<Configuration>) {
  state.configuration = {
    quote: merge({}, defaultQuoteConfiguration, configuration.quote),
    invoice: merge({}, defaultInvoiceConfiguration, configuration.invoice),
    'credit-note': merge({}, defaultCreditNoteConfiguration, configuration['credit-note']),
    receipt: merge({}, defaultReceiptConfiguration, configuration.receipt),
  } as Configuration
}

export function config(): Configuration {
  if (!state.configuration) {
    let err = new Error('Configuration not set')
    if (Error.captureStackTrace) Error.captureStackTrace(err, config)
    throw err
  }

  return state.configuration
}
