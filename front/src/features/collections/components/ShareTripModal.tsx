import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, Copy, Link2, MailPlus, RefreshCw, Share2, Unlink, UserRound, UsersRound, X } from 'lucide-react';
import { Button, Field, Notice } from '../../../components/ui';
import type { CollectionDetail } from '../../../types';
import { imageUrl } from '../../../utils';

type Member = NonNullable<CollectionDetail['members']>[number];

type ShareTripModalProps = {
  shareToken?: string | null;
  visibility: string;
  owner?: CollectionDetail['owner'];
  members: Member[];
  onClose: () => void;
  onActivate: (regenerate?: boolean) => Promise<string>;
  onDeactivate: () => Promise<void>;
  onAddMember: (email: string, role: 'editor' | 'viewer') => Promise<void>;
  onUpdateMember: (memberId: string, role: 'editor' | 'viewer') => Promise<void>;
  onRemoveMember: (memberId: string) => Promise<void>;
};

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
  const input = document.createElement('textarea');
  input.value = value;
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  input.remove();
}

function initials(name?: string | null, email?: string) {
  const source = name?.trim() || email || '?';
  return source.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}

function Avatar({ name, email, src }: { name?: string | null; email?: string; src?: string | null }) {
  return src
    ? <img className="trip-avatar" src={imageUrl(src)} alt="" />
    : <span className="trip-avatar trip-avatar--initials" aria-hidden="true">{initials(name, email)}</span>;
}

export function ShareTripModal({ shareToken, visibility, owner, members, onClose, onActivate, onDeactivate, onAddMember, onUpdateMember, onRemoveMember }: ShareTripModalProps) {
  const [tab, setTab] = useState<'people' | 'link'>('people');
  const [token, setToken] = useState(shareToken || '');
  const [active, setActive] = useState(visibility === 'shared' && Boolean(shareToken));
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackTone, setFeedbackTone] = useState<'success' | 'error'>('success');
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const closeButton = useRef<HTMLButtonElement>(null);
  const url = token ? `${location.origin}/viaje/${token}` : '';

  useEffect(() => {
    closeButton.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pending) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose, pending]);

  const run = async (action: () => Promise<void>, success: string) => {
    setPending(true);
    setFeedback('');
    try {
      await action();
      setFeedback(success);
      setFeedbackTone('success');
    } catch (cause) {
      setFeedback(cause instanceof Error ? cause.message : 'No se pudo completar la acción');
      setFeedbackTone('error');
    } finally {
      setPending(false);
    }
  };

  const invite = async (event: FormEvent) => {
    event.preventDefault();
    await run(async () => {
      await onAddMember(email.trim(), role);
      setEmail('');
    }, 'Persona añadida al viaje');
  };

  const activate = async (regenerate = false) => run(async () => {
    const nextToken = await onActivate(regenerate);
    setToken(nextToken);
    setActive(true);
    setConfirmRegenerate(false);
  }, regenerate ? 'Enlace sustituido' : 'Enlace público activado');

  const deactivate = async () => run(async () => {
    await onDeactivate();
    setActive(false);
    setToken('');
  }, 'Enlace público desactivado');

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <section className="modal share-trip-modal" role="dialog" aria-modal="true" aria-labelledby="share-trip-title" onMouseDown={(event) => event.stopPropagation()}>
        <button ref={closeButton} className="modal__close" type="button" onClick={onClose} aria-label="Cerrar"><X /></button>
        <div className="modal__heading">
          <span className="modal__icon"><Share2 aria-hidden="true" /></span>
          <div><p className="kicker">Compañeros de ruta</p><h2 id="share-trip-title">Compartir viaje</h2></div>
        </div>

        <div className="share-tabs" role="tablist" aria-label="Opciones para compartir">
          <button type="button" role="tab" aria-selected={tab === 'people'} onClick={() => setTab('people')}><UsersRound /> Personas <span>{members.length + 1}</span></button>
          <button type="button" role="tab" aria-selected={tab === 'link'} onClick={() => setTab('link')}><Link2 /> Enlace público</button>
        </div>

        {tab === 'people' ? (
          <div className="share-people-panel" role="tabpanel">
            <form className="share-invite" onSubmit={invite}>
              <Field label="Añadir por email" htmlFor="share-member-email" hint="Debe tener una cuenta de TravSeeker.">
                <div className="share-invite__row">
                  <input id="share-member-email" type="email" autoComplete="email" placeholder="persona@correo.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
                  <select aria-label="Permiso" value={role} onChange={(event) => setRole(event.target.value as 'editor' | 'viewer')}>
                    <option value="editor">Puede editar</option>
                    <option value="viewer">Solo lectura</option>
                  </select>
                  <Button type="submit" loading={pending} disabled={!email.trim()}><MailPlus /> Añadir</Button>
                </div>
              </Field>
            </form>

            <div className="share-member-list" aria-label="Personas con acceso">
              <div className="share-member-row">
                <Avatar name={owner?.nombre} src={owner?.avatarUrl} />
                <div><strong>{owner?.nombre || 'Tú'}</strong><small>Propietario del viaje</small></div>
                <span className="share-role-badge"><UserRound /> Propietario</span>
              </div>
              {members.map((member) => (
                <div className="share-member-row" key={member.id}>
                  <Avatar name={member.user.nombre} email={member.user.email} src={member.user.avatarUrl} />
                  <div><strong>{member.user.nombre || member.user.email}</strong><small>{member.user.email}</small></div>
                  <select aria-label={`Permiso de ${member.user.nombre || member.user.email}`} value={member.role} disabled={pending} onChange={(event) => void run(() => onUpdateMember(member.id, event.target.value as 'editor' | 'viewer'), 'Permiso actualizado')}>
                    <option value="editor">Puede editar</option>
                    <option value="viewer">Solo lectura</option>
                  </select>
                  <button className="share-member-remove" type="button" disabled={pending} onClick={() => void run(() => onRemoveMember(member.id), 'Persona eliminada')} aria-label={`Quitar a ${member.user.nombre || member.user.email}`}><X /></button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div role="tabpanel">
            {active ? (
              <>
                <div className="share-status"><Check aria-hidden="true" /><div><strong>El enlace está activo</strong><p>Cualquiera que lo tenga puede consultar la última versión guardada, pero nunca editarla.</p></div></div>
                <div className="share-link-row"><label htmlFor="public-trip-link">Enlace público</label><div><input id="public-trip-link" readOnly value={url} /><Button type="button" onClick={() => void copyText(url).then(() => { setFeedback('Enlace copiado'); setFeedbackTone('success'); })}><Copy /> Copiar</Button></div></div>
                {confirmRegenerate ? <Notice tone="info" action={<div className="notice__actions"><Button variant="quiet" type="button" onClick={() => setConfirmRegenerate(false)}>Cancelar</Button><Button variant="danger" type="button" loading={pending} onClick={() => void activate(true)}>Sustituir enlace</Button></div>}>El enlace anterior dejará de funcionar inmediatamente.</Notice> : <div className="share-secondary-actions"><Button type="button" variant="secondary" disabled={pending} onClick={() => setConfirmRegenerate(true)}><RefreshCw /> Crear otro enlace</Button><Button type="button" variant="quiet" loading={pending} onClick={() => void deactivate()}><Unlink /> Desactivar</Button></div>}
              </>
            ) : (
              <div className="share-empty"><Link2 aria-hidden="true" /><h3>Comparte una vista de solo lectura</h3><p>La página pública muestra el itinerario guardado sin permitir cambios.</p><Button type="button" loading={pending} onClick={() => void activate()}><Share2 /> Activar enlace público</Button></div>
            )}
          </div>
        )}
        {feedback && <Notice tone={feedbackTone}>{feedback}</Notice>}
      </section>
    </div>
  );
}
