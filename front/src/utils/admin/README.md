# utils/admin

Utilidades del panel de administración: conversión entre formulario amigable y formato almacenado en API/DB.

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `storedText.ts` | `readStoredText` / `writeStoredText` — compatibilidad con campos JSON legacy. |
| `htmlContent.ts` | `htmlToPlainText` / `plainTextToHtml` — descripción sin editar HTML a mano. |
| `imprescindibles.ts` | `parseImprescindibles` / `serializeImprescindibles` — editor visual ↔ HTML. |
| `destinoForm.ts` | `emptyDestinoForm`, `destinoDetailToForm`, `destinoFormToPayload`. |
