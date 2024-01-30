export class DefaultMap<T = string, V = any> extends Map<T, V> {
  constructor(private factory: (key: T) => V) {
    super()
  }

  get(key: T): V {
    if (!this.has(key)) {
      this.set(key, this.factory(key))
    }

    return super.get(key)!
  }
}
