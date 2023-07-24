import { z } from 'zod'

export enum TaxID {
  VAT = 'vat',
}

// ---

export let Tax = z.object({
  id: z.nativeEnum(TaxID),
  value: z.string(),
})

export type Tax = z.infer<typeof Tax>

export class TaxBuilder {
  private _id: TaxID | null = TaxID.VAT
  private _value: string | null = null

  public build(): Tax {
    return Tax.parse({
      id: this._id,
      value: this._value,
    })
  }

  public id(id: TaxID): TaxBuilder {
    this._id = id
    return this
  }

  public value(value: string): TaxBuilder {
    this._value = value
    return this
  }
}
