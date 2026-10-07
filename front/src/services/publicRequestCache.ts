// Only public editorial endpoints belong here. Never cache accounts or trips.
export function isPublicDataPath(path: string) {
  const pathname = path.split('?')[0];
  return (
    /^\/municipios\/[^/]+\/?$/.test(pathname) ||
    /^\/(?:destacados|stats|mapa|activities|tourism-types)\/?$/.test(pathname) ||
    /^\/destinos(?:\/[^/]+(?:\/(?:relacionados|climate))?)?\/?$/.test(pathname)
  );
}

export function createRequestCache(ttlMs = 60_000, now = Date.now) {
  const values = new Map<string, { value: unknown; expires: number; size: number }>();
  const pending = new Map<string, Promise<unknown>>();
  let generation = 0;
  let size = 0;
  function clear() {
    generation += 1;
    values.clear();
    pending.clear();
    size = 0;
  }
  async function read<T>(key: string, load: () => Promise<T>): Promise<T> {
    const cached = values.get(key);
    if (cached && cached.expires > now()) return structuredClone(cached.value) as T;
    if (cached) {
      values.delete(key);
      size -= cached.size;
    }
    const existing = pending.get(key);
    if (existing) return structuredClone(await existing) as T;
    const started = generation;
    const request = Promise.resolve()
      .then(load)
      .then((value) => {
        const length = JSON.stringify(value).length;
        if (started === generation && length <= 4_000_000) {
          while (values.size >= 100 || size + length > 4_000_000) {
            const oldest = values.keys().next().value!;
            size -= values.get(oldest)!.size;
            values.delete(oldest);
          }
          values.set(key, { value: structuredClone(value), expires: now() + ttlMs, size: length });
          size += length;
        }
        return value;
      });
    pending.set(key, request);
    try {
      return structuredClone(await request);
    } finally {
      if (pending.get(key) === request) pending.delete(key);
    }
  }
  return { read, clear };
}

// A component cancelling its subscription must not cancel another component's
// identical request (including React StrictMode's mount/unmount/remount).
export function withAbort<T>(request: Promise<T>, signal?: AbortSignal | null): Promise<T> {
  if (!signal) return request;
  return new Promise((resolve, reject) => {
    const abort = () => reject(signal.reason || new DOMException('Aborted', 'AbortError'));
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
    request.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
  });
}
