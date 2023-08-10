import { InvoiceConfiguration } from '~/domain/invoice/configuration'
import { QuoteConfiguration } from '~/domain/quote/configuration'

export type Configuration = {
  quote: QuoteConfiguration
  invoice: InvoiceConfiguration
}

let state = {
  configuration: null as Configuration | null,
}

export function configure(configuration: Configuration) {
  state.configuration = configuration
}

export function config(): Configuration {
  if (!state.configuration) {
    let err = new Error('Configuration not set')
    if (Error.captureStackTrace) Error.captureStackTrace(err, config)
    throw err
  }

  return state.configuration
}
