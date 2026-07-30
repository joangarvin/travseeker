import { API_BASE } from '../api/config';

export async function downloadDestination(id: string, imageUrl: string): Promise<boolean> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return false;
  const worker = registration.active;
  if (!worker) return false;
  const channel = new MessageChannel();
  const result = new Promise<boolean>((resolve) => {
    const timer = window.setTimeout(() => resolve(false), 10000);
    channel.port1.onmessage = (event) => { window.clearTimeout(timer); resolve(event.data?.ok === true); };
  });
  worker.postMessage({ type: 'CACHE_DESTINATION', urls: [`${API_BASE}/api/destinos/${id}`, imageUrl, window.location.href] }, [channel.port2]);
  return result;
}
