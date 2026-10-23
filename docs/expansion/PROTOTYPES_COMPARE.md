# Comparador internacional: Cara a cara integrado

Propuesta elegida: **Cara a cara**. Integrada en `/comparar` en `new/expansion`. Las superficies de exploración se han retirado tras la elección; los prototipos originales permanecen en el historial (commit `5219ab6`).

## Comportamiento

- Tarjetas con fotografía grande y destinos como protagonistas. En móvil se apilan a todo el ancho disponible.
- Criterios: tranquilidad, actividades, presupuesto y datos prácticos. Época y planes modifican la comparación.
- País, moneda e idiomas proceden de los datos existentes del backend. La respuesta pública de comparación conserva las restricciones de publicación e incorpora estos campos; no hay migración ni fichas ficticias.
- Los presupuestos editoriales solo se clasifican si todos los destinos tienen país conocido, pertenecen al mismo país y tienen un nivel válido. Compartir moneda no hace equivalentes los niveles entre países. No se calculan conversiones ni tipos de cambio.
- Afluencia pendiente se muestra como tal; si falta una estimación, no se recomienda una opción basándose en los datos incompletos.
- Editor de 2–4 destinos con búsqueda real, navegación por teclado, quitar, vaciar y deshacer. Los nombres permanecen visibles mientras se actualizan los datos. El foco vuelve a un control estable al eliminar o alcanzar el máximo.
- La URL conserva destinos, criterio, época, planes y elección. Una única actualización de URL evita que las preferencias sobrescriban los destinos al añadir o quitar. La elección se conserva tras recargar.
- Copiar enlace ofrece un campo de copia manual si el portapapeles no está disponible.
- Feedback visible y anunciado, diálogos del sistema existente, transiciones breves de selección y medidores, hover solo con ratón y respeto a `prefers-reduced-motion`.
- Se mantienen estados de carga/error, reintento, resultados parciales y selección vacía. Traducciones de la nueva interfaz incorporadas al inglés.

Las imágenes son las del catálogo real, con el componente existente `MediaImage`, sus variantes responsivas y su alternativa de error. Se han retirado las fotografías y datos de demostración junto con los prototipos.

## Validación

- Frontend: 57 pruebas correctas.
- Backend: 158 pruebas correctas, 1 prueba de integración de BD omitida por no estar configurada la BD aislada de tests. No se ejecutan pruebas destructivas contra la BD compartida.
- Pruebas nuevas: país/moneda/idiomas en la respuesta, idioma y orden solicitados, restricciones de publicación, límites de comparación y abstención del ranking de presupuesto entre países o con información desconocida.
- ESLint de los módulos modificados y build de producción correctos.
- Navegador real: datos de tres destinos; elección y recarga; editor, búsqueda, vaciar y deshacer; añadir un cuarto destino y conservarlo en la URL; pantalla de 390 px y ancho mínimo de 320 px sin desbordamiento horizontal. Fotografías y disposición en móvil revisadas visualmente.
