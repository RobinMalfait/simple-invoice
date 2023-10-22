import { addDays } from 'date-fns'
import { MailTemplate } from '~/domain/mail-template/mail-template'
import { IncrementStrategy } from '~/domain/number-strategies'

export type Configuration = {
  /**
   * The default net strategy, this will be used to calculate the dueDate based on the issueDate.
   *
   * Typically this is 30 days after the issueDate.
   */
  defaultNetStrategy: (issueDate: Date) => Date

  /**
   * All invoices should have an invoice number in ascending order. This is the strategy to
   * calculate the next invoice number.
   */
  numberStrategy: (issueDate: Date) => string

  /**
   * The configuration for PDF generation.
   */
  pdf: {
    /**
     *  The filename template for the PDF. You can use every property of the invoice as a placeholder.
     *  - For example `{{number}}` will be replaced by the invoice number.
     *  - You can also use nested properties, for example `{{client.name}}` will be replaced by the
     *    client name.
     *  - For dates, you can use a format string, for example `{{issueDate:dd-MM-yyyy}}`
     */
    filename: string

    /**
     * When creating a backup, the PDFs will be stored in this folder.
     */
    folder: string
  }

  /**
   * The configuration for sending emails.
   */
  mail: {
    templates: MailTemplate[]
  }
}

export let defaultConfiguration: Configuration = {
  defaultNetStrategy: (issueDate: Date) => {
    return addDays(issueDate, 30)
  },
  numberStrategy: new IncrementStrategy().next,
  pdf: {
    filename: 'invoice-{{number}}.pdf',
    folder: 'invoices/{{status}}/{{issueDate:yyyy-QQ}}',
  },
  mail: {
    templates: [],
  },
}
