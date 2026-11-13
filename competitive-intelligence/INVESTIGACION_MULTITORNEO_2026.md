# Competitive Intelligence | Investigación multitorneo 2026

Fecha: 13 de noviembre de 2026. Alcance: rivales universitarios que también disputan competencias federativas, abiertas e internacionales. **No se necesita que coincidan entre sí.**

## Corpus inicial registrado
| ID | Competición | Evidencia | URL |
|---|---|---|---|
| JUNCOS-ST-2026 | JUNCOS Clásico, octubre | Ranking inicial | https://s2.chess-results.com/tnr1516373.aspx?SNode=S0&lan=21 |
| JUNCOS-BL-2026 | JUNCOS Blitz, octubre | Ranking inicial | https://s3.chess-results.com/Test/tnr1516388.aspx?lan=1 |
| UTN-CONARE-2026 | II Universitario UTN–CONARE, septiembre | Ranking inicial | https://s3.chess-results.com/tnr1498218.aspx?SNode=S0&lan=21 |
| EQUIPOS-ST-2026 | Nacional por Equipos, mayo | Listado de jugadores | https://s2.chess-results.com/tnr1413614.aspx?SNode=S0&art=15&flag=NO&lan=33&turdet=YES |
| CLASIF-ABS-2026 | Clasificatorio Absoluto 2026–27 | Listado | https://s3.chess-results.com/tnr1479494.aspx?SNode=S0&lan=-1210 |
| NACIONAL-ABS-2026 | Nacional Absoluto, febrero | Listado de jugadores | https://s1.chess-results.com/Test/tnrWZ.aspx?lan=9&tno=1341014 |
| GP3-PRELIM-2026 | III Grand Prix, octubre | **Lista preliminar**: no demuestra participación final | https://s4.chess-results.com/tnrWZ.aspx?flag=30&lan=1&tno=1513182&turdet=NO |
| OLYMPIAD-OPEN-2026 | 46.ª Olimpiada Samarcanda, septiembre | Resultados y ocho planillas de David Cabezas | https://s4.chess-results.com/tnrWZ.aspx?art=9&fed=CRC&fedb=SEY&flag=30&lan=1&snr=407&tno=1469895&turdet=YES |

## Primera cosecha internacional: David Cabezas
Ocho planillas públicas enlazadas directamente desde la ficha de la Olimpiada:
| Ronda | Rival | Color Cabezas | Resultado Cabezas | URL planilla |
|---|---|---|---|---|
| 1 | CM Ragul Pillay | Negro | 1 | https://s4.chess-results.com/PartieSuche.aspx?art=36&id=6624945 |
| 2 | IM Filip Magold | Blanco | 0 | https://s4.chess-results.com/PartieSuche.aspx?art=36&id=6625143 |
| 3 | Yazid Elhayek | Blanco | 1 | https://s4.chess-results.com/PartieSuche.aspx?art=36&id=6625659 |
| 4 | FM Colin Federer | Negro | ½ | https://s4.chess-results.com/PartieSuche.aspx?art=36&id=6625950 |
| 5 | Nidal Ghanoui | Negro | 1 | https://s4.chess-results.com/PartieSuche.aspx?art=36&id=6626439 |
| 7 | FM Reinis Paikens | Negro | 0 | https://s4.chess-results.com/PartieSuche.aspx?art=36&id=6627190 |
| 9 | IM Satria Duta Cahaya | Blanco | 0 | https://s4.chess-results.com/PartieSuche.aspx?art=36&id=6628038 |
| 10 | CM Ifan Rathbone-Jones | Negro | 0 | https://s4.chess-results.com/PartieSuche.aspx?art=36&id=6634991 |

Ocho planillas enlazadas ≠ ocho PGN ya guardados. La plataforma solo contará partidas validadas y persistidas en `ib_ci_games`. Para material usado en estadísticas, comprobar encabezados, movimiento legal, identidad, fecha, modalidad y fuente antes de guardarlo.

## Corrección identificativa
Mateo Espitia Torres: ID FIDE confirmado **6508332**, visible en el Nacional Absoluto 2026, Nacional por Equipos 2026 y Clasificatorio. El catálogo queda corregido; el expediente en Supabase se completa en la siguiente sincronización autorizada, sin perder notas.

## Método permanente para los 26 jugadores
1. Buscar por FIDE ID — no solo por nombre — en torneos nacionales, federativos, universitarios y abiertos.
2. Documentar `EVT` (torneo), `SRC` (fuente), `VER` (fecha verificación), `STS` (estado de evidencia).
3. Distinguir `LST` (lista), `RES` (resultado) y `SCO` (planilla pública) de `PGN` validado y persistido.
4. Ante ausencia de PGN, guardar enlace de la fuente; nunca generar repertorio estadístico imaginado.
5. Dar prioridad a los rivales A, pero conservar registros de B y C para posteriores comparaciones.
6. Etiquetar ratings con fecha y control; nunca mezclar Elo clásico, blitz, rápido y nacional.
7. Reconstruir luego frecuencia de aperturas por color y periodo, con tamaño de muestra y proporción de partidas desconocidas.

## Próximos lotes
- Procesar todas las partidas disponibles de la Olimpiada de Cabezas en un PGN completo, conservando fuente de cada planilla.
- Buscar planillas federativas completas de Gerardo Ramírez, Martín Barboza, Mateo Espitia, Esteban Quesada y Dany Montero.
- Añadir filtros por torneo y ritmo al repertorio y evitar sesgo de muestras parciales.
- Estudiar el historial de Elo y su tendencia en FIDE mediante capturas mensuales verificadas.
