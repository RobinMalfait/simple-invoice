import { z } from 'zod'

export let env = z
  .object({
    DATA_SOURCE_FILE: z.string().default('example'),
    CLASSIFIED_MODE: z.preprocess((value) => value === 'true' || value === '1', z.boolean()),
  })
  .parse(process.env)
