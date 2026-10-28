# Activación de estudios compartidos (opcional)

Actualmente el sitio publicado guarda partidas, comentarios, variantes y etiquetas por alumno en IndexedDB del navegador. El modo nube funciona **solo** al crear y conectar un proyecto Supabase: no está activo de manera automática.

## 1. Crear el backend
1. Crear un proyecto en https://supabase.com y activar **Authentication > Providers > Email** (enlace OTP/magic link).
2. En SQL Editor ejecutar una vez `supabase/migrations/20261027_ib_studies.sql`.
3. Configurar en Authentication > URL Configuration: Site URL `https://ibarrantesg-cenfo.github.io/IB-Chess-Analyzer/` y permitir esta URL en Redirect URLs.
4. Ejecutar pruebas de seguridad: un usuario debe ver solo sus estudios o los compartidos con él; otro usuario sin permiso NO debe poder leer ni editar estos registros. Verificar insert/update/delete de usuarios anónimos denegado.

## 2. Conectar la web sin secretos privados
En GitHub, repositorio > Settings > Secrets and variables > Actions > **Variables**, crear:
- `VITE_SUPABASE_ANON_KEY`: clave anon/publishable destinada al cliente, **nunca** secret/service_role.

La URL pública del proyecto Supabase `https://ctnymqmzzppfymrteqha.supabase.co` ya está preconfigurada en `.github/workflows/deploy.yml`; no hace falta crear una segunda variable.

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


## Flujo de entrenamiento entrenador ↔ alumno (v2.1, tras activar Supabase)
1. Ambos inician sesión con enlaces por correo desde la propia web.
2. El entrenador entra en Estudios compartidos y copia **mi ID para compartir**.
3. El alumno abre un estudio **propio** en su cuenta, pulsa **Subir estudio actual**, introduce el UUID del entrenador y usa **Compartir estudio**.
4. Al actualizar la biblioteca de la cuenta del entrenador y seleccionar **Compartidos conmigo**, aparece el estudio del alumno. El propietario es siempre el alumno.
5. El entrenador lo abre, añade comentarios y variantes y pulsa **Enviar corrección al alumno**. Esto guarda **otro estudio** a nombre del entrenador, con referencia al original, y comparte la copia con el alumno en lectura. No sobrescribe la entrega original.
6. El alumno pulsa Actualizar biblioteca y encuentra la corrección en **Compartidos conmigo**.

**Importante**: es un intercambio secuencial, no edición simultánea. La corrección no se sube automáticamente al escribir; hay que pulsar el botón para enviarla. No debe usarse con datos privados reales sin probar RLS con dos cuentas separadas. Los alumnos menores requieren medidas adicionales de protección de datos y acceso.

## Diagramas y posiciones
El editor permite añadir/retirar piezas, establecer el turno, importar/copiar FEN, partir de solo dos reyes y **guardar diagramas FEN en cada estudio**. El PGN principal queda inalterado. Las copias JSON incluyen los diagramas.

## Seguridad operacional
- No crear variables GitHub para claves service_role ni secretos de base de datos.
- Aplicar únicamente la migración tras examinarla y probar permisos en Supabase.
- Probar que un tercer usuario no puede ver estudios compartidos entre alumno y entrenador, ni modificar un estudio que no posee.
- Si falla el compartido de correcciones, comprobar que el propietario de la copia está autenticado y que se creó la membresía, antes de anunciar que la devolución se completó.

## Conexión de producción (28 de octubre de 2026)
El proyecto Supabase ya está creado y la migración inicial se ejecutó correctamente. La URL pública está configurada en el workflow y `VITE_SUPABASE_ANON_KEY` se añadió a las variables del repositorio. El siguiente despliegue de GitHub Pages incorpora estos valores en el cliente. Aún deben configurarse en Supabase Authentication la URL del sitio, las redirecciones y la verificación de políticas con dos cuentas; una compilación correcta no confirma autenticación ni privacidad.
