# UbicApp · Versión 43

Aplicación web estática para organizar parejas **persona-mesa** dentro de un espacio.

## Modelo de funcionamiento

El número de la persona y el número de su mesa son siempre el mismo:

- persona 1 ↔ mesa 1
- persona 2 ↔ mesa 2
- persona 3 ↔ mesa 3

Cuando **Organiza** o **Al azar** cambia la distribución, no reasigna una persona a una mesa con otro número. En su lugar, desplaza la unidad completa persona-mesa a otra posición del canvas.

Por ejemplo, si la persona 7 debe ocupar la posición que antes ocupaba el 18, se mueve a esa posición **la persona 7 junto con la mesa 7**.


## Esquemas de espacio

El desplegable **Esquema**, situado junto a los controles de tamaño, incluye **Manual** como primera opción y estado inicial. **Manual** describe un plano creado o ajustado directamente por el usuario y seleccionarlo no mueve ninguna mesa. Los demás esquemas reorganizan las posiciones físicas de las mesas. Si existen restricciones efectivas, tras crear la nueva geometría UbicApp ejecuta automáticamente **Organiza** para volver a optimizar la distribución sobre esas posiciones. **Cooperativo ABBC** conserva además su condición especial de composición por grupos, sin romper nunca la relación `persona N ↔ mesa N`.

- **Individual**: cuadrícula de mesas individuales, con un pasillo mayor entre cada par de mesas.
- **2 mesas juntas**: parejas horizontales unidas por el lado corto; cada pareja se mantiene completa al saltar de fila.
- **3 mesas juntas**: tríos horizontales unidos por el lado corto, separados entre sí.
- **Esquema 2-3-2**: secuencia horizontal de pareja, trío y pareja; los bloques se mantienen completos al adaptarse al ancho.
- **Circular**: distribución en uno o varios óvalos concéntricos dentro del espacio disponible, evitando solapamientos siempre que el tamaño físico lo permita.
- **Equipos x4**: bloques `AB / CD` (2 × 2).
- **Equipos x5**: cuatro mesas en bloque 2 × 2 y una quinta mesa lateral, girada 90° y orientada hacia el grupo.
- **Equipos x6**: bloques `ABC / DEF` (3 × 2).
- **Equipos xN**: permite indicar un tamaño de equipo `N ≥ 2`. Con N par crea dos filas iguales enfrentadas; con N impar añade una mesa lateral girada 90° hacia el grupo. Primero forma los equipos completos y coloca después las mesas sobrantes.
- **Cooperativo ABBC**: bloques 2 × 2 que intentan reunir `A+B+B+C` y conservar esa composición al organizar.

El esquema **Manual** aparece seleccionado por defecto al iniciar un proyecto vacío. Cuando se aplica expresamente un esquema automático, su disposición puede recalcularse al cambiar el ancho mientras siga activa.

## Uso

1. Abre `index.html` en un navegador moderno.
2. Mueve manualmente las mesas con drag & drop si quieres definir las posiciones disponibles.
3. Escribe la lista de personas. Las líneas aparecen numeradas automáticamente (`1.`, `2.`, `3.`…) para poder referenciarlas en las restricciones.
4. Añade restricciones, por ejemplo:
   - `1x2` → muy separados
   - `1-2` → juntos
   - `1--2` → cerca
   - `F: 1,4,7` → delante
   - `B: 2,8,10` → detrás
5. Pulsa **Organiza**.
6. Usa **Descargar** para obtener únicamente el plano del espacio en un PDF A4 vertical de una sola página.
7. Para eliminar una mesa, selecciónala y usa **− Mesa** en la barra superior, o haz clic derecho sobre ella. Si la mesa está vinculada a un persona, se elimina también su línea de la lista.

La aplicación utiliza una matriz de distancias normalizadas y simulated annealing para buscar una buena distribución.

Al eliminar una pareja persona-mesa, las parejas posteriores se renumeran para mantener una secuencia continua. Las restricciones se actualizan automáticamente: las referencias al persona eliminado desaparecen y los números posteriores se desplazan una posición. Las mesas libres que no tengan persona pueden eliminarse sin modificar la lista.

No requiere servidor, backend ni dependencias externas.


- **Vaciar** elimina todas las mesas del plano sin borrar la lista de personas ni las restricciones.


## Versión 10: giro y bloqueo de mesas

Esta versión parte de la versión adjunta anterior y añade únicamente una barra secundaria con dos herramientas:

- **Girar mesa**: gira 90° la mesa seleccionada. La etiqueta gira con ella; la orientación del texto representa desde qué lado se sentaría la persona para poder leerla.
- **Bloquear mesa**: fija la mesa seleccionada en su posición. Una mesa bloqueada no se puede arrastrar y conserva su posición al usar **Organiza**, **Al azar** o aplicar un **Esquema**. El botón cambia a **Desbloquear mesa** cuando corresponde.

El giro y el bloqueo se guardan en `localStorage` y también se reflejan en el PDF exportado.


## Novedades de la versión 11

- Tercera barra de **Salida** bajo las herramientas de mesa.
- La salida se puede **ocultar o mostrar** con su propio botón.
- Tras pulsar **Organiza**, las restricciones se explican con los nombres abreviados de los personas (por ejemplo, `Juan P.R. se debe sentar cerca de Marta G.L.`).
- Cada restricción muestra también un porcentaje aproximado de cumplimiento y una valoración breve.
- La salida informa cuando se aplica una distribución aleatoria, indicando que las restricciones no han intervenido.
- El estado visible/oculto de la barra se conserva en `localStorage`.


## Novedades de la versión 12

- A la derecha de **Vaciar** se puede indicar una cantidad y pulsar **Añadir** para crear varias mesas de una vez; también funciona con `Enter`.
- Añadir varias mesas no modifica la lista de personas ni las restricciones. Las nuevas mesas reutilizan primero los números que estén libres y buscan posiciones no solapadas dentro del canvas.
- Al mantener el puntero sobre una mesa asignada aparece un tooltip propio con el nombre completo de la persona.
- **Organiza** muestra una barra de progreso vinculada a las iteraciones reales del algoritmo de optimización.
- **Al azar** muestra igualmente una barra de progreso visual. La distribución se aplica de inmediato, pero el indicador permanece visible aproximadamente dos segundos para que el proceso sea perceptible.
- La barra de progreso utiliza la paleta activa y no requiere dependencias externas.


## Novedades de la versión 13

### Selección múltiple de mesas

- Arrastra sobre una zona vacía del plano para dibujar un rectángulo de selección.
- Se seleccionan las mesas no bloqueadas cuyo centro geométrico quede dentro del rectángulo.
- Arrastra cualquiera de las mesas seleccionadas para mover todo el grupo conservando sus distancias relativas.
- El grupo se mantiene siempre dentro de los límites del canvas.
- Un clic en una zona vacía o la tecla `Escape` cancelan la selección.
- La selección es temporal y no se guarda en `localStorage`.


## Novedades de la versión 14

### Grupos de personas

La lista de personas admite una etiqueta opcional de grupo al final de cada línea:

```text
1. Pérez Rodríguez, Juan / A
2. Gómez Pardo, Ana / B
3. Soler Martínez, Daniel / A
```

La letra se normaliza a mayúsculas y puede ir de `A` a `Z`. En pantalla, la mesa muestra la etiqueta entre paréntesis (`Juan P.R. (A)`) y utiliza un color de relleno estable asociado al grupo. Las personas sin grupo mantienen el color normal de la paleta.

El tooltip muestra el nombre completo y, cuando corresponde, el grupo. La información de grupos es exclusivamente una ayuda de trabajo: **el PDF no incluye ni la letra del grupo ni los colores de grupo**.

### Restricciones de grupo

Además de las restricciones numéricas existentes, se admiten restricciones basadas en letras:

- `AxB` → los grupos A y B lo más separados posible.
- `A-B` → los grupos A y B lo más cerca posible (proximidad fuerte).
- `A--B` → los grupos A y B relativamente cerca.
- `F: C` o `F: C,D` → esos grupos lo más adelante posible.
- `B: B,A` → ambos grupos atrás y, además, A debe quedar globalmente detrás de B.

Las relaciones entre dos grupos utilizan la **distancia media** entre todas las parejas de personas de ambos grupos, evitando que una restricción pese más solo por contener más integrantes. En las restricciones `F:` y `B:` con varios grupos se promedian primero las posiciones de cada grupo para que cada etiqueta tenga un peso comparable.

La barra de **Salida** explica también estas restricciones en lenguaje natural e indica su porcentaje aproximado de cumplimiento.


## Novedades de la versión 15

### Listado histórico de ejemplo

La plantilla **Personajes** incluye 30 personajes relevantes de la historia, manteniendo una única etiqueta de grupo por persona:

- `L` → Literatura
- `C` → Ciencia
- `A` → Arte
- `H` → Historia
- `P` → Pensamiento
- `M` → Música

El formato sigue siendo `Apellidos, Nombre / grupo`. No se añade ninguna segunda clasificación.

### Comentarios en la lista de personas

Las líneas cuyo primer carácter útil es `#` son comentarios. Se muestran y se guardan en `localStorage`, pero no se cuentan como personas, no reciben número y no crean mesas. La renumeración automática y la eliminación de personas conservan esos comentarios.

### Restricciones internas de un mismo grupo

Ahora se admiten también relaciones de un grupo consigo mismo:

- `L-L` → las personas del grupo L lo más cerca posible unas de otras.
- `L--L` → las personas del grupo L relativamente cerca unas de otras.
- `LxL` → las personas del grupo L lo más separadas posible unas de otras.

Para estas reglas se calcula la distancia media entre parejas internas únicas: nunca se compara una persona consigo misma ni se cuenta dos veces la misma pareja. Las reglas entre grupos distintos (`L-C`, `L--C`, `LxC`) y las reglas individuales continúan funcionando igual.

Si un grupo tiene una sola persona, una restricción interna de ese grupo no añade coste al optimizador porque no existe ninguna pareja que pueda evaluarse.

## Novedades de la versión 17

- Terminología generalizada a **Personas** y **espacio**, sin limitar la interfaz a un contexto educativo.
- Scroll suave al inicio tras **Organiza**, **Al azar** y la aplicación manual de esquemas automáticos.
- Nueva herramienta **+ Zona** para crear áreas protegidas mediante arrastre.
- Las zonas protegidas bloquean el movimiento individual y múltiple de mesas, la colocación de nuevas mesas y los esquemas automáticos.
- Las zonas se pueden seleccionar, mover y eliminar; se conservan con **Vaciar**, se guardan en `localStorage` y aparecen en el PDF.

## Novedades de la versión 16

### Posición horizontal

El lenguaje de restricciones admite ahora condiciones de izquierda y derecha mezclando personas concretas y grupos:

- `L: 1,4,A` → las personas 1 y 4 y las personas del grupo A deben quedar lo más a la izquierda posible.
- `R: 2,6,B,C` → las personas 2 y 6 y las personas del grupo B y C deben quedar lo más a la derecha posible.

La posición se evalúa con la coordenada horizontal normalizada del centro de la mesa. Las referencias que afecten a la misma persona se deduplican para no aumentar artificialmente el peso de una regla.

### Esquema Cooperativo ABBC

El desplegable **Esquema** incorpora **Cooperativo ABBC**. Utiliza la misma geometría 2 × 2 de **Equipos x4**, pero intenta formar el máximo número posible de equipos con esta composición:

```text
A   B
B   C
```

La prioridad principal es obtener equipos completos `A+B+B+C`. Como preferencia secundaria se favorece la posición interna `A B / B C`; los dos miembros B son intercambiables. Las mesas bloqueadas conservan siempre su posición y su grupo se tiene en cuenta al completar el equipo.

Si no existe la proporción exacta de personas A, B y C, se forman tantos equipos completos como sea posible y el resto de personas se distribuye en las posiciones sobrantes. Los grupos distintos de A, B y C no se modifican.

Al seleccionar el esquema, la barra de **Salida** informa del número de equipos ABBC completos. Mientras **Cooperativo ABBC** siga seleccionado, **Organiza** incorpora una restricción interna de alta prioridad para conservar el máximo número posible de equipos completos además de las restricciones escritas por el usuario. **Al azar** mantiene su comportamiento aleatorio habitual.


## Zonas protegidas

La barra secundaria incluye **+ Zona**. Después de activarla, arrastra sobre una zona vacía del plano para dibujar un rectángulo reservado. Las zonas protegidas:

- impiden colocar mesas total o parcialmente encima;
- afectan al arrastre individual y múltiple;
- son respetadas por los esquemas automáticos, incluido **Cooperativo ABBC**;
- son respetadas al añadir nuevas mesas;
- pueden seleccionarse y moverse si no se superponen con mesas;
- se eliminan con `Delete`/`Backspace` o con clic derecho;
- se guardan en `localStorage`;
- permanecen al pulsar **Vaciar**;
- aparecen en la exportación PDF con borde discontinuo.

Al crear una zona sobre una mesa existente, UbicApp rechaza la operación para no alterar una distribución preparada manualmente.

## Scroll automático

Después de **Organiza** o **Al azar**, UbicApp espera a que termine y desaparezca la barra de progreso, deja dos segundos para revisar el resultado y después vuelve suavemente al inicio de la página. Los esquemas automáticos conservan el mismo desplazamiento, con una espera de dos segundos tras aplicar el resultado.

## Novedades de la versión 18

### Barra informativa y ayuda

La parte superior incorpora una barra compacta y permanentemente oscura con **UbicApp · Enrique Benimeli · Ayuda**. El nombre **Enrique Benimeli** enlaza a `https://www.ebenimeli.org` en una nueva pestaña. El tutorial se encuentra en `help.html` y se muestra en una ventana modal sobre la propia aplicación, con scroll independiente y cierre mediante ×, Escape o clic en el fondo. El estado de la aplicación principal se conserva intacto. La ayuda explica el plano, zonas protegidas, lista de personas, lenguaje de restricciones, esquemas, Cooperativo ABBC, optimización y exportación PDF con ejemplos prácticos.

### Listas de ejemplo

Sobre el cuadro **Personas** se incorpora el selector **Ejemplo** con estas plantillas:

- **Personajes**: conserva exactamente el listado histórico utilizado en la versión 17 y sus etiquetas L, C, A, H, P y M.
- **Ejemplo ABC**: utiliza los mismos 30 personajes, en el mismo orden, con etiquetas A, B y C distribuidas como 8 A, 15 B y 7 C para probar **Cooperativo ABBC**.
- **Lista simple**: plantilla limpia de 30 líneas numeradas con el texto `Apellidos, Nombre`, sin etiquetas de grupo ni comentarios, pensada como punto de partida para crear una lista propia.
- **Personalizado**: aparece automáticamente cuando el contenido del cuadro ya no coincide exactamente con una plantilla.

Cambiar de ejemplo modifica únicamente la lista de personas y sus grupos. No mueve mesas, no cambia su tamaño u orientación, no elimina zonas, no desbloquea mesas y no aplica esquemas. Las restricciones se conservan y la barra de salida recuerda revisar las reglas basadas en grupos. Si la lista actual es personalizada, UbicApp solicita confirmación antes de sustituirla.

El estado del selector se conserva mediante el sistema existente de `localStorage`, sin sobrescribir listas personalizadas al recargar.

### Ejemplo didáctico ABC

En una instalación nueva, UbicApp comienza con un espacio de trabajo vacío. El botón **Ver un ejemplo**, situado a la derecha de **Buscar persona**, carga **Ejemplo ABC**, coloca las mesas con el esquema **Individual**, carga restricciones de demostración de las sintaxis principales, activa **Generar 3 alternativas** y ejecuta **Organiza**, mostrando las alternativas A/B/C.

Las restricciones de demostración incluyen comentarios iniciados por `#`; esas líneas son informativas, no cuentan como restricciones y son ignoradas por el parser.

Si ya existe una configuración en curso, **Ver un ejemplo** solicita confirmación antes de sustituirla. El botón **Nuevo** crea, también previa confirmación, un espacio completamente vacío y guarda ese estado en `localStorage`.

## Novedades de la versión 19

### Ayuda integrada en modal

El botón **Ayuda** ya no abre una nueva pestaña. El tutorial completo de `help.html` se reutiliza dentro de una ventana modal centrada sobre UbicApp. El modal dispone de scroll independiente, bloquea la interacción y el desplazamiento de la aplicación situada detrás, adapta su aspecto a la paleta activa y puede cerrarse con el botón **×**, la tecla **Escape** o haciendo clic fuera del cuadro de ayuda. Al cerrar, el foco vuelve al botón **Ayuda** y el estado de UbicApp permanece intacto.

`help.html` continúa siendo una página HTML válida que puede abrirse directamente de forma independiente.


## Novedades de la versión 20

- Nuevo botón **Borrar lista** junto al selector **Ejemplo**. Vacía únicamente la lista de personas, conserva mesas, restricciones y zonas protegidas y deja el selector en **Personalizado**.
- La lista vacía se conserva en `localStorage` y no se sustituye automáticamente por **Personajes** al recargar.
- Nuevo subtítulo: **Un organizador de espacios de estudio y de trabajo**.
- La barra informativa superior utiliza siempre fondo oscuro y texto claro, independientemente de la paleta activa.
- La barra muestra únicamente **UbicApp · Enrique Benimeli · Ayuda**. El nombre **Enrique Benimeli** enlaza a `https://www.ebenimeli.org` en una nueva pestaña.


## Búsqueda de personas

La barra secundaria incluye un campo **Buscar persona...**. La búsqueda se actualiza mientras se escribe, ignora mayúsculas/minúsculas y acentos, admite coincidencias parciales y resalta simultáneamente todas las mesas coincidentes. El resaltado es temporal: no modifica selección, bloqueo, colores de grupo, posiciones ni exportación PDF.


## Novedades de la versión 23

### Tres alternativas de asignación

La barra de acciones incorpora el checkbox **Generar 3 alternativas**. Es un estado temporal y no se guarda en `localStorage`; **Ver un ejemplo** lo activa automáticamente para la demostración ABC.

Cuando está activo:

- **Organiza** conserva varias soluciones candidatas del recocido simulado, prioriza las de mejor coste y descarta alternativas prácticamente idénticas. La barra situada sobre el plano permite comparar hasta tres soluciones, identificadas como **A**, **B** y **C**, y muestra su calidad con una cifra decimal cuando procede. El resumen general mantiene el porcentaje entero.
- **Al azar** genera hasta tres distribuciones aleatorias distintas.
- **Cooperativo ABBC** puede generar hasta tres composiciones cooperativas distintas, manteniendo el máximo número posible de equipos `A+B+B+C`.

Cambiar entre alternativas es inmediato y no vuelve a ejecutar el algoritmo. La barra de **Salida** y el panel de calidad se actualizan para describir la solución seleccionada. Las mesas bloqueadas permanecen exactamente en la misma posición en todas las alternativas y las zonas protegidas siguen siendo respetadas.

Las alternativas son temporales. Se invalidan al modificar personas, restricciones, mesas, bloqueos, zonas o esquemas. Al desmarcar el checkbox se conserva visualmente la alternativa actual, pero se eliminan las restantes y se oculta la barra.


## Novedades de la versión 26

- La aplicación adopta el nombre **UbicApp** en toda su identidad visible.
- El título principal combina **Ubic** con **App** en el naranja del icono, manteniendo el resto de menciones en un único color.
- Se añade un pie de página oscuro con **UbicApp · Enrique Benimeli · Ayuda**, reutilizando el mismo enlace del autor y el mismo modal de ayuda de la barra superior.
- Se conservan el icono y favicon existentes y no se modifican las claves históricas de `localStorage`.


## Versión 27 · nombre del espacio

La barra secundaria incorpora **Nombre del espacio...**. El texto se actualiza mientras se escribe, se guarda junto con el estado existente de la aplicación y aparece centrado sobre el plano, justo antes de **DELANTE**. Si el campo está vacío no se reserva espacio adicional.

El mismo nombre se incorpora como encabezado centrado en la exportación **PDF A4 vertical**, por fuera del rectángulo del espacio. Si no se ha indicado nombre, el PDF conserva la composición anterior.


## Versión 33 · flujo inicial y relaciones contextuales

- Una instalación nueva comienza con **canvas, Personas, Restricciones y Nombre del espacio vacíos**. La pantalla inicial de presentación se mantiene, pero ya no carga ni organiza ningún ejemplo automáticamente.
- **Ver un ejemplo** carga el ejemplo ABC completo, reconstruye la geometría Individual, incorpora las restricciones didácticas, activa **Generar 3 alternativas** y ejecuta **Organiza**. Si ya existe contenido, solicita confirmación.
- **Nuevo** sustituye a **Restablecer**. Tras confirmar, elimina mesas, zonas, personas, restricciones, nombre del espacio, búsqueda, alternativas y resultados, dejando un proyecto vacío que se conserva al recargar.
- En el tooltip contextual se siguen mostrando todas las restricciones aplicables. El resaltado visual de otras mesas queda limitado a relaciones individuales directas: `1x2`, `1-2` y `1--2`. Las restricciones entre grupos o dentro del mismo grupo ya no resaltan grupos completos.


## Versión 34 · esquema Manual y navegación rápida

- **Manual** es ahora la primera opción y el esquema por defecto de un proyecto vacío. Seleccionarlo no transforma el plano. Al añadir mesas manualmente, eliminar mesas, moverlas o girarlas, el selector refleja que la geometría es manual.
- El botón naranja **Lista de personas**, junto a **Buscar persona**, desplaza suavemente la página hasta la sección **Personas**.
- El botón naranja **Ver espacio**, junto a **Borrar lista**, vuelve suavemente al inicio para mostrar el canvas y sus herramientas.
- El canvas visible es ligeramente menos alto para facilitar la navegación vertical, manteniendo las coordenadas normalizadas, los esquemas, zonas, optimización y exportación PDF.
- La terminología visible utiliza **grupo / grupos** para las etiquetas A, B, C, etc. La sintaxis (`/ A`, `AxB`, `A-B`, `A--B`) y las estructuras internas no cambian.


## Versión 36 · restricciones al cambiar de esquema y Equipos x5

- Al aplicar un esquema automático, UbicApp conserva exactamente el contenido del cuadro **Restricciones**. Si existe al menos una restricción efectiva (ignorando líneas vacías y comentarios `#`), se reutiliza automáticamente **Organiza** sobre la nueva geometría. El estado de **Generar 3 alternativas** se respeta sin crear una lógica de optimización paralela.
- **Manual** continúa siendo descriptivo y no mueve mesas ni ejecuta **Organiza**.
- Se incorpora **Equipos x5** entre **Equipos x4** y **Equipos x6**. Cada equipo completo conserva un bloque 2 × 2 de cuatro mesas y añade una quinta mesa a la derecha, girada 90° hacia el grupo. Si sobran menos de cinco mesas, se colocan ordenadamente como un bloque parcial sin eliminar personas ni mesas.
- Las zonas protegidas, mesas bloqueadas, tooltip contextual, líneas de relaciones, PDF y claves existentes de `localStorage` mantienen su funcionamiento.


## Versión 43 · Equipos xN

- Nuevo esquema configurable **Equipos xN**, con un campo `N` visible únicamente mientras ese esquema está seleccionado.
- `N` admite enteros desde 2 y se guarda junto al estado del proyecto. Los estados de versiones anteriores siguen cargando con `N = 4` como valor inicial.
- Para `N` par, cada equipo utiliza dos filas enfrentadas de `N/2` mesas. Para `N` impar, utiliza dos filas de `floor(N/2)` mesas más una mesa lateral girada 90° hacia el equipo.
- Se forman primero todos los equipos completos y las mesas sobrantes se colocan después como un bloque compacto, sin eliminarlas ni forzar un equipo incompleto.
- Si el tamaño solicitado no cabe físicamente en el canvas con las dimensiones actuales de las mesas, UbicApp conserva la geometría anterior y muestra un mensaje de validación.
- **Organiza**, **Al azar**, alternativas A/B/C, zonas protegidas, mesas bloqueadas, PDF e internacionalización reutilizan la lógica existente.
