interface Props {
  message: string;
  variant: 'error' | 'success';
}

export default function AdminAlert({ message, variant }: Props) {
  return (
    <div
      className={`admin-alert admin-alert--${variant}`}
      role="alert"
    >
      {message}
    </div>
  );
}
