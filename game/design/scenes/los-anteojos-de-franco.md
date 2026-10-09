# Los anteojos de Franco

## Identificación

- **Scene ID:** `los-anteojos-de-franco`
- **Lugar:** Copenhague
- **Año:** 1999
- **Personaje controlado:** `franco`

## Situación

Franco, Fede y Gon pasean por una calle de Copenhague.

En la calle hay un puesto de anteojos de sol.

Franco quiere saber si los anteojos son baratos comparados con Argentina y comprarlos solamente si le conviene.

## Objetivo de la escena

Descubrir el precio de los anteojos en pesos y comprarlos.

## Personajes

### Franco

- ID: `franco`
- Personaje controlado por el jugador.

### Fede

- ID: `fede`
- Tiene una calculadora.
- Puede prestársela a Franco.

### Gon

- ID: `gon`
- Conoce la cotización de la corona danesa.

## Objetos

### Puesto de anteojos

- ID: `sunglasses-stand`
- Precio: **75 coronas danesas**.

### Calculadora

- ID: `calculator`
- Tipo: objeto de inventario.
- Inicialmente está en poder de Fede.

## Estado relevante

La escena necesita recordar:

- si Franco conoce el precio de los anteojos;
- si Franco conoce la cotización;
- si Franco tiene la calculadora;
- si Franco ya realizó la conversión;
- el precio de los anteojos;
- la cotización de la corona danesa.

Valores de la escena:

- Precio: **75 DKK**
- Cotización: **1 USD = 7,43 DKK**
- Equivalencia narrativa: **1 USD = 1 peso**
- Resultado mostrado: **10 pesos**, sin centavos.

## Interacciones

### Mirar puesto

Si Franco todavía no hizo el cálculo:

> «¡Uh, acá venden anteojos!»

Se muestra el precio:

> 75 coronas danesas.

Franco recuerda el precio.

Si Franco ya hizo el cálculo:

> «¡Ya puedo comprar los anteojos!»

### Ir al puesto

Si todavía no hizo el cálculo:

> «Primero quiero saber cuánto salen en pesos.»

Si ya hizo el cálculo:

Se inicia la secuencia `buy-sunglasses`.

### Mirar Gon

> «Muy hello-hello...»

### Mirar Fede

> «Nada que decir.»

### Mirar calculadora

Si está en el inventario:

> «¡La mágica!»

### Usar calculadora

Si falta la cotización:

> «No tengo la cotización de la corona danesa.»

Esta condición tiene prioridad aunque también falte el precio.

Si tiene cotización pero falta el precio:

> «No tengo el precio de los anteojos.»

Si tiene precio y cotización:

Se muestra:

> 10 pesos

Franco dice:

> «¡Diez pesos! Están baratos. Me los compro.»

La escena queda marcada como cálculo realizado.

## Diálogos

- Fede: `fede-sunglasses`
- Gon: `gon-sunglasses`

Ver `game/design/04-dialogues.md`.

## Puzzle

Puzzle principal:

`calculate-sunglasses-price`

Ver `game/design/03-puzzles.md`.

## Secuencia final — buy-sunglasses

Cuando Franco ya realizó el cálculo y va al puesto:

1. Franco llega al puesto.
2. Espera **3 segundos**.
3. Franco dice:

> «¡Listo! Tengo mis anteojos.»

4. Franco se aleja automáticamente.
5. Después de **cinco pasos**, intenta ponerse los anteojos.
6. Franco dice:

> «¡Uy! ¿Dónde están mis anteojos?»

7. Fin de la escena.

Los anteojos no se recuperan.

## Remate

Después de dedicar toda la escena a calcular si la compra era conveniente, Franco pierde los anteojos inmediatamente después de comprarlos.