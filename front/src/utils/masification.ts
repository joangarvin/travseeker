export function getMasificationLabel(value: number): string {
  if (value <= 25) return 'Tranquilo';
  if (value <= 50) return 'Moderado';
  if (value <= 75) return 'Concurrido';
  return 'Muy concurrido';
}

export function getMasificationColor(value: number): string {
  // Paleta «cuaderno de campo»: verde botella → mostaza → teja → lacre
  if (value <= 25) return '#3a7050';
  if (value <= 50) return '#2f5d3f';
  if (value <= 75) return '#d9a441';
  return '#c4622d';
}
