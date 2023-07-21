import { z } from 'zod'

export let addressSchema = z.object({
  street1: z.string().nullable(),
  street2: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postcode: z.string().nullable(),
  country: z.string().nullable(),
})

export type Address = z.infer<typeof addressSchema>

export class AddressBuilder {
  private _street1: string | null = null
  private _street2: string | null = null
  private _city: string | null = null
  private _state: string | null = null
  private _postcode: string | null = null
  private _country: string | null = null

  public build(): Address {
    return addressSchema.parse({
      street1: this._street1,
      street2: this._street2,
      city: this._city,
      state: this._state,
      postcode: this._postcode,
      country: this._country,
    })
  }

  public street1(street1: string): AddressBuilder {
    this._street1 = street1
    return this
  }

  public street2(street2: string): AddressBuilder {
    this._street2 = street2
    return this
  }

  public city(city: string): AddressBuilder {
    this._city = city
    return this
  }

  public state(state: string): AddressBuilder {
    this._state = state
    return this
  }

  public postcode(postcode: string): AddressBuilder {
    this._postcode = postcode
    return this
  }

  public country(country: string): AddressBuilder {
    this._country = country
    return this
  }
}
