# UAE — Instructions for Codex

UAE es un motor moderno de aventuras gráficas inspirado en SCUMM.

## Principios

- El juego se describe declarativamente.
- No hardcodear personajes, objetos o escenas en el engine.
- GameScene debe coordinar, no contener lógica narrativa específica.
- Reutilizar sistemas existentes antes de crear sistemas paralelos.
- Cada feature nueva debe surgir de una necesidad real del juego.
- Mantener compatibilidad con los tests existentes.
- Ejecutar tests y build después de cambios relevantes.

## UX objetivo

Inspiración funcional:
- Maniac Mansion
- The Secret of Monkey Island

Características:
- escena arriba;
- verbos e inventario abajo;
- speech sobre personajes;
- navegación point & click;
- default verb por target;
- interacciones declarativas.

## Antes de implementar

1. inspeccionar el código actual;
2. leer los documentos de diseño relevantes;
3. explicar brevemente el enfoque;
4. implementar;
5. ejecutar tests y build.