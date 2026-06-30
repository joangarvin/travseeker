const LIST_SELECT = {
  id: true,
  nombre: true,
  imagen: true,
  presupuesto: true,
  masificacion: true,
  ubicacion: true,
  tipoTurismoPrincipal: true,
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

module.exports = { LIST_SELECT, MAP_SELECT, COMPARE_SELECT, USER_PUBLIC_SELECT };
