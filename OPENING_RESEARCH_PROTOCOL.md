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
