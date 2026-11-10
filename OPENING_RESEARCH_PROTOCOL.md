# Biblioteca Maestra: protocolo de investigación y aprobación

**Estado:** laboratorio de investigación; ningún capítulo del catálogo inicial está aprobado automáticamente. Esta capa está separada de los expedientes de alumnos.

## Objetivo
Desarrollar repertorios rigurosos, comentados y reproducibles a partir de variantes legales, análisis de Stockfish 19 Lite, datos de partidas magistrales y revisión ajedrecística humana.

## Procedimiento por posición
1. **Identidad y legalidad:** comprobar la línea SAN completa, FEN de cada jugada, ECO y transposiciones por FEN, no solamente por nombre.
2. **Contexto competitivo:** consultar manualmente Lichess Masters Opening Explorer para recuperar frecuencias, resultados y referencias de partidas reales; indicar fecha de consulta y tamaño de muestra. Frecuencia no es prueba de corrección.
3. **Análisis táctico:** analizar el FEN exacto en Game Review con Stockfish 19 Lite, preferiblemente MultiPV 3 y profundidad >= 20. Guardar líneas, versión, profundidad, puntuación desde perspectiva blanca y fecha. Examinar alternativas críticas a igual o mayor profundidad; no equiparar análisis con distinta profundidad o posición.
4. **Interpretación humana:** describir consecuencias verificables (actividad, casillas, estructura, seguridad del rey, rupturas y amenazas concretas); distinguir hechos, hipótesis y consejos prácticos. No llamar 'mejor' o 'error' una jugada solo por frecuencia ni por una evaluación de búsqueda poco profunda.
5. **Partidas modelo:** seleccionar partidas de referencia cuyos planes sean realmente visibles. Guardar identificadores y metadatos, sin copiar anotaciones protegidas de libros o cursos.
6. **Verificación:** reconstruir cada variante anotada y contrastar afirmaciones tácticas con motor. Revisar transposiciones, estabilidad ante mayor profundidad y posibles refutaciones.
7. **Aprobación editorial:** un entrenador debe revisar el capítulo y las fuentes antes de moverlo a una futura base académica compartida. El laboratorio actual NO dispone de botón de publicación.

## Criterios para aprobar un capítulo
- Toda línea y desviación legal; ningún comentario enlazado a jugada errónea.
- Posiciones críticas con capturas de análisis, incluyendo FEN, alternativas y profundidad.
- Datos de Masters o evidencia equivalente con autor, fecha y denominador; aclarar ausencia de muestra.
- Planes para ambos colores que expliquen **qué**, **por qué**, **cuándo** y **qué juega el contrario**.
- Una refutación o problema táctico expuesto sin cifras de motor inventadas.
- Comentarios originales, atribución bibliográfica y revisión manual del entrenador.
- Control de versiones para detectar cambios de evaluación o teoría.

## Material inicial
- 39 líneas de investigación de 15 familias a partir de 6 prototipos y 33 extensiones.
- Las notas se guardan como **borradores locales**. Se dispone de exportación PGN de línea individual o familia.
- El almacenamiento local no reemplaza una base Supabase editorial ni sirve para respaldos multi-dispositivo.
- Las capturas de Stockfish solo documentan una búsqueda local; no equivalen a un dictamen de la teoría.
- Las consultas de Masters son opcionales y respetan límites de API; si una consulta falla, el capítulo sigue sin evidencia histórica.
- Ninguna evaluación predefinida está incluida en los datos iniciales.

## Fuentes técnicas primarias
- Lichess Opening Explorer / Masters: https://lichess-org.github.io/api/ (Opening Explorer)
- Proyecto Lichess Opening Explorer: https://github.com/lichess-org/lila-openingexplorer
- Lichess Opening Catalog (CC0): https://github.com/lichess-org/chess-openings
- Lichess Open Database: https://database.lichess.org/
- Chess.js PGN y legalidad: https://github.com/jhlywa/chess.js

## Precauciones
- Algunos códigos ECO y nombres de subvariantes requieren revisión adicional antes de publicación.
- Las fuentes generales de clasificación no documentan por sí mismas todos los comentarios puntuales.
- Un resultado de Stockfish en una FEN no permite extrapolar automáticamente a todos los órdenes de jugadas.
- La consulta de una posición a Masters muestra hechos históricos, nunca validez objetiva.
- Los libros o videos comerciales pueden orientar investigación, pero sus comentarios no se reutilizan textualmente sin permiso.

## Ampliación y navegación por posiciones · 10 de noviembre de 2026

El catálogo público reúne 87 capítulos. A los 56 capítulos anteriores se suman 31 posiciones de referencia seleccionadas del catálogo CC0 de Lichess. Se contrastaron los 31 pares ECO–secuencia con los archivos TSV. Los capítulos incorporan preguntas propias para comparar estructuras y planes. Las 14 partidas modelo de Candidatos y Olimpiada 2026 siguen siendo la evidencia de práctica reciente de esta colección.

| Área | Cobertura incorporada | Qué conviene comparar al enseñar | Límite de la evidencia |
| --- | --- | --- | --- |
| Siciliana abierta | Dragón, Dragón acelerado, Sveshnikov, Taimanov, Kan y Scheveningen | …d5, control de d5, Maróczy, presión por c y coste de perder tiempos con la dama | Los nodos representan jugadas del catálogo. La cantidad de capítulos por jugada no mide popularidad |
| Francesa y Caro-Kann | Tarrasch abierta y cerrada, Panov con …e6 o …Cc6, Caro-Kann clásica | Cadenas de peones, peón aislado, salida del alfil de c8 y momento de la ruptura | Las entradas de referencia requieren partida modelo y análisis antes de recomendar una elección de repertorio |
| Defensas indias y contra 1.d4 | Sämisch en India de Rey, 4.Dc2 en Nimzoindia, Benko, Benoni y Holandesa Leningrado | Bloqueo del centro, compensación por peón, actividad en columnas abiertas y transposición entre estructuras | La equivalencia estructural no implica identidad de posiciones |
| Juegos abiertos y de flanco | Marshall, Inglesa de Cuatro Caballos y Pirc contra el centro austríaco | Iniciativa frente a material, rutas de piezas y ruptura central | Son puntos de partida para estudiar, con alcance limitado a las jugadas de cada capítulo |

### Cómo usar el árbol

1. Abrí una familia para situar el tablero en su posición de entrada. Najdorf comienza tras 5…a6. En otras familias se usa el prefijo común de los capítulos disponibles.
2. Elegí la siguiente jugada. Cada botón muestra cuántos capítulos del catálogo pasan por esa rama.
3. Volvé a una posición anterior desde la ruta del árbol. Las jugadas del tablero y las continuaciones del árbol se sincronizan mientras recorrés un capítulo de la familia activa.
4. Abrí «Ver capítulos y partidas modelo» para consultar notas, órdenes alternativos o guardar una línea en Mis estudios.
5. Cuando dos órdenes llegan a una posición equivalente, conservá la secuencia de cada capítulo como referencia. Este árbol une prefijos de jugadas. La comparación de transposiciones requiere comprobar el FEN y, cuando sea relevante, derechos de enroque y captura al paso.

### Criterios para seguir ampliando

Priorizar familias con pocas opciones y nodos que terminan justo antes de una decisión crítica. Por cada incorporación, guardar ECO, secuencia, fuente, objetivo didáctico y una pregunta que se pueda comprobar en el tablero. Separar la clasificación, el ejemplo competitivo y la evaluación de motor. Para sostener una afirmación de novedad teórica, contrastar la posición exacta con partidas anteriores y registrar fecha, cobertura de la base y primera aparición dentro de esa muestra.

Fuentes de clasificación y agenda editorial: [Lichess chess-openings](https://github.com/lichess-org/chess-openings) y [Opening Encyclopaedia 2026, índice público](https://books1.chessbase.com/en/opening-encyclopaedia-2026-5). Para práctica reciente: [Candidatos 2026](https://theweekinchess.com/chessnews/events/fide-candidates-tournaments-2026) y [Olimpiada 2026](https://theweekinchess.com/chessnews/events/46th-world-chess-olympiad-2026).
