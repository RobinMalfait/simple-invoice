import { redirect } from 'next/navigation'
import puppeteer from 'puppeteer'
import { invoices } from '~/data'

export async function GET(request: Request, { params, ...rest }: { params: { number: string } }) {
  let query = new URL(request.url).searchParams
  let invoice = invoices.find((invoice) => invoice.number === params.number)
  const type = query.has('preview') ? 'preview' : 'download'

  if (!invoice) {
    return redirect(`/`)
  }

  return presentPDF(
    invoice.number + '.pdf',
    await generatePDF(request.url.replace('/pdf', '/raw')),
    type,
  )
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
