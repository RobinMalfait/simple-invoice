import { EventEmitter } from 'node:events'

export class SuperEventEmitter extends EventEmitter {
  constructor() {
    super()
    this.setMaxListeners(1000)
  }

  emit(eventName: string | symbol, ...args: any[]) {
    super.emit('*', ...args)
    return super.emit(eventName, ...args)
  }
}

export let bus = new SuperEventEmitter()
