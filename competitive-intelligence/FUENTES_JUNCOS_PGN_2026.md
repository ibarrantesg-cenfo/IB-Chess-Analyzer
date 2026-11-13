# Competitive Intelligence — Nueva fuente verificable: PGN JUNCOS 2026

**Fecha de investigación:** 13 de noviembre de 2026.

## Hallazgo
La base de partidas de Chess-Results para el torneo **XXV Juegos Universitarios Costarricenses Individual Masculino Standard 2026** (identificador 1516373) anuncia **10 partidas PGN disponibles**, repartidas en 5 rondas, 2 por ronda.

- Base de partidas y descarga PGN: https://s3.chess-results.com/partiesuche.aspx?art=3&lan=2&tnr=1516373
- Lista inicial y FIDE ID de participantes: https://s1.chess-results.com/tnr1516373.aspx?SNode=S0&lan=1

**Control de evidencia:** diez partidas disponibles en un torneo NO implican diez por jugador ni que todos los participantes tengan PGN publicado.

## Cuatro rivales universitarios adicionales identificados
| Jugador | FIDE ID | Universidad | Elo clásico inicial JUNCOS |
|---|---|---|---|
| Anthony León Cubero | 6511430 | UTN | 1547 |
| Pablo Andrés Mora Arias | 6529151 | UACA | 1465 |
| Miguel Andrés Rojas Anchía | 6550550 | UTN | Sin Elo internacional en lista |
| Allan Castillo Hernández | 6583822 | LEAD University | Sin Elo internacional en lista |

No sustituimos un 0 por Elo real. La base now contempla **26 candidatos**; la UI solicitará incorporar solo los cuatro que falten, preservando expedientes existentes.

## Procedimiento de carga
1. Abrir el enlace de la base de partidas de JUNCOS.
2. Elegir desde ronda 1 hasta ronda 5 (o filtros relevantes) y usar **Descargar en formato PGN**.
3. Abrir en la aplicación el expediente de cada rival al que efectivamente pertenezcan esas partidas.
4. Importar el PGN completo. El importador identifica White/Black y rechaza partidas que no correspondan al rival.
5. Revisar estadísticas por color, ECO y primeras ocho medias jugadas únicamente después de que se guarden los PGN validados.
6. Conservar la URL de procedencia de la base y documentar cualquier rechazo.

## Mejoras de interfaz incorporadas
- Fuente JUNCOS PGN visible en fichas de candidatos del torneo clásico.
- Indicadores de **datos identificados, Elo con fecha, partidas PGN guardadas y referencias externas**. No se confunden referencias externas con partidas importadas.
- Panel de líneas frecuentes observadas, además de primeras respuestas y códigos ECO.
- No se ejecuta una importación oculta; cualquier operación de escritura requiere la sesión administrativa y una acción explícita.

## Pendientes honestos
No hemos obtenido todavía un archivo PGN integral por un canal automatizado confiable; las páginas de búsqueda/descarga requieren selección y acción de descarga desde la interfaz pública. No existe conexión directa a la instancia autenticada de Supabase en este entorno. No se marca ningún PGN como almacenado hasta que el backend confirme la escritura.

Próximo desarrollo: ingestión de PGN de torneo con identificación y distribución de partidas en lote entre expedientes, auditoría de duplicados interjugadores y árbol de aperturas con control del tamaño muestral.
