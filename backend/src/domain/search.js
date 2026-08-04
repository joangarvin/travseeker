const STOP_WORDS = new Set([
  "a",
  "al",
  "con",
  "da",
  "das",
  "de",
  "del",
  "do",
  "dos",
  "el",
  "en",
  "la",
  "las",
  "lo",
  "los",
  "o",
  "para",
  "por",
  "un",
  "una",
  "y",
]);

const FIELD_DEFINITIONS = [
  {
    kind: "destination",
    weight: 120,
    fuzzyThreshold: 0.72,
    values: (destination) => [destination.nombre],
    label: () => "Nombre del destino",
  },
  {
    kind: "municipality",
    weight: 105,
    fuzzyThreshold: 0.75,
    values: (destination) =>
      (destination.municipioLinks || []).map((link) => link.municipio?.nombre),
    label: (value) => `Municipio · ${value}`,
  },
  {
    kind: "activity",
    weight: 90,
    fuzzyThreshold: 0.78,
    values: (destination) =>
      (destination.activityLinks || []).map((link) => link.activity?.name),
    label: (value) => `Actividad · ${value}`,
  },
  {
    kind: "tourism",
    weight: 88,
    fuzzyThreshold: 0.78,
    values: (destination) =>
      (destination.tourismTypeLinks || []).map(
        (link) => link.tourismType?.name,
      ),
    label: (value) => `Tipo de viaje · ${value}`,
  },
  {
    kind: "essential-group",
    weight: 78,
    fuzzyThreshold: 0.82,
    values: (destination) =>
      (destination.essentialGroups || []).map((group) => group.title),
    label: (value) => `Recorrido · ${value}`,
  },
  {
    kind: "essential-item",
    weight: 76,
    fuzzyThreshold: 0.86,
    allowDistributedTokens: false,
    values: (destination) =>
      (destination.essentialGroups || []).flatMap((group) =>
        (group.items || []).map((item) => item.title),
      ),
    label: (value) => `Imprescindible · ${value}`,
  },
  {
    kind: "essential-description",
    weight: 70,
    fuzzyThreshold: 0.88,
    allowDistributedTokens: false,
    values: (destination) =>
      (destination.essentialGroups || []).flatMap((group) =>
        (group.items || []).map((item) => item.description),
      ),
    label: () => "En un imprescindible",
  },
  {
    kind: "essential",
    weight: 68,
    fuzzyThreshold: 0.88,
    allowDistributedTokens: false,
    values: (destination) => [destination.imprescindibles],
    label: () => "Entre sus imprescindibles",
  },
  {
    kind: "place",
    weight: 76,
    fuzzyThreshold: 0.8,
    values: (destination) =>
      (destination.places || []).map((place) => place.nombre),
    label: (value) => `Lugar · ${value}`,
  },
  {
    kind: "location",
    weight: 65,
    fuzzyThreshold: 0.8,
    values: (destination) => [destination.ubicacion],
    label: (value) => `Zona · ${value}`,
  },
  {
    kind: "description",
    weight: 50,
    fuzzyThreshold: 0.88,
    allowDistributedTokens: false,
    values: (destination) => [destination.descripcion],
    label: () => "En la descripción",
  },
];

function plainSearchText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:nbsp|amp|quot|apos|lt|gt);/gi, " ");
}

function normalizeSearchText(value) {
  return plainSearchText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function searchTokens(value) {
  const tokens = normalizeSearchText(value).split(" ").filter(Boolean);
  const meaningful = tokens.filter((token) => !STOP_WORDS.has(token));
  return meaningful.length ? meaningful : tokens;
}

function levenshteinDistance(first, second) {
  if (first === second) return 0;
  if (!first.length) return second.length;
  if (!second.length) return first.length;

  let previous = Array.from({ length: second.length + 1 }, (_, index) => index);
  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    const current = [firstIndex];
    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      const substitution =
        previous[secondIndex - 1] +
        (first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1);
      current[secondIndex] = Math.min(
        current[secondIndex - 1] + 1,
        previous[secondIndex] + 1,
        substitution,
      );
    }
    previous = current;
  }
  return previous[second.length];
}

function textSimilarity(first, second) {
  const normalizedFirst = normalizeSearchText(first);
  const normalizedSecond = normalizeSearchText(second);
  const longest = Math.max(normalizedFirst.length, normalizedSecond.length);
  if (!longest) return 1;
  return 1 - levenshteinDistance(normalizedFirst, normalizedSecond) / longest;
}

function bestWindowSimilarity(query, value) {
  const queryWords = normalizeSearchText(query).split(" ").filter(Boolean);
  const valueWords = normalizeSearchText(value).split(" ").filter(Boolean);
  if (!queryWords.length || !valueWords.length) return 0;

  const lengths = [
    ...new Set([
      queryWords.length - 1,
      queryWords.length,
      queryWords.length + 1,
    ]),
  ].filter((length) => length > 0 && length <= valueWords.length);
  let best = 0;
  lengths.forEach((length) => {
    for (let index = 0; index <= valueWords.length - length; index += 1) {
      best = Math.max(
        best,
        textSimilarity(
          queryWords.join(" "),
          valueWords.slice(index, index + length).join(" "),
        ),
      );
    }
  });
  return best;
}

function tokensAppearNearby(query, value, maximumExtraWords = 2) {
  const tokens = searchTokens(query);
  if (tokens.length < 2) return false;
  const words = normalizeSearchText(value).split(" ").filter(Boolean);
  for (let start = 0; start < words.length; start += 1) {
    if (words[start] !== tokens[0]) continue;
    let tokenIndex = 1;
    const lastPossibleIndex = Math.min(
      words.length - 1,
      start + tokens.length + maximumExtraWords - 1,
    );
    for (
      let wordIndex = start + 1;
      wordIndex <= lastPossibleIndex;
      wordIndex += 1
    ) {
      if (words[wordIndex] === tokens[tokenIndex]) tokenIndex += 1;
      if (tokenIndex === tokens.length) return true;
    }
  }
  return false;
}

function scoreValue(
  query,
  value,
  weight,
  { fuzzyThreshold = 0.8, allowDistributedTokens = true } = {},
) {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedValue = normalizeSearchText(value);
  if (!normalizedQuery || !normalizedValue) return 0;
  if (normalizedValue === normalizedQuery) return weight + 40;
  if (normalizedValue.startsWith(normalizedQuery)) return weight + 32;
  if (normalizedValue.includes(normalizedQuery)) return weight + 24;

  const tokens = searchTokens(normalizedQuery);
  if (
    allowDistributedTokens &&
    tokens.length > 1 &&
    tokens.every((token) => normalizedValue.includes(token))
  ) {
    return weight + 14;
  }
  if (
    !allowDistributedTokens &&
    tokensAppearNearby(normalizedQuery, normalizedValue)
  ) {
    return weight + 10;
  }

  const similarity = bestWindowSimilarity(normalizedQuery, normalizedValue);
  const threshold =
    normalizedQuery.length <= 4
      ? Math.max(0.86, fuzzyThreshold)
      : fuzzyThreshold;
  return similarity >= threshold ? Math.round(weight * similarity) : 0;
}

function crossFieldMatch(query, fields) {
  const tokens = searchTokens(query);
  if (tokens.length < 2) return null;
  const normalizedValues = fields
    .filter(
      (field) =>
        !["description", "essential-description", "essential"].includes(
          field.kind,
        ),
    )
    .flatMap((field) =>
      field.values.map((value) => normalizeSearchText(value)).filter(Boolean),
    );
  const everyTokenMatches = tokens.every((token) =>
    normalizedValues.some(
      (value) =>
        value.includes(token) || bestWindowSimilarity(token, value) >= 0.86,
    ),
  );
  return everyTokenMatches
    ? { score: 68, kind: "multiple", label: "Coincide con varios criterios" }
    : null;
}

function destinationSearchMatch(destination, query) {
  const fields = FIELD_DEFINITIONS.map((definition) => ({
    ...definition,
    values: definition.values(destination).filter(Boolean),
  }));
  const candidates = fields.flatMap((field) =>
    field.values.map((value) => ({
      score: scoreValue(query, value, field.weight, {
        fuzzyThreshold: field.fuzzyThreshold,
        allowDistributedTokens: field.allowDistributedTokens,
      }),
      kind: field.kind,
      label: field.label(plainSearchText(value).replace(/\s+/g, " ").trim()),
    })),
  );
  const best = candidates.reduce(
    (current, candidate) =>
      candidate.score > current.score ? candidate : current,
    { score: 0, kind: "", label: "" },
  );
  if (best.score > 0) return best;
  return crossFieldMatch(query, fields);
}

function rankDestinationSearch(destinations, query) {
  const cleanQuery = String(query || "")
    .trim()
    .slice(0, 120);
  if (!normalizeSearchText(cleanQuery)) return destinations;
  return destinations
    .map((destination) => {
      const match = destinationSearchMatch(destination, cleanQuery);
      return match
        ? {
            ...destination,
            searchMatch: { kind: match.kind, label: match.label },
            _searchScore: match.score,
          }
        : null;
    })
    .filter(Boolean)
    .sort(
      (first, second) =>
        second._searchScore - first._searchScore ||
        first.nombre.localeCompare(second.nombre, "es"),
    );
}

module.exports = {
  normalizeSearchText,
  textSimilarity,
  destinationSearchMatch,
  rankDestinationSearch,
};
