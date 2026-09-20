# Guías por dominio

Lee solo las secciones correspondientes al sistema actual.

## Frontend web

- Reduce JavaScript, CSS, fuentes e imágenes transferidas; comprime, dimensiona y carga bajo demanda.
- Evita sondeos frecuentes, renderizados repetidos y dependencias grandes para tareas pequeñas.
- Usa caché con invalidación explícita y conserva accesibilidad y compatibilidad con dispositivos modestos.

## Backend y API

- Evita solicitudes duplicadas y respuestas sobredimensionadas; pagina, filtra y selecciona solo campos necesarios.
- Limita concurrencia, reintentos y trabajos en segundo plano; aplica backoff y operaciones idempotentes.
- Perfila rutas calientes antes de cambiar algoritmos o asignar más instancias.

## Datos

- Elimina consultas N+1, agrega índices justificados por planes de ejecución y procesa en lotes de tamaño acotado.
- Define retención para datos, copias, sesiones, telemetría y archivos temporales.
- Evalúa el costo de escritura y almacenamiento añadido por cada índice, réplica o caché.

## Infraestructura y entrega

- Ajusta capacidad a la demanda con mínimos y máximos seguros; busca alta utilización sin comprometer latencia o disponibilidad acordadas.
- Evita reconstrucciones y despliegues sin cambios; reutiliza artefactos verificados y reduce matrices de CI redundantes.
- Considera región y horario con electricidad más limpia solo para cargas desplazables y dentro de las restricciones del sistema.

## Aplicaciones pequeñas con Node.js y MySQL

- Mantén pools de conexión acotados, consultas parametrizadas e índices que correspondan a filtros y ordenamientos reales.
- Sirve recursos estáticos con caché y evita dependencias o microservicios que no aporten una necesidad operativa demostrable.
- Mide por pedido o solicitud completada: tiempo, consultas, bytes transferidos y memoria máxima son indicadores útiles, pero no sustituyen una medición de energía o SCI.

Referencia conceptual: [Learn Green Software](https://learn.greensoftware.foundation/introduction/).
