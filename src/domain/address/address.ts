export type Address = {
  street: string | null
  city: string | null
  zip: string | null
  country: string | null
}

export class AddressBuilder {
  private _street: string | null = null
  private _city: string | null = null
  private _zip: string | null = null
  private _country: string | null = null

  public build(): Address {
    return {
      street: this._street,
      city: this._city,
      zip: this._zip,
      country: this._country,
    }
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
