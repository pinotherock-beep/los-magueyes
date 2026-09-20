# Resultado de revisión — 20 de septiembre de 2026

## Corregido

- Adaptación de Express 5 a Netlify Functions con `serverless-http` 4, rutas y recursos estáticos.
- La primera versión del adaptador probada (3.x) no procesaba el cuerpo de peticiones con la combinación actual de Express/body-parser; las pruebas detectaron el problema y se actualizó a 4.x.
- Inclusión explícita de las 12 plantillas EJS en el paquete de Netlify, con rutas de acceso compatibles con el entorno de la función.
- Sesiones persistentes en MySQL, limpieza de sesiones vencidas durante actividad y respuestas dinámicas sin caché.
- Errores al recuperar sesiones muestran una página controlada.
- Menú funciona con localStorage corrupto o bloqueado; elimina productos retirados del carrito y limita cantidades según el backend.
- Se rechazan productos duplicados en la petición de pedido. Cálculo monetario en centavos con precios del servidor.
- Se evita el doble escape de nombres y descripciones; las vistas siguen escapando HTML al mostrarlo.
- Validación de identificadores administrativos, precio cero visible al editar, estado de disponibilidad conservado al fallar validación y mensajes para categorías inválidas/productos duplicados.
- Preparación de producción sin CREATE DATABASE, TLS con verificación del certificado y soporte de CA del proveedor.
- Configuración Netlify, Node 22, GitHub Actions, plantillas de variables e instrucciones renovadas.
- Entrega sin credenciales privadas, historial Git ni node_modules. Habilidades originales sin modificaciones.

## Verificado

- `npm ci`: instalación reproducible desde el archivo de dependencias.
- `npm run test:all`: **32 pruebas aprobadas** (25 Jest y 7 node:test).
- Cubren rutas, autenticación, regeneración de sesión, cookies HTTPS/HttpOnly, cierre de sesión, CSRF, origen, precios calculados en servidor, validaciones de pedidos, crear/editar/desactivar productos, cambio de estado de pedidos, cola FIFO, fallos de sesión, almacenamiento del carrito y preparación local.
- `npm run build`: comprobación de sintaxis JavaScript y compilación de plantillas EJS aprobadas.
- Empaquetado con la herramienta oficial `@netlify/zip-it-and-ship-it`, esbuild y la configuración del proyecto; 12 plantillas incluidas.
- El paquete generado se extrajo y ejecutó separado del código fuente: inicio y nosotros respondieron 200, ruta inexistente respondió 404.
- `npm audit --omit=dev`: 0 vulnerabilidades reportadas en dependencias de producción al revisar. Es una consulta puntual, no una garantía futura.
- Revisión de archivos de entrega para excluir credenciales del ZIP original.

## Límites y pendientes para publicar

No se ha publicado en una cuenta de GitHub o Netlify. No se recibió una base MySQL remota configurada para el despliegue y este entorno no dispone de un servidor MySQL ejecutable. Las pruebas de base de datos usan respuestas simuladas; no certifican la conectividad real, la ejecución del SQL en el proveedor ni la persistencia después de desplegar.

No se realizó una prueba visual en un navegador. El JavaScript del carrito se comprobó con un DOM simulado y las páginas mediante respuestas HTML.

Antes de operar con clientes debes conectar la base, ejecutar `setup:production`, configurar las variables de Netlify y completar la prueba manual del punto 6 de `SUBIR_GITHUB_NETLIFY.md`. No es correcto afirmar “100% funcional en producción” sin esas verificaciones.

Los límites de tráfico actuales son por instancia de función. La cola se muestra en orden de llegada; no impide al administrador cambiar manualmente el estado de otro pedido. No se agregaron pagos en línea ni un servicio de entrega.
