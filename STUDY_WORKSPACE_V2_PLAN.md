# IB Chess Analyzer · Estudios 2.0

**Documento de producto y migración incremental (2026-11-03).** No es una declaración de que toda la arquitectura ya esté implementada.

## Diagnóstico de la versión existente
Hay tres interfaces cercanas, pero técnicamente distintas:
1. Biblioteca PGN: colección local en IndexedDB, con algunos registros visibles desde Supabase y entrada de PGN.
2. Game Review + Estudio actual: PGN principal y variaciones como arrays `{ply,san,fen}`, comentarios por ply, exportaciones y nube mediante `ib_studies`.
3. Biblioteca Maestra: capítulos y variantes como registros independientes en `localStorage` con relación `origin.parent`, aún sin sincronización Supabase.

Esto obliga a recordar dónde quedó cada partida, dónde se guardó cada variante y desde dónde se comparte. Se debe **unificar la experiencia sin borrar ni sobrescribir ninguno de los tres conjuntos existentes**.

## Norte: un único espacio «Mis estudios»

**Pantalla principal:** Buscar, filtros (Míos / Compartidos / Recibidos del alumno / Archivados), carpetas, tarjetas con capítulos, fecha, propietario, estado de sincronización y acceso.

**Al abrir un estudio:**
- Izquierda: tablero fijo, controles, evaluación y Stockfish.
- Centro: árbol de jugadas real (principal, ramas, subramas), navegar con flechas sin abandonar la rama.
- Derecha: pestañas **Comentarios / Motor / Ejercicios y tareas / Fuentes**.
- Encabezado: nombre, «Guardar» con estado real, «Compartir», «Duplicar», «Exportar» y menú de administración.
- Varias partidas / líneas de un tema serán capítulos dentro de un mismo estudio. Los capítulos tendrán su propia posición inicial y FEN.

### Añadir una variante sin formularios confusos
1. Hacer clic en la jugada o posición de origen.
2. Pulsar **＋ Variante**, o simplemente jugar otra jugada legal sobre el tablero.
3. Ver la bifurcación inmediatamente en el árbol, editar nombre y comentario si se desea.
4. Opcionalmente pegar SAN, PGN o guardar una PV desde Stockfish.
5. Deshacer/rehacer, borrar rama, promocionar a línea principal: operaciones explícitas, nunca un cambio destructivo implícito.

**Regla esencial:** una rama pertenece al capítulo y al nodo del que sale; no se convierte en otro estudio de la biblioteca.

### Compartir sin UUID ni exportaciones intermedias
- Botón **Compartir** en el propio estudio; destinatarios por nombre desde el directorio de la academia.
- Alumno: puede entregar una copia/versión de su estudio al entrenador habilitado.
- Entrenador: puede asignar estudio a alumno(s) matriculados activos.
- Modal con vista previa de nombre/rol, permiso y confirmación explícita.
- Estado visible «Solo mío» / «Compartido con N personas» / «Recibido» / «Pendiente de revisión».
- Fase actual soporta **solo lectura** usando la tabla `ib_study_members`; los roles «Comentar» y «Editar juntos» requerirán RLS, migraciones de permisos y auditoría antes de activarlos.
- Revisión del profesor: entrega de una versión derivada que no reemplaza el original del alumno.

## Datos canónicos objetivo (fase posterior)
```
Study: id, ownerId, title, description, collectionId, visibility, status, revision, updatedAt
Chapter: id, studyId, title, initialFen, ordinal
Node: id, chapterId, parentId, uci, san, fen, mainlineOrder, comment, annotations, engineEvidence
Membership: studyId, userId, role(viewer/commenter/editor), grantedBy, createdAt, revokedAt
Revision: id, studyId, chapterId, actorId, operation, createdAt, priorRevision
```
Las tablas se deben diseñar con RLS de propietario y destinatario. Las variantes se guardan por **nodo padre** y no como líneas principales completas independientes. Transposiciones por FEN canónica pueden indexarse, pero no deben fusionarse a ciegas: los derechos de enroque, captura al paso y turno importan.

## Fases de entrega

### Fase 1 — Simplificación segura (en curso)
- Acciones principales en el Estudio actual: **＋ Variante**, **Comentario**, **Compartir**.
- Escribir una continuación con validación y previsualización. Poder jugar la rama sobre el tablero.
- Compartir con alumno activo o profesor habilitado identificado por nombre. Confirmación y permiso de lectura claros; guardar en nube antes de conceder acceso.
- Se conserva editor anterior y se mantiene la exportación; datos antiguos permanecen intactos.

### Fase 2 — Unificación de navegación (pendiente)
- Reemplazar entradas separadas por **Mis estudios** y la sección **Biblioteca de aperturas** como categoría de estudios.
- Capítulos dentro de una sola colección/estudio, sin crear una entidad nueva por cada rama.
- Vista de árbol de jugadas, comentarios por nodo, promoción y reordenación de variantes.
- Enlaces individuales de estudio y capítulo que se puedan abrir en distintas pestañas.

### Fase 3 — Persistencia y permisos (pendiente)
- Diseñar migración aditiva desde IndexedDB, `ib-opening-research-v1` y `ib_studies`, sin destrucción; vista previa, respaldo y posibilidad de revertir.
- Confirmar políticas RLS en Supabase por rol y estudiar protección contra conflictos entre pestañas.
- Añadir invitaciones/grupos, revocación visible, estados de entrega, lectura y revisión del entrenador.

### Fase 4 — Academia y pedagogía (pendiente)
- Asignar un capítulo como tarea a uno o varios alumnos, fecha límite, seguimiento y retroalimentación.
- Modo entrenamiento con jugadas ocultas, evaluación de variantes y repaso por errores.
- Analítica por alumno y por tema vinculada a las tareas y estudios realmente realizados.

## Gates de calidad antes de sustituir la versión anterior
- Reproducir y editar ramas con idas/vueltas, sin perder el FEN ni saltar a la línea principal.
- Preservar nombre, PGN, notas, diagramas, alternativas y propietario de cada estudio.
- Probar permisos en dos sesiones reales: profesor y alumno; lector no debe poder sobrescribir.
- Importar y exportar PGN/JSON con ramas y comentarios conservados.
- Probar tema claro, oscuro y móvil; acceso con teclado; manejo sin conexión.
- Comparar respaldos antiguos antes y después de migración, sin eliminar datos originales.
