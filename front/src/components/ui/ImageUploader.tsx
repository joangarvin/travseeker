import { useState, type ChangeEvent, type DragEvent } from 'react';
import { Image as ImageIcon, UploadCloud } from 'lucide-react';
import { api } from '../../services/api';
import { imageUrl } from '../../utils';
import { MediaImage } from './MediaImage';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

type ImageUploaderProps = {
  id: string;
  label: string;
  value?: string | null;
  token: string;
  endpoint: string;
  onChange: (url: string) => void;
  extraData?: Record<string, string>;
  circular?: boolean;
};

export function ImageUploader({
  id,
  label,
  value,
  token,
  endpoint,
  onChange,
  extraData,
  circular = false,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const uploadFile = async (file?: File) => {
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('Elige una imagen JPG, PNG, WebP o GIF.');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setError('La imagen supera el máximo de 10 MB.');
      return;
    }

    setUploading(true);
    setError('');

    const body = new FormData();
    body.append('image', file);
    Object.entries(extraData || {}).forEach(([key, data]) => body.append(key, data));

    try {
      const result = await api<{ url: string }>(endpoint, { method: 'POST', body }, token);
      onChange(result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void uploadFile(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void uploadFile(event.dataTransfer.files?.[0]);
  };

  return (
    <div
      className={`image-uploader ${circular ? 'image-uploader--circular' : ''} ${dragging ? 'is-dragging' : ''}`}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setDragging(false);
        }
      }}
      onDrop={handleDrop}
    >
      <div className="image-uploader__preview">
        {value ? (
          <MediaImage src={imageUrl(value)} alt="Vista previa" />
        ) : (
          <ImageIcon aria-hidden />
        )}
      </div>

      <div>
        <strong>{label}</strong>
        <p>Arrastra una imagen aquí o selecciónala. JPG, PNG, WebP o GIF · máximo 10 MB.</p>
        <label className="button button--secondary" htmlFor={id}>
          <UploadCloud /> {uploading ? 'Subiendo…' : value ? 'Cambiar imagen' : 'Elegir imagen'}
        </label>
        <input
          className="sr-only"
          id={id}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(',')}
          onChange={handleInputChange}
          disabled={uploading}
        />
        {error && (
          <small className="image-uploader__error" role="alert">
            {error}
          </small>
        )}
      </div>
    </div>
  );
}
