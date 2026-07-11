import { useId, useRef, useState } from 'react';
import { ImagePlus, Link2, Loader2, Upload } from 'lucide-react';
import { getImageUrl, type ImagePreset } from '../../utils/images';

interface Props {
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
  previewPreset?: ImagePreset;
  label?: string;
  hint?: string;
  allowUrl?: boolean;
  aspectClass?: string;
}

export default function ImageUploadField({
  value,
  onChange,
  onUpload,
  label = 'Imagen',
  hint,
  allowUrl = true,
  aspectClass = 'aspect-[16/9] max-h-48',
  previewPreset = 'preview',
}: Props) {
  const inputId = useId();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');

  async function handleFile(file: File | null) {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await onUpload(file);
      onChange(url);
      setMode('upload');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={allowUrl && mode === 'url' ? `${inputId}-url` : inputId} className="text-sm font-medium text-[var(--color-primary)]">
          {label}
        </label>
        {allowUrl && (
          <button
            type="button"
            onClick={() => setMode((m) => (m === 'upload' ? 'url' : 'upload'))}
            className="text-xs text-[var(--color-brand)] hover:underline inline-flex items-center gap-1"
          >
            {mode === 'upload' ? (
              <>
                <Link2 className="w-3.5 h-3.5" />
                Usar enlace externo
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                Subir archivo
              </>
            )}
          </button>
        )}
      </div>

      {hint && <p className="text-xs text-[var(--color-muted)]">{hint}</p>}

      {mode === 'upload' ? (
        <label
          htmlFor={inputId}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-border-strong)] bg-[var(--color-secondary)]/40 px-4 py-8 cursor-pointer hover:border-[var(--color-brand)]/50 transition-colors ${uploading ? 'pointer-events-none opacity-70' : ''}`}
        >
          <input
            id={inputId}
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={uploading}
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          />
          {uploading ? (
            <Loader2 className="w-8 h-8 text-[var(--color-brand)] animate-spin" />
          ) : (
            <ImagePlus className="w-8 h-8 text-[var(--color-muted)]" />
          )}
          <span className="text-sm text-[var(--color-muted)] text-center">
            {uploading ? 'Subiendo…' : 'Haz clic o arrastra una imagen (máx. 10 MB)'}
          </span>
        </label>
      ) : (
        <input
          id={`${inputId}-url`}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="w-full px-4 py-3 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
        />
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}

      {value && (
        <div className={`rounded-xl overflow-hidden border border-[var(--color-border)] ${aspectClass} bg-[var(--color-secondary)]`}>
          <img
            src={getImageUrl(value, 0, previewPreset)}
            alt="Vista previa"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
