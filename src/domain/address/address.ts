import { z } from 'zod'

export let addressSchema = z.object({
  street: z.string().nullable(),
  city: z.string().nullable(),
  zip: z.string().nullable(),
  country: z.string().nullable(),
})

export type Address = z.infer<typeof addressSchema>

export class AddressBuilder {
  private _street: string | null = null
  private _city: string | null = null
  private _zip: string | null = null
  private _country: string | null = null

  public build(): Address {
    return addressSchema.parse({
      street: this._street,
      city: this._city,
      zip: this._zip,
      country: this._country,
    })
  }

  public street(street: string): AddressBuilder {
    this._street = street
    return this
  }

  public city(city: string): AddressBuilder {
    this._city = city
    return this
  }

  public zip(zip: string): AddressBuilder {
    this._zip = zip
    return this
  }

  public country(country: string): AddressBuilder {
    this._country = country
    return this
  }
}
