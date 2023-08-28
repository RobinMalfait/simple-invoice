import { redirect } from 'next/navigation'
import puppeteer from 'puppeteer'
import { records } from '~/data'
import { config } from '~/domain/configuration/configuration'
import { render } from '~/utils/tl'

export async function GET(
  request: Request,
  { params }: { params: { type: string; number: string } },
) {
  let query = new URL(request.url).searchParams
  let record = records.find(
    (record) => record.type === params.type && record.number === params.number,
  )
  const type = query.has('preview') ? 'preview' : 'download'

  if (!record) {
    return redirect(`/`)
  }

  let filenameTemplate = config()[record.type].pdf.filename
  let filename = render(filenameTemplate, record)

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
  await page.waitForSelector('[data-pdf-state="ready"]', {
    timeout: 2 * 60 * 1000, // 2 minutes
  })
  let pdfBuffer = await page.pdf({ printBackground: true, format: 'A4', preferCSSPageSize: true })

  await browser.close()

  return pdfBuffer
}
