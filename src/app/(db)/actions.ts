'use server'

import fs from 'fs/promises'
import { revalidatePath } from 'next/cache'
import path from 'path'
import { env } from '~/utils/env'
import { match } from '~/utils/match'

async function persist(data: DB) {
  let file = path.resolve(process.cwd(), 'db.json')
  await fs.writeFile(file, JSON.stringify(data))
  revalidatePath('/')
}

export type DB = {
  ui: {
    sidebar: 'small' | 'large'
    classified: boolean
  }
}

let defaults: DB = {
  ui: {
    sidebar: 'large',
    classified: env.CLASSIFIED_MODE,
  },
}

function mergeWithDefaults(data: DB, defaults: DB) {
  return {
    ...defaults,
    ...data,
    ui: {
      ...defaults.ui,
      ...data.ui,
    },
  }
}

export async function load(): Promise<DB> {
  let file = path.resolve(process.cwd(), 'db.json')
  let data = await fs
    .readFile(file, 'utf-8')
    .then((x) => JSON.parse(x))
    .catch(() => ({}))

  return mergeWithDefaults(data, defaults)
}

async function mutate(cb: (config: DB) => void) {
  let config = await load()
  await Promise.resolve(cb(config))
  return persist(config)
}

export async function toggleSidebar() {
  return mutate((config) => {
    config.ui.sidebar = match(config.ui.sidebar, {
      small: 'large',
      large: 'small',
    })
  })
}

export async function toggleClassified() {
  return mutate((config) => {
    config.ui.classified = !config.ui.classified
  })
}