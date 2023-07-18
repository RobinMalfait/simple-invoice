import { required } from '~/utils/required'

export type Tax = {
  id: TaxID
  value: string
}

export class TaxBuilder {
  private _id: TaxID | null = TaxID.VAT
  private _value: string | null = null

  public build(): Tax {
    return {
      id: this._id ?? required('id'),
      value: this._value ?? required('value'),
    }
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

// ---

export enum TaxID {
  VAT = 'vat',
}
