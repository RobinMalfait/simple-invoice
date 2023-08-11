export class IncrementStrategy {
  private state: number = 0

  public constructor(private significantDigits = 4) {}

  public next = (): string => {
    return `${++this.state}`.padStart(this.significantDigits, '0')
  }
}
