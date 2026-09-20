---
name: green-review
description: Revisa código, arquitectura u operación para detectar desperdicio energético y riesgos de emisiones, con evidencia y severidad consistente. Úsalo para auditorías o revisiones verdes; no implementes cambios salvo petición explícita.
---

# Green Review

Realiza una revisión de sostenibilidad accionable sin confundir indicadores técnicos con emisiones verificadas.

## Procedimiento

1. Confirma alcance, carga esperada y unidad funcional. Si faltan métricas, revisa el código y declara que el impacto es estimado.
2. Lee las secciones pertinentes de [references/review-domains.md](references/review-domains.md).
3. Busca trabajo evitable, amplificación, recursos sin límite, transferencia excesiva, retención innecesaria y capacidad infrautilizada.
4. Clasifica cada hallazgo con [references/review-severity.md](references/review-severity.md).
5. Verifica que la recomendación no debilite seguridad, privacidad, accesibilidad, integridad de datos o confiabilidad.

## Formato de hallazgo

Incluye:

- severidad y ubicación concreta;
- comportamiento observado y evidencia;
- por qué aumenta energía, hardware o emisiones potenciales;
- cambio recomendado;
- medición o prueba para demostrar la mejora.

Ordena los hallazgos por severidad. No inventes porcentajes, consumo eléctrico ni CO2e. Si no hay hallazgos importantes, dilo y menciona brevemente las áreas revisadas y las limitaciones de evidencia.
