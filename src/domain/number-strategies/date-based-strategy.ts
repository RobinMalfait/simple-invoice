import { format } from 'date-fns'

export let Base = {
  yyyyMMdd: (date: Date) => {
    return format(date, 'yyyyMMdd')
  },
  yyyyQ: (date: Date) => {
    return format(date, 'yyyyQ')
  },
  yyQ: (date: Date) => {
    return format(date, 'yyQ')
  },
  yyQQ: (date: Date) => {
    return format(date, 'yyQQ')
  },
  yy: (date: Date) => {
    return format(date, 'yy')
  },
}

export class DateBasedStrategy {
  private countsByDate = new Map<string, number>()

  public constructor(
    private base = Base.yyyyMMdd,
    private significantDigits = 3,
  ) {}

  public next = (date: Date): string => {
    let base = this.base(date)

    if (this.countsByDate.has(base)) {
      this.countsByDate.set(base, this.countsByDate.get(base)! + 1)
    } else {
      this.countsByDate.set(base, 1)
    }

    let postfix = `${this.countsByDate.get(base)}`.padStart(this.significantDigits, '0')
    return `${base}${postfix}`
  }
}
