# Carbono en IA y aprendizaje automático

Usa esta guía cuando el sistema entrene modelos, ejecute inferencias, use recuperación o invoque agentes.

## Límite de ciclo de vida

Incluye cuando aplique: preparación de datos, experimentación, entrenamiento, evaluación, almacenamiento de artefactos, despliegue, inferencia, recuperación y retiro. Separa cargas únicas de cargas recurrentes.

## Unidad funcional

Elige una unidad que represente el servicio, como 1,000 inferencias válidas o 1,000 solicitudes resueltas con un umbral de calidad. No compares modelos con unidades, calidad o límites distintos.

## Tácticas

- Usa el modelo más pequeño que alcance el criterio de calidad y seguridad.
- Reduce tokens de entrada y salida, contexto duplicado, llamadas encadenadas y reintentos sin límite.
- Almacena en caché solo resultados reutilizables sin vulnerar privacidad ni producir respuestas obsoletas.
- Agrupa inferencias cuando la latencia lo permita y supervisa utilización de aceleradores.
- Detén experimentos sin progreso, reutiliza checkpoints y registra energía, duración, hardware y región.
- Evalúa cuantización, destilación o recuperación selectiva con pruebas de calidad equivalentes.

## Evidencia

Reporta calidad junto con energía o emisiones. Declara factores estimados y datos de hardware faltantes; evita extrapolar una prueba corta sin explicar el patrón de uso esperado.

Fuente oficial: [SCI for AI](https://greensoftware.foundation/standards/sci-ai/).
