import { Account } from '~/domain/account/account'
import { Invoice } from '~/domain/invoice/invoice'

export let me: Account
export let invoices: Invoice[]

module.exports = require(`./${process.env.DATA_SOURCE_FILE}.ts`)
