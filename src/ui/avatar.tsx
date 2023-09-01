import { classNames } from '~/ui/class-names'
import { match } from '~/utils/match'

export function Avatar({
  url,
  name,
  size = 'base',
}: {
  url: string | null
  name: string
  size?: 'sm' | 'base'
}) {
  return (
    <div
      className={classNames(
        'relative grid shrink-0 place-content-center rounded-full bg-white dark:bg-zinc-700 dark:text-zinc-300',
        match(size, {
          base: 'h-12 w-12',
          sm: 'h-8 w-8 text-sm',
        }),
      )}
    >
      <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/10"></span>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="h-full w-full shrink-0 rounded-full" src={url} alt="" />
      ) : (
        <span className="shrink-0 uppercase">
          {name
            .split(' ')
            .map((x) => x[0])
            .filter(Boolean)
            .slice(0, 2)
            .join('')}
        </span>
      )}
    </div>
  )
}
