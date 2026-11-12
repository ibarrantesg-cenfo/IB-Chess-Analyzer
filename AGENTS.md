# IB Chess Analyzer — criterios persistentes de producto y desarrollo

Este documento es una **memoria técnica versionada** para agentes y colaboradores que desarrollan IB Chess Analyzer. Resume decisiones expresadas por el propietario en sesiones de producto; **no sustituye solicitudes nuevas**, no autoriza acciones sin pruebas y debe actualizarse cuando el propietario cambie un requisito.

## Patrones confirmados de diseño

1. **Interfaz despejada, jerárquica y contextual.** La primera vista muestra solo lo que es útil en ese momento. El tablero documental de Competitive Intelligence aparece únicamente después de elegir un rival; los demás paneles no deben superponerse.
2. **No dejar controles de instalación o migración permanentes.** Los botones de importar catálogos, migrar o configurar son acciones de onboarding: solo se muestran mientras existe una tarea pendiente comprobable. Cuando se completa, **se retira el bloque entero**, no queda un botón inactivo ni un cartel de felicitación persistente. Si reaparece una necesidad futura, se puede mostrar de nuevo cuando la evidencia de la base la justifique.
3. **Acciones verificables y feedback en contexto.** Todo botón debe realizar una acción real, indicar progreso, errores y resultado junto al control. No informar únicamente arriba de la página si la acción ocurre más abajo.
4. **No duplicar herramientas.** Reutilizar tablero, estudios, motor y biblioteca mediante componentes o referencias, sin reescribirlos ni alterar Game Review cuando se construyen módulos especializados.
5. **Apariencia coherente y pulida.** Conservar tema claro/oscuro, contraste alto, tipografías legibles, coordenadas correctas, iconos consistentes y diseño adaptable. El tablero debe mantener calidad de piezas y casillas.
6. **Persistencia y reversibilidad.** Toda edición guarda y reabre correctamente; un import PGN nunca elimina variantes o comentarios sin confirmación. Migraciones reversibles y copias cuando haya cambios de esquema.
7. **Privacidad por defecto.** Competitive Intelligence es exclusivo de UUIDs autorizados; no basta ocultar navegación. Debe existir enforcement de Supabase RLS y pruebas negativas con alumno/profesor/anónimo.
8. **Evidencia antes que afirmaciones.** No fabricar IDs FIDE, ratings, PGN, estadísticas, fortalezas o debilidades. Etiquetar fuentes, modalidad, fecha y tamaño de muestra; diferenciar hechos de hipótesis.
9. **Flujos simples para el usuario real.** Evitar repetir capturas, pasos de SQL, importaciones y validaciones ya realizadas. La incorporación manual debe detectar duplicados y permitir editar sin perder anotaciones.
10. **Documentación almacenable y visual.** Entregar manuales claros, diagramas de flujo y mapas conceptuales editables, glosario de siglas, guía por etapas y notas de versión. En tareas relacionadas, mantener documentación también en el repositorio.

## Puertas de calidad antes de publicar
- Definir objetivo del usuario y estado inicial/final de cada flujo.
- Revisar la experiencia de **primera vez, estado completo, error, reintento, edición y regreso**.
- Probar que **completar una tarea elimina su UI temporal** y que el reingreso no la muestra por caché.
- Validar botones, foco, navegación, responsive, temas claro/oscuro y acceso de roles.
- Ejecutar `npm run check`, `npm test` y `npm run build` en una rama.
- No declarar disponibilidad pública hasta comprobar GitHub Pages y conducta en sesión real.

## Contrato de tareas efímeras
| Estado | Presentación |
|---|---|
| Pendiente | Mostrar acción y explicación breve |
| En progreso | Deshabilitar duplicación y mostrar avance cercano |
| Parcial | Mostrar elementos faltantes y recuperar sin duplicar |
| Completada | **Ocultar por completo la acción y su bloque de onboarding** |
| Error | Mostrar mensaje contextual y opción de reintento |
| Nueva necesidad | Reaparecer solo cuando la consulta actual a la base confirme nuevos pendientes |

## Antipatrones que se evitarán
- Botones que no producen acción visible.
- Formularios visibles todo el tiempo que roban espacio a fichas.
- Tablero principal mostrado detrás de otro módulo.
- Datos privados en GitHub público.
- Reimportar todos los rivales cada vez que se abre una sección.
- Asumir que una prueba automatizada valida la experiencia visual completa.
- Prometer integración terminada cuando falta migración, autorización o despliegue.

## Decisiones específicas de Competitive Intelligence
- Solo cuenta administradora autorizada, no todos los profesores.
- Catálogo universitario como fuente histórica, gestionado por Supabase; actualización explícita e idempotente.
- La importación inicial se oculta cuando los 22 registros están sincronizados; continúa visible «Nuevo rival» para futuras altas manuales.
- Expedientes > seleccionar rival > estudio documental aislado.
- FIDE ID, FEN, PGN, OBS, EVD, CF, IPR e indicadores son campos y conceptos diferenciados; todo dato debe tener trazabilidad.

## Mantenimiento
Cuando el propietario dé feedback de UX o reporte una regresión, extraer la regla general, documentarla aquí, añadir una prueba de regresión cuando sea posible y verificar si afecta otros módulos. No inferir preferencias nuevas sin evidencia.
