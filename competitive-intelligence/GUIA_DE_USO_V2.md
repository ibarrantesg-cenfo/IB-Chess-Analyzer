# Competitive Intelligence — Interfaz de expedientes y estudio documental

## Apertura
Iniciar sesión como administrador CI en la aplicación y entrar en `Investigación privada → Competitive Intelligence`. Acceso concedido exclusivamente por `ib_ci_admins` y políticas RLS de Supabase.

## Expedientes
1. Ir a **Expedientes de rivales**.
2. Pulsar **+ Nuevo rival**. Aparece el editor en la columna derecha y se enfoca el nombre.
3. Escribir nombre completo, FIDE ID opcional (solo números), grupo A/B/C, alias y notas. Pulsar **Guardar expediente**.
4. Elegir cualquier jugador desde la lista. Pulsar **Editar ficha** para modificarlo.
5. **Archivar** conserva sus registros y lo quita del listado activo.

### Candidatos iniciales
**Incorporar candidatos iniciales** solicita confirmación y carga siete nombres como fichas pendientes de investigar (sin Elo ni FIDE ID). Revisa duplicados de nombre exacto antes de crear. No adjudica resultados ni repertorios.
La importación se inicia únicamente cuando el administrador pulsa el botón.

## Estudio documental
1. Abrir la pestaña **Estudio documental**, elegir el expediente del rival.
2. Crear nuevo estudio o abrir uno guardado en la lista.
3. Escribir título y procedencia, pegar un PGN legal y pulsar **Cargar PGN al tablero**.
4. Navegar con las flechas o seleccionando jugadas. Girar el tablero si hace falta.
5. Escribir una nota para la posición seleccionada; navegar a otra posición conserva la nota en el documento actual.
6. Pulsar **Guardar documento privado** para persistirlo en `ib_ci_preparations`.
7. **Exportar PGN** descarga las jugadas. Las notas editoriales se almacenan en el documento privado y no se incluyen en ese PGN de exportación.

### Limitaciones de esta fase
- No existe todavía edición de árboles ni conservación automática de nuevas variantes al cambiar la línea principal.
- El PGN importado se conserva textualmente mientras solo se navegue y anote. Si se añaden nuevas jugadas sobre el tablero, se genera una nueva línea principal y se debe evitar hacerlo sobre un PGN con comentarios y variantes que no se quieran perder.
- El tablero documental no llama a Stockfish ni modifica la biblioteca general.
- Se utiliza la tabla privada `ib_ci_preparations` del esquema SQL ya creado, por lo que no requiere migración adicional.

## Comprobaciones posteriores a publicación
- Crear, editar, filtrar, archivar, refrescar y volver a abrir un rival.
- Importar PGN válido e inválido; recorrer jugadas y guardar notas; reabrir.
- Comprobar modo claro, modo oscuro, menú contraído y pantalla móvil.
- Iniciar sesión con alumno y otro profesor: la ruta y consultas privadas deben denegar el acceso.
