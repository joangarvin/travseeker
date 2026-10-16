import type { Dispatch, SetStateAction } from 'react';
import { t } from '../../../i18n';
import { api } from '../../../services/api';
import type { CollectionDetail } from '../../../types';

type Options = {
  id?: string;
  token: string | null;
  setCollection: Dispatch<SetStateAction<CollectionDetail | null>>;
  setActionPending: Dispatch<SetStateAction<boolean>>;
};

export function useCollectionSharing({ id, token, setCollection, setActionPending }: Options) {
  const shareCollection = async (regenerate = false) => {
    if (!token || !id) throw new Error(t('No se pudo identificar el viaje'));
    setActionPending(true);
    try {
      const result = await api<{ shareToken: string }>(
        `/colecciones/${id}/share`,
        { method: 'POST', body: JSON.stringify({ regenerate }) },
        token,
      );
      setCollection((current) =>
        current ? { ...current, visibility: 'shared', shareToken: result.shareToken } : current,
      );
      return result.shareToken;
    } catch (cause) {
      throw cause instanceof Error ? cause : new Error(t('No se pudo compartir el viaje'));
    } finally {
      setActionPending(false);
    }
  };

  const stopSharing = async () => {
    if (!token || !id) throw new Error(t('No se pudo identificar el viaje'));
    setActionPending(true);
    try {
      await api(`/colecciones/${id}/share`, { method: 'DELETE' }, token);
      setCollection((current) =>
        current ? { ...current, visibility: 'private', shareToken: null } : current,
      );
    } finally {
      setActionPending(false);
    }
  };

  const addMember = async (email: string, role: 'editor' | 'viewer') => {
    if (!token || !id) throw new Error(t('No se pudo identificar el viaje'));
    const member = await api<NonNullable<CollectionDetail['members']>[number]>(
      `/colecciones/${id}/members`,
      { method: 'POST', body: JSON.stringify({ email, role }) },
      token,
    );
    setCollection((current) =>
      current
        ? {
            ...current,
            members: [
              ...(current.members || []).filter((item) => item.user.id !== member.user.id),
              member,
            ],
          }
        : current,
    );
  };

  const updateMember = async (memberId: string, role: 'editor' | 'viewer') => {
    if (!token || !id) throw new Error(t('No se pudo identificar el viaje'));
    const member = await api<NonNullable<CollectionDetail['members']>[number]>(
      `/colecciones/${id}/members/${memberId}`,
      { method: 'PATCH', body: JSON.stringify({ role }) },
      token,
    );
    setCollection((current) =>
      current
        ? {
            ...current,
            members: (current.members || []).map((item) => (item.id === memberId ? member : item)),
          }
        : current,
    );
  };

  const removeMember = async (memberId: string) => {
    if (!token || !id) throw new Error(t('No se pudo identificar el viaje'));
    await api(`/colecciones/${id}/members/${memberId}`, { method: 'DELETE' }, token);
    setCollection((current) =>
      current
        ? { ...current, members: (current.members || []).filter((item) => item.id !== memberId) }
        : current,
    );
  };

  return { shareCollection, stopSharing, addMember, updateMember, removeMember };
}
