// js/text/write.js  (barrel + bootstrap side-effect)

// Reexporta API pública que usa tu actionMap / main.js
export * from "./write-suggest.js";
export * from "./write-audio.js";
export * from "./write-typewriter.js";
export { wireFormatControls, resetSchemeToTheme } from "./write-format.js";
export { initWriteMode, exitWriteMode } from "./write-mode.js";

// Registra listeners de arranque (app:main-updated)
import "./write-bootstrap.js";
