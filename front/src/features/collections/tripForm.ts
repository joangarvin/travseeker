export type TripFormValues = {
  nombre: string;
  descripcion: string;
  startDate: string;
  endDate: string;
  travelerCount: number | '';
};

export function validTripForm(values: TripFormValues) {
  return (
    !!values.nombre.trim() &&
    typeof values.travelerCount === 'number' &&
    Number.isInteger(values.travelerCount) &&
    values.travelerCount >= 1 &&
    values.travelerCount <= 50 &&
    (!values.endDate || (!!values.startDate && values.endDate >= values.startDate))
  );
}
