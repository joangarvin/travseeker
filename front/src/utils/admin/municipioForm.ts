import type { AdminMunicipio, AdminMunicipioPayload, MunicipioFormState } from '../../types/admin';
import { htmlToPlainText, plainTextToHtml } from './htmlContent';
import { readStoredText } from './storedText';

export function emptyMunicipioForm(): MunicipioFormState {
  return {
    nombre: '',
    precios: '',
    conexiones: '',
    tipoTurismo: '',
  };
}

export function municipioToForm(m: {
  nombre?: string | null;
  precios?: string | null;
  conexiones?: string | null;
  tipoTurismo?: string | null;
}): MunicipioFormState {
  return {
    nombre: m.nombre ?? '',
    precios: htmlToPlainText(m.precios ?? ''),
    conexiones: htmlToPlainText(m.conexiones ?? ''),
    tipoTurismo: readStoredText(m.tipoTurismo) || htmlToPlainText(m.tipoTurismo ?? ''),
  };
}

export function municipioFormToPayload(form: MunicipioFormState): AdminMunicipioPayload {
  return {
    nombre: form.nombre.trim(),
    precios: plainTextToHtml(form.precios),
    conexiones: plainTextToHtml(form.conexiones),
    tipoTurismo: form.tipoTurismo.trim(),
  };
}

export function normalizeAdminMunicipio(m: {
  id: string;
  nombre: string;
  precios?: string | null;
  conexiones?: string | null;
  tipoTurismo?: string | null;
  destinosCount?: number;
}): AdminMunicipio {
  return {
    id: m.id,
    nombre: m.nombre,
    precios: m.precios ?? '',
    conexiones: m.conexiones ?? '',
    tipoTurismo: m.tipoTurismo ?? '',
    destinosCount: m.destinosCount ?? 0,
  };
}
