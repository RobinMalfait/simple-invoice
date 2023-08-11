import { addDays } from 'date-fns'
import { IncrementStrategy } from '~/domain/invoice/number-strategies'

export type Configuration = {
  /**
   * The default net strategy, this will be used to calculate the quoteExpirationDate based on the
   * quoteDate.
   *
   * Typically this is 15 days after the quoteDate.
   */
  defaultNetStrategy: (quoteDate: Date) => Date

  /**
   * All quotes should have an quote number in ascending order. This is the strategy to
   * calculate the next quote number.
   */
  numberStrategy: (quoteDate: Date) => string

  /**
   * The configuration for PDF generation.
   */
  pdf: {
    /**
     *  The filename template for the PDF. You can use every property of the quote as a placeholder.
     *  - For example `{{number}}` will be replaced by the quote number.
     *  - You can also use nested properties, for example `{{client.name}}` will be replaced by the
     *    client name.
     *  - For dates, you can use a format string, for example `{{quoteDate:dd-MM-yyyy}}`
     */
    filename: string
  }
}

export let defaultConfiguration: Configuration = {
  defaultNetStrategy: (quoteDate: Date) => addDays(quoteDate, 15),
  numberStrategy: new IncrementStrategy().next,
  pdf: {
    filename: 'quote-{{number}}.pdf',
  },
}
