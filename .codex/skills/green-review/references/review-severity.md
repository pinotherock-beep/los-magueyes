# Severidad de revisión verde

Asigna severidad por frecuencia, escala, duración, certeza y dificultad de mitigación. No la bases únicamente en estilo de código.

## Crítica

Consumo no acotado o amplificación que puede crecer de forma sostenida y descontrolada en condiciones normales o ante entradas previsibles. Ejemplos: reintentos infinitos, fuga persistente de recursos o escalamiento sin límite. Debe existir evidencia concreta del camino de ejecución.

## Alta

Trabajo recurrente y de gran escala en una ruta principal, o una decisión arquitectónica que mantiene capacidad o transferencia considerablemente innecesaria. La corrección requiere prioridad y medición específica.

## Media

Desperdicio repetible con alcance acotado o dependiente de una carga concreta. Puede aumentar costos y energía, pero no amenaza por sí solo el control operativo del sistema.

## Baja

Mejora localizada, infrecuente o de impacto probablemente pequeño. Regístrala cuando el arreglo sea claro o ayude a impedir una regresión.

## Nota

Oportunidad de medición, documentación o experimento sin evidencia suficiente para afirmar un defecto.

## Ajustes

- Sube severidad cuando el patrón ocurre en cada solicitud, afecta grandes volúmenes o crece sin límite.
- Baja severidad cuando existe un límite efectivo, caché demostrada, ruta excepcional o impacto no reproducible.
- No clasifiques como hallazgo una preferencia tecnológica sin datos sobre la carga y el comportamiento actuales.
