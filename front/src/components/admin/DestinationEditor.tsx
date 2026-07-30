import { useMemo, useState } from 'react';
import { BookOpen, CalendarRange, Check, CheckCircle2, Image as ImageIcon, Link2, MapPinned, Search, Tag, Trash2 } from 'lucide-react';
import { api, plain } from '../../lib/api';
import { tourismTypes } from '../../lib/tourism';
import type { Destino, Municipio } from '../../types';
import { Button, Field, ImageUploader, Notice } from '../ui';
import { AdminModal } from './AdminModal';
import { CoordinatePicker } from './CoordinatePicker';

type Section = 'identity' | 'content' | 'season' | 'image' | 'location' | 'municipalities';
const sections: Array<{ id: Section; label: string; Icon: typeof Tag }> = [
  { id: 'identity', label: 'Identidad', Icon: Tag }, { id: 'content', label: 'Contenido', Icon: BookOpen }, { id: 'season', label: 'Temporadas', Icon: CalendarRange },
  { id: 'image', label: 'Portada', Icon: ImageIcon }, { id: 'location', label: 'Localización', Icon: MapPinned }, { id: 'municipalities', label: 'Municipios', Icon: Link2 },
];
const budgetOptions = ['Bajo', 'Medio-Bajo', 'Medio', 'Medio-Alto', 'Alto'];
const crowdOptions = ['Leve', 'Bajo', 'Medio-Bajo', 'Medio', 'Medio-Alto', 'Alto'];

export function DestinationEditor({ initial, municipalities, token, onChange, onClose }: { initial: Partial<Destino>; municipalities: Municipio[]; token: string; onChange: (destination: Destino) => void; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Destino>>(() => ({
    ...initial,
    ubicacion: plain(initial.ubicacion),
    tipoTurismoPrincipal: plain(initial.tipoTurismoPrincipal),
    tipoTurismoSecundario: plain(initial.tipoTurismoSecundario),
    presupuesto: plain(initial.presupuesto),
    masificacion: plain(initial.masificacion),
  }));
  const [section, setSection] = useState<Section>('identity');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [municipalityQuery, setMunicipalityQuery] = useState('');
  const associated = form.municipios || [];
  const candidates = useMemo(() => municipalities.filter((municipality) => !associated.some((item) => item.id === municipality.id) && municipality.nombre.toLowerCase().includes(municipalityQuery.toLowerCase())).slice(0, 30), [municipalities, associated, municipalityQuery]);
  const update = <K extends keyof Destino>(key: K, value: Destino[K]) => setForm((current) => ({ ...current, [key]: value }));

  const save = async (event?: React.FormEvent) => {
    event?.preventDefault(); setSaving(true); setMessage(null);
    try {
      const payload = { ...form, mesesJulioAgosto: Number(form.mesesJulioAgosto), mesesMayJunSeptOct: Number(form.mesesMayJunSeptOct), mesesNovAbril: Number(form.mesesNovAbril), latitud: form.latitud ?? null, longitud: form.longitud ?? null };
      const result = await api<Destino>(`/admin/destinos${form.id ? `/${form.id}` : ''}`, { method: form.id ? 'PUT' : 'POST', body: JSON.stringify(payload) }, token);
      setForm(result); onChange(result); setMessage({ tone: 'success', text: form.id ? 'Destino actualizado' : 'Destino creado. Ya puedes asociar municipios.' });
    } catch (cause) { setMessage({ tone: 'error', text: cause instanceof Error ? cause.message : 'No se pudo guardar el destino' }); }
    finally { setSaving(false); }
  };
  const linkMunicipality = async (municipality: Municipio) => {
    if (!form.id) return;
    try { await api(`/admin/destinos/${form.id}/municipios`, { method: 'POST', body: JSON.stringify({ municipioId: municipality.id }) }, token); setForm((current) => ({ ...current, municipios: [...(current.municipios || []), municipality].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')) })); }
    catch (cause) { setMessage({ tone: 'error', text: cause instanceof Error ? cause.message : 'No se pudo asociar el municipio' }); }
  };
  const unlinkMunicipality = async (municipality: Municipio) => {
    if (!form.id) return;
    try { await api(`/admin/destinos/${form.id}/municipios/${municipality.id}`, { method: 'DELETE' }, token); setForm((current) => ({ ...current, municipios: (current.municipios || []).filter((item) => item.id !== municipality.id) })); }
    catch (cause) { setMessage({ tone: 'error', text: cause instanceof Error ? cause.message : 'No se pudo retirar el municipio' }); }
  };

  return <AdminModal wide title={form.id ? `Editar ${form.nombre}` : 'Crear un destino'} subtitle="Completa cada apartado. Puedes guardar y continuar cuando quieras." onClose={onClose}><form className="admin-editor" onSubmit={save}>
    <nav className="admin-editor__nav" aria-label="Apartados del destino" role="tablist">{sections.map(({ id, label, Icon }) => <button type="button" role="tab" aria-selected={section === id} className={section === id ? 'is-active' : ''} onClick={() => setSection(id)} key={id}><Icon /><span>{label}</span>{id === 'municipalities' && <b>{associated.length}</b>}</button>)}</nav>
    <div className="admin-editor__content">
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      {section === 'identity' && <section className="editor-section" aria-labelledby="editor-identity"><header><span>01</span><div><h3 id="editor-identity">Identidad y clasificación</h3><p>Cómo se llama, dónde está y qué clase de experiencia propone.</p></div></header><div className="form-grid"><Field label="Nombre del destino" htmlFor="admin-name"><input id="admin-name" value={form.nombre || ''} onChange={(event) => update('nombre', event.target.value)} required /></Field><Field label="Zona o región" htmlFor="admin-location"><input id="admin-location" value={form.ubicacion || ''} onChange={(event) => update('ubicacion', event.target.value)} required placeholder="Navarra · Interior" /></Field><Field label="Tipo principal" htmlFor="admin-type"><select id="admin-type" value={plain(form.tipoTurismoPrincipal)} onChange={(event) => update('tipoTurismoPrincipal', event.target.value)} required><option value="">Elige un tipo</option>{tourismTypes.map((type) => <option key={type.key}>{type.label}</option>)}</select></Field><Field label="Tipo secundario" htmlFor="admin-secondary"><select id="admin-secondary" value={plain(form.tipoTurismoSecundario)} onChange={(event) => update('tipoTurismoSecundario', event.target.value)} required><option value="">Elige un tipo</option>{tourismTypes.map((type) => <option key={type.key}>{type.label}</option>)}</select></Field><Field label="Presupuesto" htmlFor="admin-budget"><select id="admin-budget" value={plain(form.presupuesto)} onChange={(event) => update('presupuesto', event.target.value)} required>{budgetOptions.map((value) => <option key={value}>{value}</option>)}</select></Field><Field label="Afluencia general" htmlFor="admin-crowd"><select id="admin-crowd" value={plain(form.masificacion)} onChange={(event) => update('masificacion', event.target.value)} required>{crowdOptions.map((value) => <option key={value}>{value}</option>)}</select></Field></div><Field label="Etiqueta interna o agrupación" htmlFor="admin-item" hint="Opcional. Úsala para ordenar o agrupar destinos internamente."><input id="admin-item" value={form.destinosItem || ''} onChange={(event) => update('destinosItem', event.target.value)} /></Field></section>}
      {section === 'content' && <section className="editor-section" aria-labelledby="editor-content"><header><span>02</span><div><h3 id="editor-content">Texto y contenido</h3><p>Escribe para ayudar a decidir, no para vender el destino.</p></div></header><Field label="Descripción" htmlFor="admin-description" hint="Puedes usar párrafos, listas y texto en negrita."><textarea id="admin-description" className="editor-textarea" value={form.descripcion || ''} onChange={(event) => update('descripcion', event.target.value)} required /></Field><Field label="Imprescindibles" htmlFor="admin-essentials" hint="Incluye lugares, experiencias y advertencias prácticas."><textarea id="admin-essentials" className="editor-textarea" value={form.imprescindibles || ''} onChange={(event) => update('imprescindibles', event.target.value)} required /></Field></section>}
      {section === 'season' && <section className="editor-section" aria-labelledby="editor-season"><header><span>03</span><div><h3 id="editor-season">Afluencia por temporada</h3><p>0 significa muy tranquilo; 100, máxima ocupación.</p></div></header><div className="season-editor">{([['mesesNovAbril','Noviembre — abril'],['mesesMayJunSeptOct','Mayo — junio / septiembre — octubre'],['mesesJulioAgosto','Julio — agosto']] as const).map(([key, label]) => <label key={key}><span><b>{label}</b><output>{Number(form[key] || 0)}%</output></span><input type="range" min="0" max="100" step="5" value={Number(form[key] || 0)} onChange={(event) => update(key, Number(event.target.value))} /></label>)}</div></section>}
      {section === 'image' && <section className="editor-section" aria-labelledby="editor-image"><header><span>04</span><div><h3 id="editor-image">Imagen de portada</h3><p>Sube el archivo directamente o pega una URL existente.</p></div></header><ImageUploader id="destination-cover" label="Portada del destino" value={form.imagen} token={token} endpoint="/upload/destino" extraData={form.id ? { destinoId: form.id } : undefined} onChange={(url) => update('imagen', url)} /><Field label="URL de la imagen" htmlFor="admin-image" hint="Se actualiza automáticamente cuando subes un archivo."><input id="admin-image" type="url" value={form.imagen || ''} onChange={(event) => update('imagen', event.target.value)} required /></Field></section>}
      {section === 'location' && <section className="editor-section" aria-labelledby="editor-map"><header><span>05</span><div><h3 id="editor-map">Punto en el mapa</h3><p>Haz clic en la localización aproximada y ajusta las coordenadas si hace falta.</p></div></header><CoordinatePicker latitude={form.latitud} longitude={form.longitud} onChange={(latitud, longitud) => setForm((current) => ({ ...current, latitud, longitud }))} /><div className="form-grid"><Field label="Latitud" htmlFor="admin-lat"><input id="admin-lat" type="number" min="-90" max="90" step="any" value={form.latitud ?? ''} onChange={(event) => update('latitud', event.target.value === '' ? null : Number(event.target.value))} /></Field><Field label="Longitud" htmlFor="admin-lng"><input id="admin-lng" type="number" min="-180" max="180" step="any" value={form.longitud ?? ''} onChange={(event) => update('longitud', event.target.value === '' ? null : Number(event.target.value))} /></Field></div></section>}
      {section === 'municipalities' && <section className="editor-section" aria-labelledby="editor-municipalities"><header><span>06</span><div><h3 id="editor-municipalities">Municipios asociados</h3><p>Estos municipios aparecerán en la ficha pública del destino.</p></div></header>{!form.id ? <Notice>Guarda primero el destino para poder asociar municipios.</Notice> : <div className="municipality-manager"><div className="municipality-manager__associated"><h4>Asociados · {associated.length}</h4>{associated.length ? associated.map((municipality) => <div key={municipality.id}><span><Check />{municipality.nombre}</span><button type="button" onClick={() => void unlinkMunicipality(municipality)} aria-label={`Retirar ${municipality.nombre}`}><Trash2 /></button></div>) : <p>Aún no has asociado municipios.</p>}</div><div className="municipality-manager__catalog"><h4>Buscar en el catálogo</h4><label className="admin-search"><Search /><span className="sr-only">Buscar municipio</span><input value={municipalityQuery} onChange={(event) => setMunicipalityQuery(event.target.value)} placeholder={`Buscar entre ${municipalities.length} municipios`} /></label><div>{candidates.map((municipality) => <button type="button" key={municipality.id} onClick={() => void linkMunicipality(municipality)}><span>{municipality.nombre}<small>{plain(municipality.tipoTurismo) || 'Sin categoría'}</small></span><Link2 /></button>)}</div></div></div>}</section>}
    </div>
    <footer className="admin-editor__footer"><span aria-live="polite">{message?.tone === 'success' && <><CheckCircle2 /> {message.text}</>}</span><Button type="button" variant="quiet" onClick={onClose}>Cerrar</Button><Button type="submit" loading={saving}>Guardar cambios</Button></footer>
  </form></AdminModal>;
}
