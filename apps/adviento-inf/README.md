# Nuestro camino hacia la Navidad

Calendario de Adviento interactivo para **Educación Infantil (3-5 años)**. Incluye 24 ventanitas, ilustraciones originales y una frase, una oración y un gesto sencillo para cada día. Está pensado para usar con el grupo desde una pizarra digital, pantalla o proyector.

No necesita cuentas, bases de datos ni herramientas de compilación. Está construido con **HTML, CSS, JavaScript nativo y JSON**. La descarga en PDF incorpora una única biblioteca externa, `html2canvas`, que se carga desde CDN solamente cuando se utiliza el botón de exportación. Para mantener las ilustraciones originales, la aplicación rasteriza temporalmente la imagen que ya muestra cada día antes de componer el PDF; no sustituye ni modifica los SVG de `assets/`.

## 1. Instalación y ejecución

Descomprime el ZIP conservando todas las carpetas y archivos. Como el calendario carga `content.json` con `fetch()`, **no debe abrirse `index.html` directamente con doble clic** (`file://`): utiliza un servidor web, incluso para probarlo en tu ordenador.

Desde la carpeta `calendario-adviento`, ejecuta:

```bash
python -m http.server 8000
```

Si en tu equipo el comando anterior no funciona, prueba `python3 -m http.server 8000`. Abre luego <http://localhost:8000> en el navegador. Para detener el servidor, pulsa `Ctrl+C` en la terminal.

Puedes publicar todos los archivos, tal cual, en cualquier alojamiento **web estático** (por ejemplo, GitHub Pages, Netlify o el servidor web de tu centro). No hace falta instalar ni ejecutar Python en el alojamiento: solo se utiliza como servidor local de pruebas.

## 2. Configuración general

Edita **`config.js`** con un editor de texto:

```javascript
const CONFIG = Object.freeze({
  testMode: false,
  calendarYear: 2026,
  timeZone: "Europe/Madrid",
  animationsEnabled: true
});
```

- `testMode: false`: funcionamiento real. Solo se puede abrir la puerta del día de diciembre correspondiente al año configurado.
- `testMode: true`: **modo pruebas**. Puedes abrir cualquiera de las 24 puertas a cualquier hora y en cualquier fecha. Aparecerá un discreto aviso «Modo pruebas activado».
- `calendarYear`: año del calendario. Cámbialo cada curso si deseas reutilizar la misma web.
- `timeZone`: zona horaria para interpretar la fecha; por defecto `Europe/Madrid`.
- `animationsEnabled`: utiliza `false` para desactivar las animaciones decorativas.

**Importante:** el modo normal no permite volver a abrir una puerta de días anteriores; tampoco permite adelantar futuras puertas. Entre el 25 y el 31 de diciembre aparecen como días pasados. Antes del 1 de diciembre del año configurado, todas permanecen cerradas. Es una restricción didáctica implementada en el navegador, no un sistema de seguridad frente a la manipulación deliberada del reloj o del código.

El calendario está diseñado para los días 1-24 de diciembre, que son una **adaptación educativa**. El inicio litúrgico del Adviento no coincide necesariamente con el 1 de diciembre.

## 3. Cómo modificar los contenidos del calendario

**Solo necesitas editar `content.json`.** No hace falta abrir los archivos HTML, CSS ni JavaScript.

1. Abre `content.json` con un editor de texto (Bloc de notas, Visual Studio Code, etc.).
2. Busca el bloque del día que quieres cambiar por el número de `"day"`.
3. Sustituye únicamente el texto *entre comillas* del campo deseado.
4. Guarda el archivo como **UTF-8** y vuelve a cargar la página.

Por ejemplo, para cambiar la oración del **día 5**, localiza:

```json
{
  "day": 5,
  "title": "José confía en Dios",
  "message": "José cuida de María con mucho cariño.",
  "prayer": "Jesús, ayúdanos a cuidar a los demás.",
  "action": "Hoy cuidamos nuestros materiales.",
  "image": "assets/day05.svg",
  "imageAlt": "José prepara con cuidado una pequeña cuna de madera."
}
```

Modifica `"prayer"` por una oración distinta y guarda.

**Significado de los campos:**

| Campo | Qué puedes cambiar |
|---|---|
| `day` | Número del día (del 1 al 24); es mejor **no modificarlo**. |
| `title` | Título breve del día. |
| `message` | Frase principal que leerá el tutor. |
| `prayer` | Oración para repetir juntos. |
| `action` | Gesto o compromiso realizable en clase. |
| `image` | Ruta relativa a la ilustración. |
| `imageAlt` | Descripción accesible de la imagen. |

**Consejos para evitar errores en JSON:**

- Mantén las comillas dobles `"` alrededor de los campos y los textos.
- Conserva las comas entre campos, pero no añadas una coma después del último campo de cada bloque.
- Si necesitas escribir comillas dobles dentro del texto, utiliza `\"`.
- No añadas comentarios con `//` o `/* ... */` en `content.json` (JSON no permite comentarios).
- Conserva exactamente 24 bloques con números del 1 al 24, sin duplicados.
- Puedes comprobar el archivo en un validador JSON local o en el editor antes de publicarlo.

La web comprueba la estructura y los campos obligatorios. Si un día contiene un error aislado, los demás días correctos siguen disponibles; el detalle técnico se muestra en la consola del navegador para quien administre el sitio.

## 4. Cómo cambiar las ilustraciones

Cada día tiene su propio SVG en `assets/`, desde `day01.svg` hasta `day24.svg`. Son ilustraciones vectoriales originales que no necesitan conexión a internet para cargarse.

Para sustituir la imagen del día 8, puedes:

- Reemplazar `assets/day08.svg` por otro archivo SVG con ese nombre, o
- Guardar tu imagen, por ejemplo `assets/maria.png`, y cambiar el campo correspondiente en `content.json` a `"image": "assets/maria.png"`.

Puedes usar imágenes PNG, JPEG, WebP y SVG. Para obtener mejores resultados, utiliza una imagen horizontal con proporciones cercanas a **4:3**. Actualiza también el campo `imageAlt` para describir el contenido nuevo. Si una imagen falla, la web muestra automáticamente una ilustración alternativa.

## 5. Cómo reutilizar el calendario otro año

1. Cambia `calendarYear` en `config.js`.
2. Edita, si lo deseas, los mensajes, oraciones y gestos de `content.json`.
3. Sustituye las ilustraciones que quieras personalizar.
4. Publica los archivos actualizados y verifica que `testMode` esté en `false` antes de usarlo en clase.

El calendario no incluye ninguna marca ni congregación específica. Puede utilizarse en distintos centros de inspiración católica.

## 6. Resolución de problemas

| Problema | Solución |
|---|---|
| No aparecen los contenidos | Comprueba que `content.json` está junto a `index.html` y que accedes desde un servidor HTTP. |
| Una imagen no aparece | Revisa el nombre del archivo, la extensión y la ruta relativa del campo `image`. |
| El modo pruebas no funciona | Comprueba que `testMode: true` está en `config.js`; guarda y actualiza. |
| Las puertas están bloqueadas | Es normal fuera del día del año configurado en modo normal. Prueba temporalmente con `testMode: true`. |
| No aparecen los cambios en el JSON | Guarda el archivo, recarga la página y comprueba que editas la copia alojada en el servidor. La aplicación solicita el JSON sin caché. |
| Error de formato JSON | Revisa comillas, llaves y comas; puedes validar `content.json` con `python -m json.tool content.json`. |
| Las animaciones molestan | Establece `animationsEnabled: false` o activa la opción de movimiento reducido del dispositivo. |

## 7. Organización de los archivos

```text
calendario-adviento/
├── index.html          Interfaz y dos cuadros de presentación
├── styles.css          Diseño adaptable y animaciones
├── app.js              Fechas, 24 puertas, carga y validación del JSON
├── pdf-export.js       Captura del modal y descarga PDF horizontal
├── config.js           Opciones: año, zona horaria, pruebas, animaciones
├── content.json        LOS TEXTOS DE LOS 24 DÍAS: principal archivo a editar
├── assets/
│   ├── day01.svg       Ilustraciones, una por día
│   ├── ...
│   ├── day24.svg
│   ├── fallback.svg    Imagen alternativa
│   └── favicon.svg     Icono de la pestaña
└── README.md           Este documento
```

## 8. Uso en el aula

La propuesta de cada día está pensada para durar pocos minutos: **observad la ilustración, escuchad la frase, repetid juntos la oración y realizad el gesto del día**. El botón «Ver ilustración grande» facilita enseñar la escena en la pizarra digital. En cada día abierto también aparece **«Descargar PDF»**: guarda una diapositiva apaisada 16:9 (una sola página, 960 × 540 puntos, con una imagen de 2400 × 1350 píxeles) que conserva la ilustración, el título, la frase, la oración y el gesto, sin botones. El PDF se genera **íntegramente en el navegador**, sin subir el contenido a servidores. Antes de capturar la diapositiva, el navegador convierte en memoria la ilustración original ya cargada (SVG, PNG, JPEG o WebP) a un PNG de alta resolución; `html2canvas` recibe así la imagen renderizada por el propio navegador y no tiene que interpretar de nuevo los SVG. Si la ilustración original no está disponible, se muestra un error en vez de exportar por error la imagen alternativa. Para usar la exportación, el navegador debe poder descargar la biblioteca `html2canvas` desde CDN (se carga bajo demanda). El resto del calendario no depende de ella. Los archivos se guardan con nombres como `Adviento_Dia_01.pdf`. Se recomienda usar una versión actual de Chrome o Firefox para la exportación; algunos navegadores restringen las capturas HTML basadas en SVG, por lo que se utiliza la rasterización previa descrita.

Los mensajes están redactados para Infantil y ponen en el centro la espera del nacimiento de Jesús. El contenido de la secuencia es intencionalmente sencillo y puede adaptarse a la programación pastoral de tu centro desde `content.json`.

---

**Privacidad y accesibilidad:** no se recopilan datos personales, no hay métricas ni se envían datos personales o contenidos a servidores. La descarga en PDF necesita una conexión a CDN para cargar `html2canvas`. Las puertas se pueden usar con pantalla táctil, ratón y teclado; los cuadros de diálogo son accesibles y las imágenes disponen de descripciones alternativas. Las animaciones respetan la preferencia de movimiento reducido.
