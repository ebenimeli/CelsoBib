# Adviento · Calendario multietapa

Una sola aplicación web de Adviento, con **seis etapas educativas**, **144 propuestas** y **144 ilustraciones SVG**. Conserva el calendario interactivo original, sus 24 ventanas, el modo pruebas, el desbloqueo por fecha y la descarga de cada día en PDF horizontal 16:9.

## Modos disponibles

| Selector | Identificador | Edad aproximada |
|---|---|---|
| Infantil | `infantil` | 3–5 años |
| Primaria 1.º–3.º | `primaria-1-3` | 6–9 años |
| Primaria 4.º–6.º | `primaria-4-6` | 9–12 años |
| ESO 1.º–2.º | `eso-1-2` | 12–14 años |
| ESO 3.º–4.º | `eso-3-4` | 14–16 años |
| Bachillerato | `bachillerato` | 16–18 años |

Las cuatro velas de Adviento se muestran arriba a la izquierda y el selector de etapa se mantiene arriba a la derecha; en pantallas pequeñas se adaptan juntos antes del título. El cambio no recarga la página: cambia los textos, los archivos SVG, los colores y las formas del calendario. La elección se guarda en `localStorage` mediante la clave `adviento.educationalMode`. La primera visita muestra **Infantil**.

El modo Infantil mantiene **todos los textos, SVG y composición del calendario de la versión original**, con la única incorporación de las velas en la cabecera. Las demás etapas incluyen textos y dibujos propios, coordinados por tema pero ajustados a diferentes edades. Bachillerato añade contenidos originales sobre la interioridad, la libertad, la vocación, el sentido y el compromiso social.

## Estructura del proyecto

```text
adviento/
├── index.html             # Pantalla única, calendarios y ventanas emergentes
├── styles.css             # Estilos originales y diseño adaptable
├── themes.css             # Selector de etapa y seis identidades visuales
├── app.js                 # Lógica común, fechas, lectura de JSON y cambio de modo
├── pdf-export.js          # Exportación común a PDF en formato 16:9
├── config.js              # Año, zona horaria, modo pruebas y animaciones
├── content/
│   ├── infantil.json
│   ├── primaria-1-3.json
│   ├── primaria-4-6.json
│   ├── eso-1-2.json
│   ├── eso-3-4.json
│   └── bachillerato.json
├── assets/
│   ├── favicon.svg
│   ├── fallback.svg
│   └── illustrations/
│       ├── infantil/      # day-01.svg … day-24.svg (originales)
│       ├── primaria-1-3/  # 24 ilustraciones SVG originales
│       ├── primaria-4-6/  # 24 ilustraciones SVG originales
│       ├── eso-1-2/      # 24 ilustraciones SVG originales
│       ├── eso-3-4/      # 24 ilustraciones SVG originales
│       └── bachillerato/ # 24 ilustraciones SVG originales
├── tools/
│   └── generate-illustrations.py # Opcional: regeneración de dibujos vectoriales
├── min.sh                 # Compilación/minimización y ofuscación
├── dist/                  # Copia lista para publicar
└── README.md
```

## Puesta en marcha

La aplicación utiliza `fetch()` para cargar los JSON editables. **No debe abrirse `index.html` mediante `file://`**: los navegadores pueden bloquear esas solicitudes locales.

Desde la carpeta raíz ejecuta:

```bash
python3 -m http.server 8000
```

Visita `http://localhost:8000`. Alternativamente, publícala en cualquier servidor HTTP estático (sin backend, base de datos ni login).

## Editar los contenidos diarios

Abre **solo el archivo JSON correspondiente a la etapa**, por ejemplo `content/eso-3-4.json`. Cada archivo contiene exactamente 24 entradas con estas claves:

```json
{
  "day": 1,
  "title": "Título del día",
  "message": "Reflexión adaptada a la etapa.",
  "prayer": "Oración breve dirigida a Jesús o a Dios.",
  "action": "Compromiso concreto y realizable.",
  "image": "assets/illustrations/eso-3-4/day-01.svg",
  "imageAlt": "Descripción accesible de la ilustración."
}
```

Respeta las comillas dobles, la coma entre entradas, la codificación **UTF-8**, la lista superior `days` y los números únicos del 1 al 24. Los textos pueden editarse libremente. Cada etapa tiene sus propias reflexiones, gestos, oraciones y títulos; los temas siguen un itinerario común hacia el nacimiento de Jesús. Puedes editar únicamente un modo sin afectar a los demás.

**No modifiques `app.js` para cambiar los textos.** Después de guardar y actualizar el navegador, el JSON se recarga con `cache: no-store`.

## Sustituir ilustraciones

Cada día apunta a un **archivo SVG independiente**, por ejemplo `assets/illustrations/primaria-4-6/day-13.svg`.

Puedes abrir y modificar el SVG con un editor de texto o gráfico vectorial. Para cambiar un dibujo, sustituye el archivo respetando la ruta indicada en su JSON. Para cambiar el nombre o ubicación, modifica únicamente el campo `image` del JSON de esa etapa. La misma ilustración cargada en el modal es la que se prepara para su PDF; no existe otra tabla de correspondencias ni una versión alternativa para imprimir.

Los SVG son independientes y no dependen de recursos externos. Con ello funcionan en navegadores modernos y pueden rasterizarse localmente para la exportación.

## Cambiar la identidad visual

Abre `themes.css`. Hay seis bloques de variables `html[data-mode="..."]` con los colores principales, además de reglas de composición específicas para las seis etapas. Cambia las variables `--theme-*`, `--night`, `--gold`, `--pdf-paper`, etc., para personalizar un tema sin alterar los demás.

`styles.css` contiene el diseño original compartido; las adaptaciones se aplican por encima en `themes.css`. El modo Infantil queda deliberadamente sin sustituciones estéticas, salvo el selector de etapa. Las otras cinco interfaces tienen estructuras distintas: libro ilustrado, cuaderno de campo, revista juvenil, póster editorial y galería contemplativa.

Para cambiar los textos breves de la cabecera, de los lemas y del encabezado del compromiso de cada etapa, edita el objeto `MODES` situado al principio de `app.js`.


## Ventanas con números y diseños diferenciados

Todas las ventanas del calendario muestran únicamente los números del 1 al 24, sin etiquetas adicionales. Se mantienen las decoraciones, los bordes y los efectos de cada modo, así como el contenido completo del cuadro que se abre al pulsar una ventana.


Las cinco etapas posteriores a Infantil **no son solo cambios de paleta**. Sus calendarios dejan de mostrar casas para adoptar tarjetas con geometrías específicas. Sus ventanas diarias utilizan cinco maquetaciones distintas:

- **Primaria 1.º–3.º:** páginas de libro ilustrado, con imagen enmarcada y contenido cálido.
- **Primaria 4.º–6.º:** cuaderno de campo con papel rayado, texto a la izquierda y lámina a la derecha.
- **ESO 1.º–2.º:** revista digital con títulos grandes, bloques editoriales y paleta contrastada.
- **ESO 3.º–4.º:** póster horizontal con franja superior ilustrada y lectura en tres columnas.
- **Bachillerato:** galería de ensayo: tipografía serif, texto a la izquierda, ilustración conceptual a la derecha y oraciones separadas por reglas.

Los diseños de la exportación a PDF siguen esas mismas estructuras en formato 16:9, incluyendo el caso de móviles. En `themes.css` están agrupados por etapa y al final se incluyen ajustes exclusivos de exportación. Cambiar un tema no modifica los restantes.

Las ilustraciones posteriores a Infantil se han reemplazado por **24 escenas temáticas distintas por etapa**: caminos, conversaciones, puente, brújula, acogida, plantas, farol, reconciliación, viaje, Navidad, etc. Comparten un lenguaje gráfico dentro de cada colección y son SVG independientes, sin recursos externos. Para editar una escena concreta, modifica su SVG directamente. Opcionalmente, el script `tools/generate-illustrations.py` permite regenerar las cinco colecciones no infantiles a partir de sus motivos vectoriales: **sobrescribe sus archivos, así que guarda copias de las personalizaciones antes de ejecutarlo**. No modifica Infantil.

## Fechas, permisos y modo pruebas

En `config.js`:

- `testMode: true` abre los 24 días, independientemente de la fecha. **Está activado, como en el original. Cambia a `false` antes de publicarlo para uso diario.**
- `testDate: null` mantiene la fecha real. Para probar el encendido, con `testMode: true` fija por ejemplo `"2026-12-13"` y recarga: la corona mostrará tres velas encendidas. Usa también `"2026-11-29"`, `"2026-12-06"` y `"2026-12-20"` para comprobar los cuatro estados. Si `testMode: false`, `testDate` se ignora.
- `calendarYear: 2026` indica el año.
- `candleLightingDates` contiene las cuatro fechas de encendido, una por domingo. **Actualízalas al cambiar `calendarYear`**. En 2026: 29 de noviembre, 6, 13 y 20 de diciembre. La tercera vela es rosa; las otras tres, moradas. El encendido es acumulativo y el 1 de diciembre ya hay una vela encendida.
- `timeZone: "Europe/Madrid"` fija la zona horaria de apertura y de encendido.
- `animationsEnabled: true` permite las animaciones, incluidas las llamas (se respetan también las preferencias de movimiento reducido).

Con `testMode: false` se conserva exactamente la lógica del proyecto original: durante diciembre solo se abre el día actual; los días anteriores y posteriores permanecen cerrados. La corona se actualiza al abrir la aplicación y cuando cambia la fecha (si la aplicación continúa abierta). Fuera del año configurado se muestra apagada. Cambiar el nivel educativo **no modifica las fechas ni el desbloqueo**.

## Descargar el PDF

En la ventana emergente selecciona **Descargar PDF**. La exportación toma el contenido activo de esa etapa y el SVG realmente mostrado, lo convierte temporalmente en PNG de alta resolución para evitar problemas de captura y genera un PDF de una sola página con proporción 16:9.

Ejemplos de nombres: `Adviento_INFANTIL_Dia-01.pdf`, `Adviento_ESO-3-4_Dia-12.pdf`.

La biblioteca `html2canvas` v1.4.1 se carga **bajo demanda desde CDNJS** cuando se hace la primera descarga: por ello, la exportación requiere acceso a ese recurso o incluir la biblioteca localmente si vas a usarla sin Internet. Si el SVG no está disponible, se informa del error y no se sustituye silenciosamente por otra imagen.

## Generar una distribución optimizada

Desde la carpeta principal:

```bash
chmod +x min.sh
./min.sh
```

El script requiere Node.js y npm. La primera vez descarga `terser`, `javascript-obfuscator`, `clean-css` y `html-minifier-terser` a la caché del usuario, fuera del proyecto. Valida los **144 registros**, sus campos y la existencia de los **144 SVG** antes de reconstruir `dist/`. Después minimiza HTML y los dos CSS y minimiza/ofusca `app.js` y `pdf-export.js`. **Los seis JSON y `config.js` quedan editables en la distribución.** Los SVG también se conservan como archivos separados.

La carpeta `dist/` incluida en este ZIP contiene una copia funcional, con archivos fuente legibles, preparada para publicar; **no debe confundirse con la versión ofuscada** que genera `min.sh`. Tras cualquier cambio de código, ejecuta de nuevo `min.sh` para generar una distribución optimizada.

## Verificaciones y límites

- Validado: 6 × 24 entradas y sus rutas, 144 SVG bien formados, correspondencia de temas, preservación de Infantil.
- Validado en Chromium con inyección local de recursos (el entorno bloquea la navegación HTTP): cambio entre seis etapas, carga de ilustraciones y diseños en escritorio y móvil. Comprobadas las 144 composiciones para exportación a 1200 × 675 px, sin desbordamientos detectados. No constituye una prueba de descarga real con `html2canvas`.
- No verificado en este entorno: descarga **real** a través de la biblioteca externa `html2canvas`, que depende del acceso al CDN; y ejecución completa del proceso de ofuscación npm (registro npm inaccesible desde este entorno). Deben probarse en el navegador y equipo de despliegue.

Esta aplicación está pensada para proyectarse brevemente al comienzo de la jornada y presentar una ilustración, una reflexión, un compromiso y una oración. Los textos son editables y deben revisarse pedagógicamente antes de su uso institucional.
