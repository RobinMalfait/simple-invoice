import { toDataURL } from 'qrcode'
import { useEffect, useState } from 'react'

export function QRCode({
  children,
  margin = 0,
  scale = 4,
}: {
  children: string
  margin?: number
  scale?: number
}) {
  let [qrCode, setQrCode] = useState<string | null>(null)
  useEffect(() => {
    let state = {
      mounted: true,
    }

    toDataURL(children, { margin, scale }).then((data) => {
      if (!state.mounted) return
      setQrCode(data)
    })

    return () => {
      state.mounted = false
    }
  }, [children, margin, scale])

  // eslint-disable-next-line @next/next/no-img-element
  return qrCode === null ? <div className="aspect-square h-28 w-28" /> : <img alt="" src={qrCode} />
}
