/**
 * CONFIGURACIÓN DEL CALENDARIO
 * Cambia solamente los valores indicados para adaptar su funcionamiento.
 */
const CONFIG = Object.freeze({
  testMode: true,              // true: abre los 24 días en cualquier fecha
  testDate: null,              // solo con testMode: "2026-12-13" para simular una fecha; null = fecha real
  calendarYear: 2026,          // año del Adviento que deseas mostrar
  timeZone: "Europe/Madrid",   // zona horaria para abrir cada ventana y encender las velas
  animationsEnabled: true,     // false: desactiva las animaciones decorativas
  candleLightingDates: Object.freeze([ // 4 domingos de Adviento; actualiza estas fechas cada año
    "2026-11-29", // primera vela morada
    "2026-12-06", // segunda vela morada
    "2026-12-13", // tercera vela, rosa
    "2026-12-20"  // cuarta vela morada
  ])
});
