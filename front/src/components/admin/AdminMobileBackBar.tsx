import { ArrowLeft } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function AdminMobileBackBar({ onBack }: Props) {
  return (
    <div className="admin-back-bar">
      <button type="button" onClick={onBack} className="admin-back-bar__btn">
        <ArrowLeft className="icon-sm" />
        Volver a la lista
      </button>
    </div>
  );
}
