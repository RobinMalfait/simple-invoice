import {
  Configuration as InvoiceConfiguration,
  defaultConfiguration as defaultInvoiceConfiguration,
} from '~/domain/invoice/configuration'
import {
  Configuration as QuoteConfiguration,
  defaultConfiguration as defaultQuoteConfiguration,
} from '~/domain/quote/configuration'
import {
  Configuration as ReceiptConfiguration,
  defaultConfiguration as defaultReceiptConfiguration,
} from '~/domain/receipt/configuration'
import { merge } from '~/utils/merge'

export type Configuration = {
  quote: QuoteConfiguration
  invoice: InvoiceConfiguration
  receipt: ReceiptConfiguration
}

let defaultConfiguration: Configuration = {
  quote: defaultQuoteConfiguration,
  invoice: defaultInvoiceConfiguration,
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
