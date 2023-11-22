import { MailTemplate } from '~/domain/mail-template/mail-template'

export type Configuration = {
  /**
   * The configuration for PDF generation.
   */
  pdf: {
    /**
     *  The filename template for the PDF. You can use every property of the receipt as a placeholder.
     *  - For example `{{number}}` will be replaced by the receipt number.
     *  - You can also use nested properties, for example `{{client.name}}` will be replaced by the
     *    client name.
     *  - For dates, you can use a format string, for example `{{receiptDate:dd-MM-yyyy}}`
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
  pdf: {
    filename: 'receipt-{{invoice.number}}.pdf',
    folder: 'receipts/{{invoice.issueDate:yyyy-QQ}}',
  },
  mail: {
    templates: [],
  },
}
