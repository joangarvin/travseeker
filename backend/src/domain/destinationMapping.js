const { serializeTags } = require("../constants/scales");
const { cleanMunicipalityFields } = require("../utils/sanitizeContent");

function mapActivities(destino) {
  if (!destino) return destino;
  const activities = (destino.activityLinks || [])
    .map((link) => link.activity)
    .filter(Boolean)
    .sort((first, second) => first.name.localeCompare(second.name, "es"));
  const { activityLinks, ...rest } = destino;
  return {
    ...rest,
    tipoTurismoSecundario: serializeTags(
      activities.map((activity) => activity.name),
    ),
    activities,
    activityIds: activities.map((activity) => activity.id),
  };
}

function mapTourismTypes(destino) {
  if (!destino) return destino;
  const tourismTypes = (destino.tourismTypeLinks || [])
    .map((link) => link.tourismType)
    .filter(Boolean)
    .sort(
      (first, second) =>
        first.sortOrder - second.sortOrder ||
        first.name.localeCompare(second.name, "es"),
    );
  const { tourismTypeLinks, ...rest } = destino;
  return {
    ...rest,
    tipoTurismoPrincipal: serializeTags(tourismTypes.map((type) => type.name)),
    tourismTypes,
    tourismTypeIds: tourismTypes.map((type) => type.id),
  };
}

function mapMunicipalities(destino) {
  if (!destino) return destino;
  const municipios = (destino.municipioLinks || [])
    .map((link) => cleanMunicipalityFields(link.municipio))
    .filter(Boolean)
    .sort((first, second) => first.nombre.localeCompare(second.nombre, "es"));
  const { municipioLinks, ...rest } = destino;
  return { ...rest, municipios };
}

// Public responses expose only the relations selected by the caller.
function mapDestinationRelations(destination) {
  if (destination?.essentialGroups) destination = { ...destination, essentialGroups: destination.essentialGroups.map(group => ({ ...group, items: group.items?.map(item => {
    const { catalogActivity, ...rest } = item;
    if (!catalogActivity) return rest;
    const shared = require("./municipalityCatalog").catalogRecord(catalogActivity);
    return { ...rest, title: shared.nombre, description: shared.descripcion, imageUrl: shared.imagen || null, imageAlt: shared.imagenAlt || null, duration: shared.duration || null, bestTime: shared.bestTime || null, officialUrl: shared.website || null, translations: Object.fromEntries(Object.entries(shared.translations || {}).map(([locale, fields]) => [locale, { title: fields.nombre, description: fields.descripcion, imageAlt: fields.imagenAlt }])) };
  }) })) };
  return mapTourismTypes(mapActivities(mapMunicipalities(destination)));
}

// Editors must retain legacy tags until the destination has catalog relations.
function mapAdminDestination(destination) {
  if (!destination) return destination;
  const mapped = mapDestinationRelations(destination);
  return {
    ...mapped,
    tipoTurismoPrincipal: mapped.tourismTypes.length
      ? mapped.tipoTurismoPrincipal
      : destination.tipoTurismoPrincipal,
    tipoTurismoSecundario: mapped.activities.length
      ? mapped.tipoTurismoSecundario
      : destination.tipoTurismoSecundario,
  };
}

module.exports = {
  mapActivities,
  mapTourismTypes,
  mapMunicipalities,
  mapDestinationRelations,
  mapAdminDestination,
};
