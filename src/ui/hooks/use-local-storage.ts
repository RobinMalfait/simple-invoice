import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import { useIsomorphicEffect } from './use-isomorphic-effect'

export function useLocalStorageState<T>(
  key: string,
  defaultValue?: T,
): [T, Dispatch<SetStateAction<T>>] {
  let global_key = `use-local-storage-state.${key}`

  let [value, setValue] = useState<T>(defaultValue!)

  useIsomorphicEffect(() => {
    let storageValue =
      typeof window !== 'undefined' ? window.localStorage.getItem(global_key) : null
    setValue(storageValue === null ? defaultValue : JSON.parse(storageValue))
  }, [defaultValue, global_key])

  let updateValue = useCallback(
    (newValue: T | ((value: T) => T)) => {
      function isCallable(value: any): value is (Value: T) => T {
        return typeof value === 'function'
      }

      setValue((value) => {
        let result = isCallable(newValue) ? newValue(value) : newValue

        // Same as default, we can just cleanup instead
        if (result === defaultValue) {
          localStorage.removeItem(global_key)
        } else {
          localStorage.setItem(global_key, JSON.stringify(result))
        }

        return result
      })
    },
    [defaultValue, global_key],
  )

  // Checks for changes across tabs and iframes
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.storageArea === localStorage && event.key === global_key) {
        setValue(event.newValue === null ? defaultValue : JSON.parse(event.newValue))
      }
    }

    window.addEventListener('storage', onStorage)
    return () => {
      return window.removeEventListener('storage', onStorage)
    }
  })

  return [value, updateValue]
}
