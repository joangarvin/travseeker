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
  /** @deprecated use previewClassName */
  aspectClass?: string;
  previewClassName?: string;
}

export default function ImageUploadField({
  value,
  onChange,
  onUpload,
  label = 'Imagen',
  hint,
  allowUrl = true,
  aspectClass,
  previewClassName = 'image-upload-preview image-upload-preview--landscape',
  previewPreset = 'preview',
}: Props) {
  const previewClass = previewClassName || aspectClass || 'image-upload-preview image-upload-preview--landscape';
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
    <div className="image-upload">
      <div className="image-upload__head">
        <label htmlFor={allowUrl && mode === 'url' ? `${inputId}-url` : inputId} className="image-upload__label">
          {label}
        </label>
        {allowUrl && (
          <button
            type="button"
            onClick={() => setMode((m) => (m === 'upload' ? 'url' : 'upload'))}
            className="image-upload__mode-btn"
          >
            {mode === 'upload' ? (
              <>
                <Link2 className="icon-sm" />
                Usar enlace externo
              </>
            ) : (
              <>
                <Upload className="icon-sm" />
                Subir archivo
              </>
            )}
          </button>
        )}
      </div>

      {hint && <p className="image-upload__hint">{hint}</p>}

      {mode === 'upload' ? (
        <label
          htmlFor={inputId}
          className={`image-upload__drop ${uploading ? 'is-busy' : ''}`}
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
            <Loader2 className="icon-lg icon-brand icon-spin" />
          ) : (
            <ImagePlus className="icon-lg icon-muted" />
          )}
          <span className="image-upload__drop-text">
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
          className="ui-input"
        />
      )}

      {error && (
        <p className="ui-field__error" role="alert">
          {error}
        </p>
      )}

      {value && (
        <div className={previewClass}>
          <img
            src={getImageUrl(value, 0, previewPreset)}
            alt="Vista previa"
            loading="lazy"
          />
        </div>
      )}
    </div>
  );
}
