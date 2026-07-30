function buildCollectionOrder(currentIds, orderedIds) {
  if (!Array.isArray(orderedIds) || !orderedIds.length || new Set(orderedIds).size !== orderedIds.length) {
    const error = new Error('El orden de destinos no es válido'); error.status = 400; throw error;
  }
  const current = new Set(currentIds);
  if (current.size !== orderedIds.length || orderedIds.some((id) => typeof id !== 'string' || !current.has(id))) {
    const error = new Error('El orden debe incluir todos los destinos de la lista'); error.status = 400; throw error;
  }
  return orderedIds.map((destinoId, index) => ({ destinoId, sortOrder: index * 10 }));
}

module.exports = { buildCollectionOrder };
