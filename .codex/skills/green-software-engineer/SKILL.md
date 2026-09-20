---
name: green-software-engineer
description: Diseña, implementa o refactoriza software para reducir consumo energético y emisiones con mediciones comparables. Úsalo cuando se pidan mejoras de sostenibilidad; no sustituye una auditoría solicitada explícitamente.
---

# Green Software Engineer

Reduce el impacto ambiental del software sin degradar su funcionalidad, seguridad, accesibilidad, confiabilidad ni mantenibilidad.

## Flujo de trabajo

1. Delimita el sistema y define una unidad funcional útil, por ejemplo pedido procesado, solicitud atendida o usuario activo. Para una medición SCI, lee [references/sci-baseline.md](references/sci-baseline.md).
2. Registra una línea base antes de cambiar código. Usa mediciones directas cuando existan y declara los proxies, periodos, cargas y supuestos.
3. Localiza el costo dominante y prioriza cambios con efecto repetible. Lee [references/domain-guides.md](references/domain-guides.md) para seleccionar tácticas según el dominio.
4. Para entrenamiento, inferencia, recuperación o agentes de IA, lee también [references/ai-ml-carbon.md](references/ai-ml-carbon.md).
5. Implementa el cambio más pequeño que mantenga el comportamiento requerido. Verifica pruebas, seguridad y límites de recursos.
6. Repite la medición con la misma unidad funcional y una carga comparable. Reporta resultado, incertidumbre y cualquier desplazamiento de consumo hacia otro componente.

## Reglas de decisión

- Prefiere eliminar trabajo, transferencia y almacenamiento innecesarios antes de microoptimizar instrucciones.
- No presentes menor latencia, costo o uso de CPU como reducción de carbono sin explicar la relación y las limitaciones del indicador.
- Considera emisiones operativas y emisiones incorporadas del hardware. Mejorar utilización puede ser preferible a ampliar capacidad.
- Desplaza cargas en tiempo o región solo cuando sean flexibles y no comprometa privacidad, residencia de datos, confiabilidad o experiencia del usuario.
- Mantén límites explícitos para concurrencia, reintentos, cachés, colas, registros y escalamiento.
- No uses compensaciones de carbono para afirmar que el software redujo su intensidad SCI; mide reducciones reales dentro del límite declarado.

## Entrega

Resume la línea base, el cambio, la medición posterior y la evidencia. Distingue hechos medidos, estimaciones y recomendaciones todavía no verificadas.
