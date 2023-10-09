import { toDataURL } from 'qrcode'

export async function QRCode({
  children,
  margin = 0,
  scale = 4,
}: {
  children: string
  margin?: number
  scale?: number
}) {
  let qrCode = await toDataURL(children, { margin, scale })

  // eslint-disable-next-line @next/next/no-img-element
  return <img alt="" src={qrCode} />
}
