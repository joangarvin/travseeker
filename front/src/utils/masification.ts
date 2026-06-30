export function getMasificationLabel(value: number): string {
  if (value <= 25) return 'Tranquilo';
  if (value <= 50) return 'Moderado';
  if (value <= 75) return 'Concurrido';
  return 'Muy concurrido';
}

export function getMasificationColor(value: number): string {
  if (value <= 25) return '#3ecf8e';
  if (value <= 50) return '#2eb87a';
  if (value <= 75) return '#fbbf24';
  return '#f87171';
}
