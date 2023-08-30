import { z } from 'zod'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'
import { ScopedIDGenerator } from '~/utils/id'

let scopedId = new ScopedIDGenerator('mail-template')

export let MailTemplate = z.object({
  id: z.string().default(() => scopedId.next()),
  name: z.string(),
  subject: z.string(),
  body: z.string().nullable(),
})

export type MailTemplate = z.infer<typeof MailTemplate>

export class MailTemplateBuilder<T extends Quote | Invoice | Receipt> {
  private _name: MailTemplate['name'] | null = null
  private _subject: MailTemplate['subject'] | null = null
  private _body: MailTemplate['body'] | null = null

  public build(): MailTemplate {
    return MailTemplate.parse({
      name: this._name,
      subject: this._subject,
      body: this._body,
    })
  }

  public name(name: MailTemplate['name']): MailTemplateBuilder<T> {
    this._name = name
    return this
  }

  public subject(subject: MailTemplate['subject']): MailTemplateBuilder<T> {
    this._subject = subject
    return this
  }

  public body(body: MailTemplate['body']): MailTemplateBuilder<T> {
    this._body = body
    return this
  }
}
