export function Avatar({ url, name }: { url: string | null; name: string }) {
  return (
    <div className="relative grid h-12 w-12 place-content-center rounded-full bg-white dark:bg-zinc-700 dark:text-zinc-300">
      <span className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/10"></span>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="h-full w-full rounded-full" src={url} alt="" />
      ) : (
        <span className="uppercase">
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
