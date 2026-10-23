function abortableDelay(ms: number, signal?: AbortSignal | null) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason || new DOMException('Aborted', 'AbortError'));
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      reject(signal?.reason || new DOMException('Aborted', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', abort, { once: true });
  });
}
// One retry for a failed read transport, never for an HTTP error, JSON error or write.
// The caller keeps coalescing identical requests around this entire operation.
export async function withReadRetry<T>(
  request: () => Promise<T>,
  method: string,
  signal?: AbortSignal | null,
  wait = abortableDelay,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    signal?.throwIfAborted();
    try {
      return await request();
    } catch (error) {
      signal?.throwIfAborted();
      if (attempt > 0 || !['GET', 'HEAD'].includes(method) || !(error instanceof TypeError))
        throw error;
      await wait(200 + Math.random() * 200, signal);
    }
  }
}
