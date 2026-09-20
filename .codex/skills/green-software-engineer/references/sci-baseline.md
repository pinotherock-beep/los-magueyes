# Línea base SCI

Usa esta guía cuando se necesite cuantificar o comparar el impacto de un sistema.

## Definición

La especificación Software Carbon Intensity expresa una tasa:

`SCI = ((E × I) + M) / R`

- `E`: energía consumida por el sistema dentro del límite elegido.
- `I`: intensidad de carbono de la electricidad correspondiente al lugar y periodo.
- `M`: emisiones incorporadas asignadas al hardware usado.
- `R`: unidad funcional, por ejemplo 1,000 pedidos procesados.

## Registro mínimo

1. Describe el sistema, ambiente, región, periodo y componentes incluidos y excluidos.
2. Define `R` antes de comparar alternativas; debe representar el valor entregado y permanecer estable.
3. Mide `E` directamente cuando sea posible. Si usas CPU-segundos, tiempo de ejecución, solicitudes o costo como proxy, conserva el factor de conversión y su fuente.
4. Relaciona `I` con el mismo periodo y ubicación de `E`; indica si es promedio o marginal.
5. Asigna `M` según vida útil y utilización del equipo; documenta los datos faltantes.
6. Ejecuta una carga representativa varias veces, informa dispersión y compara con el mismo conjunto de datos y condiciones.

## Interpretación

Un valor menor es mejor únicamente cuando el límite y la unidad funcional son comparables. Informa por separado cambios de energía, carbono operativo y hardware para evitar que una mejora aparente oculte un traslado de impacto.

Fuentes oficiales: [SCI Specification](https://sci.greensoftware.foundation/) y [SCI Guidance](https://sci-guide.greensoftware.foundation/).
