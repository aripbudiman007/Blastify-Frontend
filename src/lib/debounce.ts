/**
 * Debounce utility to prevent multiple rapid calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId)

    timeoutId = setTimeout(() => {
      func(...args)
      timeoutId = null
    }, delay)
  }
}

/**
 * Throttle utility to limit function calls
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function (...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Request deduplication - prevent duplicate requests in flight
 */
const requestCache = new Map<string, Promise<any>>()

export async function dedupedRequest<T>(
  key: string,
  requestFn: () => Promise<T>
): Promise<T> {
  if (requestCache.has(key)) {
    return requestCache.get(key)!
  }

  const promise = requestFn().finally(() => {
    requestCache.delete(key)
  })

  requestCache.set(key, promise)
  return promise
}
