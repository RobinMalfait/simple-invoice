import { Account } from '~/domain/account/account'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'

type Entity = Quote | Invoice | Receipt

let data = require(`./${process.env.DATA_SOURCE_FILE}.ts`)

export let me: Account = data.me
export let invoices: Entity[] = (
  Array.from(
    new Set( // Make unique using identity
      data.invoices.flatMap((entity: Entity) => {
        if (entity.type === 'quote') {
          return [entity]
        } else if (entity.type === 'invoice') {
          return [entity, entity.quote].filter(Boolean)
        } else if (entity.type === 'receipt') {
          return [entity, entity.invoice, entity.invoice.quote].filter(Boolean)
        }
      }),
    ),
  ) as Entity[]
)
  // Make unique using ID
  .filter((entity, idx, all) => all.findIndex((other) => other.id === entity.id) === idx)
