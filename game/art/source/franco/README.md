# Los anteojos de Franco — Arte v1

Escena: Copenhague, verano de 1999. Presentación: 1280×720.

## Archivos

- `copenhagen-street.png`: fondo sin puesto, 1280×720.
- `sunglasses-stand.png`: puesto con vendedora decorativa, 440×264, transparencia. No crear NPC ni interacción para la vendedora.
- `franco.png`, `fede.png`, `gon.png`: poses quietas, 192×272, transparencia.
- `calculator.png`: calculadora blanca, 64×96, transparencia.
- `franco-walk.png`: 4 cuadros en una fila, 768×272; celdas de 192×272.
- `franco-walk-01.png` a `franco-walk-04.png`: cuadros individuales equivalentes.
- `manifest.json`: dimensiones, anclas y animación sugerida.
- `preview.png`: montaje de referencia para ubicación; no usar como fondo del juego.
- `franco-walk-preview.gif`: vista del ciclo exportado; no usar como spritesheet.

## Integración

Usar PNG con alpha y filtrado nearest-neighbor. No recortar las celdas de personaje al cargarlas: comparten el mismo tamaño y ancla `(96,264)`, al centro de la línea de apoyo de los pies. El fondo se dibuja primero y el puesto y personajes después. Todas las coordenadas están expresadas en la presentación de 1280×720.

Franco quieto usa `franco.png`. Durante el desplazamiento, reproducir los cuadros 0,1,2,3 de `franco-walk.png` en bucle, 180 ms por cuadro (aprox. 5,56 FPS). Al detenerse, volver a la pose quieta. Para caminar a la izquierda, espejar horizontalmente. Fede y Gon quedan quietos.

Ubicaciones iniciales sugeridas, ajustables por el motor: puesto esquina superior izquierda `(690,300)`; Franco pies `(602,584)`; Fede `(400,584)`; Gon `(270,584)`. No son coordenadas de hotspots definitivas.

Esta es una primera entrega estática para integrar y revisar en el motor. Los diseños provienen de las imágenes aprobadas; la exportación fija los tamaños, las celdas y las anclas. No incluye animaciones de hablar, tomar objetos, frente o espalda. El manifest es información de integración; no presupone que el motor pueda importarlo directamente.
