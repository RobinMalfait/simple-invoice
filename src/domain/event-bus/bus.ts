import { EventEmitter } from 'node:events'

export class SuperEventEmitter extends EventEmitter {
  emit(eventName: string | symbol, ...args: any[]) {
    super.emit('*', ...args)
    return super.emit(eventName, ...args)
  }
}

export let bus = new SuperEventEmitter()
