export type Disposables = ReturnType<typeof disposables>

export function disposables() {
  let _disposables: Function[] = []

  let api = {
    addEventListener<TEventName extends keyof WindowEventMap>(
      element: HTMLElement | Window | Document,
      name: TEventName,
      listener: (event: WindowEventMap[TEventName]) => any,
      options?: boolean | AddEventListenerOptions,
    ) {
      element.addEventListener(name, listener as any, options)
      return api.add(() => {
        return element.removeEventListener(name, listener as any, options)
      })
    },

    setTimeout(...args: Parameters<typeof setTimeout>) {
      let timer = setTimeout(...args)
      return api.add(() => {
        return clearTimeout(timer)
      })
    },

    add(cb: () => void) {
      _disposables.push(cb)
      return () => {
        let idx = _disposables.indexOf(cb)
        if (idx >= 0) {
          for (let dispose of _disposables.splice(idx, 1)) {
            dispose()
          }
        }
      }
    },

    dispose() {
      for (let dispose of _disposables.splice(0)) {
        dispose()
      }
    },
  }

  return api
}
