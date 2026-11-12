# Estado de implementación — 2026-11-11

## Entregado en rama de desarrollo
- Modelo de dominio con validación y siglas.
- Servicio Supabase inyectable, acceso fallando cerrado si RPC no autoriza.
- CRUD básico de rivales, observaciones y alta/listado de partidas, sin interfaz pública.
- Pruebas unitarias para validación y ausencia de consultas después de rechazo de permiso.
- Propuesta SQL aislada **no ejecutada**.

## No entregado todavía
- Políticas RLS verificadas en la instancia real.
- Migración en Supabase ni inclusión de UUID administrador.
- Pantalla navegable en Dashboard.
- Validación PGN basada en chess.js dentro del servicio.
- Importación múltiple, historial/auditoría, cálculo IPR/IFE/IRD/VEP, test E2E.
- Integración con tablas de estudios y tableros.

## Control de regresiones
No se han modificado archivos existentes fuera de competitive-intelligence/.
La siguiente fase requiere pruebas negativas reales en Supabase para anónimo, estudiante, profesor y el administrador elegido.
La función ib_ci_is_admin() y su SECURITY DEFINER requieren revisión de privilegios y propietario antes de ejecutar el SQL.
