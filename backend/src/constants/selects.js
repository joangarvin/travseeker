const LIST_SELECT = {
  id: true,
  nombre: true,
  imagen: true,
  presupuesto: true,
  masificacion: true,
  ubicacion: true,
  tipoTurismoPrincipal: true,
  mesesJulioAgosto: true,
  mesesMayJunSeptOct: true,
  mesesNovAbril: true,
  tourismTypeLinks: {
    where: { tourismType: { isActive: true } },
    include: { tourismType: true },
  },
};

const MAP_SELECT = {
  id: true,
  nombre: true,
  latitud: true,
  longitud: true,
  imagen: true,
  presupuesto: true,
  masificacion: true,
  ubicacion: true,
  tipoTurismoPrincipal: true,
  mesesJulioAgosto: true,
  mesesMayJunSeptOct: true,
  mesesNovAbril: true,
  tourismTypeLinks: {
    where: { tourismType: { isActive: true } },
    include: { tourismType: true },
  },
};

const SEARCH_RELATIONS = {
  descripcion: true,
  imprescindibles: true,
  municipioLinks: {
    select: { municipio: { select: { id: true, nombre: true } } },
  },
  activityLinks: {
    where: { activity: { isActive: true } },
    include: { activity: true },
  },
  places: {
    where: { isActive: true },
    select: { nombre: true },
  },
};

const SEARCH_LIST_SELECT = {
  ...LIST_SELECT,
  ...SEARCH_RELATIONS,
};

const SEARCH_MAP_SELECT = {
  ...MAP_SELECT,
  ...SEARCH_RELATIONS,
};

const COMPARE_SELECT = {
  id: true,
  nombre: true,
  imagen: true,
  ubicacion: true,
  presupuesto: true,
  masificacion: true,
  tipoTurismoPrincipal: true,
  tipoTurismoSecundario: true,
  mesesJulioAgosto: true,
  mesesMayJunSeptOct: true,
  mesesNovAbril: true,
  activityLinks: {
    where: { activity: { isActive: true } },
    include: { activity: true },
  },
  tourismTypeLinks: {
    where: { tourismType: { isActive: true } },
    include: { tourismType: true },
  },
};

const USER_PUBLIC_SELECT = {
  id: true,
  email: true,
  nombre: true,
  apellidos: true,
  avatarUrl: true,
  bio: true,
  role: true,
  locale: true,
  preferences: true,
  emailVerified: true,
  createdAt: true,
};

module.exports = {
  LIST_SELECT,
  MAP_SELECT,
  SEARCH_LIST_SELECT,
  SEARCH_MAP_SELECT,
  COMPARE_SELECT,
  USER_PUBLIC_SELECT,
};
