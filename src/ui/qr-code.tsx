import { toDataURL } from 'qrcode'

export async function QRCode({ children }: { children: string }) {
  let qrCode = await toDataURL(children, { margin: 0 })

  // eslint-disable-next-line @next/next/no-img-element
  return <img alt="" src={qrCode} />
}
