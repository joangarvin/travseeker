/** Stored activities may be catalog IDs or names added from a destination guide. */
export function plannedActivityLabel<T extends { id: string; name: string }>(
  value: string,
  catalog: ReadonlyArray<T> = [],
  name: (activity: T) => string = (activity) => activity.name || activity.id,
): string {
  const activity = catalog.find((item) => item.id === value);
  return activity ? name(activity) : value;
}

export function movePlannedActivity<
  T extends { destinationId: string; plannedActivities?: string[] },
>(days: T[], from: number, to: number, value: string): T[] {
  if (
    from === to ||
    !days[from] ||
    !days[to] ||
    days[from].destinationId !== days[to].destinationId ||
    !days[from].plannedActivities?.includes(value)
  )
    return days;
  return days.map((day, index) =>
    index === from
      ? { ...day, plannedActivities: day.plannedActivities?.filter((item) => item !== value) }
      : index === to
        ? { ...day, plannedActivities: [...new Set([...(day.plannedActivities || []), value])] }
        : day,
  );
}

/** Concrete municipal plans open their own guide; legacy values keep the destination link. */
export function plannedActivityHref(
  destination: {
    id: string;
    municipios?: { id: string; actividades?: { id: string; nombre: string }[] }[];
  },
  value: string,
) {
  for (const municipality of destination.municipios || []) {
    const record = municipality.actividades?.find(
      (activity) => activity.id === value || activity.nombre === value,
    );
    if (record)
      return `/municipio/${encodeURIComponent(municipality.id)}#ficha-${encodeURIComponent(record.id)}`;
  }
  return `/destino/${encodeURIComponent(destination.id)}#actividad=${encodeURIComponent(value)}`;
}

export function tripActivityCatalog(destination?: {
  activities?: { id: string; name: string; displayName?: string }[];
  municipios?: { actividades?: { id: string; nombre: string }[] }[];
}) {
  return [
    ...(destination?.activities || []),
    ...(destination?.municipios || []).flatMap((municipality) =>
      (municipality.actividades || []).map((record) => ({ id: record.id, name: record.nombre })),
    ),
  ];
}
