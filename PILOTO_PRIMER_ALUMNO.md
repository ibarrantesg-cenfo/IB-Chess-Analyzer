# IB Chess Academy — Primera prueba con un alumno real (29 de octubre de 2026)

**Estado:** código implementado en GitHub. La activación definitiva requiere migraciones en Supabase y una prueba con dos cuentas reales. No cargar datos personales ajenos sin autorización.

## 0. Antes de empezar
- Contar con respaldo de Supabase y acceso a su SQL Editor.
- El profesor debe iniciar sesión con una cuenta presente y activa en `ib_teachers`.
- El estudiante debe tener cuenta Supabase Auth y estar vinculado en `ib_enrollments` con `state='active'`, vigencia sin vencer. El estudiante autoriza compartir sus PGN.
- Preparar un PGN real de un torneo, idealmente con encabezados `Event`, `Date`, `Round`, `White`, `Black`, `Result` y Elo del rival (`WhiteElo`/`BlackElo`). Ejemplo de una partida:

```pgn
[Event "Torneo de prueba"]
[Date "2026.10.29"]
[Round "1"]
[White "Nombre exacto alumno"]
[Black "Rival"]
[WhiteElo "1850"]
[BlackElo "1910"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 1-0
```
La muestra es SOLO para verificar la interfaz; NO se debe contar como partida auténtica.

## 1. Migraciones en orden
Ejecutar desde **Supabase Dashboard → SQL Editor** con respaldo previo:

1. [Base de datos académica](supabase/migrations/20261028_ib_academic_workspace.sql): crea `ib_student_games`, `ib_assignments`, `ib_assignment_submissions` y RLS. Ejecutarla **una sola vez** después de las migraciones de cuentas.
2. [Importación del profesor](supabase/migrations/20261029_ib_teacher_tournament_import.sql): permite insertar en la cuenta de un estudiante activo **solo a su profesor vinculado y activo**.
3. Las políticas de acceso de biblioteca `ib_studies` son independientes: revisar la migración [de acceso de nube](supabase/migrations/20261028_ib_active_cloud_access.sql) antes de activarla, pues reemplaza algunas políticas.

**Advertencia:** publicar GitHub Pages NO ejecuta SQL en Supabase. No introducir credenciales secretas en GitHub.

## 2. Diagnóstico de estructura (consulta de solo lectura)
```sql
select table_name from information_schema.tables
where table_schema='public' and table_name in
 ('ib_student_games','ib_assignments','ib_assignment_submissions','ib_enrollments','ib_profiles','ib_teachers')
order by table_name;

select tablename, policyname, cmd from pg_policies
where schemaname='public' and tablename in
 ('ib_student_games','ib_assignments','ib_assignment_submissions')
order by tablename, policyname;

select relname, relrowsecurity from pg_class
where relname in ('ib_student_games','ib_assignments','ib_assignment_submissions');
```
Verificar que existan las 6 tablas, que las 3 nuevas tengan RLS habilitado y que exista la política `ib_teacher_game_insert` tras el paso 2.

## 3. Prueba del profesor
1. Abrir la web e iniciar sesión como **Profe Ian**.
2. Ir a **Academia → Centro de seguimiento → seleccionar alumno → Ficha deportiva**.
3. Abrir **Importar torneo PGN para este alumno**.
4. Escribir el **nombre exacto del alumno tal como figura en PGN**. Puede diferir del nombre visible de su cuenta.
5. Pegar todas las partidas, indicar el nombre del torneo, pulsar **Previsualizar rondas**.
6. Confirmar que cada ronda identifica **Blancas** o **Negras** correctamente.
7. Pulsar **Guardar torneo del alumno**. No importar dos veces: la ficha comprueba partidas que ya existan.
8. Verificar que el torneo y las rondas aparecen en la ficha del estudiante.

## 4. Prueba del estudiante
1. Iniciar sesión en otro navegador/ventana de incógnito.
2. Abrir **Mi entrenamiento**; verificar que aparecen sus partidas y torneos.
3. Abrir una partida en **Game Review** y comprobar PGN y nombres.
4. Opcional: importación por lote desde **Mi entrenamiento → Importar torneo completo**, con su nombre exacto.
5. Verificar que no aparece la sección administrativa de Academia.

## 5. Métricas y reportes
1. Profesor: abrir **Estadísticas de Academia**.
2. Seleccionar al estudiante y **Todo el historial** para confirmar que se ven sus torneos.
3. Cambiar a **Últimos 30 días** para confirmar el filtro. Utiliza `played_at` si existe; si no, `created_at`.
4. Comprobar resultado y Elo de rivales en PGN para el cálculo de performance. Un torneo con 100% o 0% de resultados no tiene TPR finito según la inversión logística; se muestra `—`.
5. **Precisión y ACPL requieren análisis completos con Stockfish**, adjuntos a cada partida; sin ellos aparecerá `—`, lo cual es correcto. Importar PGN por sí solo NO ejecuta ni sube el análisis. El análisis y sincronización automática a Supabase todavía no están terminados.
6. Exportar CSV y validar los valores comparando con las rondas.

## 6. Tarea y retroalimentación
1. Profesor: ficha deportiva → **Asignar tarea** → título, instrucciones y fecha.
2. Alumno: **Mi entrenamiento → Tareas asignadas** → entregar notas y, si corresponde, PGN.
3. Profesor: ficha deportiva → **Tareas y correcciones** → ver entrega → escribir devolución.
4. Alumno: confirmar que puede leer la corrección.

## 7. Verificaciones de permisos (indispensables)
- Alumno activo: puede consultar sus propias partidas y entregar tareas.
- Profesor vinculado: puede abrir las partidas del alumno e importar torneos.
- Cuenta no vinculada: NO puede consultar ni importar partidas de ese alumno.
- Alumno suspendido: no debe poder insertar partidas nuevas ni enviar entregas. Sus datos previos permanecen guardados.
- **No verificar la seguridad solamente ocultando botones**; RLS debe denegar acciones en la base.

## 8. Limitaciones explícitas del piloto
- La importación por lote guarda el PGN y sus datos, y **adjunta un informe de Stockfish ya analizado y guardado en el mismo navegador** si encuentra una coincidencia exacta. **No ejecuta Stockfish automáticamente**; por eso una partida nueva todavía puede aparecer sin precisión ni ACPL. Los análisis locales no se sincronizan hasta que se importen explícitamente las partidas.
- Actualmente los torneos se agrupan por nombre del evento. Si el mismo nombre se usa en varios años, conviene distinguirlos en el campo de torneo (ej.: `Nacional 2026`).
- La consulta estadística limita el historial a 1000 partidas; para una academia grande habrá que implementar paginación del lado servidor.
- El registro de solicitudes e invitaciones de nuevos estudiantes continúa parcialmente manual.

## Resultado de aceptación
El piloto estará validado cuando: el PGN aparezca en la cuenta del estudiante, Profe Ian lo vea, los resultados y la performance coincidan con los PGN, el filtro 30 días funcione, una tarea se entregue/corrija y las políticas RLS rechacen accesos no autorizados.

**Enlace de la web:** https://ibarrantesg-cenfo.github.io/IB-Chess-Analyzer/
