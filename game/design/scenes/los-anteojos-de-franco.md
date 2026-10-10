# Los anteojos de Franco

## Identificación

- **Scene ID:** `los-anteojos-de-franco`
- **Lugar:** Copenhague
- **Año:** 1999
- **Personaje controlado:** `franco`

## Intro

Antes de comenzar la escena jugable se reproducen estas pantallas:

1. Durante **2,2 segundos**, sobre fondo negro:

> **COPENHAGUE**<br>
> **1999**

2. Durante **5 segundos**, la imagen de presentación con el texto:

> Tres jóvenes argentinos.<br>
> Una ciudad desconocida.<br>
> Y una economía que exige hacer cuentas.

3. Durante **2,5 segundos**, sobre fondo negro:

> **LOS ANTEOJOS DE FRANCO**

Después comienza automáticamente la escena jugable.

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
- Si Franco ya tiene la calculadora y pregunta cómo usarla, responde:

> «Usá la picardía.»

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
5. Después de **cinco pasos**, termina el movimiento y queda quieto.
6. Espera **3 segundos**.
7. Franco dice:

> «¡Uy! ¿Dónde están mis anteojos?»

8. Al terminar la frase, aparece centrado:

> **CONTINUARÁ**

9. Fin de la escena. El título permanece visible.

Los anteojos no se recuperan.

## Remate

Después de dedicar toda la escena a calcular si la compra era conveniente, Franco pierde los anteojos inmediatamente después de comprarlos.
