import { Account } from '~/domain/account/account'
import { Invoice } from '~/domain/invoice/invoice'
import { Quote } from '~/domain/quote/quote'
import { Receipt } from '~/domain/receipt/receipt'

export let me: Account
export let invoices: (Quote | Invoice | Receipt)[]

module.exports = require(`./${process.env.DATA_SOURCE_FILE}.ts`)
