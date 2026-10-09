# Puzzles

## calculate-sunglasses-price

### Escena

`los-anteojos-de-franco`

### Objetivo

Franco debe determinar cuánto cuestan en pesos unos anteojos de 75 coronas danesas antes de decidir comprarlos.

### Información necesaria

Para resolver el puzzle necesita tres cosas:

1. **Precio de los anteojos**
   - Se obtiene mirando `sunglasses-stand`.
   - Valor: 75 DKK.

2. **Cotización de la corona danesa**
   - Se obtiene hablando con `gon`.
   - Valor: 1 USD = 7,43 DKK.

3. **Calculadora**
   - Se obtiene hablando con `fede`.
   - Item: `calculator`.

Los tres pasos pueden realizarse en cualquier orden.

### Convención de la escena

Para simplificar el cálculo:

**1 USD = 1 peso**

El resultado narrativo se redondea a:

**10 pesos**

No se muestran centavos.

### Uso de la calculadora

#### Falta cotización

Si Franco usa la calculadora sin conocer la cotización:

> «No tengo la cotización de la corona danesa.»

Esta respuesta tiene prioridad si también falta el precio.

#### Falta precio

Si Franco conoce la cotización pero todavía no miró el precio:

> «No tengo el precio de los anteojos.»

#### Datos completos

Si Franco:

- tiene la calculadora;
- conoce el precio;
- conoce la cotización;

la calculadora muestra:

> 10 pesos

Franco dice:

> «¡Diez pesos! Están baratos. Me los compro.»

El puzzle queda resuelto.

### Estado conceptual

- `sunglasses-price-known`
- `exchange-rate-known`
- `calculator-owned`
- `sunglasses-price-calculated`

Valores:

- `sunglasses-price-dkk = 75`
- `dkk-per-usd = 7.43`

### Condición de resolución

El puzzle se considera resuelto cuando:

`calculator-owned`
+
`sunglasses-price-known`
+
`exchange-rate-known`
+
uso de `calculator`

producen:

`sunglasses-price-calculated = true`

### Consecuencia

Una vez resuelto:

- Mirar el puesto cambia su respuesta.
- Ir al puesto permite iniciar la compra.

Antes de resolverlo, intentar ir al puesto produce:

> «Primero quiero saber cuánto salen en pesos.»

### Secuencia de solución típica

1. Mirar el puesto.
2. Pedir la calculadora a Fede.
3. Preguntar la cotización a Gon.
4. Usar la calculadora.
5. Ir al puesto.

Los pasos 1, 2 y 3 son intercambiables.

### Remate del puzzle

La recompensa aparente es conseguir los anteojos baratos.

La recompensa real es el gag final: Franco pierde los anteojos apenas termina de comprarlos.