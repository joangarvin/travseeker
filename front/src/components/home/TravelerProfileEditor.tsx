import { useEffect, useState } from 'react';
import { Check, Pencil, Sparkles, Users, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { TRAVEL_BUDGETS, TRAVEL_TYPES } from '../../constants/travelProfile';

interface Props { onSaved: () => void }

export default function TravelerProfileEditor({ onSaved }: Props) {
  const { user, updateProfile } = useAuth();
  const travel = user?.preferences?.travel;
  const [open, setOpen] = useState(!travel?.tipos?.length && !travel?.presupuesto && !travel?.evitarMasificacion);
  const [types, setTypes] = useState<string[]>(travel?.tipos ?? []);
  const [budget, setBudget] = useState(travel?.presupuesto ?? '');
  const [avoidCrowds, setAvoidCrowds] = useState(travel?.evitarMasificacion ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setTypes(travel?.tipos ?? []);
    setBudget(travel?.presupuesto ?? '');
    setAvoidCrowds(travel?.evitarMasificacion ?? false);
  }, [travel?.tipos, travel?.presupuesto, travel?.evitarMasificacion]);

  const summary = [types.slice(0, 2).join(' · '), budget ? `Presupuesto ${budget.toLowerCase()}` : '', avoidCrowds ? 'Sitios tranquilos' : ''].filter(Boolean).join(' · ');

  const save = async () => {
    setSaving(true); setError(''); setSaved(false);
    try {
      await updateProfile({ preferences: { travel: { tipos: types, presupuesto: budget || undefined, evitarMasificacion: avoidCrowds } } });
      setSaved(true); setOpen(false); onSaved();
      window.setTimeout(() => setSaved(false), 1800);
    } catch (err) { setError(err instanceof Error ? err.message : 'No se pudo guardar'); }
    finally { setSaving(false); }
  };

  return <div className={`traveler-profile ${open ? 'is-open' : ''}`}>
    <div className="traveler-profile__head">
      <span className="traveler-profile__icon"><Sparkles className="icon-sm" /></span>
      <div><h3>Sobre ti</h3><p>{summary || 'Cuéntanos cómo te gusta viajar y afinaremos estas propuestas.'}</p></div>
      <button type="button" className="traveler-profile__edit" onClick={() => setOpen((value) => !value)}>{open ? <X className="icon-sm" /> : <Pencil className="icon-sm" />}{open ? 'Cerrar' : 'Editar'}</button>
    </div>
    {open && <div className="traveler-profile__form">
      <fieldset><legend>¿Qué viajes te apetecen?</legend><div className="traveler-profile__chips">{TRAVEL_TYPES.map((type) => <button key={type} type="button" aria-pressed={types.includes(type)} className={types.includes(type) ? 'is-active' : ''} onClick={() => setTypes((current) => current.includes(type) ? current.filter((item) => item !== type) : [...current, type])}>{type}</button>)}</div></fieldset>
      <label className="traveler-profile__budget">Tu presupuesto habitual<select className="ui-input" value={budget} onChange={(event) => setBudget(event.target.value)}><option value="">Me da igual</option>{TRAVEL_BUDGETS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      <button type="button" role="switch" aria-checked={avoidCrowds} className={`traveler-profile__crowds ${avoidCrowds ? 'is-active' : ''}`} onClick={() => setAvoidCrowds((value) => !value)}><Users className="icon-sm" /><span><strong>Prefiero evitar aglomeraciones</strong><small>Priorizaremos destinos más tranquilos.</small></span><i /></button>
      {error && <p className="traveler-profile__error">{error}</p>}
      <button type="button" className="btn-cta traveler-profile__save" onClick={save} disabled={saving}>{saving ? 'Afinando…' : 'Guardar y actualizar destinos'}</button>
    </div>}
    {saved && <span className="traveler-profile__saved"><Check className="icon-sm" /> Perfil actualizado</span>}
  </div>;
}
