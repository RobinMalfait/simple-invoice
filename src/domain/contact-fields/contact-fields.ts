import { z } from 'zod'
import { icons, socialIcons } from '~/domain/contact-fields/icon-names'

export let ContactField = z.object({
  id: z.string().default(() => crypto.randomUUID()),
  name: z.string(),
  value: z.string(),
  icon: z
    .discriminatedUnion('type', [
      z.object({
        type: z.literal('heroicon'),
        heroicon: z.enum(icons),
      }),
      z.object({
        type: z.literal('socials'),
        name: z.enum(socialIcons),
      }),
      z.object({
        type: z.literal('image'),
        imageUrl: z.string().url(),
      }),
    ])
    .nullable(),
})

export type ContactField = z.infer<typeof ContactField>

export class ContactFieldBuilder {
  private _name: ContactField['name'] | null = null
  private _value: ContactField['value'] | null = null
  private _icon: ContactField['icon'] | null = null

  public build(): ContactField {
    return ContactField.parse({
      name: this._name,
      value: this._value,
      icon: this._icon,
    })
  }

  public name(name: ContactField['name']): ContactFieldBuilder {
    this._name = name
    return this
  }

  public value(value: ContactField['value']): ContactFieldBuilder {
    this._value = value
    return this
  }

  public icon(icon: ContactField['icon']): ContactFieldBuilder {
    this._icon = icon
    return this
  }
}
