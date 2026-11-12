# Investigación universitaria — CI v2.1

Fecha de verificación: 12 de noviembre de 2026

## Alcance comprobable
Se tomaron los **rankings iniciales** de JUNCOS 2026 (17 de octubre) y los podios del torneo FedeU–CENFOTEC de mayo de 2026. Son datos históricos, NO ratings actuales, probabilidades de apertura, resultados completos ni confirmación de futuras inscripciones.

Fuentes:
- JUNCOS 2026, Standard: https://s1.chess-results.com/tnr1516373.aspx?SNode=S0&lan=2
- JUNCOS 2026, Blitz: https://s3.chess-results.com/Test/tnr1516388.aspx?lan=1
- FedeU, resultados del torneo de mayo: https://fedeu.net/ucr-domina-el-torneo-universitario-de-ajedrez-fedeu-cenfotec-2026/

## Navegación solicitada
- Al entrar, se muestra **únicamente la biblioteca de rivales**.
- El botón y la pestaña **Estudio documental** permanecen ocultos hasta seleccionar una ficha.
- Seleccioná un jugador > Abrir estudio documental. Se selecciona ese jugador en el tablero.
- Si se archiva o pierde selección, se vuelve a la vista de expedientes.

## Cómo incorporar perfiles universitarios
1. Entrá como administrador CI.
2. En **Expedientes de rivales** pulsa **Incorporar rivales universitarios**.
3. La aplicación vuelve a consultar Supabase antes de comparar los registros.
4. Muestra confirmación con número de fichas nuevas y por enriquecer.
5. Compara primero por **FIDE ID** y después por nombre normalizado.
6. Crea fichas nuevas; para coincidencias solo completa el FIDE ID faltante y anexa el bloque fuente, sin alterar notas anteriores, prioridad o alias.
7. Si volvés a pulsarlo, no repite el bloque [CI:JUNCOS-FEDEU-2026].
8. Abrí una ficha y revisá universidad, rating histórico, fuente pública y URL.

**Importante:** no hacer importación automática en cada render; se ejecuta únicamente tras clic y confirmación. Como son jugadores de investigación, no crea PGN inexistentes ni evalúa su estilo.

## Cómo agregar un rival manual
1. Usá **+ Nuevo rival**.
2. Completá el nombre e idealmente el FIDE ID, que permite evitar identidades duplicadas.
3. Seleccioná prioridad A/B/C y notas con fuente.
4. El sistema comprueba duplicados en la lista activa antes de guardar. Si encuentra uno, abre su ficha en vez de crear un duplicado.
5. Podés crear un estudio documental solo después de guardar y seleccionar al rival.

## Limitaciones controladas
- La investigación inicial documenta identidad, universidad y datos históricos, no debilidades ni aperturas.
- La deduplicación de nombres normalizados no sustituye una revisión manual de homónimos y alias.
- Las fuentes y ratings se anotan por ahora en el campo de notas, sin migrar esquemas existentes de Supabase.
- No se han importado datos automáticamente a Supabase desde GitHub; el administrador ejecuta la importación desde su cuenta.
- El estudio documental continúa separado del Game Review general; no existe todavía árbol de variantes completo.
- La autorización se basa en RPC y políticas RLS existentes, no en una condición de docente.
