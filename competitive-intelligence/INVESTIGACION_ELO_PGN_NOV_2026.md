# Competitive Intelligence — Rating y partidas reales (investigación 12 nov 2026)

## Regla de evidencia
El **Elo FIDE noviembre 2026** es una foto oficial del mes, no consulta en tiempo real. Las colecciones de partidas citadas son **referencias externas**, NO partidas completas ya importadas. Solo se contabilizan líneas, ECO y resultados cuando el administrador guarda un **PGN legal completo** en `ib_ci_games`.

### Ratings FIDE verificados, noviembre de 2026
| Jugador / FIDE ID | Clásico | Rápido | Blitz | FIDE |
|---|---:|---:|---:|---|
| FM David Alejandro Cabezas Solano · 6507522 | 2275 | 2216 | 2262 | https://ratings.fide.com/profile/6507522 |
| FM Gerardo Alfonso Ramírez Madrid · 6505945 | 2056 | 1955 | 1934 | https://ratings.fide.com/profile/6505945 |
| Dany José Montero Romero · 6522181 | 1859 | 1790 | 2000 | https://ratings.fide.com/profile/6522181 |
| CM Martín Eduardo Barboza Víquez · 6508200 | 2042 | 1725 | 1877 | https://ratings.fide.com/profile/6508200 |
| Juan Diego Coto Calderón · 6506941 | 1867 | 1767 | 1774 | https://ratings.fide.com/profile/6506941 |
| Luis Javier Cartín Aguilar · 6516858 | 1890 | 1786 | 1840 | https://ratings.fide.com/profile/6516858 |
| Esteban Quesada Fallas · 6513743 | 2052 | 1856 | 1817 | https://ratings.fide.com/profile/6513743 |

La UI deja vacío el Elo de jugadores sin lista mensual verificada, en lugar de copiar el rating histórico de JUNCOS como actual.

## Banco de partidas localizadas (por revisar e importar)
- David Cabezas: https://www.chess.com/games/david-alejandro-cabezas-solano
- David Cabezas (ChessPrime): https://chessprime.com/players/player/146957/
- Gerardo Ramírez: https://www.chess.com/games/gerardo-alfonso-ramirez-madrid
- Martín Barboza: https://www.chess.com/games/martin-eduardo-barboza-viquez
- Nacional por equipos clásico 2026 · ronda 4: https://s2.chess-results.com/test/partiesuche.aspx?art=4&lan=5&rd=4&tnr=1413614
- Nacional por equipos clásico 2026 · ronda 5: https://s2.chess-results.com/test/partiesuche.aspx?art=4&lan=5&rd=5&tnr=1413614

En la ronda 4 aparecen, por ejemplo, Cabezas–Granados Ramírez, Bermúdez–Ramírez Madrid, Campos Sánchez–Cartín y Vargas Miranda–Agüero. En la ronda 5 aparecen Urbina–Cabezas y Céspedes–Ramírez Madrid.

**Precaución**: el índice de partidas publicado en Chess.com o Chess-Results no equivale a un archivo PGN descargado. No se usaron sus aperturas para inferir frecuencias individuales, por el sesgo de selección de partidas.

## Uso de la nueva ficha
1. Competitive Intelligence > seleccionar rival.
2. Ver el panel de Elo FIDE y sus fuentes.
3. En «Fuentes y partidas localizadas», abrir fuentes públicas y descargar/copiar el PGN **completo** de las partidas disponibles, con respeto a sus condiciones de acceso.
4. En «Importar partidas del rival», seleccionar el archivo PGN o pegar múltiples partidas, con los encabezados White y Black y movetext legal.
5. Introducir URL de procedencia, cuando se tenga, y pulsar «Verificar e importar PGN».
6. Revisar cantidad de partidas válidas, duplicadas y rechazadas. La base se actualiza con guardados confirmados en Supabase.
7. Consultar repertorio basado en datos realmente importados: total por color, resultados, primer movimiento/respuesta y ECO con número de partidas.

## Qué NO se implementó todavía
- Extracción automática desde sitios externos ni acceso a bases de datos privadas de terceros.
- Repertorios inferidos del listado de resultados si no están los movimientos completos.
- Aperturas por nombre de ECO cuando el PGN no incluye ese encabezado; se muestra «Sin ECO».
- Análisis Stockfish, métricas de precisión o error, árbol avanzado de transposiciones.
- Revisión E2E del navegador conectado a Supabase; los tests son del código y parser.

## Siguiente mejora segura
1. Estandarizar procedencia individual por partida (actualmente URL de importación).
2. Clasificación ECO automatizada por reglas de transposición validadas.
3. Historial Elo FIDE en Supabase con fecha, fuente y revisión.
4. Recolección pública autorizada, procesada en staging y auditada antes de insertar expedientes reales.
