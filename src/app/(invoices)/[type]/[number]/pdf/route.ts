import { kebab, lower, upper } from 'case'
import { format } from 'date-fns'
import { redirect } from 'next/navigation'
import puppeteer from 'puppeteer'
import { invoices } from '~/data'
import { config } from '~/domain/configuration/configuration'
import { match } from '~/utils/match'

export async function GET(
  request: Request,
  { params }: { params: { type: string; number: string } },
) {
  let query = new URL(request.url).searchParams
  let invoice = invoices.find(
    (invoice) => invoice.type === params.type && invoice.number === params.number,
  )
  const type = query.has('preview') ? 'preview' : 'download'

  if (!invoice) {
    return redirect(`/`)
  }

  let filenameTemplate = config()[invoice.type].pdf.filename
  let filename = filenameTemplate.replace(/{{([^}]+)}}/g, (_, value) => {
    let transformations: string[] = value.split('|')
    let [path, arg] = transformations.shift()?.split(':') ?? []

    let segments = path.split('.')
    let next: any = invoice
    for (let segment of segments) {
      next = next[segment]
      if (next === undefined || next === null) {
        throw new Error(`Could not find property ${segment} in ${path}`)
      }
    }

    if (next instanceof Date) {
      next = format(next, arg ?? 'yyyy-MM-dd')
    }

    if (transformations.length > 0) {
      for (let transform of transformations) {
        next = match(transform, {
          lower: () => lower(next),
          upper: () => upper(next),
          kebab: () => kebab(next),
        })
      }
    }

    return next
  })

  return presentPDF(filename, await generatePDF(request.url.replace('/pdf', '/raw')), type)
}

function presentPDF(filename: string, data: Buffer, type: 'download' | 'preview') {
  let types = {
    download: 'attachment',
    preview: 'inline',
  }

  return new Response(data, {
    status: 201,
    headers: {
      'Content-Disposition': `${types[type]}; filename="${filename}"`,
      'Content-Length': Buffer.byteLength(data).toString(),
    },
  })
}

async function generatePDF(url: string) {
  let browser = await puppeteer.launch({ headless: 'new' })
  let page = await browser.newPage()

  await page.goto(url)

  // Give the page time to load
  await new Promise((resolve) => setTimeout(resolve, 1000))
  let pdfBuffer = await page.pdf({ printBackground: true, format: 'A4', preferCSSPageSize: true })

  await browser.close()

  return pdfBuffer
}
