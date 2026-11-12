# Competitive Intelligence — Fase 0 / Fundación

**Estado:** documentación técnica inicial, no desplegado. Módulo privado, solo el administrador expresamente autorizado.

## Límites
- No utilizar `isTeacher` como autorización. Administrador de CI es un permiso distinto, asociado al UUID autenticado.
- Denegar por defecto en Supabase RLS y comprobar autorización también en el servidor. Ocultar la navegación es únicamente una mejora de UX.
- No incluir PGN privados, expedientes reales, claves de servicio o investigaciones sensibles en el repositorio público.
- No alterar biblioteca, tablero, estudios, estudiantes, Game Review, motor, rutas o estilos sin auditoría y pruebas.
- Reutilizar apertura del tablero y estudios por referencias, nunca copiando datos de alumno.
- Todo cambio en rama independiente, migraciones reversibles, pruebas de rol y respaldo antes de despliegue.
- Un expediente nunca se comparte automáticamente con estudiantes, otros profesores o público.

## Modelo propuesto
- `ib_ci_admins`: identidades autorizadas (UUID de Supabase Auth), administrado solo desde migración/operación privilegiada.
- `ib_ci_players`: identidad y alias de rivales.
- `ib_ci_games`: PGN original, atribución y fuente; deduplicación.
- `ib_ci_observations`: afirmación, tipo, muestra, evidencia, confianza y revisión.
- `ib_ci_preparations`: plan privado ligado a jugador y referencia de estudio.
- `ib_ci_audit_log`: historial de cambios sin almacenar secretos.

## Secuencia de implementación
0. Inventario de rutas, esquema y permisos reales de Supabase. Verificación de regresiones y respaldo.
1. Migraciones RLS con pruebas negativas por roles (anónimo, alumno, profesor, admin).
2. CRUD de expediente y procedencia de partida.
3. Apertura de partida/estudio vía API existente.
4. Análisis estadístico y documentación de métricas.
5. Validación UI claro/oscuro, accesibilidad y reversión.

**No ejecutar DDL de ejemplo en producción** hasta revisar migraciones, esquema y permisos existentes.

## Glosario abreviado
RID = Rival ID; FID = FIDE ID; GID = Game ID; SRC = fuente; DT = fecha; TC = control de tiempo; COL = color; OPN = apertura; ECO = clasificación ECO; FEN = posición; PGN = partida; MVR = movimiento/variante; RFR = referencia de repertorio; OBS = observación; EVD = evidencia; CF = confianza; N = tamaño de muestra; IPR = índice de previsibilidad del repertorio; IFE = índice de familiaridad estructural; IRD = índice de resistencia defensiva; VEP = valor esperado de preparación; REV = revisión; ACL = control de acceso; RLS = Row Level Security.

Todos los índices propuestos son experimentales y deberán definirse, medirse y validarse con datos.
