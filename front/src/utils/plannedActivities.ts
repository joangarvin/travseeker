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
