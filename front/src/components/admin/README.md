# admin

Componentes del panel de administración (`/admin`). Organizados por responsabilidad UI.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `AdminWorkspace.tsx` | Layout principal: lista + editor en grid responsive. |
| `DestinoList.tsx` | Listado de destinos con búsqueda y botón nuevo. |
| `DestinoListItem.tsx` | Tarjeta de un destino con municipios inline. |
| `DestinoListEmpty.tsx` | Estado vacío y placeholder del editor en escritorio. |
| `DestinoForm.tsx` | Formulario por secciones (tipo documento). |
| `DestinoFormActions.tsx` | Botones guardar/cancelar (escritorio + móvil sticky). |
| `ImprescindiblesEditor.tsx` | Editor visual de categorías y puntos imprescindibles. |
| `SeasonPicker.tsx` | Barras de masificación por temporada. |
| `LocationPickerMap.tsx` | Mapa para colocar el pin del destino. |
| `AdminField.tsx` | Campo con etiqueta, hint y estilos compartidos. |
| `AdminSectionCard.tsx` | Bloque de sección del formulario con icono. |
| `AdminAlert.tsx` | Mensajes de error o éxito. |
| `AdminMobileBackBar.tsx` | Barra «Volver a la lista» en móvil. |

## Relacionados (fuera de esta carpeta)

| Ubicación | Descripción |
|-----------|-------------|
| `hooks/useAdminPanel.ts` | Estado, carga y mutaciones del panel. |
| `types/admin.ts` | Tipos del dominio admin. |
| `constants/admin.ts` | Opciones de turismo y sugerencias de ubicación. |
| `utils/admin/` | Conversión formulario ↔ API (HTML, JSON legacy). |
| `api/admin.ts` | Peticiones HTTP a `/api/admin/*`. |
