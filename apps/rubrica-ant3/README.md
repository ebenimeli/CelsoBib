# Rúbrica v1.2

Aplicación web local para diseñar rúbricas, evaluar criterios de forma ágil y generar informes PDF sin conexión, sin cuentas y sin enviar datos a servidores.

## Abrir la aplicación

1. Descomprime el ZIP.
2. Abre `rubrica/index.html` (o `rubrica/dist/index.html`) con un navegador actualizado: Chrome, Edge, Safari o Firefox.
3. Define el nombre de la actividad, los criterios y elementos de evaluación y los niveles de logro.
4. Pulsa **Usar esta rúbrica**, califica los elementos y descarga el informe PDF de cada alumno antes de pulsar **Calificar nuevo**.

También puedes probar la nueva configuración con **Cargar ejemplo**.

## Novedades de v1.2: descriptores por elemento y nivel

- Los niveles de logro muestran, inicialmente, **solo la etiqueta y la puntuación**. Se configuran de 2 a 10 niveles, con valores entre 0 y 10.
- **Detallar niveles de logro** abre una tabla editable: filas = elementos, columnas = niveles. Cada celda admite una descripción opcional. **Ocultar detalles** vuelve a contraer la tabla sin borrar el contenido.
- Los descriptores acompañan a su elemento y nivel aunque se cambie el orden de las líneas de elementos o se utilicen las flechas para reordenar niveles. También se conservan al editar su etiqueta o puntuación.
- En la **Rúbrica activa**, el descriptor específico aparece al pasar el cursor sobre un botón o al recibir foco con el teclado. En dispositivos táctiles se puede consultar mediante el pequeño icono de información. Los botones de calificación siguen seleccionándose mediante un clic.
- El **informe PDF** y la **plantilla vacía PDF** incluyen, si hay descriptores, una sección de matriz analítica. Con muchos niveles, se distribuye en tablas de hasta cuatro columnas por grupo para evitar textos ilegibles. Si no hay descriptores, no se añade esta sección.
- **Guardar rúbrica** e **Importar rúbrica** sustituyen las etiquetas «Guardar JSON» e «Importar JSON». Los archivos siguen siendo `.json`.
- El ejemplo incluye tres elementos de programación, cuatro niveles de logro (*Excellent*, *Very good*, *Good* e *Insufficient*) y los doce descriptores correspondientes.

## Compatibilidad del JSON

El nuevo formato mantiene `format: "rubric-maker"` y utiliza `version: 2`. Incluye `levels` con identificadores estables, `items` con identificadores y las entradas `descriptors` asociadas a esos identificadores, además de los campos de configuración habituales.

Se **siguen importando los archivos de la versión 1**. Si contenían una descripción general para un nivel, se convierte en un descriptor de ese nivel para cada elemento, para no perder esa información. Si no contenían descripciones, los descriptores permanecen vacíos y ocultos inicialmente.

Los JSON guardan **solo la configuración**: nunca el nombre ni las notas de alumnos.

## Formatos de entrada

**Criterios de evaluación**: una línea por criterio, `código / descripción / peso` (opcionales, peso por defecto 1).

```text
1.1 / Presentación del trabajo / 1
2.3 / Programación de soluciones / 3
2.4 / Comprobación y depuración / 2
```

**Elementos a calificar**: una línea por elemento, `elemento / código, código`.

```text
Inicializa correctamente las variables / 2.3
Organiza el código / 2.3, 2.4
El archivo tiene el nombre solicitado / 1.1
```

Acepta coma o punto decimal. Si un elemento utiliza un código de criterio que no se haya definido expresamente, se crea con peso 1.

## Evaluación y calificaciones

- La **nota de cada criterio** es la media de sus elementos ya calificados. Un elemento puede intervenir en varios criterios.
- La **nota final** es la media ponderada de los criterios disponibles, según sus pesos.
- Los elementos pendientes **no cuentan como cero** y el resultado se identifica como provisional.
- Las calificaciones reales por debajo de 5 se resaltan visualmente.
- Los botones **Asignar a todos** aplican un mismo nivel a todos los elementos; las filas siguen pudiendo corregirse individualmente.
- El indicador flotante muestra la nota final actual y busca una zona de pantalla que no tape controles relevantes.
- El botón **.txt** copia un informe de texto plano; **Descargar informe PDF** genera el informe en PDF.

## Informes PDF

El motor autónomo `vendor/pdf-export.js` permite generar tanto el **informe individual** como la **rúbrica vacía** sin bibliotecas externas ni conexión. La plantilla vacía no consulta notas ni nombres de alumnos.

Se utilizan fuentes PDF estándar en codificación Windows-1252, con soporte para caracteres habituales del español y de otras lenguas occidentales. Otros símbolos, como muchos emojis, pueden aparecer como `?`. Los documentos paginan las tablas y repiten las cabeceras; las filas muy largas pueden continuar en la página siguiente.

## Archivos y distribución

```text
rubrica/
├── index.html
├── styles.css
├── app.js
├── recommend.js
├── vendor/
│   └── pdf-export.js
├── min.sh
├── dist/                Copia de distribución funcional, lista para abrir
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── recommend.js
│   └── vendor/pdf-export.js
└── README.md
```

**`dist/` se entrega funcional y sincronizada con el código fuente**, sin ofuscación previa. Si quieres una compilación minificada y ofuscada, ejecuta `bash min.sh` desde `rubrica/` en un equipo con Node.js; la primera ejecución necesita instalar las herramientas npm necesarias y puede requerir Internet. El código fuente no se modifica.

El menú **Recomendar** puede configurarse mediante las URL de `recommend.js`. Si no se proporcionan URL públicas, informa de ello sin inventar direcciones.

No hay historial automático de alumnos: descarga el PDF de cada evaluación antes de empezar otra. Los cálculos y los datos se procesan localmente en el navegador.
