import { format } from 'date-fns'

export const Base = {
  yyyyMMdd: (date: Date) => format(date, 'yyyyMMdd'),
  yyyyQ: (date: Date) => format(date, 'yyyyQ'),
  yyQ: (date: Date) => format(date, 'yyQ'),
  yyQQ: (date: Date) => format(date, 'yyQQ'),
  yy: (date: Date) => format(date, 'yy'),
}

export class DateBasedStrategy {
  private countsByDate = new Map<string, number>()

  public constructor(
    private base = Base.yyyyMMdd,
    private significantDigits = 3,
  ) {}

  public next = (issueDate: Date): string => {
    let base = this.base(issueDate)

    if (this.countsByDate.has(base)) {
      this.countsByDate.set(base, this.countsByDate.get(base)! + 1)
    } else {
      this.countsByDate.set(base, 1)
    }

    let postfix = `${this.countsByDate.get(base)}`.padStart(this.significantDigits, '0')
    return `${base}${postfix}`
  }
}
