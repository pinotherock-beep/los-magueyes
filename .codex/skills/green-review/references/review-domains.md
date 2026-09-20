# Dominios de revisión

## Trabajo y amplificación

- Bucles, recursión, reintentos, colas, paginación o concurrencia sin límites.
- Cálculo repetido, serialización duplicada y reconstrucción de artefactos sin cambios.
- Sondeo cuando existe una alternativa por evento o una frecuencia adaptable.

## Red y frontend

- Recursos no comprimidos, no dimensionados o cargados antes de necesitarlos.
- Respuestas con campos innecesarios, falta de caché segura o actualizaciones completas para cambios pequeños.
- Renderizados y listeners duplicados; ejecución continua en pestañas inactivas.

## Backend y datos

- Consultas N+1, escaneos completos recurrentes, joins evitables y falta de paginación.
- Pools, workers o cachés sin límites; sesiones, registros y copias sin política de retención.
- Servicios separados cuyo costo operativo no corresponde a una necesidad de escalamiento o aislamiento.

## Infraestructura y CI/CD

- Sobreaprovisionamiento sostenido, escalamiento sin máximos o baja utilización persistente.
- Construcciones duplicadas, matrices redundantes y artefactos transferidos repetidamente.
- Cargas flexibles ejecutadas sin considerar región u horario, cuando el cambio sea legal y operativo.

## IA/ML

- Modelo mayor al necesario, contexto o salida excesivos y múltiples llamadas para una sola respuesta.
- Entrenamientos repetidos sin checkpoints, detención temprana o registro de energía y hardware.
- Inferencia sin lotes, caché segura o umbrales de calidad comparables cuando esas técnicas sean aplicables.

Referencia conceptual: [principios de Green Software](https://learn.greensoftware.foundation/introduction/).
