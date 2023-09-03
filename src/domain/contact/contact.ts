import { z } from 'zod'
import { ScopedIDGenerator } from '~/utils/id'

let scopedId = new ScopedIDGenerator('contact')

export let Contact = z.object({
  id: z.string().default(() => scopedId.next()),
  name: z.string(),
  nickname: z.string().nullable(),
  email: z.string().email().nullable(),
  phone: z.string().nullable(),
  role: z.string().nullable(),
  imageUrl: z.string().nullable(),
})

export type Contact = z.infer<typeof Contact>

export class ContactBuilder {
  private _name: Contact['name'] | null = null
  private _nickname: Contact['nickname'] | null = null
  private _email: Contact['email'] | null = null
  private _phone: Contact['phone'] | null = null
  private _role: Contact['role'] | null = null
  private _imageUrl: Contact['imageUrl'] | null = null

  public build(): Contact {
    return Contact.parse({
      name: this._name,
      nickname: this._nickname ?? this._name,
      email: this._email,
      phone: this._phone,
      role: this._role,
      imageUrl: this._imageUrl,
    })
  }

  public name(name: Contact['name']): ContactBuilder {
    this._name = name
    return this
  }

  public nickname(nickname: Contact['nickname']): ContactBuilder {
    this._nickname = nickname
    return this
  }

  public phone(phone: Contact['phone']): ContactBuilder {
    this._phone = phone
    return this
  }

  public email(email: Contact['email']): ContactBuilder {
    this._email = email
    return this
  }

  public role(role: Contact['role']): ContactBuilder {
    this._role = role
    return this
  }

  public imageUrl(imageUrl: Contact['imageUrl']): ContactBuilder {
    this._imageUrl = imageUrl
    return this
  }
}
