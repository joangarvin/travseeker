import type { AdminDestinoPayload, DestinoFormState } from '../../types/admin';
import { MASIFICACION_ORDER, PRESUPUESTO_ORDER, parseTags } from '../scales';
import { htmlToPlainText, plainTextToHtml } from './htmlContent';
import { parseImprescindibles, serializeImprescindibles } from './imprescindibles';
import { readStoredText, writeStoredText } from './storedText';

function pickFirstTag(value?: string | null): string {
  const tags = parseTags(value);
  return tags[0]?.trim() ?? readStoredText(value);
}

export function emptyDestinoForm(): DestinoFormState {
  return {
    nombre: '',
    ubicacion: '',
    presupuesto: '',
    masificacion: '',
    tipoTurismoPrincipal: '',
    tipoTurismoSecundario: '',
    descripcion: '',
    imagen: '',
    imprescindiblesSections: [{ title: '', items: [''] }],
    mesesJulioAgosto: 50,
    mesesMayJunSeptOct: 30,
    mesesNovAbril: 10,
    latitud: null,
    longitud: null,
  };
}

export function destinoDetailToForm(detail: {
  nombre?: string;
  ubicacion?: string;
  presupuesto?: string;
  masificacion?: string;
  tipoTurismoPrincipal?: string;
  tipoTurismoSecundario?: string;
  descripcion?: string;
  imprescindibles?: string;
  imagen?: string;
  mesesJulioAgosto?: number;
  mesesMayJunSeptOct?: number;
  mesesNovAbril?: number;
  latitud?: number | null;
  longitud?: number | null;
}): DestinoFormState {
  return {
    nombre: detail.nombre ?? '',
    ubicacion: readStoredText(detail.ubicacion),
    presupuesto: readStoredText(detail.presupuesto),
    masificacion: readStoredText(detail.masificacion),
    tipoTurismoPrincipal: pickFirstTag(detail.tipoTurismoPrincipal),
    tipoTurismoSecundario: pickFirstTag(detail.tipoTurismoSecundario),
    descripcion: htmlToPlainText(detail.descripcion ?? ''),
    imagen: detail.imagen ?? '',
    imprescindiblesSections: parseImprescindibles(detail.imprescindibles ?? ''),
    mesesJulioAgosto: Number(detail.mesesJulioAgosto ?? 0),
    mesesMayJunSeptOct: Number(detail.mesesMayJunSeptOct ?? 0),
    mesesNovAbril: Number(detail.mesesNovAbril ?? 0),
    latitud: detail.latitud ?? null,
    longitud: detail.longitud ?? null,
  };
}

export function destinoFormToPayload(form: DestinoFormState): AdminDestinoPayload {
  return {
    nombre: form.nombre.trim(),
    ubicacion: writeStoredText(form.ubicacion),
    presupuesto: writeStoredText(form.presupuesto),
    masificacion: writeStoredText(form.masificacion),
    tipoTurismoPrincipal: writeStoredText(form.tipoTurismoPrincipal),
    tipoTurismoSecundario: writeStoredText(form.tipoTurismoSecundario),
    descripcion: plainTextToHtml(form.descripcion),
    imprescindibles: serializeImprescindibles(form.imprescindiblesSections),
    imagen: form.imagen.trim(),
    mesesJulioAgosto: form.mesesJulioAgosto,
    mesesMayJunSeptOct: form.mesesMayJunSeptOct,
    mesesNovAbril: form.mesesNovAbril,
    latitud: form.latitud,
    longitud: form.longitud,
  };
}

export function presupuestoOptions() {
  return PRESUPUESTO_ORDER;
}

export function masificacionOptions() {
  return MASIFICACION_ORDER;
}
