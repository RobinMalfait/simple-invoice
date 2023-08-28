import { z } from 'zod'
import { ScopedIDGenerator } from '~/utils/id'

let scopedId = new ScopedIDGenerator('document')

export let Document = z
  .discriminatedUnion('type', [
    // z.object({ type: z.literal('path'), value: z.string() }),
    z.object({
      type: z.literal('markdown'),
      name: z.string(),
      value: z.string(),
    }),
    z.object({
      type: z.literal('html'),
      name: z.string(),
      value: z.string(),
    }),
  ])
  .and(
    z.object({
      id: z.string().default(() => scopedId.next()),
    }),
  )

export type Document = z.infer<typeof Document>

export class DocumentBuilder {
  private _type: Document['type'] | null = null
  private _name: Document['name'] | null = null
  private _value: Document['value'] | null = null

  public build(): Document {
    return Document.parse({
      type: this._type,
      name: this._name,
      value: this._value,
    })
  }

  public type(type: Document['type']): DocumentBuilder {
    this._type = type
    return this
  }

  public name(name: Document['name']): DocumentBuilder {
    this._name = name
    return this
  }

  public value(value: Document['value']): DocumentBuilder {
    this._value = value
    return this
  }
}

// ---

export let md = String.raw
