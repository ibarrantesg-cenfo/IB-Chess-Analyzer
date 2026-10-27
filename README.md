# IB Chess Analyzer Web v1.3

Analizador de ajedrez web **sin suscripción**, construido sobre `chess.js` y **Stockfish.js 19** (WASM). El cálculo se realiza en un Web Worker en tu navegador, no en servidores de pago.

## Uso en tu computadora (para desarrollar)
1. Instala Node.js LTS desde https://nodejs.org/ (VS Code es opcional).
2. Extrae el ZIP y abre una terminal dentro de `IB_Chess_Analyzer_Web`.
3. Ejecuta `npm install` y después `npm run dev`.
4. Abre el enlace local que aparezca (normalmente http://localhost:5173/).

**No necesitas instalar Stockfish**: `npm run dev` ahora copia automáticamente el motor a los recursos públicos.

## Publicarlo automáticamente como web
1. Crea repositorio nuevo en GitHub (por ejemplo `IB-Chess-Analyzer`).
2. Sube **el contenido de esta carpeta** a la rama `main` (no subas `node_modules`).
3. En GitHub → Settings → Pages → Build and deployment → Source selecciona **GitHub Actions**.
4. En Actions ejecuta `Publicar IB Chess Analyzer`, o sube un commit nuevo.
5. La URL será `https://TU-USUARIO.github.io/NOMBRE-DEL-REPOSITORIO/`.

**Privacidad:** GitHub Pages es público, pero tus PGN importados se analizan únicamente en el navegador. No se incluyen los PGN de alumnos en el código del sitio. No añadas archivos privados a `public/`.

## Capacidades
- Arrastrar/importar PGN, selección de partida y tablero navegable.
- Análisis local Stockfish 19: Lite (≈1.7 MB) o completo (≈94 MB), ambos single-thread.
- Revisión por jugada con clasificaciones aproximadas basadas en centipeones, gráfico de evaluación, mejor variante y comentarios básicos.
- Exportar el análisis en CSV y partida anotada PGN.
- Pausar/cancelar análisis; valores hasta 30 de profundidad (puedes elevar el límite en la interfaz si tu hardware lo permite).

## Límites conocidos
- Las etiquetas son heurísticas originales; no son las métricas oficiales de Chess.com.
- Analizar todas las posiciones a profundidad alta puede llevar mucho tiempo y consumir CPU.
- El análisis se cancela al cerrar o recargar la pestaña. No se guardan evaluaciones persistentes en esta v1.
- La versión completa consume alrededor de 94 MB en descargas y tarda más en inicializar.
- El Elo performance **no** está implementado; no sería correcto inferir Elo oficial de unas pocas partidas.
- Debe validarse en Chrome/Edge en Windows; no se ha realizado una prueba end-to-end en este entorno sin red.

## Licencias
Stockfish.js 19 está licenciado bajo **GPL-3.0**. Cuando distribuyas el sitio con el motor, proporciona también acceso al código fuente del motor y cumple sus requisitos: https://github.com/nmrugg/stockfish.js . `chess.js`: BSD-2-Clause. Este proyecto incluye enlaces a las fuentes originales.

## Editor de estudios v1.2 (almacenamiento local)
- Clic derecho sobre una jugada para abrir sus comentarios.
- Etiquetá la partida por alumno y guardá el estudio usando IndexedDB del navegador.
- Agregá variantes SAN legales desde la posición seleccionada.
- Editá una posición mediante la paleta de piezas. Esta edición afecta la visualización de esa posición; **no** modifica el PGN original ni constituye todavía un editor de árboles de variantes.
- Exportá el estudio (PGN base, comentarios y variantes) como JSON.
- Los estudios son **locales a cada navegador**, sin cuentas, sincronización ni colaboración multiusuario. No se deben prometer bibliotecas compartidas hasta integrar backend y permisos.
- Hacé una copia JSON regularmente: borrar datos del navegador puede borrar la biblioteca local.

## Fase posterior: estudios compartidos
Supabase PostgreSQL + Auth + RLS, con tablas profiles, students, studies, study_memberships, study_positions, variations, move_comments, analysis_jobs. Exigir autorización por estudio y alumno en todas las lecturas y escrituras, usar migraciones, auditoría de cambios y evitar incluir service_role keys en el cliente. El análisis Stockfish sigue corriendo en el navegador.

## Novedades v1.3 — Edición y estudios
- Clic derecho en cualquier jugada para anotar la posición.
- Mover piezas con dos clics (origen y destino) para crear una variante legal desde la posición elegida; navegarla con los controles en Estudios.
- Editar diagramas mediante una copia FEN, sin alterar la partida original.
- Guardar la partida y comentarios localmente en el navegador; exportar e importar copias de seguridad JSON.
- Exportar PGN con comentarios del entrenador y alternativas anotadas como texto.
- Panel opcional de estudios compartidos: iniciar sesión por correo, subir/abrir estudios y dar acceso de lectura por ID de usuario. **Inactivo hasta configurar Supabase** según `CLOUD_SETUP.md`.
- Comprobación sintáctica automática antes del despliegue.

**Estado de validación:** el código está versionado y tiene comprobaciones sintácticas; las funciones nuevas requieren una prueba real en el navegador antes de considerarse estables. No subir información sensible hasta verificar permisos de la nube.
