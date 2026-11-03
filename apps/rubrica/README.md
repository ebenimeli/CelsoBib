# Rubrica v1.1

Aplicación web local para crear rúbricas, evaluar sucesivamente a distintos alumnos y descargar informes PDF.

## Ajuste visual de legibilidad

- Incrementados ligeramente los tamaños de letra de etiquetas, instrucciones, campos de texto, botones, tablas, estados y nota flotante.
- Aplicada una escala tipográfica reutilizable mediante variables CSS y pequeños ajustes de altura y alineación.
- Sin cambios en la lógica de evaluación, los cálculos, la exportación PDF ni el resto de funcionalidades. Se mantiene la versión 1.1.

## Novedades de la versión 1.1

- Nombre de la aplicación actualizado a **Rubrica**, con identificación de versión **1.1**.
- Botón de configuración **Usar esta rúbrica**.
- Pantalla de presentación de aproximadamente 3 segundos al abrir o recargar, con el nombre Rubrica y el autor **Enrique Benimeli**. No se requiere ninguna descarga.
- Indicador flotante de **Calificación final**, preferentemente en la esquina inferior derecha: se recoloca cuando hay controles próximos, cambia en tiempo real, señala notas provisionales y vuelve a `— / 10` con **Calificar nuevo**. No reemplaza el resumen original.

Los archivos JSON antiguos con `format: "rubric-maker"` y `version: 1` siguen siendo compatibles con esta versión. Esa etiqueta se mantiene como identificador técnico para evitar incompatibilidades.

## Abrir

1. Descomprime el archivo ZIP.
2. Abre `index.html` con Chrome, Edge, Firefox o Safari actualizado. No necesitas instalación, servidor ni Internet.
3. Introduce una actividad, los elementos que se calificarán y sus códigos de criterio. Opcionalmente, define las descripciones y los pesos.
4. Configura entre 2 y 10 niveles de logro. Pulsa **Usar esta rúbrica**.
5. Escribe el nombre del alumno (opcional), selecciona niveles y descarga el informe PDF. **Calificar nuevo** deja la rúbrica preparada para el siguiente alumno.

Puedes pulsar **Cargar ejemplo** para probar inmediatamente el funcionamiento.

## Formatos de entrada

**Criterios** (opcionales): una línea por criterio, `código / descripción / peso`.

```text
1.1 / Presentación del trabajo / 1
2.3 / Programa mediante estructuras de control / 3
2.4 / Comprueba y depura el programa / 2
```

La descripción y el peso se pueden omitir. El peso por defecto es 1. Los códigos no definidos expresamente se crean al encontrar un elemento que los utiliza.

**Elementos** (obligatorios): una línea por elemento, `descripción / código, código`.

```text
Inicializa las variables / 2.3
Organiza el código / 2.3, 2.4
El archivo tiene el nombre solicitado / 1.1
```

Usa coma o punto para los valores decimales (por ejemplo, `2,5` o `2.5`). Los niveles de logro admiten notas entre 0 y 10. Si eliges dos niveles, la propuesta inicial será **Sí (10)** y **No (0)**.

## Cómo se calculan las notas

1. La nota de **cada criterio** es la media aritmética de las puntuaciones de sus elementos asociados que ya están calificados.
2. La nota **final de la actividad** es la media ponderada de las notas de los criterios disponibles, según el peso de cada criterio.
3. Los elementos pendientes no son ceros. Mientras falten elementos, las notas se señalan como **provisionales**.
4. Un mismo elemento puede contribuir a la nota de varios criterios cuando está asociado a varios códigos.

Las notas se calculan sin redondeos intermedios y se presentan con dos decimales.

## Reutilizar una rúbrica

- **Calificar nuevo** borra las calificaciones y el nombre del alumno actual, pero conserva íntegra la rúbrica.
- **Guardar JSON** descarga la configuración (nunca contiene las notas de alumnos).
- **Importar JSON** recupera una configuración guardada desde otro navegador u ordenador.

La aplicación no envía información a Internet ni guarda datos personales del alumnado en servidores. **No hay un historial de alumnos**: descarga su PDF antes de pulsar «Calificar nuevo». Los cambios en una evaluación iniciada requieren confirmación antes de perder calificaciones.

## Informe PDF

El PDF se genera en el navegador con un módulo independiente incluido en `vendor/pdf-export.js`. No descarga bibliotecas de terceros. Usa fuentes PDF estándar con codificación Windows-1252; se admiten los acentos, la eñe y los caracteres habituales del español. Los caracteres fuera de esta codificación (por ejemplo, emojis) se sustituyen por `?` en el PDF. Las tablas se paginan automáticamente, repiten encabezados y evitan cortar las filas, salvo filas excepcionalmente más largas que una página, que continúan en la siguiente.

## Archivos

```text
rubrica-v1.1/
├── index.html           Estructura semántica de la página
├── styles.css           Diseño adaptable y estilos
├── app.js               Validaciones, interfaz, cálculo y archivos JSON
├── vendor/
│   └── pdf-export.js    Generador PDF autónomo
└── README.md            Instrucciones de uso
```

Todo el proyecto funciona con archivos locales y JavaScript nativo; no requiere instalación de paquetes ni compilación.
