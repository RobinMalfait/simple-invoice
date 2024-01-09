import { Address as AddressType } from '~/domain/address/address'
import { classNames } from '~/ui/class-names'
import { Classified } from '~/ui/classified'

export function formatAddress(address: AddressType) {
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

export function Address({
  address,
  className,
  ...props
}: React.ComponentProps<'div'> & { address: AddressType }) {
  return (
    <div className={classNames('whitespace-pre-wrap', className)} {...props}>
      <Classified>{formatAddress(address)}</Classified>
    </div>
  )
}
