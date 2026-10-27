# IB Chess Analyzer Web v1.0

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
