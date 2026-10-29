# Academia: seguimiento académico (v1)
Actualizado: 2026-10-28

## Activación (requiere al propietario de Supabase)
1. Confirmar que existen `ib_teachers`, `ib_enrollments`, `ib_profiles` y Supabase Auth.
2. Guardar una copia de seguridad de la base de datos.
3. Abrir **Supabase → SQL Editor** y ejecutar el contenido de `supabase/migrations/20261028_ib_academic_workspace.sql` una sola vez. No ejecutar el archivo de manera repetida: crea políticas RLS con nombres fijos.
4. La publicación de código de GitHub Pages no ejecuta migraciones. Probar el dashboard con **dos sesiones**: Profe Ian y un alumno activo.
5. No introducir credenciales ni `service_role` en el navegador ni en el repositorio.

## Uso del alumno
1. Iniciar sesión y abrir **Mi entrenamiento**.
2. Abrir **Game Review**, importar un PGN, ejecutar el análisis si se quiere adjuntar un informe técnico. Volver a **Mi entrenamiento**.
3. En **Enviar una partida PGN**, elegir **Usar partida de Game Review**, verificar título y torneo y pulsar **Enviar a mi profesor**.
4. La partida aparece bajo el torneo correspondiente. El envío explícito crea la copia en la nube; los estudios locales del navegador no se sincronizan automáticamente.
5. En **Tareas asignadas**, abrir las instrucciones, opcionalmente consultar el PGN de referencia, entregar notas y PGN. Las devoluciones aparecen en la misma ficha.

## Uso del profesor
1. Iniciar sesión con la cuenta autorizada y abrir **Academia**.
2. Buscar alumno activo → **Ficha deportiva · Partidas, torneos y tareas**.
3. Revisar los PGN enviados, agrupados por torneo. Usar **Analizar en Game Review** para obtener/comprobar resultados de Stockfish.
4. En **Asignar tarea**, indicar título, instrucciones, tipo, vencimiento y PGN opcional. El alumno la verá en **Mi entrenamiento**.
5. En **Tareas y correcciones**, consultar la entrega y añadir devolución con **Guardar corrección**.

## Fiabilidad y seguridad
- `ib_student_games.review` contiene un informe técnico suministrado por el cliente. No debe tomarse como verificación independiente: el profesor puede volver a analizar el PGN.
- Los promedios técnicos por evento solo incluyen análisis completos; **no son performance Elo FIDE**.
- Una cuenta suspendida mantiene su historial pero no puede enviar nuevas partidas ni entregar nuevas tareas si se aplica el RLS de esta migración.
- Este módulo controla juegos/tareas de Academia. El acceso a `ib_studies` sigue regido por las políticas anteriores y debe revisarse aparte.
- No hay todavía notificaciones push, asignación masiva, historial de versiones de tareas ni invitaciones automáticas desde el panel.
- Los archivos PGN tienen límite de 500 KB por partida; los estudios largos deben dividirse.
- Para supervisión de seguridad, probar como alumno suspendido: `insert ib_student_games` y `insert ib_assignment_submissions` deben ser rechazados; como alumno activo deben funcionar.
