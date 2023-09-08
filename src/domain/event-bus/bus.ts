import { EventEmitter } from 'node:events'
import { trackMilestones } from '~/domain/milestone/milestone'

export let bus = new EventEmitter()

trackMilestones(bus)
