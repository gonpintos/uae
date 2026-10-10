# UAE Scene Format v1

## Estado

Diseño cerrado antes de implementar el loader. Este documento define el contrato
de UAE Scene Format v1 y usa `los-anteojos-de-franco` como ejemplo normativo.
Todavía no existe parser, loader ni migración del runtime.

Los archivos normativos del ejemplo son:

- `game/content/game.uae.yaml`;
- `game/content/scenes/los-anteojos-de-franco.uae.yaml`.

## Principios

- El YAML contiene contenido y referencias, nunca TypeScript ni scripting.
- El manifiesto reúne los catálogos globales y el arranque del juego.
- Una escena reúne entidades, geometría, interacciones, diálogos y secuencias.
- El engine interpreta datos mediante sistemas genéricos.
- Los candidatos ordenados reemplazan lógica narrativa imperativa.
- Las referencias se validan completamente antes de comenzar el juego.
- Los nombres de campos usan `camelCase`; los IDs de contenido prefieren
  `kebab-case`.

## 1. Game manifest

`game/content/game.uae.yaml` es la raíz del contenido. Su forma v1 es:

```yaml
format: uae-game
version: 1
id: game-id
title: Título
resolution: {width: 1280, height: 720}
start:
  intro: intro-id
  scene: scene-id
scenes: []
assetBasePath: ./assets
assets: {}
verbs: []
items: []
initialInventory: []
state: {}
intros: []
```

### Identificación y resolución

- `format` debe ser exactamente `uae-game`.
- `version` debe ser exactamente `1`.
- `id` identifica el juego.
- `title` es texto visible o metadata.
- `resolution` define el único sistema de coordenadas lógicas. Para UAE es
  `1280 x 720`.

El layout, la escala del canvas y la transformación desde coordenadas del
navegador siguen siendo responsabilidad del engine.

### Arranque

```yaml
start:
  intro: copenhagen-1999
  scene: los-anteojos-de-franco
```

`start.scene` es obligatorio. `start.intro` es opcional. Si existe, el engine
reproduce la intro completa y después crea la escena inicial. Al entrar a esa
escena se aplica además su regla `entry`.

### Registro de escenas

```yaml
scenes:
  - id: los-anteojos-de-franco
    source: ./scenes/los-anteojos-de-franco.uae.yaml
```

`source` se resuelve con relación al archivo del manifiesto. El `id` registrado
debe coincidir con el `id` raíz del archivo cargado. v1 no descubre escenas por
convención de directorios.

### Catálogo de assets

```yaml
assetBasePath: ./assets
assets:
  franco-idle: actors/franco/idle.png
  calculator-icon: inventory/calculator.png
```

`assetBasePath` es una URL relativa al documento HTML. Cada valor de `assets` se
resuelve dentro de ese base path. Esto conserva rutas web relativas compatibles
con itch.io y GitHub Pages.

El catálogo define dónde está cada recurso, pero no mantiene una lista manual de
qué recursos necesita una escena. Esa lista se deriva de las referencias, como
se define en “Derivación de assets”.

### Catálogo de verbos

```yaml
verbs:
  - id: goTo
    label: Ir a
    default: true
  - id: look
    label: Mirar
```

Debe existir por lo menos un verbo y exactamente uno debe tener `default: true`.
Todos los `verb` y `defaultVerb` deben referir a este catálogo. Los IDs actuales
`goTo` y `talkTo` se conservan para no introducir una traducción artificial.

### Catálogo de items

```yaml
items:
  - id: calculator
    displayName: Calculadora
    description: ¡La mágica!
    defaultVerb: use
    icon:
      asset: calculator-icon
      width: 32
      height: 48
```

Los items son globales porque el inventario sobrevive al cierre de diálogos y a
los cambios de escena. `initialInventory` contiene IDs de este catálogo. La
posesión se consulta con `hasItem`; no se duplica con flags como
`calculator-owned`.

### Catálogo de state keys

```yaml
state:
  exchange-rate-known:
    type: boolean
    initial: false
  dkk-per-usd:
    type: number
```

Las claves de estado son globales y deben declararse antes de ser usadas. Tipos
de v1: `boolean`, `number` y `string`. `initial` es opcional; su ausencia significa
que la clave todavía no tiene valor. Si existe, debe coincidir con `type`.

Esto permite detectar nombres mal escritos y efectos con tipos incompatibles
antes de ejecutar el juego.

### Intros

Las intros son globales y tienen pasos ordenados:

```yaml
intros:
  - id: intro-id
    backgroundColor: "#000000"
    textColor: "#ffffff"
    screens:
      - type: text
        text: Texto centrado
        durationMs: 2000
      - type: image
        asset: image-id
        caption: Texto de apoyo
        durationMs: 5000
```

v1 admite únicamente pantallas `text` e `image`, avance automático por
`durationMs`, colores generales, tamaño/interlineado opcional y caption.

## 2. Scene document

Un archivo `*.uae.yaml` tiene esta raíz:

```yaml
format: uae-scene
version: 1
id: scene-id
name: Nombre visible
controlledActor: actor-id
entry:
  once: true
  sequence: opening-sequence
room: {}
entities: []
interactions: []
dialogues: []
sequences: []
```

- `format` debe ser `uae-scene` y `version` debe ser `1`.
- `controlledActor` debe apuntar a una entidad local `kind: actor`.
- `room` contiene geometría y visuales ambientales sin comportamiento.
- `entities` contiene actores y objetos del mundo.
- `interactions`, `dialogues` y `sequences` son catálogos locales.

El estado y el inventario inicial no se repiten por escena; pertenecen al
manifiesto global.

## 3. Entity model

Una entidad agrupa identidad, presentación e interacción. Un objeto interactivo
ya no se declara una vez como visual y otra vez como hotspot.

Campos comunes:

```yaml
- id: entity-id
  kind: actor | object
  displayName: Nombre visible
  visual: {}
  hotspot: true | {bounds: {x: 0, y: 0, width: 10, height: 10}}
  defaultVerb: look
  interactionPosition: {x: 100, y: 500}
  depthY: 500
```

- `id`, `kind` y `displayName` son obligatorios.
- `visual` es obligatorio en las entidades visibles del caso actual.
- `hotspot` es opcional. Si se omite, la entidad no recibe clicks del mundo.
- `defaultVerb` e `interactionPosition` sólo son válidos si existe `hotspot`.
- `depthY` permite ordenar la entidad contra actores y otros objetos.

### Objetos

```yaml
- id: sunglasses-stand
  kind: object
  displayName: Tienda de anteojos
  visual:
    asset: sunglasses-stand
    bounds: {x: 40, y: 266, width: 440, height: 264}
  hotspot: true
  defaultVerb: look
  interactionPosition: {x: 536, y: 525}
  depthY: 527
```

Para un objeto, `hotspot: true` reutiliza `visual.bounds`. Si el área clickeable
difiere del dibujo, puede declararse `hotspot.bounds`. El loader genera a partir
de esta única entidad el `RoomVisualData` y el `HotspotOptions` que requiere hoy
el runtime.

### Actores

```yaml
- id: fede
  kind: actor
  displayName: Fede
  position: {x: 856, y: 525}
  visual:
    size: {width: 192, height: 272}
    animations:
      sourceFacing: right
      idle:
        frames: [fede-idle]
  hotspot:
    bounds: {x: 800, y: 253, width: 150, height: 272}
  defaultVerb: talkTo
  interactionPosition: {x: 740, y: 525}
```

`position` es siempre el anchor entre los pies. El hotspot puede diferir del
sprite, como ocurre con Fede y Gon. Campos propios de actor en v1:

- `position`;
- `speechColor`;
- `walkSpeedPixelsPerSecond`;
- `initialFacing` (`left` o `right`);
- `visual.size`;
- `visual.animations.idle`;
- `visual.animations.walk` opcional;
- `visual.animations.sourceFacing`.

La entidad controlada puede omitir hotspot y default verb.

### Visuales ambientales

`room.visuals` queda reservado para fondos o decoración sin identidad narrativa:

```yaml
room:
  visuals:
    - id: street-background
      asset: copenhagen-street
      bounds: {x: 0, y: -85, width: 1280, height: 720}
      layer: roomBackground
```

Si algo puede ser target, tiene display name o participa en interacciones, debe
ser una entidad y no un visual ambiental.

## 4. IDs y referencias

### Sintaxis

Todos los IDs y state keys deben:

- comenzar con una letra minúscula;
- contener sólo letras ASCII, números y guiones;
- no contener espacios;
- ser sensibles a mayúsculas;
- cumplir `^[a-z][A-Za-z0-9]*(?:-[a-z0-9]+)*$`.

Se recomienda `kebab-case`. Los verbos existentes en `lowerCamelCase` son válidos.

### Namespaces

Catálogos globales, cada uno con unicidad propia:

- scenes;
- intros;
- assets;
- verbs;
- items;
- state keys.

Catálogos locales a una escena, cada uno con unicidad propia:

- entities;
- dialogues;
- sequences;
- room visuals.

Los IDs de nodos son únicos dentro de su diálogo. Los IDs de opciones son únicos
dentro de todo el diálogo, aunque estén en nodos distintos.

`target` puede apuntar a una entidad local o a un item global. Una escena no puede
usar el mismo ID para una entidad y un item porque la referencia sería ambigua.

### Forma de las referencias

Se usa un nombre de campo tipado por contexto, sin sufijo `Id`:

```yaml
asset: franco-idle
verb: talkTo
actor: franco
target: fede
item: calculator
dialogue: fede-sunglasses
sequence: buy-sunglasses
key: exchange-rate-known
goto: main
```

### Validación previa obligatoria

Antes de iniciar el renderer, el loader debe validar:

1. `start.scene`, `start.intro` y cada `scenes.source`.
2. Coincidencia entre el ID registrado y el ID del archivo de escena.
3. Unicidad y sintaxis de todos los IDs.
4. `controlledActor`, speakers y actores de acciones contra entidades actor.
5. Assets de backgrounds, objetos, animaciones, items e intros.
6. Verbos de interacciones y default verbs.
7. Targets contra entidades con hotspot o items globales.
8. Items de inventario, `hasItem` y `giveItem`.
9. State keys y compatibilidad de tipos en condiciones, efectos e iniciales.
10. Diálogos y secuencias referidos por acciones y `entry`.
11. Nodo inicial y todos los `goto` dentro de cada diálogo.
12. Forma y valores de bounds, posiciones, polígonos, depth y timings.
13. Que cada opción tenga exactamente un destino: `goto` o
    `endDialogue: true`.
14. Que cada secuencia y diálogo tenga por lo menos un paso/nodo estructural.

Los errores de referencia son errores de carga. No deben descubrirse después de
que el jugador hizo click.

## 5. Derivación de assets

No existe `requiredAssets` en el contenido v1. El loader calcula un conjunto sin
duplicados recorriendo referencias:

1. carga el manifiesto y valida el catálogo `assets`;
2. agrega los assets de la intro elegida por `start.intro`;
3. carga la escena requerida;
4. agrega assets de `room.visuals`;
5. agrega assets estáticos y todos los frames de `entities.visual`;
6. encuentra items alcanzables desde `initialInventory`, targets de interacción,
   condiciones `hasItem` y efectos `giveItem`;
7. agrega los iconos de esos items;
8. resuelve cada ID mediante `assetBasePath + assets[id]`;
9. deduplica URLs y las entrega al precargador actual.

Al cambiar a otra escena, se calcula y precarga su cierre antes del cambio. v1 no
requiere precargar todas las escenas al arrancar. Un asset referido pero ausente
del catálogo es un error de validación.

## 6. Scene entry

La forma v1 es:

```yaml
entry:
  sequence: opening-sunglasses
  once: true
```

Semántica:

1. `entry` es opcional. Si existe, `sequence` es obligatorio.
2. `once` es opcional y vale `false` por defecto.
3. La habitación y la UI se dibujan antes de iniciar la secuencia.
4. Mientras corre, la UI permanece visible, atenuada y sin input; la escena y la
   navegación tampoco reciben input.
5. Al terminar normalmente, el engine selecciona el verbo global default y
   habilita input.
6. Si la secuencia ejecuta `endScene`, el input permanece bloqueado.
7. Con `once: false`, se ejecuta en cada entrada a la escena.
8. Con `once: true`, se ejecuta una vez por ID de escena durante la sesión actual
   del engine. Una reentrada la omite.
9. Como v1 no incluye save/load, la marca de ejecución no se persiste fuera de la
   sesión.

Una falla inesperada de entry es fatal para la carga de la escena y no debe dejar
al jugador en una escena parcialmente interactiva.

## 7. Condiciones y efectos

Una lista `conditions` usa AND y conserva el orden escrito. Una lista ausente o
vacía coincide siempre.

Condiciones v1:

```yaml
- type: state
  key: exchange-rate-known
  operator: equals | notEquals
  value: true

- type: hasItem
  item: calculator
  value: true
```

Efectos v1:

```yaml
- type: setState
  key: exchange-rate-known
  value: true

- type: giveItem
  item: calculator
```

Los efectos se ejecutan en orden. Los valores son sólo boolean, number o string.
No hay expresiones, funciones ni valores calculados.

En una interacción, los efectos se aplican antes de entregar la acción. En una
opción de diálogo se aplican al seleccionarla, antes de reproducir el turno. Ese
orden coincide con el runtime actual y queda fijo en v1.

## 8. Interacciones y default verbs

Las interacciones son candidatos ordenados. El engine filtra por `verb + target`
y ejecuta el primer candidato cuyas condiciones coinciden:

```yaml
interactions:
  - verb: use
    target: calculator
    conditions: []
    effects: []
    action:
      type: say
      actor: franco
      text: Línea hablada.
```

Acciones v1:

- `message` con `text`;
- `say` con `actor` y `text`;
- `startDialogue` con `dialogue`;
- `triggerSequence` con `sequence`.

`triggerSequence` corresponde al actual `triggerAction`. El nombre del formato
expresa directamente el tipo de recurso referido.

`defaultVerb` acepta un verbo directo:

```yaml
defaultVerb: talkTo
```

o candidatos condicionales ordenados:

```yaml
defaultVerb:
  - verb: look
    conditions:
      - type: state
        key: sunglasses-price-calculated
        operator: notEquals
        value: true
  - verb: goTo
    conditions:
      - type: state
        key: sunglasses-price-calculated
        operator: equals
        value: true
```

El click izquierdo usa el verbo seleccionado. El click derecho usa el default
del target. Ambos recorren el mismo walk-to-target, facing y ejecución diferida.
El hover de un item muestra su default temporalmente sin cambiar la selección.

## 9. Walkable area, interaction position y depth

v1 admite walkable area rectangular o poligonal. El caso de estudio usa:

```yaml
walkableArea:
  type: polygon
  points:
    - {x: 0, y: 460}
    - {x: 1280, y: 460}
    - {x: 1280, y: 529}
    - {x: 0, y: 529}
```

El punto probado es siempre el anchor de los pies. No hay pathfinding ni
obstáculos; un destino fuera del área se rechaza.

`interactionPosition` es el anchor de pies donde se detiene el actor controlado
antes de ejecutar una interacción. Al llegar, el engine aplica facing y recién
entonces ejecuta la acción.

Para actores, la profundidad por defecto es `position.y`. Para objetos con
`depthY`, el engine los ordena contra ese anchor. Un actor con pies arriba de la
línea queda detrás y uno con pies debajo queda delante. Un objeto sin `depthY`
usa la capa estática de objetos del engine. UI, speech, títulos y cursor siempre
quedan por encima del mundo.

## 10. Dialogue nodes

v1 define diálogos como grafos de nodos y soporta ciclos explícitos:

```yaml
dialogues:
  - id: example-dialogue
    player: franco
    npc: fede
    start: main
    nodes:
      main:
        options:
          - id: ask
            playerLine: ¿Cómo estás?
            npcLine: Bien.
            conditions: []
            effects: []
            goto: follow-up
          - id: leave
            playerLine: Chau.
            endDialogue: true
      follow-up:
        options:
          - id: back
            playerLine: Volvamos.
            goto: main
```

Cada opción:

- puede tener `playerLine`, `npcLine` y `playerClosingLine`;
- puede tener condiciones de visibilidad y efectos;
- debe declarar exactamente uno entre `goto` y `endDialogue: true`;
- puede volver al mismo nodo o a cualquier nodo del diálogo;
- no puede saltar a un nodo de otro diálogo.

Presentación del turno:

1. se selecciona una opción visible y se aplican sus efectos;
2. se oculta el menú;
3. habla el player;
4. habla el NPC si existe `npcLine`;
5. habla el player si existe `playerClosingLine`;
6. al terminar, se abre el nodo de `goto` o finaliza la conversación;
7. al finalizar se restaura el verbo default.

Los nodos multinodo forman parte del formato v1 aunque `DialogueSession` todavía
requiera una extensión para ejecutarlos. No se define scripting de entrada o
salida de nodo.

## 11. Sequences

Una secuencia contiene acciones estrictamente ordenadas. Cada acción asincrónica
termina antes de comenzar la siguiente.

Una secuencia puede declarar una política de UI opcional:

```yaml
sequences:
  - id: cinematic-sequence
    ui: hidden
    actions:
      - type: say
        actor: player
        text: Una línea de la secuencia.
```

`ui: hidden` oculta completamente `ClassicAdventureUI` mientras se ejecuta la
secuencia. La escena, los actores, ActorSpeech y el cursor continúan visibles y
el input permanece bloqueado. Si la secuencia termina normalmente, la UI se
restaura. Si ejecuta `endScene`, permanece oculta. Cuando `ui` se omite se
conserva el comportamiento normal: UI visible, atenuada y no interactiva.

El único valor admitido por v1 es `hidden`.

Acciones v1:

| Acción | Campos |
| --- | --- |
| `wait` | `durationMs` |
| `say` | `actor`, `text` |
| `moveTo` | `actor`, `x`, `y`, `durationMs?` |
| `moveBySteps` | `actor`, `steps`, `deltaX`, `deltaY`, `stepDurationMs?` |
| `showTitle` | `text` |
| `endScene` | ninguno |

`moveTo` y `moveBySteps` usan el sistema general de movimiento, activan walk y
terminan en idle. `say` usa ActorSpeech. `showTitle` permanece visible si luego
se ejecuta `endScene`.

Durante toda secuencia el input queda deshabilitado. Sin una política `ui`, la
UI conserva su geometría y se atenúa. Una secuencia normal devuelve el control;
`endScene` lo mantiene bloqueado.

## 12. Correspondencia con el runtime actual

| Formato v1 | Runtime actual |
| --- | --- |
| manifest assets | `AssetCatalog` |
| manifest verbs | `VerbData` |
| manifest items | `InventoryItemData` |
| manifest state | `GameStateData` más validación futura |
| intro | `IntroData` / `IntroScene` |
| entity actor | `ActorData` y hotspot opcional |
| entity object | `RoomVisualData` más hotspot opcional |
| room | `RoomData` |
| interaction | `VerbInteractionData` |
| conditions/effects | `GameCondition` / `GameEffect` |
| sequence | `ActionSequenceData` |
| diálogo de un nodo | `DialogueData` |

El loader traducirá aliases legibles como `asset`, `actor`, `item`, `target`,
`dialogue`, `sequence` y `text` a los campos `*Id` y `message` de los modelos
actuales.

### Trabajo requerido más adelante

Sin implementarlo todavía, el loader/runtime necesitará:

- parseo y validación estructural de YAML;
- resolución completa de referencias;
- fábrica declarativa para IntroScene y GameScene;
- expansión de entidades a actor, visual y hotspot;
- derivación de assets requeridos;
- registro de entry ejecutado por sesión;
- soporte multinodo en DialogueSession;
- adaptación `triggerSequence -> triggerAction` mientras exista el nombre viejo;
- diagnóstico claro de errores de contenido.

## UAE Scene Format v1 — Frozen Scope

### Soportado por v1

- un manifiesto global por juego;
- resolución lógica fija;
- intro opcional seguida de una escena inicial;
- registro explícito de escenas externas;
- catálogos globales de assets, verbos, items, state keys e intros;
- inventario inicial global;
- entidades `actor` y `object` con visual e interacción opcionales;
- `displayName`, hotspot derivado o personalizado, default verb,
  interaction position y depth;
- actores con idle, walk, facing horizontal, speech color y velocidad;
- visuales ambientales de habitación;
- walkable areas rectangulares o poligonales;
- condiciones `state` y `hasItem` combinadas con AND;
- operadores `equals` y `notEquals`;
- efectos `setState` y `giveItem`;
- candidatos ordenados de interacción y default verb;
- acciones `message`, `say`, `startDialogue` y `triggerSequence`;
- diálogos multinodo con `goto`, ciclos, salida, condiciones y efectos;
- secuencias con `wait`, `say`, `moveTo`, `moveBySteps`, `showTitle` y
  `endScene`;
- política opcional de secuencia `ui: hidden`;
- entry sequence repetible o una vez por sesión;
- validación previa de sintaxis, tipos y referencias;
- derivación automática de assets requeridos.

### Postergado después de v1

- lenguaje de expresiones;
- aritmética general o cálculo dinámico de monedas;
- scripting embebido;
- funciones definidas por contenido;
- TypeScript o JavaScript dentro del YAML;
- condiciones OR/NOT arbitrarias y operadores distintos de equals/notEquals;
- efectos personalizados;
- variables locales de diálogo o secuencia;
- acciones condicionales dentro de una secuencia;
- paralelismo, branching o llamadas entre secuencias;
- transiciones entre múltiples habitaciones o escenas durante el juego;
- pathfinding, obstáculos y navegación multinivel;
- animaciones frontal/trasera, lip-sync o skeletal animation;
- combinación y drag-and-drop de items;
- save/load y persistencia de `entry.once` entre sesiones;
- audio, voces y música declarativa;
- localización;
- hot reload y herramientas visuales de autoría.

El cálculo de los anteojos permanece precalculado: las condiciones comprueban los
datos conocidos, el texto declara “diez pesos” y `setState` marca el puzzle como
resuelto. v1 no evalúa una fórmula.
