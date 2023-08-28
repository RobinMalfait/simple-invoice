// Ideally we can just use `crypto.randomUUID()` but right now we can't because we want the IDs to
// be stable over rebuilds.
//
// Once we have a database, we can use randomUUID()'s again or use the database's auto-incrementing IDs.
export class ScopedIDGenerator {
  constructor(
    public scope: string = '',
    public id: number = 0,
  ) {}

  next() {
    return `${this.scope}-${++this.id}`
  }
}
