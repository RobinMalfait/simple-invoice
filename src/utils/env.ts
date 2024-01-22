import { z } from 'zod'

export let env = z
  .object({
    /** @deprecated use process.env.NEXT_PUBLIC_ENVIRONMENT instead */
    DATA_SOURCE_FILE: z.string().default('example'),

    CLASSIFIED_MODE: z.preprocess((value) => {
      return value === 'true' || value === '1'
    }, z.boolean()),
  })
  .parse(process.env)
