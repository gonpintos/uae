# Diálogos

## fede-sunglasses

### Actor

`fede`

### Escena

`los-anteojos-de-franco`

### Comportamiento

Después de cada respuesta de Fede se vuelve al menú de opciones, salvo que la opción indique explícitamente terminar la conversación.

---

### Opción: pedir calculadora

Visible si Franco todavía no tiene `calculator`.

Franco:

> «¿Me prestás la calculadora?»

Fede:

> «Sí. Tomá.»

Franco:

> «Gracias.»

Efecto:

- `calculator` pasa al inventario de Franco.

Finaliza la conversación.

---

### Opción: preguntar cómo usar la calculadora

Visible si Franco ya tiene `calculator`.

Reemplaza a:

> «¿Me prestás la calculadora?»

Franco:

> «¿Cómo se usa esta maravilla?»

Respuesta de Fede:

> «Usá la picardía.»

Después vuelve el menú.

---

### Opción: opinión sobre los anteojos

Franco:

> «¿Vos te comprarías esos anteojos?»

Fede:

> «Claro que sí. Salvo que no.»

Después vuelve el menú.

---

### Opción: salir

Franco:

> «Ahora vuelvo.»

Finaliza la conversación.


---

# gon-sunglasses

### Actor

`gon`

### Escena

`los-anteojos-de-franco`

### Comportamiento

Después de cada respuesta de Gon se vuelve al menú de opciones, salvo que la opción indique explícitamente terminar la conversación.

---

### Opción: pedir cotización

Franco:

> «¿Cuál es la cotización de la corona danesa?»

Gon:

> «1 dólar está 7,43 coronas danesas.»

Efecto:

- Franco recuerda la cotización.
- `exchange-rate-known = true`
- `dkk-per-usd = 7.43`

Finaliza la conversación.

---

### Opción: hello hello

Franco:

> «¿Hoy no hay ningún “hello, hello”?»

Gon:

> «I AM REALLY!»

Después vuelve el menú.

---

### Opción: salir

Franco:

> «Voy a mirar los anteojos.»

Finaliza la conversación.
