import { EventEmitter } from 'node:events'

class SuperEventEmitter extends EventEmitter {
  emit(eventName: string | symbol, ...args: any[]) {
    super.emit('*', ...args)
    return super.emit(eventName, ...args)
  }
}

export let bus = new SuperEventEmitter()
