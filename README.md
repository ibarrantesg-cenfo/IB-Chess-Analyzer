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


## v1.5: Motor en vivo, 3 variantes, conclusiones visibles
- Corregido el panel de conclusiones: ya no es flotante ni tapa gráficas o notación al desplazarse.
- Stockfish Lite se inicia automáticamente en un worker independiente al abrir la web.
- Cada avance/retroceso y cada variante jugada sobre el tablero solicita el análisis de la posición actual.
- MultiPV seleccionable: 1, 3 o 5 líneas, profundidad 16/20/24/28; incluye evaluación desde la perspectiva de las blancas, SAN y una explicación heurística por alternativa.
- El motor en vivo se pausa al iniciar un Game Review completo y se reanuda al terminar; el navegador no mantiene dos búsquedas simultáneas.
- Cada línea del motor puede guardarse en un estudio junto con una explicación; la opción solo es válida desde la línea principal (no una FEN editada o subvariante).
- El Game Review contextualiza errores con continuación principal de Stockfish y argumentos básicos sobre capturas, jaques y fases del juego.
- Es un análisis basado en reglas y en Stockfish; no equivale a una narración estratégica generada por un entrenador o IA.
- El cómputo puede consumir CPU; desactivá el análisis automático desde el interruptor si necesitás recursos.
- Se necesita verificar esta versión en un navegador real. GitHub Actions comprueba sintaxis y publicación, no garantiza que Stockfish WASM inicialice en todos los equipos.


## v1.6 — Escritorio compacto y reproducción de variantes
- **Paneles normales, no flotantes**: el informe no tapa tablero, notación ni gráficas al desplazar.
- **Vista compacta** con distribución equilibrada para pantallas de escritorio, o vista cómoda con más espacio.
- **Prioridad** automática: Game Review sobre variantes en la línea principal; variantes sobre Game Review al reproducir una línea, incluida una variante del estudio. Controles manuales para invertir los dos bloques o restaurar el orden. La preferencia se conserva en el navegador.
- **Reproducción de líneas MultiPV**: clic en una jugada calculada para mostrar la posición correspondiente en el tablero; controles de anterior/siguiente y volver a partida. Las otras opciones del motor permanecen visibles mientras se reproduce la línea.
- **Interpretación escrita** basada en puntuación Stockfish (perspectiva blanca), ventaja material probable en escala aproximada, jaques y capturas en la secuencia. El valor de MultiPV corresponde a la posición inicial de cada línea, no a evaluaciones independientes de cada jugada interna.
- La reproducción es temporal: no modifica ni sobrescribe el PGN de la partida.
- Las explicaciones son heurísticas, no equivalen a análisis causal profundo de IA. Pueden existir variantes evaluadas distinto a profundidad mayor.
- La build valida sintaxis de `workspace.js` y `live-analysis.js`, pero las interacciones necesitan una prueba real del navegador tras el despliegue.


## v1.7 — Rendimiento de partida y torneo
- **Desempeño por partida**: resultado PGN, índice técnico original de 0–100 por jugador, pérdida media de centipeones, jugadas procesadas, errores y desglose aproximado apertura/medio juego/final.
- **No se presenta el índice técnico como Elo o como precisión de Chess.com**. Fórmula pública del proyecto: promedio de `100 × exp(-min(pérdidaCP,600)/150)` para las jugadas analizadas. Las métricas solo son comparables a igual motor, profundidad y criterio.
- **Rendimiento Elo estimado de torneo**: seleccioná jugador y evento en el PGN. El estimador resuelve por búsqueda binaria la ecuación `Σ 1/(1+10^((EloRival-Rendimiento)/400)) = puntos obtenidos` usando únicamente rivales con Elo válido y resultado 1-0/0-1/1/2-1/2. No es cálculo oficial FIDE ni debe mostrarse como rating obtenido.
- Para 0% y 100% frente a rivales calificados, no se inventa un número finito. Para rivales sin Elo no se calcula TPR hasta disponer de la información.
- Abrí cada partida del evento con un clic, calculá Game Review para cada una, o ejecutá **Analizar partidas de este torneo**. El lote analiza secuencialmente las pendientes y se puede cancelar entre partidas.
- Conserva las evaluaciones de las partidas analizadas **en la sesión actual** al navegar; todavía no las sincroniza ni las persiste automáticamente entre sesiones.
- Exportá resultados, ratings rivales e índice técnico a CSV. No importa a una base pública ni revela datos del PGN al servidor.
- **Pruebas automáticas**: `npm run test` comprueba resultados, estimación de 50%, ratings ausentes y resultados extremos; GitHub Actions ejecuta los tests antes del build.
- Falta confirmar prueba de interfaz/navegación desde un navegador tras el despliegue actual.


## v1.8 — Performance basado en análisis Stockfish (experimental)

El módulo prioriza el **performance técnico obtenido de las decisiones evaluadas por Stockfish** y no confunde un resultado deportivo con calidad de juego.

- Índice técnico instantáneo 0–100: promedio `100 × exp(-min(pérdidaCP,600)/150)` sobre jugadas realmente analizadas. Es una métrica interna, no una precisión comercial.
- **Elo de performance derivado del motor:** cuando hay suficientes partidas completas con Elo de referencia en el PGN, el software aprende una relación *local* entre calidad técnica y Elo declarado, con vecinos cercanos. Se apartan las muestras del mismo jugador y de la propia partida para reducir filtración de resultados.
- Umbral mínimo: 16 partidas-jugador de otros jugadores, 6 jugadores diferentes, dispersión de Elo de al menos 350 puntos, dispersión de calidad de al menos 7 puntos; tampoco extrapola lejos del intervalo de referencia.
- Se muestra aproximación y dispersión, no un rating oficial ni una precisión garantizada. La calibración con partidas de distintos ritmos, motores o profundidades puede ser inválida; usar partidas homogéneas.
- Para el torneo: promedio de los performances analíticos calibrados de las partidas completas del jugador. Cuando no alcanza la muestra, mostrar índice técnico y “Sin calibración” en lugar de inventar rating.
- Resultado/Elo rivales (performance FIDE Ra + dp) queda como estadística independiente, nunca se usa para generar el performance técnico de la partida evaluada.
- Importar partidas PGN **no las analiza automáticamente**. Analizar todas las partidas relevantes del evento para crear y utilizar calibración.
- La calibración procede de ratings PGN declarados y debe validarse con una muestra representativa, idealmente separada de las partidas que se predicen.

Este prototipo estima fuerza a partir del análisis bajo las condiciones indicadas, no reproduce el Estimated Rating de Chess.com.


## v1.9 — Elo aparente instantáneo en cada partida
- Tras Game Review completo, muestra **una cifra para blancas y otra para negras** calculadas solo a partir de las pérdidas de evaluación del jugador en esa partida.
- No usa resultado, rating del rival ni rating del propio jugador.
- Interpolación heurística explícita (índice técnico → Elo aparente): 0→400, 35→700, 45→900, 60→1250, 70→1500, 80→1800, 87→2100, 93→2350, 97→2600, 100→2800.
- Intervalo mostrado como orientación (±450 para 8–14 decisiones, ±350 para 15–24 y ±300 para 25 o más), **no** es un intervalo estadístico calibrado.
- Sin puntuación si hay jugadas sin analizar o menos de 8 decisiones del bando.
- En torneo se muestra media del Elo aparente de sus partidas completamente analizadas.
- Es un indicador experimental recreativo de fuerza demostrada, **no** rating FIDE, performance oficial ni estimación predictiva validada. Para lograr validez será necesario calibrar y medir error con muchos PGN de referencia.


## v2.2 — Apariencia para clases
En la barra superior hay un selector **♟ Apariencia**. Ofrece seis temas de tablero (Jade, madera, azul, gris, violeta y alto contraste), combinación personalizada de colores claros y oscuros, cuatro tratamientos visuales de piezas basados en los glifos Unicode (Clásicas, Planas, Contorno y Alto contraste), coordenadas opcionales y botón para restaurar ajustes. Las preferencias se guardan con `localStorage` solamente en el navegador; no afectan ni el PGN ni los cálculos Stockfish. Estos estilos no equivalen a cambiar a paquetes de imágenes 2D distintos, que requerirían activos gráficos adicionales. La nube Supabase sigue pendiente de conexión y pruebas de permisos.


## v2.3 — Flechas y marcas de casillas
- Clic derecho sostenido sobre una casilla y arrastrar a otra: flecha amarilla sobre el tablero (SVG independiente de la partida).
- Clic derecho sin arrastrar: marca de casilla rojiza.
- Repetir la misma flecha o marca alterna su visibilidad (borra esa anotación).
- Clic izquierdo sobre el tablero elimina las anotaciones actuales; avanzar/retroceder posiciones también las limpia.
- Las anotaciones no se guardan en el PGN ni en los estudios; son marcas temporales para enseñar.
- El editor de piezas tiene prioridad sobre las flechas cuando está habilitado.
- La apariencia de cada navegador y perfil se guarda en localStorage por origen (dominio + protocolo). Cambiar de github.io a .com crea otra identidad de almacenamiento y el aspecto anterior no migra automáticamente.


## v2.4 — Colecciones reales de piezas
En **Apariencia → Estilo de piezas** hay cinco nuevas colecciones SVG ilustradas:
Chessnut (moderna), Fantasy (artística), Spatial (geométrica),
Celtic (decorativa) y RhosGFX (pixel art), además de los cuatro
tratamientos Unicode anteriores. La mini galería muestra las seis piezas
de ambos colores del conjunto elegido.

Las imágenes SVG se descargan de los recursos públicos licenciados de
Lichess *durante la compilación* y se incluyen en `dist/pieces`: no se
requiere un CDN externo cuando el alumno abre la aplicación.
El proceso de build falla si no puede obtener/validar las imágenes,
para evitar publicar una versión visualmente incompleta.
Créditos y licencias: [PIECE_CREDITS.md](PIECE_CREDITS.md).
La preferencia se recuerda por navegador y perfil.

## v2.6 — más personalización visual
Seis paletas nuevas: nogal, océano, bosque, rosa, noche y arena (12 paletas en total), con combinación libre con ocho familias SVG diferentes más cuatro tratamientos Unicode. Nuevas familias: Kiwen Suwi, Totoy y Papercut, con atribución CC BY 4.0 documentada en `PIECE_CREDITS.md`. Las opciones se conservan de forma local por navegador y perfil. La compilación descarga las piezas SVG al paquete web; verificar la ejecución verde de GitHub Actions antes de probar.
