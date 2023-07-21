import { Address as AddressType } from '~/domain/address/address'

function formatAddress(address: AddressType) {
  return [
    address.street1,
    address.street2,
    [[address.postcode, address.city].filter(Boolean).join(' '), address.state, address.country]
      .filter(Boolean)
      .join(', '),
  ]
    .filter(Boolean)
    .join('\n')
}

export function Address({ address }: { address: AddressType }) {
  return <div className="whitespace-pre-wrap">{formatAddress(address)}</div>
}
