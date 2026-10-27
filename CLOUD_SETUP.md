# Activación de estudios compartidos (opcional)

Actualmente el sitio publicado guarda partidas, comentarios, variantes y etiquetas por alumno en IndexedDB del navegador. El modo nube funciona **solo** al crear y conectar un proyecto Supabase: no está activo de manera automática.

## 1. Crear el backend
1. Crear un proyecto en https://supabase.com y activar **Authentication > Providers > Email** (enlace OTP/magic link).
2. En SQL Editor ejecutar una vez `supabase/migrations/20261027_ib_studies.sql`.
3. Configurar en Authentication > URL Configuration: Site URL `https://ibarrantesg-cenfo.github.io/IB-Chess-Analyzer/` y permitir esta URL en Redirect URLs.
4. Ejecutar pruebas de seguridad: un usuario debe ver solo sus estudios o los compartidos con él; otro usuario sin permiso NO debe poder leer ni editar estos registros. Verificar insert/update/delete de usuarios anónimos denegado.

## 2. Conectar la web sin secretos privados
En GitHub, repositorio > Settings > Secrets and variables > Actions > **Variables**, crear:
- `VITE_SUPABASE_URL`: URL pública del proyecto (https://...supabase.co).
- `VITE_SUPABASE_ANON_KEY`: clave anon/publishable destinada al cliente, **nunca** secret/service_role.

Volver a ejecutar `Publicar IB Chess Analyzer` en GitHub Actions. Son variables incorporadas a la build estática y visibles para el navegador. RLS es la barrera de seguridad, no el secreto de la clave pública.

## 3. Primera sincronización
1. Abrir la web, desplegar **Estudios compartidos**, indicar correo y pulsar **Enviar enlace**.
2. Abrir el enlace recibido, volver al analizador.
3. Elegir/crear un estudio y pulsar **Subir estudio actual**.
4. El administrador puede agregar a otro usuario autorizado como viewer mediante el ID UUID del usuario que existe en Supabase Auth. No es todavía una invitación cómoda por correo.
5. El alumno verá únicamente estudios compartidos en su biblioteca nube. Solo el dueño puede modificar o eliminar en esta primera versión.

**Privacidad:** no subas PGN de alumnos a repositorios públicos ni actives una política RLS que permita acceso anónimo. El almacenamiento local no ofrece copias de respaldo automáticas fuera del navegador. Exportá JSON periódicamente.

## Limitaciones v1.3
- La sincronización es manual; no existe aún colaboración simultánea ni resolución de conflictos.
- El editor de tablero es una copia FEN visual que no modifica la partida importada.
- Las variantes jugadas sobre el tablero se guardan como ramas alternativas asociadas a la jugada, no como una estructura recursiva de varias subvariantes anidadas.
- No hay pruebas de navegador reales en GitHub Actions por ahora; el workflow verifica sintaxis y compilación.
- Antes de uso real con menores se requiere revisar protección de datos, consentimiento y controles de acceso.
