import { API_BASE } from './config';
import { ApiError } from './client';

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

async function parseErrorMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => res.statusText);
  try {
    const json = JSON.parse(text) as { error?: string };
    return json.error || text || `HTTP ${res.status}`;
  } catch {
    return text || `HTTP ${res.status}`;
  }
}

export async function uploadAvatar(file: File, token: string): Promise<UploadResult> {
  const body = new FormData();
  body.append('image', file);

  const res = await fetch(`${API_BASE}/api/upload/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res));
  }

  return res.json() as Promise<UploadResult>;
}

export async function uploadDestinoCover(
  file: File,
  token: string,
  destinoId?: string,
): Promise<UploadResult> {
  const body = new FormData();
  body.append('image', file);
  if (destinoId) body.append('destinoId', destinoId);

  const res = await fetch(`${API_BASE}/api/upload/destino`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res));
  }

  return res.json() as Promise<UploadResult>;
}

export async function getUploadStatus(): Promise<{ configured: boolean }> {
  const res = await fetch(`${API_BASE}/api/upload/status`);
  if (!res.ok) return { configured: false };
  return res.json() as Promise<{ configured: boolean }>;
}
