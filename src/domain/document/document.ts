import { z } from 'zod'

export let Document = z
  .discriminatedUnion('type', [
    // z.object({ type: z.literal('path'), value: z.string() }),
    z.object({
      type: z.literal('raw'),
      value: z.string(),
    }),
  ])
  .and(
    z.object({
      id: z.string().default(() => crypto.randomUUID()),
    }),
  )

export type Document = z.infer<typeof Document>

export class DocumentBuilder {
  private _type: Document['type'] | null = null
  private _value: Document['value'] | null = null

  public build(): Document {
    return Document.parse({
      type: this._type,
      value: this._value,
    })
  }

  public type(type: Document['type']): DocumentBuilder {
    this._type = type
    return this
  }

  public value(value: Document['value']): DocumentBuilder {
    this._value = value
    return this
  }
}

// ---

export let md = String.raw
