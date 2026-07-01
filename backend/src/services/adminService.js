const { prisma } = require('../config/database');

function normalizePayload(data) {
  return {
    nombre: String(data.nombre || '').trim(),
    tipoTurismoPrincipal: String(data.tipoTurismoPrincipal || '').trim(),
    tipoTurismoSecundario: String(data.tipoTurismoSecundario || '').trim(),
    presupuesto: String(data.presupuesto || '').trim(),
    masificacion: String(data.masificacion || '').trim(),
    mesesJulioAgosto: Number(data.mesesJulioAgosto || 0),
    mesesMayJunSeptOct: Number(data.mesesMayJunSeptOct || 0),
    mesesNovAbril: Number(data.mesesNovAbril || 0),
    destinosItem: data.destinosItem ? String(data.destinosItem).trim() : null,
    ubicacion: String(data.ubicacion || '').trim(),
    descripcion: String(data.descripcion || '').trim(),
    imprescindibles: String(data.imprescindibles || '').trim(),
    imagen: String(data.imagen || '').trim(),
    latitud: data.latitud === '' || data.latitud == null ? null : Number(data.latitud),
    longitud: data.longitud === '' || data.longitud == null ? null : Number(data.longitud),
  };
}

function validateDestino(data) {
  const labels = {
    nombre: 'Nombre del destino',
    tipoTurismoPrincipal: 'Tipo de turismo principal',
    tipoTurismoSecundario: 'Tipo de turismo secundario',
    presupuesto: 'Presupuesto',
    masificacion: 'Masificación',
    ubicacion: 'Zona o región',
    descripcion: 'Descripción',
    imprescindibles: 'Imprescindibles',
    imagen: 'Imagen de portada',
  };
  for (const [key, label] of Object.entries(labels)) {
    if (!data[key]) {
      const err = new Error(`Falta completar: ${label}`);
      err.status = 400;
      throw err;
    }
  }
}

async function listDestinos() {
  return prisma.destino.findMany({
    orderBy: { nombre: 'asc' },
    select: {
      id: true,
      nombre: true,
      ubicacion: true,
      imagen: true,
      presupuesto: true,
      masificacion: true,
      latitud: true,
      longitud: true,
      municipios: {
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
      },
    },
  });
}

async function createDestino(payload) {
  const data = normalizePayload(payload);
  validateDestino(data);
  return prisma.destino.create({ data, include: { municipios: true } });
}

async function updateDestino(id, payload) {
  const data = normalizePayload(payload);
  validateDestino(data);
  return prisma.destino.update({
    where: { id },
    data,
    include: { municipios: true },
  });
}

async function deleteDestino(id) {
  await prisma.destino.delete({ where: { id } });
  return { success: true };
}

async function createMunicipio(destinoId, payload) {
  const nombre = String(payload.nombre || '').trim();
  if (!nombre) {
    const err = new Error('El nombre del municipio es obligatorio');
    err.status = 400;
    throw err;
  }
  return prisma.municipio.create({
    data: {
      destinoId,
      nombre,
      precios: payload.precios ? String(payload.precios).trim() : '',
      conexiones: payload.conexiones ? String(payload.conexiones).trim() : '',
      tipoTurismo: payload.tipoTurismo ? String(payload.tipoTurismo).trim() : '',
    },
  });
}

async function updateMunicipio(id, payload) {
  const nombre = String(payload.nombre || '').trim();
  if (!nombre) {
    const err = new Error('El nombre del municipio es obligatorio');
    err.status = 400;
    throw err;
  }
  return prisma.municipio.update({
    where: { id },
    data: {
      nombre,
      precios: payload.precios ? String(payload.precios).trim() : '',
      conexiones: payload.conexiones ? String(payload.conexiones).trim() : '',
      tipoTurismo: payload.tipoTurismo ? String(payload.tipoTurismo).trim() : '',
    },
  });
}

async function deleteMunicipio(id) {
  await prisma.municipio.delete({ where: { id } });
  return { success: true };
}

module.exports = {
  listDestinos,
  createDestino,
  updateDestino,
  deleteDestino,
  createMunicipio,
  updateMunicipio,
  deleteMunicipio,
};
