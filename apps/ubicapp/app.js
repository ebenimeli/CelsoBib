(() => {
  'use strict';

  const STORAGE_KEY = 'app-spaces-state-v2';
  const LEGACY_STORAGE_KEY = 'app-spaces-state-v1';
  const INITIAL_TABLE_COUNT = 30;
  const INITIAL_ROWS = 6;
  const INITIAL_COLS = 5;
  const INITIAL_TABLE_WIDTH = 112;
  const INITIAL_TABLE_HEIGHT = 54;
  const MIN_TABLE_WIDTH = 72;
  const MAX_TABLE_WIDTH = 180;
  const TABLE_SIZE_STEP = 8;
  const DEFAULT_SPACE_LAYOUT = 'manual';
  const DIDACTIC_SPACE_LAYOUT = 'individual';
  const MIN_PROGRESS_VISIBLE_MS = 2000;
  const TOOLTIP_DELAY_MS = 350;
  const SPLASH_VISIBLE_MS = 5000;
  const POST_PROGRESS_SCROLL_DELAY_MS = 2000;
  const VISIT_COUNTER_BASE_URL = 'https://abacus.jasoncameron.dev';
  const VISIT_COUNTER_KEY = 'ubicapp-visits-v1';
  const VISIT_COUNTER_TIMEOUT_MS = 6000;

  const SPACE_LAYOUT_LABELS = Object.freeze({
    manual: 'Manual',
    individual: 'Individual',
    pairs: '2 mesas juntas',
    trios: '3 mesas juntas',
    'two-three-two': 'Esquema 2-3-2',
    circular: 'Circular',
    team4: 'Equipos x4',
    team5: 'Equipos x5',
    team6: 'Equipos x6',
    'cooperative-abbc': 'Cooperativo ABBC'
  });

  const DEFAULT_STUDENTS = [
    'de Cervantes Saavedra, Miguel / L',
    'García Lorca, Federico / L',
    'Pérez Galdós, Benito / L',
    'Pardo Bazán, Emilia / L',
    'Machado Ruiz, Antonio / L',
    'Ramón y Cajal, Santiago / C',
    'Ochoa de Albornoz, Severo / C',
    'Salas Falgueras, Margarita / C',
    'Torres Quevedo, Leonardo / C',
    'de la Cierva Codorníu, Juan / C',
    'Ruiz Picasso, Pablo / A',
    'Dalí Domènech, Salvador / A',
    'de Goya y Lucientes, Francisco / A',
    'Sorolla Bastida, Joaquín / A',
    'Quevedo Villegas, Francisco de / L',
    'Campoamor Rodríguez, Clara / H',
    'Hernández Gilabert, Miguel / L',
    'Jiménez Mantecón, Juan Ramón / L',
    'Delibes Setién, Miguel / L',
    'Cela Trulock, Camilo José / L',
    'Ortega y Gasset, José / P',
    'Unamuno Jugo, Miguel de / P',
    'Peral Caballero, Isaac / C',
    'Marañón Posadillo, Gregorio / C',
    'Rodrigo Vidre, Joaquín / M',
    'Albéniz Pascual, Isaac / M',
    'Buñuel Portolés, Luis / M',
    'García Berlanga, Luis / M',
    'Falla Matheu, Manuel de / M',
    'Segovia Torres, Andrés / M'
  ];

  const DEFAULT_STUDENT_COMMENTS = [
    '# Formato: Apellidos, Nombre / grupo',
    '# Grupos: L=Literatura, C=Ciencia, A=Arte, H=Historia, P=Pensamiento, M=Música',
    '# Las letras pueden utilizarse en las restricciones para referirse a grupos de personas.',
    '#'
  ];


  const COOPERATIVE_GROUP_LABELS = Object.freeze([
    'B','A','B','C','B','A','B','C','B','A',
    'B','C','B','A','B','C','B','A','B','C',
    'B','A','B','C','B','A','B','C','B','A'
  ]);

  const COOPERATIVE_STUDENTS = DEFAULT_STUDENTS.map((entry, index) => {
    const baseName = entry.replace(/\s*\/\s*[A-Za-z]\s*$/, '');
    return `${baseName} / ${COOPERATIVE_GROUP_LABELS[index]}`;
  });

  const COOPERATIVE_STUDENT_COMMENTS = [
    '# Ejemplo para distribuciones cooperativas',
    '# Grupos: A, B y C',
    '# Distribución: A=8, B=15, C=7',
    '# Adecuado para probar el esquema Cooperativo ABBC',
    '#'
  ];

  const DIDACTIC_CONSTRAINTS_TEXT = [
    '# Restricciones individuales',
    '1x2',
    '3-4',
    '5--6',
    '',
    '# Restricciones entre grupos',
    'AxB',
    'B-C',
    'A--C',
    '',
    '# Restricciones dentro del mismo grupo',
    'AxA',
    'B-B',
    'C--C',
    '',
    '# Posición',
    'F: 7',
    'B: 8',
    'L: 9',
    'R: 10'
  ].join('\n');

  const SIMPLE_STUDENTS = Array.from({ length: 30 }, () => 'Apellidos, Nombre');

  const WEIGHTS = Object.freeze({
    far: 10,
    together: 12,
    near: 5,
    front: 4,
    back: 4,
    left: 4,
    right: 4
  });

  const GROUP_WEIGHTS = Object.freeze({
    far: 10,
    together: 12,
    near: 5,
    front: 4,
    back: 4,
    left: 4,
    right: 4,
    orderedBack: 6
  });

  const COOPERATIVE_ABBC_WEIGHTS = Object.freeze({
    composition: 28,
    pattern: 3
  });

  const GROUP_COLORS = Object.freeze({
    A: '#cfe8d5', B: '#f7d7b5', C: '#cfe0f5', D: '#dfd3f2', E: '#f4e7a8', F: '#f3c7c3',
    G: '#cbe7e4', H: '#edd1e2', I: '#d9e6b8', J: '#f0d9c5', K: '#cbdcf0', L: '#e2d5c5',
    M: '#c9e2c8', N: '#f0c8ae', O: '#c8d8e8', P: '#d9c6e8', Q: '#eadf9d', R: '#e8bdb8',
    S: '#bfe0dc', T: '#e5c4d9', U: '#d1dfad', V: '#e8d0bb', W: '#bed4ec', X: '#d8cdbb',
    Y: '#bfd9bf', Z: '#e9c09f'
  });

  const $ = (selector) => document.querySelector(selector);
  const elements = {
    classroom: $('#classroom'),
    addTableBtn: $('#addTableBtn'),
    deleteTableBtn: $('#deleteTableBtn'),
    increaseSizeBtn: $('#increaseSizeBtn'),
    decreaseSizeBtn: $('#decreaseSizeBtn'),
    layoutSelect: $('#layoutSelect'),
    clearTablesBtn: $('#clearTablesBtn'),
    tableCountInput: $('#tableCountInput'),
    addTablesBtn: $('#addTablesBtn'),
    rotateTableBtn: $('#rotateTableBtn'),
    lockTableBtn: $('#lockTableBtn'),
    addZoneBtn: $('#addZoneBtn'),
    spaceNameInput: $('#spaceNameInput'),
    spaceNameDisplay: $('#spaceNameDisplay'),
    classroomWrap: $('#classroomWrap'),
    personSearchInput: $('#personSearchInput'),
    peopleListBtn: $('#peopleListBtn'),
    viewExampleBtn: $('#viewExampleBtn'),
    outputBar: $('#outputBar'),
    toggleOutputBtn: $('#toggleOutputBtn'),
    outputContent: $('#outputContent'),
    calculationProgress: $('#calculationProgress'),
    progressLabel: $('#progressLabel'),
    progressPercent: $('#progressPercent'),
    progressTrack: $('#progressTrack'),
    progressFill: $('#progressFill'),
    tableTooltip: $('#tableTooltip'),
    downloadPdfBtn: $('#downloadPdfBtn'),
    themeSelect: $('#themeSelect'),
    resetBtn: $('#resetBtn'),
    organizeBtn: $('#organizeBtn'),
    randomizeBtn: $('#randomizeBtn'),
    generateAlternativesCheckbox: $('#generateAlternativesCheckbox'),
    alternativesBar: $('#alternativesBar'),
    alternativesButtons: $('#alternativesButtons'),
    exampleSelect: $('#exampleSelect'),
    clearPeopleBtn: $('#clearPeopleBtn'),
    viewSpaceBtn: $('#viewSpaceBtn'),
    peoplePanel: $('#peoplePanel'),
    studentsInput: $('#studentsInput'),
    studentErrors: $('#studentErrors'),
    constraintsInput: $('#constraintsInput'),
    studentCountBadge: $('#studentCountBadge'),
    constraintCountBadge: $('#constraintCountBadge'),
    constraintErrors: $('#constraintErrors'),
    metrics: $('#metrics'),
    message: $('#message'),
    solutionPanel: $('#solutionPanel'),
    saveStatus: $('#saveStatus'),
    helpOpenBtn: $('#helpOpenBtn'),
    helpOpenFooterBtn: $('#helpOpenFooterBtn'),
    visitCountSeparator: $('#visitCountSeparator'),
    visitCount: $('#visitCount'),
    helpModal: $('#helpModal'),
    helpModalDialog: $('#helpModalDialog'),
    helpCloseBtn: $('#helpCloseBtn'),
    helpFrame: $('#helpFrame'),
    splashModal: $('#splashModal'),
    splashDialog: $('#splashDialog'),
    splashProgressTrack: $('#splashProgressTrack'),
    splashProgressFill: $('#splashProgressFill'),
    appShell: document.querySelector('main.app-shell'),
    topInfoBar: document.querySelector('body > .info-bar:not(.site-footer)'),
    siteFooter: document.querySelector('body > .site-footer')
  };

  const state = {
    tables: [],
    tableWidth: INITIAL_TABLE_WIDTH,
    tableHeight: INITIAL_TABLE_HEIGHT,
    theme: 'light',
    spaceLayout: DEFAULT_SPACE_LAYOUT,
    layoutActive: false,
    lastSolution: null,
    dragging: null,
    marquee: null,
    selectedTableId: null,
    selectedTableIds: new Set(),
    outputCollapsed: false,
    saveTimer: null,
    tooltipTimer: null,
    progressSequence: 0,
    progressSession: null,
    scrollTimer: null,
    spaceName: '',
    cooperativeBlockPositions: [],
    zones: [],
    selectedZoneId: null,
    zoneMode: false,
    zoneDraft: null,
    zoneDragging: null,
    examplePreset: 'custom',
    helpModalOpen: false,
    helpReturnFocus: null,
    alternatives: [],
    alternativeSlotPositions: null,
    selectedAlternativeIndex: -1,
    alternativeContext: null
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }


  function cancelPendingPageTopScroll() {
    if (state.scrollTimer) {
      clearTimeout(state.scrollTimer);
      state.scrollTimer = null;
    }
  }

  function scrollToPageTopSoon(delayMs = 0) {
    cancelPendingPageTopScroll();
    state.scrollTimer = setTimeout(() => {
      state.scrollTimer = null;
      if (window.scrollY <= 1) return;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });
    }, Math.max(0, Number(delayMs) || 0));
  }

  function scheduleScrollAfterProgress(token) {
    cancelPendingPageTopScroll();
    const session = state.progressSession;
    if (!session || session.token !== token) {
      scrollToPageTopSoon(POST_PROGRESS_SCROLL_DELAY_MS);
      return;
    }
    session.onHidden.push(() => scrollToPageTopSoon(POST_PROGRESS_SCROLL_DELAY_MS));
  }

  function updateSpaceNameDisplay() {
    const value = String(state.spaceName || '').trim();
    if (elements.spaceNameInput && elements.spaceNameInput.value !== state.spaceName) {
      elements.spaceNameInput.value = state.spaceName;
    }
    if (elements.spaceNameDisplay) {
      elements.spaceNameDisplay.textContent = value;
      elements.spaceNameDisplay.hidden = !value;
    }
    if (elements.classroomWrap) elements.classroomWrap.classList.toggle('has-space-name', Boolean(value));
  }

  function onSpaceNameChanged() {
    state.spaceName = elements.spaceNameInput?.value || '';
    updateSpaceNameDisplay();
    saveStateSoon();
  }

  function setSplashInteractionBlocked(blocked) {
    [elements.topInfoBar, elements.appShell, elements.siteFooter].forEach(element => {
      if (element) element.inert = blocked;
    });
    document.body.classList.toggle('splash-modal-open', blocked);
  }

  function startSplashScreen(onComplete = null) {
    const complete = () => {
      setSplashInteractionBlocked(false);
      if (typeof onComplete === 'function') {
        requestAnimationFrame(() => {
          try { onComplete(); } catch (error) { console.warn('No se pudo completar la inicialización posterior al splash:', error); }
        });
      }
    };

    if (!elements.splashModal || !elements.splashProgressFill) {
      complete();
      return;
    }
    setSplashInteractionBlocked(true);
    elements.splashModal.hidden = false;
    elements.splashModal.setAttribute('aria-hidden', 'false');
    elements.splashDialog?.focus({ preventScroll: true });
    elements.splashProgressFill.style.transition = 'none';
    elements.splashProgressFill.style.width = '0%';
    if (elements.splashProgressTrack) elements.splashProgressTrack.setAttribute('aria-valuenow', '0');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        elements.splashProgressFill.style.transition = `width ${SPLASH_VISIBLE_MS}ms linear`;
        elements.splashProgressFill.style.width = '100%';
        if (elements.splashProgressTrack) elements.splashProgressTrack.setAttribute('aria-valuenow', '100');
      });
    });

    setTimeout(() => {
      elements.splashModal.classList.add('closing');
      setTimeout(() => {
        elements.splashModal.hidden = true;
        elements.splashModal.setAttribute('aria-hidden', 'true');
        elements.splashModal.classList.remove('closing');
        complete();
      }, 320);
    }, SPLASH_VISIBLE_MS);
  }


  function alternativesEnabled() {
    return Boolean(elements.generateAlternativesCheckbox?.checked);
  }

  function layoutUsesSlotRotation() {
    // En cualquier esquema automático, la orientación forma parte de la geometría
    // física del slot. Así, una pareja persona-mesa adopta la rotación de la
    // posición que ocupa y no arrastra una orientación heredada de otro esquema.
    return state.spaceLayout !== 'manual';
  }

  function captureAssignmentSlots() {
    return state.tables.map(table => ({
      xNorm: table.xNorm,
      yNorm: table.yNorm,
      rotation: normalizeRotation(table.rotation)
    }));
  }

  function restoreAssignmentSlots(slotPositions) {
    if (!Array.isArray(slotPositions)) return;
    const restoreRotation = layoutUsesSlotRotation();
    state.tables.forEach((table, index) => {
      const slot = slotPositions[index];
      if (!slot) return;
      table.xNorm = slot.xNorm;
      table.yNorm = slot.yNorm;
      if (restoreRotation && slot.rotation != null) table.rotation = normalizeRotation(slot.rotation);
    });
  }

  function assignmentSignature(assignment) {
    return Array.isArray(assignment) ? assignment.join(',') : '';
  }

  function assignmentDifferenceRatio(a, b, movableIndexes = null) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || !a.length) return 1;
    const indexes = Array.isArray(movableIndexes) && movableIndexes.length
      ? movableIndexes
      : Array.from({ length: a.length }, (_, index) => index);
    let different = 0;
    indexes.forEach(index => { if (a[index] !== b[index]) different++; });
    return indexes.length ? different / indexes.length : 0;
  }

  function solutionQuality(solution, constraints, distanceMatrix) {
    if (!solution || !Array.isArray(solution.assignment)) return null;
    if (!constraints?.length) return null;
    const scoreInfo = calculateCost(solution.assignment, constraints, distanceMatrix);
    return scoreInfo.maxPossible
      ? Math.max(0, (1 - scoreInfo.total / scoreInfo.maxPossible) * 100)
      : 100;
  }

  function formatAlternativeQuality(value) {
    return Number(value).toLocaleString('es-ES', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
  }

  function selectDiverseAlternatives(candidates, count, studentCount) {
    const lockInfo = getAssignmentLockInfo(studentCount);
    const unique = [];
    const seen = new Set();
    [...candidates]
      .filter(candidate => candidate?.assignment)
      .sort((a, b) => (a.score ?? Infinity) - (b.score ?? Infinity))
      .forEach(candidate => {
        const signature = assignmentSignature(candidate.assignment);
        if (seen.has(signature)) return;
        seen.add(signature);
        unique.push({ ...candidate, assignment: candidate.assignment.slice() });
      });

    if (unique.length <= count) return unique;
    const selected = [unique[0]];
    const thresholds = [0.25, 0.20, 0.12, 0.01];
    for (const threshold of thresholds) {
      for (const candidate of unique) {
        if (selected.length >= count) break;
        if (selected.includes(candidate)) continue;
        const diverse = selected.every(existing =>
          assignmentDifferenceRatio(candidate.assignment, existing.assignment, lockInfo.movableStudents) >= threshold
        );
        if (diverse) selected.push(candidate);
      }
      if (selected.length >= count) break;
    }
    return selected.slice(0, count);
  }

  function renderAlternativesBar() {
    if (!elements.alternativesBar || !elements.alternativesButtons) return;
    if (!state.alternatives.length) {
      elements.alternativesBar.hidden = true;
      elements.alternativesButtons.innerHTML = '';
      return;
    }
    elements.alternativesBar.hidden = false;
    elements.alternativesButtons.innerHTML = '';
    state.alternatives.forEach((alternative, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `alternative-btn${index === state.selectedAlternativeIndex ? ' active' : ''}`;
      const label = String.fromCharCode(65 + index);
      const qualityText = Number.isFinite(alternative.quality)
        ? ` · ${formatAlternativeQuality(alternative.quality)} %`
        : '';
      button.textContent = `${label}${qualityText}`;
      button.setAttribute('aria-pressed', String(index === state.selectedAlternativeIndex));
      button.setAttribute('aria-label', `Alternativa ${label}${qualityText}`);
      button.addEventListener('click', () => applyAlternative(index));
      elements.alternativesButtons.appendChild(button);
    });
  }

  function clearAlternatives(options = {}) {
    const hadAlternatives = state.alternatives.length > 0;
    state.alternatives = [];
    state.alternativeSlotPositions = null;
    state.selectedAlternativeIndex = -1;
    state.alternativeContext = null;
    renderAlternativesBar();
    if (options.uncheck && elements.generateAlternativesCheckbox) elements.generateAlternativesCheckbox.checked = false;
    return hadAlternatives;
  }

  function setAlternatives(alternatives, slotPositions, context) {
    state.alternatives = alternatives.map(item => ({ ...item, assignment: item.assignment.slice() }));
    state.alternativeSlotPositions = slotPositions.map(position => ({ ...position }));
    state.alternativeContext = context || null;
    state.selectedAlternativeIndex = state.alternatives.length ? 0 : -1;
    renderAlternativesBar();
  }

  function renderAlternativeOutput(alternative) {
    const context = state.alternativeContext;
    if (!context || !alternative) return;
    if (context.mode === 'random') {
      hideSolution();
      renderRandomOutput();
      return;
    }
    if (context.mode === 'cooperative') {
      hideSolution();
      setOutputHtml(cooperativeABBCSummaryHtml(context.students, alternative.assignment));
      return;
    }
    renderSolution(alternative, context.constraints, context.distanceMatrix);
    renderConstraintSummary(
      context.students,
      context.constraints,
      alternative,
      context.distanceMatrix,
      context.contradictions || []
    );
  }

  function applyAlternative(index) {
    const alternative = state.alternatives[index];
    const context = state.alternativeContext;
    if (!alternative || !context || !state.alternativeSlotPositions) return;
    state.selectedAlternativeIndex = index;
    // Las puntuaciones y explicaciones se calculan siempre contra las posiciones base
    // que existían al generar las alternativas, no contra la alternativa anterior.
    restoreAssignmentSlots(state.alternativeSlotPositions);
    renderAlternativeOutput(alternative);
    applyPositionAssignment(alternative.assignment, context.students.length, state.alternativeSlotPositions);
    renderAlternativesBar();
    state.layoutActive = false;
    saveStateSoon();
  }

  function rectsOverlap(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  function zonePixelRect(zone, width = elements.classroom.clientWidth, height = elements.classroom.clientHeight) {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    const left = clamp(zone.xNorm * w, 0, w);
    const top = clamp(zone.yNorm * h, 0, h);
    const zoneWidth = clamp(zone.widthNorm * w, 0, w - left);
    const zoneHeight = clamp(zone.heightNorm * h, 0, h - top);
    return { left, top, width: zoneWidth, height: zoneHeight, right: left + zoneWidth, bottom: top + zoneHeight };
  }

  function tableRectAtPixelCenter(table, cx, cy, tableWidth = state.tableWidth, tableHeight = state.tableHeight) {
    const rotation = normalizeRotation(table?.rotation);
    const quarterTurn = rotation === 90 || rotation === 270;
    const halfW = (quarterTurn ? tableHeight : tableWidth) / 2;
    const halfH = (quarterTurn ? tableWidth : tableHeight) / 2;
    return { left: cx - halfW, top: cy - halfH, right: cx + halfW, bottom: cy + halfH, width: halfW * 2, height: halfH * 2 };
  }

  function rectOverlapsProtectedZone(rect, ignoredZoneId = null) {
    return state.zones.some(zone => zone.id !== ignoredZoneId && rectsOverlap(rect, zonePixelRect(zone)));
  }

  function tableOverlapsProtectedZoneAt(table, cx, cy, tableWidth = state.tableWidth, tableHeight = state.tableHeight) {
    return rectOverlapsProtectedZone(tableRectAtPixelCenter(table, cx, cy, tableWidth, tableHeight));
  }

  function anyTableOverlapsProtectedZone(tableWidth = state.tableWidth, tableHeight = state.tableHeight) {
    const roomWidth = Math.max(1, elements.classroom.clientWidth);
    const roomHeight = Math.max(1, elements.classroom.clientHeight);
    return state.tables.some(table => {
      const cx = table.xNorm * roomWidth;
      const cy = table.yNorm * roomHeight;
      return tableOverlapsProtectedZoneAt(table, cx, cy, tableWidth, tableHeight);
    });
  }

  function zoneRectOverlapsAnyTable(rect) {
    return state.tables.some(table => {
      const geometry = tablePixelGeometry(table);
      return rectsOverlap(rect, tableRectAtPixelCenter(table, geometry.cx, geometry.cy));
    });
  }

  function nextZoneId() {
    let id = 1;
    const used = new Set(state.zones.map(zone => zone.id));
    while (used.has(id)) id++;
    return id;
  }

  function normalizeRotation(value) {
    const rotation = ((Number(value) || 0) % 360 + 360) % 360;
    const snapped = Math.round(rotation / 90) * 90;
    return snapped === 360 ? 0 : snapped;
  }

  function tableVisualHalfExtents(table) {
    const rotation = normalizeRotation(table?.rotation);
    const quarterTurn = rotation === 90 || rotation === 270;
    return {
      halfW: (quarterTurn ? state.tableHeight : state.tableWidth) / 2,
      halfH: (quarterTurn ? state.tableWidth : state.tableHeight) / 2
    };
  }

  function shuffle(array) {
    const result = array.slice();
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function stripStudentNumber(line) {
    return line.replace(/^\s*\d+\s*[.)]\s*/, '').trim();
  }

  function numberStudentLines(value) {
    let studentNumber = 0;
    return value
      .split(/\r?\n/)
      .map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('#')) return line;
        studentNumber += 1;
        return `${studentNumber}. ${stripStudentNumber(line)}`;
      })
      .join('\n');
  }

  function studentsTextFromTemplate(students, comments) {
    const numberedStudents = students.map((name, index) => `${index + 1}. ${name}`);
    return [...comments, '', ...numberedStudents].join('\n');
  }

  function defaultStudentsText() {
    return studentsTextFromTemplate(DEFAULT_STUDENTS, DEFAULT_STUDENT_COMMENTS);
  }

  function cooperativeStudentsText() {
    return studentsTextFromTemplate(COOPERATIVE_STUDENTS, COOPERATIVE_STUDENT_COMMENTS);
  }

  function simpleStudentsText() {
    return SIMPLE_STUDENTS.map((name, index) => `${index + 1}. ${name}`).join('\n');
  }

  function normalizeExampleText(value) {
    return String(value || '').replace(/\r\n/g, '\n').trimEnd();
  }

  function detectExamplePreset(value = elements.studentsInput?.value || '') {
    const normalized = normalizeExampleText(value);
    if (normalized === normalizeExampleText(defaultStudentsText())) return 'characters';
    if (normalized === normalizeExampleText(cooperativeStudentsText())) return 'cooperative';
    if (normalized === normalizeExampleText(simpleStudentsText())) return 'simple';
    return 'custom';
  }

  function updateExampleSelect() {
    if (!elements.exampleSelect) return;
    state.examplePreset = detectExamplePreset();
    elements.exampleSelect.value = state.examplePreset;
  }

  function selectedExampleText(preset) {
    if (preset === 'characters') return defaultStudentsText();
    if (preset === 'cooperative') return cooperativeStudentsText();
    if (preset === 'simple') return simpleStudentsText();
    return null;
  }

  function loadPeopleExample(preset) {
    const nextText = selectedExampleText(preset);
    if (!nextText) {
      updateExampleSelect();
      return;
    }

    const previousPreset = detectExamplePreset();
    const currentIsCustom = previousPreset === 'custom';
    if (currentIsCustom && !window.confirm('¿Quieres sustituir la lista actual por el ejemplo seleccionado?')) {
      state.examplePreset = 'custom';
      elements.exampleSelect.value = 'custom';
      return;
    }

    clearAlternatives();
    elements.studentsInput.value = nextText;
    state.examplePreset = preset;
    elements.exampleSelect.value = preset;
    state.lastSolution = null;
    renderTables();
    hideSolution();
    updateUIState();
    setOutputHtml(
      '<div class="output-summary-head"><strong>Ejemplo cargado.</strong></div>' +
      '<div class="output-note">Se ha cargado un nuevo ejemplo. Revisa las restricciones relacionadas con grupos.</div>'
    );
    saveStateSoon();
  }

  function clearPeopleList() {
    if (!window.confirm('¿Quieres borrar completamente la lista de personas?')) return;
    clearAlternatives();

    elements.studentsInput.value = '';
    state.examplePreset = 'custom';
    if (elements.exampleSelect) elements.exampleSelect.value = 'custom';
    state.lastSolution = null;
    renderTables();
    hideSolution();
    updateUIState();
    setOutputHtml(
      '<div class="output-summary-head"><strong>Lista de personas borrada.</strong></div>' +
      '<div class="output-note">Las mesas, las restricciones y las zonas protegidas se han conservado.</div>'
    );
    saveStateSoon();
  }

  function parseStudents() {
    const students = [];
    const lines = elements.studentsInput.value.split(/\r?\n/);

    lines.forEach((sourceLine, lineIndex) => {
      const trimmed = sourceLine.trim();
      if (!trimmed || trimmed.startsWith('#')) return;

      const raw = stripStudentNumber(sourceLine);
      let fullName = raw;
      let group = null;
      let groupError = null;

      if (raw.includes('/')) {
        const groupMatch = raw.match(/^(.*?)\s*\/\s*([A-Za-z])\s*$/);
        if (groupMatch) {
          fullName = groupMatch[1].trim();
          group = groupMatch[2].toUpperCase();
        } else {
          fullName = raw.split('/')[0].trim();
          groupError = `Línea ${lineIndex + 1}: la etiqueta de grupo debe ser una única letra de A a Z.`;
        }
      }

      const commaIndex = fullName.indexOf(',');
      let surnames = '';
      let firstName = fullName;
      if (commaIndex >= 0) {
        surnames = fullName.slice(0, commaIndex).trim();
        firstName = fullName.slice(commaIndex + 1).trim();
      }

      const surnameParts = surnames.split(/\s+/).filter(Boolean);
      const initials = surnameParts.slice(0, 2)
        .map(part => `${part.charAt(0).toLocaleUpperCase('es')}.`)
        .join('');

      const displayName = initials ? `${firstName} ${initials}` : firstName;
      const id = students.length + 1;

      students.push({
        id,
        raw,
        fullName,
        firstName,
        surnames,
        displayName,
        group,
        groupError,
        sourceLine: lineIndex + 1
      });
    });

    return students;
  }

  function getStudentGroupErrors(students) {
    return students.map(student => student.groupError).filter(Boolean);
  }

  function renumberStudents() {
    const numbered = numberStudentLines(elements.studentsInput.value);
    if (numbered === elements.studentsInput.value) return;
    elements.studentsInput.value = numbered;
    onStudentsChanged();
  }

  function buildGroupMembers(students) {
    const members = new Map();
    students.forEach(student => {
      if (!student.group) return;
      if (!members.has(student.group)) members.set(student.group, []);
      members.get(student.group).push(student.id);
    });
    return members;
  }

  function parseConstraints(studentsOrCount) {
    const students = Array.isArray(studentsOrCount) ? studentsOrCount : null;
    const studentCount = students ? students.length : Number(studentsOrCount) || 0;
    const groupMembers = students ? buildGroupMembers(students) : new Map();
    const existingGroups = new Set(groupMembers.keys());
    const lines = elements.constraintsInput.value.split(/\r?\n/);
    const constraints = [];
    const errors = [];
    const seen = new Set();

    const validateGroups = (groups, lineIndex, line) => {
      const missing = groups.filter(group => !existingGroups.has(group));
      if (missing.length) {
        errors.push(`Línea ${lineIndex + 1}: grupo(s) inexistente(s): ${[...new Set(missing)].join(', ')}.`);
        return false;
      }
      return true;
    };

    lines.forEach((rawLine, lineIndex) => {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) return;

      let constraint = null;
      let match;

      if ((match = line.match(/^([A-Za-z])\s*x\s*([A-Za-z])$/))) {
        const groupA = match[1].toUpperCase();
        const groupB = match[2].toUpperCase();
        if (!validateGroups([groupA, groupB], lineIndex, line)) return;
        constraint = { type: 'groupFar', groupA, groupB, membersA: groupMembers.get(groupA), membersB: groupMembers.get(groupB), raw: line, line: lineIndex + 1 };
      } else if ((match = line.match(/^([A-Za-z])\s*--\s*([A-Za-z])$/))) {
        const groupA = match[1].toUpperCase();
        const groupB = match[2].toUpperCase();
        if (!validateGroups([groupA, groupB], lineIndex, line)) return;
        constraint = { type: 'groupNear', groupA, groupB, membersA: groupMembers.get(groupA), membersB: groupMembers.get(groupB), raw: line, line: lineIndex + 1 };
      } else if ((match = line.match(/^([A-Za-z])\s*-\s*([A-Za-z])$/))) {
        const groupA = match[1].toUpperCase();
        const groupB = match[2].toUpperCase();
        if (!validateGroups([groupA, groupB], lineIndex, line)) return;
        constraint = { type: 'groupTogether', groupA, groupB, membersA: groupMembers.get(groupA), membersB: groupMembers.get(groupB), raw: line, line: lineIndex + 1 };
      } else if ((match = line.match(/^(\d+)\s*x\s*(\d+)$/i))) {
        constraint = { type: 'far', a: Number(match[1]), b: Number(match[2]), raw: line, line: lineIndex + 1 };
      } else if ((match = line.match(/^(\d+)\s*--\s*(\d+)$/))) {
        constraint = { type: 'near', a: Number(match[1]), b: Number(match[2]), raw: line, line: lineIndex + 1 };
      } else if ((match = line.match(/^(\d+)\s*-\s*(\d+)$/))) {
        constraint = { type: 'together', a: Number(match[1]), b: Number(match[2]), raw: line, line: lineIndex + 1 };
      } else if ((match = line.match(/^([LR])\s*:\s*(.+)$/i))) {
        const values = match[2]
          .split(',')
          .map(value => value.trim())
          .filter(Boolean);

        if (!values.length) {
          errors.push(`Línea ${lineIndex + 1}: lista inválida en “${line}”.`);
          return;
        }

        const ids = [];
        const groups = [];
        for (const value of values) {
          if (/^\d+$/.test(value)) ids.push(Number(value));
          else if (/^[A-Za-z]$/.test(value)) groups.push(value.toUpperCase());
          else {
            errors.push(`Línea ${lineIndex + 1}: usa solo números de personas o letras de grupo en “${line}”.`);
            return;
          }
        }

        const duplicateIds = ids.length !== new Set(ids).size;
        const duplicateGroups = groups.length !== new Set(groups).size;
        if (duplicateIds || duplicateGroups) {
          errors.push(`Línea ${lineIndex + 1}: hay referencias repetidas en “${line}”.`);
          return;
        }
        if (!validateGroups(groups, lineIndex, line)) return;

        const invalidIds = ids.filter(id => id < 1 || id > studentCount);
        if (invalidIds.length) {
          errors.push(`Línea ${lineIndex + 1}: persona(s) inexistente(s): ${[...new Set(invalidIds)].join(', ')}.`);
          return;
        }

        const groupIds = groups.flatMap(group => groupMembers.get(group) || []);
        constraint = {
          type: match[1].toUpperCase() === 'L' ? 'left' : 'right',
          ids,
          groups,
          memberIds: [...new Set([...ids, ...groupIds])],
          raw: line,
          line: lineIndex + 1
        };
      } else if ((match = line.match(/^([FB])\s*:\s*(.+)$/i))) {
        const values = match[2]
          .split(',')
          .map(value => value.trim())
          .filter(Boolean);

        if (!values.length) {
          errors.push(`Línea ${lineIndex + 1}: lista inválida en “${line}”.`);
          return;
        }

        const allNumeric = values.every(value => /^\d+$/.test(value));
        const allGroups = values.every(value => /^[A-Za-z]$/.test(value));

        if (allNumeric) {
          const numericIds = values.map(Number);
          constraint = {
            type: match[1].toUpperCase() === 'F' ? 'front' : 'back',
            ids: numericIds,
            raw: line,
            line: lineIndex + 1
          };
        } else if (allGroups) {
          const groups = values.map(value => value.toUpperCase());
          if (new Set(groups).size !== groups.length) {
            errors.push(`Línea ${lineIndex + 1}: hay grupos repetidos en “${line}”.`);
            return;
          }
          if (!validateGroups(groups, lineIndex, line)) return;
          constraint = {
            type: match[1].toUpperCase() === 'F' ? 'groupFront' : 'groupBack',
            groups,
            groupMembers: groups.map(group => groupMembers.get(group)),
            memberIds: [...new Set(groups.flatMap(group => groupMembers.get(group)))],
            raw: line,
            line: lineIndex + 1
          };
        } else {
          errors.push(`Línea ${lineIndex + 1}: usa solo números de personas o solo letras de grupo en “${line}”.`);
          return;
        }
      } else {
        errors.push(`Línea ${lineIndex + 1}: sintaxis no reconocida “${line}”.`);
        return;
      }

      if (constraint.ids) {
        const invalidIds = constraint.ids.filter(id => id < 1 || id > studentCount);
        if (invalidIds.length) {
          errors.push(`Línea ${lineIndex + 1}: persona(s) inexistente(s): ${[...new Set(invalidIds)].join(', ')}.`);
          return;
        }
      } else if ('a' in constraint) {
        const invalidIds = [constraint.a, constraint.b].filter(id => id < 1 || id > studentCount);
        if (invalidIds.length) {
          errors.push(`Línea ${lineIndex + 1}: persona(s) inexistente(s): ${[...new Set(invalidIds)].join(', ')}.`);
          return;
        }
        if (constraint.a === constraint.b) {
          errors.push(`Línea ${lineIndex + 1}: una restricción binaria necesita dos personas distintas.`);
          return;
        }
      }

      const normalizedKey = normalizeConstraintKey(constraint);
      if (seen.has(normalizedKey)) {
        errors.push(`Línea ${lineIndex + 1}: restricción duplicada “${line}”.`);
        return;
      }
      seen.add(normalizedKey);
      constraints.push(constraint);
    });

    return { constraints, errors };
  }

  function normalizeConstraintKey(c) {
    if (c.type === 'left' || c.type === 'right') {
      return `${c.type}:ids=${c.ids.slice().sort((a, b) => a - b).join(',')};groups=${c.groups.slice().sort().join(',')}`;
    }
    if (c.type === 'groupFront') {
      return `${c.type}:${c.groups.slice().sort().join(',')}`;
    }
    if (c.type === 'groupBack') {
      return `${c.type}:${c.groups.join(',')}`;
    }
    if (c.type === 'groupFar' || c.type === 'groupTogether' || c.type === 'groupNear') {
      const pair = [c.groupA, c.groupB].sort();
      return `${c.type}:${pair[0]}:${pair[1]}`;
    }
    if (c.ids) {
      return `${c.type}:${c.ids.slice().sort((a, b) => a - b).join(',')}`;
    }
    const pair = [c.a, c.b].sort((a, b) => a - b);
    return `${c.type}:${pair[0]}:${pair[1]}`;
  }

  function findContradictions(constraints) {
    const pairTypes = new Map();
    const groupPairTypes = new Map();
    const warnings = [];

    for (const c of constraints) {
      if ('a' in c) {
        const [a, b] = [c.a, c.b].sort((x, y) => x - y);
        const key = `${a}:${b}`;
        if (!pairTypes.has(key)) pairTypes.set(key, new Set());
        pairTypes.get(key).add(c.type);
      }
      if (c.groupA && c.groupB) {
        const [a, b] = [c.groupA, c.groupB].sort();
        const key = `${a}:${b}`;
        if (!groupPairTypes.has(key)) groupPairTypes.set(key, new Set());
        groupPairTypes.get(key).add(c.type);
      }
    }

    for (const [key, types] of pairTypes.entries()) {
      if (types.has('far') && (types.has('together') || types.has('near'))) {
        warnings.push(`Las personas ${key.replace(':', ' y ')} tienen restricciones de separación y proximidad simultáneas.`);
      }
    }

    for (const [key, types] of groupPairTypes.entries()) {
      if (types.has('groupFar') && (types.has('groupTogether') || types.has('groupNear'))) {
        const [a, b] = key.split(':');
        warnings.push(a === b
          ? `El grupo ${a} tiene restricciones internas de separación y proximidad simultáneas.`
          : `Los grupos ${a} y ${b} tienen restricciones de separación y proximidad simultáneas.`);
      }
    }

    const fronts = new Set();
    const backs = new Set();
    const groupFronts = new Set();
    const groupBacks = new Set();
    constraints.forEach(c => {
      if (c.type === 'front') c.ids.forEach(id => fronts.add(id));
      if (c.type === 'back') c.ids.forEach(id => backs.add(id));
      if (c.type === 'groupFront') c.groups.forEach(group => groupFronts.add(group));
      if (c.type === 'groupBack') c.groups.forEach(group => groupBacks.add(group));
    });
    [...fronts].filter(id => backs.has(id)).forEach(id => {
      warnings.push(`La persona ${id} aparece a la vez en DELANTE y DETRÁS.`);
    });
    [...groupFronts].filter(group => groupBacks.has(group)).forEach(group => {
      warnings.push(`El grupo ${group} aparece a la vez en DELANTE y DETRÁS.`);
    });

    const leftMembers = new Set();
    const rightMembers = new Set();
    constraints.forEach(c => {
      if (c.type === 'left') c.memberIds.forEach(id => leftMembers.add(id));
      if (c.type === 'right') c.memberIds.forEach(id => rightMembers.add(id));
    });
    [...leftMembers].filter(id => rightMembers.has(id)).forEach(id => {
      warnings.push(`La persona ${id} aparece a la vez en IZQUIERDA y DERECHA.`);
    });

    return warnings;
  }

  function makeInitialTables() {
    state.tables = [];
    state.cooperativeBlockPositions = [];
    state.zones = [];
    state.selectedZoneId = null;
    state.zoneMode = false;
    state.zoneDraft = null;
    state.zoneDragging = null;
    state.selectedTableId = null;
    state.selectedTableIds.clear();
    state.tableWidth = INITIAL_TABLE_WIDTH;
    state.tableHeight = INITIAL_TABLE_HEIGHT;
    state.spaceLayout = DEFAULT_SPACE_LAYOUT;
    state.layoutActive = true;

    for (let i = 0; i < INITIAL_TABLE_COUNT; i++) {
      const row = Math.floor(i / INITIAL_COLS);
      const col = i % INITIAL_COLS;
      state.tables.push({
        id: i + 1,
        xNorm: (col + 0.5) / INITIAL_COLS,
        yNorm: (row + 0.5) / INITIAL_ROWS,
        rotation: 0,
        locked: false
      });
    }
  }

  function sortedTables() {
    return state.tables.slice().sort((a, b) => a.id - b.id);
  }

  function setTablePixelCenter(table, cx, cy, roomWidth, roomHeight) {
    const { halfW, halfH } = tableVisualHalfExtents(table);
    const safeX = clamp(cx, halfW, Math.max(halfW, roomWidth - halfW));
    const safeY = clamp(cy, halfH, Math.max(halfH, roomHeight - halfH));
    table.xNorm = roomWidth ? safeX / roomWidth : 0.5;
    table.yNorm = roomHeight ? safeY / roomHeight : 0.5;
  }

  function buildShapeGroup(tables, cols, innerGapX = 1, innerGapY = 1) {
    const placements = tables.map((table, index) => ({
      table,
      col: index % cols,
      row: Math.floor(index / cols)
    }));
    const usedCols = placements.length ? Math.max(...placements.map(item => item.col)) + 1 : 1;
    const usedRows = placements.length ? Math.max(...placements.map(item => item.row)) + 1 : 1;
    return {
      placements,
      width: usedCols * state.tableWidth + Math.max(0, usedCols - 1) * innerGapX,
      height: usedRows * state.tableHeight + Math.max(0, usedRows - 1) * innerGapY,
      innerGapX,
      innerGapY
    };
  }

  function buildTeam5Group(tables) {
    // La orientación es parte del esquema, no de la identidad de la mesa.
    // Las posiciones normales quedan a 0° y solo la quinta posición de cada
    // equipo completo queda girada 90° mirando hacia el bloque de cuatro.
    tables.forEach(table => { table.rotation = 0; });
    if (tables.length < 5) return buildShapeGroup(tables, 2, 1, 1);

    const innerGap = 1;
    const sideGap = 2;
    const team4Width = state.tableWidth * 2 + innerGap;
    const team4Height = state.tableHeight * 2 + innerGap;
    const fifth = tables[4];
    fifth.rotation = 90;

    const fifthWidth = state.tableHeight;
    const fifthHeight = state.tableWidth;
    const groupHeight = Math.max(team4Height, fifthHeight);
    const team4Top = (groupHeight - team4Height) / 2;
    const placements = tables.slice(0, 4).map((table, index) => ({
      table,
      centerX: (index % 2) * (state.tableWidth + innerGap) + state.tableWidth / 2,
      centerY: team4Top + Math.floor(index / 2) * (state.tableHeight + innerGap) + state.tableHeight / 2
    }));

    placements.push({
      table: fifth,
      centerX: team4Width + sideGap + fifthWidth / 2,
      centerY: groupHeight / 2
    });

    return {
      placements,
      width: team4Width + sideGap + fifthWidth,
      height: groupHeight,
      innerGapX: innerGap,
      innerGapY: innerGap
    };
  }

  function chunkTables(tables, size) {
    const chunks = [];
    for (let i = 0; i < tables.length; i += size) chunks.push(tables.slice(i, i + size));
    return chunks;
  }

  function buildPattern232Groups(tables) {
    const groups = [];
    let index = 0;
    while (tables.length - index >= 7) {
      for (const size of [2, 3, 2]) {
        groups.push(buildShapeGroup(tables.slice(index, index + size), size, 1, 1));
        index += size;
      }
    }
    const remaining = tables.length - index;
    const remainderPatterns = { 1: [1], 2: [2], 3: [3], 4: [2, 2], 5: [2, 3], 6: [3, 3] };
    for (const size of remainderPatterns[remaining] || []) {
      groups.push(buildShapeGroup(tables.slice(index, index + size), size, 1, 1));
      index += size;
    }
    return groups;
  }

  function packGroupsIntoRows(groups, availableWidth, gapX) {
    const rows = [];
    let row = [];
    let rowWidth = 0;
    for (const group of groups) {
      const nextWidth = row.length ? rowWidth + gapX + group.width : group.width;
      if (row.length && nextWidth > availableWidth) {
        rows.push(row);
        row = [group];
        rowWidth = group.width;
      } else {
        row.push(group);
        rowWidth = nextWidth;
      }
    }
    if (row.length) rows.push(row);
    return rows;
  }

  function measureRows(rows, gapX) {
    return rows.map(row => ({
      groups: row,
      width: row.reduce((sum, group) => sum + group.width, 0) + Math.max(0, row.length - 1) * gapX,
      height: Math.max(...row.map(group => group.height), state.tableHeight)
    }));
  }

  function groupPlacementRects(group, left, top) {
    return group.placements.map(placement => {
      const cx = left + (Number.isFinite(placement.centerX)
        ? placement.centerX
        : placement.col * (state.tableWidth + group.innerGapX) + state.tableWidth / 2);
      const cy = top + (Number.isFinite(placement.centerY)
        ? placement.centerY
        : placement.row * (state.tableHeight + group.innerGapY) + state.tableHeight / 2);
      return { table: placement.table, cx, cy, rect: tableRectAtPixelCenter(placement.table, cx, cy) };
    });
  }

  function groupPlacementIsValid(group, left, top, roomWidth, roomHeight, placedRects = []) {
    const candidates = groupPlacementRects(group, left, top);
    for (const candidate of candidates) {
      const rect = candidate.rect;
      if (rect.left < 0 || rect.top < 0 || rect.right > roomWidth || rect.bottom > roomHeight) return false;
      if (rectOverlapsProtectedZone(rect)) return false;
      if (placedRects.some(other => rectsOverlap(rect, other))) return false;
    }
    return true;
  }

  function findValidGroupPlacement(group, preferredLeft, preferredTop, roomWidth, roomHeight, placedRects = []) {
    if (groupPlacementIsValid(group, preferredLeft, preferredTop, roomWidth, roomHeight, placedRects)) {
      return { left: preferredLeft, top: preferredTop };
    }

    const step = 10;
    const maxLeft = Math.max(0, roomWidth - group.width);
    const maxTop = Math.max(0, roomHeight - group.height);
    const xs = [];
    for (let x = 0; x <= maxLeft + 0.1; x += step) xs.push(Math.min(x, maxLeft));
    if (!xs.includes(maxLeft)) xs.push(maxLeft);
    xs.sort((a, b) => Math.abs(a - preferredLeft) - Math.abs(b - preferredLeft));

    const ys = [];
    for (let y = 0; y <= maxTop + 0.1; y += step) ys.push(Math.min(y, maxTop));
    if (!ys.includes(maxTop)) ys.push(maxTop);
    ys.sort((a, b) => {
      const aBehind = a >= preferredTop ? 0 : 1;
      const bBehind = b >= preferredTop ? 0 : 1;
      return aBehind - bBehind || Math.abs(a - preferredTop) - Math.abs(b - preferredTop);
    });

    for (const y of ys) {
      for (const x of xs) {
        if (groupPlacementIsValid(group, x, y, roomWidth, roomHeight, placedRects)) return { left: x, top: y };
      }
    }
    return null;
  }

  function placeGroupedLayout(groups, options = {}) {
    const roomWidth = Math.max(1, elements.classroom.clientWidth);
    const roomHeight = Math.max(1, elements.classroom.clientHeight);
    const marginX = Math.max(8, Math.min(32, roomWidth * 0.025));
    const marginY = Math.max(6, Math.min(14, roomHeight * 0.012));
    const availableWidth = Math.max(state.tableWidth, roomWidth - marginX * 2);
    const availableHeight = Math.max(state.tableHeight, roomHeight - marginY * 2);
    const preferredGapX = options.groupGapX ?? 38;
    const minGapX = options.minGroupGapX ?? 10;
    const preferredRowGap = options.rowGap ?? 28;
    const minRowGap = options.minRowGap ?? 6;
    const gapCandidates = [...new Set([
      preferredGapX,
      Math.round(preferredGapX * 0.78),
      Math.round(preferredGapX * 0.55),
      minGapX
    ].map(value => Math.max(minGapX, value)))].sort((a, b) => b - a);

    let chosen = null;
    for (const gapX of gapCandidates) {
      const packed = measureRows(packGroupsIntoRows(groups, availableWidth, gapX), gapX);
      const rowHeights = packed.reduce((sum, row) => sum + row.height, 0);
      const maxRowGap = packed.length > 1 ? (availableHeight - rowHeights) / (packed.length - 1) : preferredRowGap;
      const rowGap = packed.length > 1 ? Math.min(preferredRowGap, maxRowGap) : 0;
      chosen = { rows: packed, gapX, rowGap: Math.max(0, rowGap), rowHeights };
      if (rowHeights + Math.max(0, rowGap) * Math.max(0, packed.length - 1) <= availableHeight + 0.5 && rowGap >= minRowGap) break;
    }
    if (!chosen || !chosen.rows.length) return;

    const placedRects = [];
    let y = marginY;
    for (const row of chosen.rows) {
      let x = marginX + Math.max(0, (availableWidth - row.width) / 2);
      for (const group of row.groups) {
        const preferredTop = y + (row.height - group.height) / 2;
        const target = findValidGroupPlacement(group, x, preferredTop, roomWidth, roomHeight, placedRects);
        group._layoutPlaced = Boolean(target);
        if (target) {
          const placements = groupPlacementRects(group, target.left, target.top);
          placements.forEach(item => {
            setTablePixelCenter(item.table, item.cx, item.cy, roomWidth, roomHeight);
            placedRects.push(item.rect);
          });
        } else {
          // Si el bloque no cabe sin invadir una zona, se conserva en su última posición válida.
          group.placements.forEach(placement => {
            const geometry = tablePixelGeometry(placement.table);
            placedRects.push(tableRectAtPixelCenter(placement.table, geometry.cx, geometry.cy));
          });
        }
        x += group.width + chosen.gapX;
      }
      y += row.height + chosen.rowGap;
    }
  }

  function captureCooperativeBlockPositions(groups) {
    state.cooperativeBlockPositions = groups
      .filter(group => group.placements.length === 4 && group._layoutPlaced !== false)
      .map(group => group.placements
        .slice()
        .sort((a, b) => (a.row - b.row) || (a.col - b.col))
        .map(placement => ({ xNorm: placement.table.xNorm, yNorm: placement.table.yNorm })));
  }

  function generateCooperativeABBCAssignment(students, options = {}) {
    const studentCount = students.length;
    if (!studentCount || studentCount > state.tables.length) return null;
    const tableIds = new Set(state.tables.map(table => table.id));
    if (students.some(student => !tableIds.has(student.id))) return null;

    const blocks = resolveCooperativeBlocksToSlots();
    if (!blocks.length) return null;
    const lockInfo = getAssignmentLockInfo(studentCount);
    const assignment = Array(studentCount).fill(null);
    const fixedBySlot = new Map();
    for (const [studentIndex, slotIndex] of lockInfo.fixedAssignments) {
      assignment[studentIndex] = slotIndex;
      fixedBySlot.set(slotIndex, studentIndex);
    }

    const availableStudents = new Set(lockInfo.movableStudents);
    const freeSlots = new Set(lockInfo.availableSlots);
    const pools = new Map();
    students.forEach((student, index) => {
      if (!availableStudents.has(index)) return;
      const group = student.group || '';
      if (!pools.has(group)) pools.set(group, []);
      pools.get(group).push(index);
    });
    if (options.shufflePools) {
      for (const [group, pool] of pools) pools.set(group, shuffle(pool));
    }

    const takeStudent = group => {
      const pool = pools.get(group) || [];
      while (pool.length) {
        const studentIndex = pool.shift();
        if (availableStudents.has(studentIndex)) {
          availableStudents.delete(studentIndex);
          return studentIndex;
        }
      }
      return null;
    };

    const expected = ['A', 'B', 'B', 'C'];
    const blockPlans = blocks.map(block => {
      const counts = { A: 0, B: 0, C: 0 };
      let incompatible = false;
      let fixedCount = 0;
      block.forEach(slot => {
        const studentIndex = fixedBySlot.get(slot);
        if (studentIndex == null) return;
        fixedCount++;
        const group = students[studentIndex]?.group;
        if (!(group in counts)) incompatible = true;
        else counts[group]++;
      });
      if (counts.A > 1 || counts.B > 2 || counts.C > 1) incompatible = true;
      return { block, counts, incompatible, fixedCount };
    }).sort((a, b) => Number(a.incompatible) - Number(b.incompatible) || b.fixedCount - a.fixedCount);

    const canSupply = needs => ['A', 'B', 'C'].every(group => {
      const pool = pools.get(group) || [];
      const count = pool.reduce((sum, studentIndex) => sum + Number(availableStudents.has(studentIndex)), 0);
      return count >= needs[group];
    });

    const fillCompleteBlock = plan => {
      if (plan.incompatible) return false;
      const needs = { A: 1 - plan.counts.A, B: 2 - plan.counts.B, C: 1 - plan.counts.C };
      if (!canSupply(needs)) return false;
      const emptySlots = plan.block.filter(slot => freeSlots.has(slot));

      // Prioridad secundaria: A B / B C, sin sacrificar la composición del equipo.
      for (let position = 0; position < plan.block.length; position++) {
        const slot = plan.block[position];
        const group = expected[position];
        if (!freeSlots.has(slot) || needs[group] <= 0) continue;
        const studentIndex = takeStudent(group);
        if (studentIndex == null) continue;
        assignment[studentIndex] = slot;
        freeSlots.delete(slot);
        needs[group]--;
      }

      for (const group of ['A', 'B', 'C']) {
        while (needs[group] > 0) {
          const slot = emptySlots.find(candidate => freeSlots.has(candidate));
          const studentIndex = takeStudent(group);
          if (slot == null || studentIndex == null) return false;
          assignment[studentIndex] = slot;
          freeSlots.delete(slot);
          needs[group]--;
        }
      }
      return true;
    };

    // Completar primero los equipos que ya contienen personas bloqueadas compatibles.
    blockPlans.forEach(fillCompleteBlock);

    // En bloques incompletos, usar las posiciones preferidas cuando todavía haya grupos A/B/C disponibles.
    for (const plan of blockPlans) {
      for (let position = 0; position < plan.block.length; position++) {
        const slot = plan.block[position];
        if (!freeSlots.has(slot)) continue;
        const studentIndex = takeStudent(expected[position]);
        if (studentIndex == null) continue;
        assignment[studentIndex] = slot;
        freeSlots.delete(slot);
      }
    }

    // El resto de personas ocupa las posiciones libres sin modificar sus grupos.
    const remainingStudents = [...availableStudents];
    const remainingSlots = [...freeSlots];
    remainingStudents.forEach((studentIndex, index) => {
      const slot = remainingSlots[index];
      if (slot == null) return;
      assignment[studentIndex] = slot;
      availableStudents.delete(studentIndex);
      freeSlots.delete(slot);
    });

    return assignment.every(slot => slot != null) ? assignment : null;
  }

  function cooperativeABBCSummaryHtml(students, assignment) {
    const constraint = buildCooperativeABBCConstraint(students);
    if (!constraint || !assignment) {
      return '<div class="output-summary-head"><strong>Esquema Cooperativo ABBC aplicado.</strong></div>' +
        '<div class="output-note">No hay suficientes datos para evaluar equipos A-B-B-C completos.</div>';
    }
    const evaluation = evaluateCooperativeABBC(constraint, assignment);
    const included = evaluation.completeCount * 4;
    const outside = Math.max(0, students.length - included);
    const details = [
      `<div class="output-summary-head"><strong>Esquema Cooperativo ABBC aplicado.</strong></div>`,
      `<div class="output-note">${evaluation.completeCount} equipo(s) completo(s) A-B-B-C${constraint.targetComplete ? ` de un máximo posible de ${constraint.targetComplete}` : ''}.</div>`
    ];
    if (outside) details.push(`<div class="output-note">${outside} persona(s) no forman parte de un equipo ABBC completo.</div>`);
    return details.join('');
  }

  function placeCircularLayout(tables) {
    const roomWidth = Math.max(1, elements.classroom.clientWidth);
    const roomHeight = Math.max(1, elements.classroom.clientHeight);
    const centerX = roomWidth / 2;
    const centerY = roomHeight / 2;
    const gap = 10;
    const rx = Math.max(state.tableWidth / 2, roomWidth / 2 - state.tableWidth / 2 - 24);
    const ry = Math.max(state.tableHeight / 2, roomHeight / 2 - state.tableHeight / 2 - 24);
    const positions = [];
    const canPlace = (x, y) => {
      const table = tables[Math.min(positions.length, tables.length - 1)] || { rotation: 0 };
      const rect = tableRectAtPixelCenter(table, x, y);
      if (rect.left < 0 || rect.right > roomWidth || rect.top < 0 || rect.bottom > roomHeight) return false;
      if (rectOverlapsProtectedZone(rect)) return false;
      return positions.every(position => (
        Math.abs(x - position.x) >= state.tableWidth + gap ||
        Math.abs(y - position.y) >= state.tableHeight + gap
      ));
    };

    const ringFactors = [1, 0.86, 0.72, 0.58, 0.44, 0.30, 0.16];
    for (let ringIndex = 0; ringIndex < ringFactors.length && positions.length < tables.length; ringIndex++) {
      const factor = ringFactors[ringIndex];
      const samples = 240;
      const phase = -Math.PI / 2 + (ringIndex % 2 ? Math.PI / 40 : 0);
      for (let i = 0; i < samples && positions.length < tables.length; i++) {
        const angle = phase + (Math.PI * 2 * i) / samples;
        const x = centerX + rx * factor * Math.cos(angle);
        const y = centerY + ry * factor * Math.sin(angle);
        if (canPlace(x, y)) positions.push({ x, y });
      }
    }

    if (positions.length < tables.length) {
      const stepX = state.tableWidth + gap;
      const stepY = state.tableHeight + gap;
      for (let y = state.tableHeight / 2 + gap / 2; y <= roomHeight - state.tableHeight / 2 && positions.length < tables.length; y += stepY) {
        for (let x = state.tableWidth / 2 + gap / 2; x <= roomWidth - state.tableWidth / 2 && positions.length < tables.length; x += stepX) {
          const ellipseValue = Math.pow((x - centerX) / rx, 2) + Math.pow((y - centerY) / ry, 2);
          if (ellipseValue <= 0.92 && canPlace(x, y)) positions.push({ x, y });
        }
      }
    }

    if (positions.length < tables.length) {
      const candidates = [];
      const stepX = state.tableWidth + 4;
      const stepY = state.tableHeight + 4;
      for (let y = state.tableHeight / 2; y <= roomHeight - state.tableHeight / 2; y += stepY) {
        for (let x = state.tableWidth / 2; x <= roomWidth - state.tableWidth / 2; x += stepX) {
          candidates.push({ x, y });
        }
      }
      candidates.sort((a, b) => {
        const da = Math.pow((a.x - centerX) / rx, 2) + Math.pow((a.y - centerY) / ry, 2);
        const db = Math.pow((b.x - centerX) / rx, 2) + Math.pow((b.y - centerY) / ry, 2);
        return da - db;
      });
      for (const candidate of candidates) {
        if (positions.length >= tables.length) break;
        if (canPlace(candidate.x, candidate.y)) positions.push(candidate);
      }
    }

    tables.forEach((table, index) => {
      const position = positions[index];
      if (position) setTablePixelCenter(table, position.x, position.y, roomWidth, roomHeight);
    });
  }

  function markManualLayout(options = {}) {
    state.spaceLayout = 'manual';
    state.layoutActive = false;
    if (elements.layoutSelect) elements.layoutSelect.value = 'manual';
    if (options.save) saveStateSoon();
  }

  function applySpaceLayout(layoutName, options = {}) {
    const allowed = Object.keys(SPACE_LAYOUT_LABELS);
    const layout = allowed.includes(layoutName) ? layoutName : DEFAULT_SPACE_LAYOUT;

    if (layout === 'manual') {
      clearAlternatives();
      markManualLayout();
      if (options.message !== false) showMessage('Esquema “Manual” seleccionado. Las mesas no se han movido.', 'info');
      if (options.save !== false) saveStateSoon();
      return;
    }

    const tables = sortedTables();
    if (!tables.length) return;
    clearAlternatives();

    // Cada esquema automático debe imponer por completo su geometría. Partimos
    // de la orientación base (0°) para eliminar rotaciones residuales del esquema
    // anterior; los esquemas que necesiten otra orientación (como Equipos x5)
    // la establecen después al construir sus propios slots.
    tables.forEach(table => { table.rotation = 0; });

    const lockedPositions = new Map(
      tables.filter(table => table.locked).map(table => [table.id, { xNorm: table.xNorm, yNorm: table.yNorm }])
    );
    state.spaceLayout = layout;
    state.layoutActive = true;
    if (elements.layoutSelect) elements.layoutSelect.value = layout;

    let placedGroups = [];
    if (layout === 'circular') {
      placeCircularLayout(tables);
      state.cooperativeBlockPositions = [];
    } else {
      let groups = [];
      let config = {};
      if (layout === 'individual') {
        groups = chunkTables(tables, 2).map(chunk => buildShapeGroup(chunk, 2, 16, 1));
        config = { groupGapX: 48, minGroupGapX: 8, rowGap: 24, minRowGap: 8 };
      } else if (layout === 'pairs') {
        groups = chunkTables(tables, 2).map(chunk => buildShapeGroup(chunk, 2, 1, 1));
        config = { groupGapX: 40, minGroupGapX: 12, rowGap: 26, minRowGap: 8 };
      } else if (layout === 'trios') {
        groups = chunkTables(tables, 3).map(chunk => buildShapeGroup(chunk, 3, 1, 1));
        config = { groupGapX: 46, minGroupGapX: 10, rowGap: 24, minRowGap: 6 };
      } else if (layout === 'two-three-two') {
        groups = buildPattern232Groups(tables);
        config = { groupGapX: 44, minGroupGapX: 10, rowGap: 24, minRowGap: 6 };
      } else if (layout === 'team4' || layout === 'cooperative-abbc') {
        groups = chunkTables(tables, 4).map(chunk => buildShapeGroup(chunk, 2, 1, 1));
        config = { groupGapX: 42, minGroupGapX: 12, rowGap: 34, minRowGap: 8 };
      } else if (layout === 'team5') {
        groups = chunkTables(tables, 5).map(chunk => buildTeam5Group(chunk));
        config = { groupGapX: 38, minGroupGapX: 10, rowGap: 30, minRowGap: 7 };
      } else if (layout === 'team6') {
        groups = chunkTables(tables, 6).map(chunk => buildShapeGroup(chunk, 3, 1, 1));
        config = { groupGapX: 44, minGroupGapX: 12, rowGap: 34, minRowGap: 8 };
      }
      placeGroupedLayout(groups, config);
      placedGroups = groups;
    }

    for (const table of tables) {
      const locked = lockedPositions.get(table.id);
      if (!locked) continue;
      table.xNorm = locked.xNorm;
      table.yNorm = locked.yNorm;
    }

    if (layout === 'cooperative-abbc') {
      // Guardamos las cuatro posiciones de cada equipo después de respetar las mesas bloqueadas.
      captureCooperativeBlockPositions(placedGroups);
      const students = parseStudents();
      const slotPositions = captureAssignmentSlots();
      if (alternativesEnabled() && options.message !== false) {
        const cooperativeConstraint = buildCooperativeABBCConstraint(students);
        const distanceMatrix = calculateDistanceMatrix();
        const candidates = [];
        const seen = new Set();
        for (let attempt = 0; attempt < 18 && candidates.length < 8; attempt++) {
          const assignment = generateCooperativeABBCAssignment(students, { shufflePools: true });
          if (!assignment) continue;
          const signature = assignmentSignature(assignment);
          if (seen.has(signature)) continue;
          seen.add(signature);
          const score = cooperativeConstraint ? calculateCost(assignment, [cooperativeConstraint], distanceMatrix).total : 0;
          candidates.push({ assignment, score, evaluated: 1 });
        }
        const alternatives = selectDiverseAlternatives(candidates, 3, students.length).map(candidate => ({
          ...candidate,
          quality: cooperativeConstraint ? solutionQuality(candidate, [cooperativeConstraint], distanceMatrix) : null
        }));
        if (alternatives.length) {
          setAlternatives(alternatives, slotPositions, { mode: 'cooperative', students });
          applyAlternative(0);
        } else {
          clearAlternatives();
          setOutputHtml(
            '<div class="output-summary-head"><strong>Esquema Cooperativo ABBC aplicado.</strong></div>' +
            '<div class="output-note">Se ha creado la disposición física en equipos de cuatro, pero no ha sido posible completar la asignación ABBC con el estado actual.</div>'
          );
        }
      } else {
        clearAlternatives();
        const assignment = generateCooperativeABBCAssignment(students);
        if (assignment) {
          const summaryHtml = cooperativeABBCSummaryHtml(students, assignment);
          applyPositionAssignment(assignment, students.length, slotPositions);
          setOutputHtml(summaryHtml);
        } else {
          setOutputHtml(
            '<div class="output-summary-head"><strong>Esquema Cooperativo ABBC aplicado.</strong></div>' +
            '<div class="output-note">Se ha creado la disposición física en equipos de cuatro, pero no ha sido posible completar la asignación ABBC con el estado actual.</div>'
          );
        }
      }
    } else {
      clearAlternatives();
      state.cooperativeBlockPositions = [];
    }

    state.selectedTableId = null;
    state.selectedTableIds.clear();
    state.layoutActive = true;
    state.lastSolution = null;
    elements.solutionPanel.hidden = true;
    elements.solutionPanel.innerHTML = '';
    if (layout !== 'cooperative-abbc') resetOutput();
    renderTables();
    updateDeleteButton();
    if (options.message !== false) {
      if (layout === 'cooperative-abbc') {
        showMessage('Esquema “Cooperativo ABBC” aplicado: equipos de cuatro con composición A-B-B-C cuando es posible.', 'success');
      } else {
        showMessage(`Esquema “${SPACE_LAYOUT_LABELS[layout]}” aplicado. Solo se han cambiado las posiciones de las mesas.`, 'success');
      }
    }
    if (options.save !== false) saveStateSoon();
    if (options.scroll !== false && options.message !== false) scrollToPageTopSoon(POST_PROGRESS_SCROLL_DELAY_MS);
  }

  function tablePixelGeometry(table) {
    const width = elements.classroom.clientWidth;
    const height = elements.classroom.clientHeight;
    const { halfW: visualHalfW, halfH: visualHalfH } = tableVisualHalfExtents(table);
    const cx = clamp(table.xNorm * width, visualHalfW, Math.max(visualHalfW, width - visualHalfW));
    const cy = clamp(table.yNorm * height, visualHalfH, Math.max(visualHalfH, height - visualHalfH));
    return {
      cx,
      cy,
      left: cx - state.tableWidth / 2,
      top: cy - state.tableHeight / 2
    };
  }

  function clearConstraintRelatedHighlights() {
    elements.classroom?.querySelectorAll('.constraint-related, .constraint-source').forEach(node => {
      node.classList.remove('constraint-related', 'constraint-source');
    });
  }

  function clearConstraintRelationLines() {
    elements.classroom?.querySelector('.constraint-relations-layer')?.remove();
  }

  function hideTableTooltip() {
    clearTimeout(state.tooltipTimer);
    state.tooltipTimer = null;
    clearConstraintRelatedHighlights();
    clearConstraintRelationLines();
    if (elements.tableTooltip) {
      elements.tableTooltip.hidden = true;
      elements.tableTooltip.replaceChildren();
    }
  }

  function tooltipInteractionInProgress() {
    return Boolean(state.dragging || state.marquee || state.zoneMode || state.zoneDraft || state.zoneDragging);
  }

  function readableStudentName(student) {
    if (!student) return '';
    return student.surnames ? `${student.firstName} ${student.surnames}`.trim() : student.fullName;
  }

  function buildStudentConstraintContext(student, students) {
    const parsed = parseConstraints(students);
    const studentMap = new Map(students.map(item => [item.id, item]));
    const items = [];
    const seenMessages = new Set();
    const relatedIds = new Set();
    const directRelations = [];
    const seenDirectRelations = new Set();

    const addItem = (text, ids = []) => {
      if (!text || seenMessages.has(text)) return;
      seenMessages.add(text);
      items.push(text);
      ids.forEach(id => {
        if (id !== student.id) relatedIds.add(id);
      });
    };

    const addDirectRelation = (otherId, relationType) => {
      if (!otherId || otherId === student.id) return;
      const visualType = relationType === 'far' ? 'far' : 'near';
      const key = `${otherId}:${visualType}`;
      if (seenDirectRelations.has(key)) return;
      seenDirectRelations.add(key);
      directRelations.push({ otherId, visualType });
    };

    const individualText = {
      far: other => `Debe estar lejos de ${readableStudentName(other)}`,
      together: other => `Debe estar cerca de ${readableStudentName(other)}`,
      near: other => `Debe permanecer relativamente cerca de ${readableStudentName(other)}`
    };

    const groupText = {
      groupFar: (group, same) => same
        ? `Debe mantener distancia con las demás personas del grupo ${group}`
        : `Debe mantener distancia con las personas del grupo ${group}`,
      groupTogether: (group, same) => same
        ? `Debe estar cerca de las demás personas del grupo ${group}`
        : `Debe estar cerca de las personas del grupo ${group}`,
      groupNear: (group, same) => same
        ? `Debe permanecer relativamente cerca de las demás personas del grupo ${group}`
        : `Debe permanecer relativamente cerca de las personas del grupo ${group}`
    };

    for (const constraint of parsed.constraints) {
      if (constraint.type === 'far' || constraint.type === 'together' || constraint.type === 'near') {
        if (constraint.a !== student.id && constraint.b !== student.id) continue;
        const otherId = constraint.a === student.id ? constraint.b : constraint.a;
        const other = studentMap.get(otherId);
        if (other) {
          addItem(individualText[constraint.type](other), [otherId]);
          addDirectRelation(otherId, constraint.type);
        }
        continue;
      }

      if (constraint.type === 'groupFar' || constraint.type === 'groupTogether' || constraint.type === 'groupNear') {
        if (!student.group) continue;
        const sameGroup = constraint.groupA === constraint.groupB;
        if (sameGroup) {
          if (student.group !== constraint.groupA) continue;
          addItem(groupText[constraint.type](constraint.groupA, true));
          continue;
        }

        if (student.group === constraint.groupA) {
          addItem(groupText[constraint.type](constraint.groupB, false));
        } else if (student.group === constraint.groupB) {
          addItem(groupText[constraint.type](constraint.groupA, false));
        }
        continue;
      }

      if ((constraint.type === 'left' || constraint.type === 'right') && constraint.memberIds?.includes(student.id)) {
        addItem(constraint.type === 'left' ? 'Debe situarse hacia la izquierda' : 'Debe situarse hacia la derecha');
        continue;
      }

      if ((constraint.type === 'front' || constraint.type === 'back') && constraint.ids?.includes(student.id)) {
        addItem(constraint.type === 'front' ? 'Debe situarse hacia delante' : 'Debe situarse hacia detrás');
        continue;
      }

      if ((constraint.type === 'groupFront' || constraint.type === 'groupBack') && constraint.memberIds?.includes(student.id)) {
        addItem(constraint.type === 'groupFront' ? 'Debe situarse hacia delante' : 'Debe situarse hacia detrás');
      }
    }

    return { items, relatedIds: [...relatedIds], directRelations };
  }

  function renderTableTooltip(student, context) {
    if (!elements.tableTooltip) return;
    elements.tableTooltip.replaceChildren();

    const title = document.createElement('div');
    title.className = 'table-tooltip-name';
    title.textContent = readableStudentName(student);
    elements.tableTooltip.appendChild(title);

    if (student.group) {
      const meta = document.createElement('div');
      meta.className = 'table-tooltip-meta';
      meta.textContent = `Grupo ${student.group}`;
      elements.tableTooltip.appendChild(meta);
    }

    if (context.items.length) {
      const list = document.createElement('ul');
      list.className = 'table-tooltip-constraints';
      context.items.forEach(text => {
        const item = document.createElement('li');
        item.textContent = text;
        list.appendChild(item);
      });
      elements.tableTooltip.appendChild(list);
    }
  }

  function positionTableTooltipBesideTable(tableNode) {
    if (!elements.tableTooltip || elements.tableTooltip.hidden || !tableNode?.isConnected) return;
    const gap = 12;
    const margin = 8;
    const anchor = tableNode.getBoundingClientRect();
    const rect = elements.tableTooltip.getBoundingClientRect();

    let left = anchor.right + gap;
    if (left + rect.width > window.innerWidth - margin) left = anchor.left - rect.width - gap;
    left = clamp(left, margin, Math.max(margin, window.innerWidth - rect.width - margin));

    let top = anchor.top + anchor.height / 2 - rect.height / 2;
    top = clamp(top, margin, Math.max(margin, window.innerHeight - rect.height - margin));

    elements.tableTooltip.style.left = `${left}px`;
    elements.tableTooltip.style.top = `${top}px`;
  }

  function highlightConstraintRelatedTables(sourceNode, ids) {
    clearConstraintRelatedHighlights();
    sourceNode?.classList.add('constraint-source');
    ids.forEach(id => {
      elements.classroom?.querySelector(`.table-node[data-table-id="${id}"]`)?.classList.add('constraint-related');
    });
  }

  function pointOnRectEdge(rect, towardX, towardY, classroomRect) {
    const centerX = rect.left - classroomRect.left + rect.width / 2;
    const centerY = rect.top - classroomRect.top + rect.height / 2;
    const dx = towardX - centerX;
    const dy = towardY - centerY;
    const halfW = Math.max(1, rect.width / 2);
    const halfH = Math.max(1, rect.height / 2);
    const scale = 1 / Math.max(Math.abs(dx) / halfW, Math.abs(dy) / halfH, 1e-9);
    return {
      x: centerX + dx * scale,
      y: centerY + dy * scale
    };
  }

  function renderConstraintRelationLines(sourceNode, relations) {
    clearConstraintRelationLines();
    if (!elements.classroom || !sourceNode?.isConnected || !relations?.length) return;

    const classroomRect = elements.classroom.getBoundingClientRect();
    if (!classroomRect.width || !classroomRect.height) return;

    const namespace = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(namespace, 'svg');
    svg.classList.add('constraint-relations-layer');
    svg.setAttribute('viewBox', `0 0 ${classroomRect.width} ${classroomRect.height}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');

    const sourceRect = sourceNode.getBoundingClientRect();
    const sourceCenter = {
      x: sourceRect.left - classroomRect.left + sourceRect.width / 2,
      y: sourceRect.top - classroomRect.top + sourceRect.height / 2
    };

    relations.forEach(relation => {
      const targetNode = elements.classroom.querySelector(`.table-node[data-table-id="${relation.otherId}"]`);
      if (!targetNode) return;

      const targetRect = targetNode.getBoundingClientRect();
      const targetCenter = {
        x: targetRect.left - classroomRect.left + targetRect.width / 2,
        y: targetRect.top - classroomRect.top + targetRect.height / 2
      };
      const start = pointOnRectEdge(sourceRect, targetCenter.x, targetCenter.y, classroomRect);
      const end = pointOnRectEdge(targetRect, sourceCenter.x, sourceCenter.y, classroomRect);

      const line = document.createElementNS(namespace, 'line');
      line.classList.add('constraint-relation-line', relation.visualType === 'far' ? 'is-far' : 'is-near');
      line.setAttribute('x1', start.x.toFixed(2));
      line.setAttribute('y1', start.y.toFixed(2));
      line.setAttribute('x2', end.x.toFixed(2));
      line.setAttribute('y2', end.y.toFixed(2));
      svg.appendChild(line);
    });

    if (svg.childElementCount) elements.classroom.appendChild(svg);
  }

  function scheduleTableTooltip(event, studentId) {
    if (!studentId || event.pointerType !== 'mouse' || !elements.tableTooltip || tooltipInteractionInProgress()) return;
    clearTimeout(state.tooltipTimer);
    clearConstraintRelatedHighlights();
    clearConstraintRelationLines();
    const tableNode = event.currentTarget;

    state.tooltipTimer = setTimeout(() => {
      if (!tableNode?.isConnected || tooltipInteractionInProgress()) return;
      const students = parseStudents();
      const student = students.find(item => item.id === studentId);
      if (!student) return;

      const context = buildStudentConstraintContext(student, students);
      renderTableTooltip(student, context);
      elements.tableTooltip.hidden = false;
      positionTableTooltipBesideTable(tableNode);
      highlightConstraintRelatedTables(tableNode, context.relatedIds);
      renderConstraintRelationLines(tableNode, context.directRelations);
    }, TOOLTIP_DELAY_MS);
  }

  function normalizeSearchText(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es')
      .trim();
  }

  function studentMatchesSearch(student, query) {
    if (!student || !query) return false;
    return [student.fullName, student.firstName, student.surnames, student.displayName]
      .map(normalizeSearchText)
      .some(value => value.includes(query));
  }

  function refreshPersonSearch() {
    renderTables();
  }

  function renderZones() {
    const fragment = document.createDocumentFragment();
    const roomWidth = Math.max(1, elements.classroom.clientWidth);
    const roomHeight = Math.max(1, elements.classroom.clientHeight);

    for (const zone of state.zones) {
      const rect = zonePixelRect(zone, roomWidth, roomHeight);
      const node = document.createElement('div');
      node.className = `zone-protected${state.selectedZoneId === zone.id ? ' selected' : ''}`;
      node.dataset.zoneId = String(zone.id);
      node.style.left = `${rect.left}px`;
      node.style.top = `${rect.top}px`;
      node.style.width = `${rect.width}px`;
      node.style.height = `${rect.height}px`;
      node.textContent = 'ZONA PROTEGIDA';
      node.setAttribute('aria-label', `Zona protegida ${zone.id}`);
      node.addEventListener('pointerdown', onZonePointerDown);
      node.addEventListener('contextmenu', onZoneContextMenu);
      fragment.appendChild(node);
    }
    return fragment;
  }

  function renderTables() {
    const students = parseStudents();
    const studentMap = new Map(students.map(student => [student.id, student]));
    const searchQuery = normalizeSearchText(elements.personSearchInput?.value);
    const fragment = document.createDocumentFragment();

    elements.classroom.innerHTML = '';
    elements.classroom.appendChild(renderZones());

    for (const table of state.tables) {
      const geometry = tablePixelGeometry(table);
      const node = document.createElement('div');
      const student = studentMap.get(table.id);

      const rotation = normalizeRotation(table.rotation);
      const inMultiSelection = state.selectedTableIds.has(table.id);
      const searchMatch = studentMatchesSearch(student, searchQuery);
      node.className = `table-node${student ? '' : ' empty'}${inMultiSelection ? ' group-selected' : ''}${state.selectedTableId === table.id ? ' selected' : ''}${table.locked ? ' locked' : ''}${searchMatch ? ' search-match' : ''}`;
      node.dataset.tableId = String(table.id);
      node.style.width = `${state.tableWidth}px`;
      node.style.height = `${state.tableHeight}px`;
      node.style.left = `${geometry.left}px`;
      node.style.top = `${geometry.top}px`;
      node.style.transform = `rotate(${rotation}deg)`;
      node.style.setProperty('--counter-rotation', `${-rotation}deg`);
      if (student?.group) {
        node.classList.add('group-tagged');
        node.style.setProperty('--group-table-fill', GROUP_COLORS[student.group] || '#e2e2e2');
      }
      const lockText = table.locked ? ' · bloqueada' : '';
      const groupText = student?.group ? ` · grupo ${student.group}` : '';
      node.setAttribute('aria-label', student ? `${student.fullName}. Mesa ${table.id}${groupText}${lockText}` : `Mesa ${table.id} · libre${lockText}`);

      const idTag = document.createElement('span');
      idTag.className = 'table-id';
      idTag.textContent = String(table.id);

      const label = document.createElement('span');
      label.className = 'student-label';
      label.textContent = student ? `${student.displayName}${student.group ? ` (${student.group})` : ''}` : 'Libre';

      node.append(idTag, label);
      if (student) {
        node.addEventListener('pointerenter', event => scheduleTableTooltip(event, student.id));
        node.addEventListener('pointerleave', hideTableTooltip);
      }
      node.addEventListener('pointerdown', onTablePointerDown);
      node.addEventListener('contextmenu', onTableContextMenu);
      fragment.appendChild(node);
    }

    elements.classroom.appendChild(fragment);
  }

  function clearTableSelection(options = {}) {
    state.selectedTableId = null;
    state.selectedTableIds.clear();
    if (options.render !== false) renderTables();
    updateDeleteButton();
    updateTableActionButtons();
  }

  function selectOnlyTable(tableId, options = {}) {
    state.selectedZoneId = null;
    state.selectedTableId = tableId;
    state.selectedTableIds = new Set(tableId == null ? [] : [tableId]);
    if (options.render !== false) renderTables();
    updateDeleteButton();
    updateTableActionButtons();
  }

  function classroomPoint(event) {
    const rect = elements.classroom.getBoundingClientRect();
    return {
      x: clamp(event.clientX - rect.left, 0, rect.width),
      y: clamp(event.clientY - rect.top, 0, rect.height),
      rect
    };
  }

  function removeMarqueeNode() {
    const node = state.marquee?.node;
    if (node?.parentNode) node.parentNode.removeChild(node);
  }

  function updateMarqueeNode(marquee) {
    if (!marquee.node) {
      marquee.node = document.createElement('div');
      marquee.node.className = 'selection-marquee';
      elements.classroom.appendChild(marquee.node);
    }
    const left = Math.min(marquee.startX, marquee.currentX);
    const top = Math.min(marquee.startY, marquee.currentY);
    const width = Math.abs(marquee.currentX - marquee.startX);
    const height = Math.abs(marquee.currentY - marquee.startY);
    marquee.node.style.left = `${left}px`;
    marquee.node.style.top = `${top}px`;
    marquee.node.style.width = `${width}px`;
    marquee.node.style.height = `${height}px`;
  }

  function setZoneMode(active) {
    state.zoneMode = Boolean(active);
    elements.addZoneBtn?.classList.toggle('zone-mode-active', state.zoneMode);
    elements.addZoneBtn?.setAttribute('aria-pressed', String(state.zoneMode));
    elements.classroom?.classList.toggle('zone-draw-mode', state.zoneMode);
    if (!state.zoneMode && state.zoneDraft?.node?.parentNode) state.zoneDraft.node.remove();
    if (!state.zoneMode) state.zoneDraft = null;
  }

  function activateZoneMode() {
    hideTableTooltip();
    state.selectedZoneId = null;
    state.selectedTableId = null;
    state.selectedTableIds.clear();
    setZoneMode(true);
    renderTables();
    updateDeleteButton();
    showMessage('Arrastra sobre una zona vacía del espacio para crear una zona protegida. Pulsa Escape para cancelar.', 'info');
  }

  function updateZoneDraftNode(draft) {
    if (!draft.node) {
      draft.node = document.createElement('div');
      draft.node.className = 'zone-draft';
      elements.classroom.appendChild(draft.node);
    }
    const left = Math.min(draft.startX, draft.currentX);
    const top = Math.min(draft.startY, draft.currentY);
    const width = Math.abs(draft.currentX - draft.startX);
    const height = Math.abs(draft.currentY - draft.startY);
    draft.node.style.left = `${left}px`;
    draft.node.style.top = `${top}px`;
    draft.node.style.width = `${width}px`;
    draft.node.style.height = `${height}px`;
  }

  function startZoneDraft(event) {
    const point = classroomPoint(event);
    state.zoneDraft = {
      pointerId: event.pointerId,
      startX: point.x,
      startY: point.y,
      currentX: point.x,
      currentY: point.y,
      moved: false,
      node: null
    };
    elements.classroom.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function moveZoneDraft(event) {
    const draft = state.zoneDraft;
    if (!draft || event.pointerId !== draft.pointerId) return false;
    const point = classroomPoint(event);
    draft.currentX = point.x;
    draft.currentY = point.y;
    if (!draft.moved && Math.hypot(draft.currentX - draft.startX, draft.currentY - draft.startY) < 4) return true;
    draft.moved = true;
    updateZoneDraftNode(draft);
    return true;
  }

  function finishZoneDraft(event) {
    const draft = state.zoneDraft;
    if (!draft || event.pointerId !== draft.pointerId) return false;
    const point = classroomPoint(event);
    draft.currentX = point.x;
    draft.currentY = point.y;
    draft.node?.remove();

    const left = Math.min(draft.startX, draft.currentX);
    const top = Math.min(draft.startY, draft.currentY);
    const width = Math.abs(draft.currentX - draft.startX);
    const height = Math.abs(draft.currentY - draft.startY);
    state.zoneDraft = null;
    setZoneMode(false);

    if (!draft.moved || width < 18 || height < 18) {
      showMessage('La zona protegida debe tener un tamaño mínimo.', 'warning');
      renderTables();
      return true;
    }

    const rect = { left, top, width, height, right: left + width, bottom: top + height };
    if (zoneRectOverlapsAnyTable(rect)) {
      showMessage('La zona no puede superponerse con mesas existentes.', 'error');
      renderTables();
      return true;
    }

    const roomWidth = Math.max(1, elements.classroom.clientWidth);
    const roomHeight = Math.max(1, elements.classroom.clientHeight);
    const zone = {
      id: nextZoneId(),
      xNorm: left / roomWidth,
      yNorm: top / roomHeight,
      widthNorm: width / roomWidth,
      heightNorm: height / roomHeight
    };
    clearAlternatives();
    state.zones.push(zone);
    state.selectedZoneId = zone.id;
    state.layoutActive = false;
    renderTables();
    showMessage('Zona protegida creada. Las mesas no podrán ocuparla.', 'success');
    saveStateSoon();
    return true;
  }

  function deleteZone(zoneId, askConfirmation = true) {
    const zone = state.zones.find(item => item.id === Number(zoneId));
    if (!zone) return;
    if (askConfirmation && !window.confirm('¿Eliminar esta zona protegida?')) return;
    clearAlternatives();
    state.zones = state.zones.filter(item => item.id !== zone.id);
    if (state.selectedZoneId === zone.id) state.selectedZoneId = null;
    state.layoutActive = false;
    renderTables();
    showMessage('Zona protegida eliminada.', 'success');
    saveStateSoon();
  }

  function onZoneContextMenu(event) {
    event.preventDefault();
    event.stopPropagation();
    const zoneId = Number(event.currentTarget.dataset.zoneId);
    state.selectedZoneId = zoneId;
    deleteZone(zoneId, true);
  }

  function onZonePointerDown(event) {
    if (state.zoneMode) return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    event.stopPropagation();
    event.preventDefault();
    const node = event.currentTarget;
    const zoneId = Number(node.dataset.zoneId);
    const zone = state.zones.find(item => item.id === zoneId);
    if (!zone) return;

    state.selectedZoneId = zoneId;
    state.selectedTableId = null;
    state.selectedTableIds.clear();
    renderTables();
    updateDeleteButton();
    const freshNode = elements.classroom.querySelector(`.zone-protected[data-zone-id="${zoneId}"]`);
    if (!freshNode) return;

    const roomWidth = Math.max(1, elements.classroom.clientWidth);
    const roomHeight = Math.max(1, elements.classroom.clientHeight);
    const rect = zonePixelRect(zone, roomWidth, roomHeight);
    state.zoneDragging = {
      pointerId: event.pointerId,
      zone,
      node: freshNode,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startLeft: rect.left,
      startTop: rect.top,
      width: rect.width,
      height: rect.height,
      lastLeft: rect.left,
      lastTop: rect.top
    };
    freshNode.setPointerCapture?.(event.pointerId);
    freshNode.addEventListener('pointermove', onZonePointerMove);
    freshNode.addEventListener('pointerup', onZonePointerUp);
    freshNode.addEventListener('pointercancel', onZonePointerUp);
  }

  function onZonePointerMove(event) {
    const drag = state.zoneDragging;
    if (!drag || event.pointerId !== drag.pointerId) return;
    const roomWidth = Math.max(1, elements.classroom.clientWidth);
    const roomHeight = Math.max(1, elements.classroom.clientHeight);
    const left = clamp(drag.startLeft + event.clientX - drag.startClientX, 0, roomWidth - drag.width);
    const top = clamp(drag.startTop + event.clientY - drag.startClientY, 0, roomHeight - drag.height);
    const rect = { left, top, width: drag.width, height: drag.height, right: left + drag.width, bottom: top + drag.height };
    if (zoneRectOverlapsAnyTable(rect)) return;

    drag.lastLeft = left;
    drag.lastTop = top;
    drag.zone.xNorm = left / roomWidth;
    drag.zone.yNorm = top / roomHeight;
    drag.node.style.left = `${left}px`;
    drag.node.style.top = `${top}px`;
  }

  function onZonePointerUp(event) {
    const drag = state.zoneDragging;
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag.node.removeEventListener('pointermove', onZonePointerMove);
    drag.node.removeEventListener('pointerup', onZonePointerUp);
    drag.node.removeEventListener('pointercancel', onZonePointerUp);
    state.zoneDragging = null;
    state.layoutActive = false;
    renderTables();
    saveStateSoon();
  }

  function onClassroomPointerDown(event) {
    if (event.target !== elements.classroom) return;
    if (event.button !== 0 && event.pointerType === 'mouse') return;

    hideTableTooltip();
    if (state.zoneMode) {
      startZoneDraft(event);
      return;
    }
    state.selectedZoneId = null;
    const point = classroomPoint(event);
    state.marquee = {
      pointerId: event.pointerId,
      startX: point.x,
      startY: point.y,
      currentX: point.x,
      currentY: point.y,
      moved: false,
      node: null
    };

    elements.classroom.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  }

  function onClassroomPointerMove(event) {
    if (moveZoneDraft(event)) return;
    const marquee = state.marquee;
    if (!marquee || event.pointerId !== marquee.pointerId) return;
    const point = classroomPoint(event);
    marquee.currentX = point.x;
    marquee.currentY = point.y;

    const distance = Math.hypot(marquee.currentX - marquee.startX, marquee.currentY - marquee.startY);
    if (!marquee.moved && distance < 4) return;
    marquee.moved = true;
    updateMarqueeNode(marquee);
  }

  function onClassroomPointerUp(event) {
    if (finishZoneDraft(event)) return;
    const marquee = state.marquee;
    if (!marquee || event.pointerId !== marquee.pointerId) return;

    const point = classroomPoint(event);
    marquee.currentX = point.x;
    marquee.currentY = point.y;
    removeMarqueeNode();

    if (!marquee.moved) {
      state.marquee = null;
      clearTableSelection();
      return;
    }

    const left = Math.min(marquee.startX, marquee.currentX);
    const right = Math.max(marquee.startX, marquee.currentX);
    const top = Math.min(marquee.startY, marquee.currentY);
    const bottom = Math.max(marquee.startY, marquee.currentY);

    const selectedIds = state.tables
      .filter(table => !table.locked)
      .filter(table => {
        const geometry = tablePixelGeometry(table);
        return geometry.cx >= left && geometry.cx <= right && geometry.cy >= top && geometry.cy <= bottom;
      })
      .map(table => table.id);

    state.selectedTableIds = new Set(selectedIds);
    state.selectedTableId = selectedIds[0] ?? null;
    state.marquee = null;
    renderTables();
    updateDeleteButton();
    updateTableActionButtons();
  }

  function onTablePointerDown(event) {
    hideTableTooltip();
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const node = event.currentTarget;
    const tableId = Number(node.dataset.tableId);
    const table = state.tables.find(item => item.id === tableId);
    if (!table) return;
    state.selectedZoneId = null;

    const alreadyInGroup = state.selectedTableIds.has(tableId) && state.selectedTableIds.size > 1;
    if (!alreadyInGroup) {
      state.selectedTableIds = new Set([tableId]);
    }
    state.selectedTableId = tableId;
    updateDeleteButton();
    updateTableActionButtons();

    elements.classroom.querySelectorAll('.table-node.selected').forEach(item => item.classList.remove('selected'));
    if (!alreadyInGroup) {
      elements.classroom.querySelectorAll('.table-node.group-selected').forEach(item => item.classList.remove('group-selected'));
      node.classList.add('group-selected');
    }
    node.classList.add('selected');

    event.preventDefault();
    if (table.locked) return;

    const rect = elements.classroom.getBoundingClientRect();
    const movableTables = Array.from(state.selectedTableIds)
      .map(id => state.tables.find(item => item.id === id))
      .filter(item => item && !item.locked);

    if (!movableTables.some(item => item.id === tableId)) movableTables.push(table);

    const group = movableTables.map(item => {
      const geometry = tablePixelGeometry(item);
      return {
        table: item,
        node: elements.classroom.querySelector(`.table-node[data-table-id="${item.id}"]`),
        startCx: geometry.cx,
        startCy: geometry.cy,
        extents: tableVisualHalfExtents(item)
      };
    });

    let minDx = -Infinity;
    let maxDx = Infinity;
    let minDy = -Infinity;
    let maxDy = Infinity;
    for (const item of group) {
      minDx = Math.max(minDx, item.extents.halfW - item.startCx);
      maxDx = Math.min(maxDx, rect.width - item.extents.halfW - item.startCx);
      minDy = Math.max(minDy, item.extents.halfH - item.startCy);
      maxDy = Math.min(maxDy, rect.height - item.extents.halfH - item.startCy);
    }

    state.dragging = {
      pointerId: event.pointerId,
      table,
      node,
      group,
      startClientX: event.clientX,
      startClientY: event.clientY,
      minDx,
      maxDx,
      minDy,
      maxDy,
      lastDx: 0,
      lastDy: 0
    };

    node.setPointerCapture?.(event.pointerId);
    node.classList.add('dragging');
    const anchorGeometry = tablePixelGeometry(table);
    updateCoordinateBubble(node, anchorGeometry.cx, anchorGeometry.cy);
    node.addEventListener('pointermove', onTablePointerMove);
    node.addEventListener('pointerup', onTablePointerUp);
    node.addEventListener('pointercancel', onTablePointerUp);
  }

  function onTablePointerMove(event) {
    if (!state.dragging || event.pointerId !== state.dragging.pointerId) return;
    const { table, node, group, startClientX, startClientY, minDx, maxDx, minDy, maxDy } = state.dragging;
    const rect = elements.classroom.getBoundingClientRect();

    const dx = clamp(event.clientX - startClientX, minDx, maxDx);
    const dy = clamp(event.clientY - startClientY, minDy, maxDy);
    const collidesWithZone = group.some(item => {
      const cx = item.startCx + dx;
      const cy = item.startCy + dy;
      return tableOverlapsProtectedZoneAt(item.table, cx, cy);
    });
    if (collidesWithZone) return;
    if (dx !== 0 || dy !== 0) clearAlternatives();

    state.dragging.lastDx = dx;
    state.dragging.lastDy = dy;
    for (const item of group) {
      const cx = item.startCx + dx;
      const cy = item.startCy + dy;
      item.table.xNorm = rect.width ? cx / rect.width : 0.5;
      item.table.yNorm = rect.height ? cy / rect.height : 0.5;
      if (item.node) {
        item.node.style.left = `${cx - state.tableWidth / 2}px`;
        item.node.style.top = `${cy - state.tableHeight / 2}px`;
      }
    }

    const anchor = group.find(item => item.table.id === table.id);
    if (anchor) updateCoordinateBubble(node, anchor.startCx + dx, anchor.startCy + dy);
  }

  function onTablePointerUp(event) {
    if (!state.dragging || event.pointerId !== state.dragging.pointerId) return;
    const { node, lastDx = 0, lastDy = 0 } = state.dragging;
    const moved = Math.abs(lastDx) > 0.5 || Math.abs(lastDy) > 0.5;
    node.classList.remove('dragging');
    node.querySelector('.coordinates')?.remove();
    node.removeEventListener('pointermove', onTablePointerMove);
    node.removeEventListener('pointerup', onTablePointerUp);
    node.removeEventListener('pointercancel', onTablePointerUp);
    state.dragging = null;
    if (moved) markManualLayout();
    else state.layoutActive = false;
    state.lastSolution = null;
    hideSolution();
    saveStateSoon();
  }

  function onSelectionKeyDown(event) {
    const activeTag = document.activeElement?.tagName?.toLowerCase();
    const editing = activeTag === 'textarea' || activeTag === 'input' || document.activeElement?.isContentEditable;

    if ((event.key === 'Delete' || event.key === 'Backspace') && state.selectedZoneId != null && !editing) {
      event.preventDefault();
      deleteZone(state.selectedZoneId, true);
      return;
    }

    if (event.key !== 'Escape') return;
    if (state.zoneMode || state.zoneDraft) {
      state.zoneDraft?.node?.remove();
      state.zoneDraft = null;
      setZoneMode(false);
      clearMessage();
      return;
    }
    if (state.selectedZoneId != null) {
      state.selectedZoneId = null;
      renderTables();
      return;
    }
    if (!state.marquee && state.selectedTableIds.size === 0 && state.selectedTableId == null) return;
    removeMarqueeNode();
    state.marquee = null;
    clearTableSelection();
  }

  function updateCoordinateBubble(node, cx, cy) {
    let bubble = node.querySelector('.coordinates');
    if (!bubble) {
      bubble = document.createElement('span');
      bubble.className = 'coordinates';
      node.appendChild(bubble);
    }
    bubble.textContent = `x ${Math.round(cx)} · y ${Math.round(cy)}`;
  }

  function updateDeleteButton() {
    if (!elements.deleteTableBtn) return;
    const exists = state.tables.some(table => table.id === state.selectedTableId);
    elements.deleteTableBtn.disabled = !exists;
    elements.deleteTableBtn.title = exists ? `Eliminar mesa ${state.selectedTableId}` : 'Selecciona una mesa para eliminarla';
    updateTableActionButtons();
  }

  function selectedTable() {
    return state.tables.find(table => table.id === state.selectedTableId) || null;
  }

  function updateTableActionButtons() {
    const table = selectedTable();
    if (elements.rotateTableBtn) {
      elements.rotateTableBtn.disabled = !table;
      elements.rotateTableBtn.title = table ? `Girar mesa ${table.id} 90°` : 'Selecciona una mesa para girarla';
    }
    if (elements.lockTableBtn) {
      elements.lockTableBtn.disabled = !table;
      elements.lockTableBtn.textContent = table?.locked ? 'Desbloquear mesa' : 'Bloquear mesa';
      elements.lockTableBtn.title = table
        ? (table.locked ? `Desbloquear mesa ${table.id}` : `Bloquear mesa ${table.id} en su posición actual`)
        : 'Selecciona una mesa para bloquearla';
    }
  }

  function rotateSelectedTable() {
    const table = selectedTable();
    if (!table) return;
    const previousRotation = normalizeRotation(table.rotation);
    const nextRotation = (previousRotation + 90) % 360;
    const geometry = tablePixelGeometry(table);
    table.rotation = nextRotation;
    if (tableOverlapsProtectedZoneAt(table, geometry.cx, geometry.cy)) {
      table.rotation = previousRotation;
      showMessage('No se puede girar la mesa porque invadiría una zona protegida.', 'warning');
      return;
    }
    clearAlternatives();
    markManualLayout();
    state.lastSolution = null;
    hideSolution();
    renderTables();
    updateTableActionButtons();
    showMessage(`Mesa ${table.id} girada 90°. La orientación del texto indica desde qué lado se sentaría la persona.`, 'success');
    saveStateSoon();
  }

  function toggleSelectedTableLock() {
    const table = selectedTable();
    if (!table) return;
    clearAlternatives();
    table.locked = !table.locked;
    state.layoutActive = false;
    state.lastSolution = null;
    hideSolution();
    renderTables();
    updateTableActionButtons();
    showMessage(
      table.locked
        ? `Mesa ${table.id} bloqueada. Conservará esta posición al organizar, mezclar o aplicar un esquema.`
        : `Mesa ${table.id} desbloqueada.`,
      'success'
    );
    saveStateSoon();
  }

  function rewriteConstraintsAfterDeletion(deletedId) {
    const lines = elements.constraintsInput.value.split(/\r?\n/);
    const rewritten = [];
    let removedCount = 0;

    const remapId = id => id > deletedId ? id - 1 : id;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        rewritten.push(rawLine);
        continue;
      }

      let match;
      if ((match = line.match(/^(\d+)\s*x\s*(\d+)$/i))) {
        const a = Number(match[1]);
        const b = Number(match[2]);
        if (a === deletedId || b === deletedId) {
          removedCount++;
          continue;
        }
        rewritten.push(`${remapId(a)}x${remapId(b)}`);
        continue;
      }

      if ((match = line.match(/^(\d+)\s*--\s*(\d+)$/))) {
        const a = Number(match[1]);
        const b = Number(match[2]);
        if (a === deletedId || b === deletedId) {
          removedCount++;
          continue;
        }
        rewritten.push(`${remapId(a)}--${remapId(b)}`);
        continue;
      }

      if ((match = line.match(/^(\d+)\s*-\s*(\d+)$/))) {
        const a = Number(match[1]);
        const b = Number(match[2]);
        if (a === deletedId || b === deletedId) {
          removedCount++;
          continue;
        }
        rewritten.push(`${remapId(a)}-${remapId(b)}`);
        continue;
      }

      if ((match = line.match(/^([LR])\s*:\s*(.+)$/i))) {
        const tokens = match[2].split(',').map(value => value.trim()).filter(Boolean);
        const rewrittenTokens = [];
        let changed = false;
        for (const token of tokens) {
          if (/^\d+$/.test(token)) {
            const id = Number(token);
            if (id === deletedId) {
              changed = true;
              removedCount++;
              continue;
            }
            const remapped = remapId(id);
            if (remapped !== id) changed = true;
            rewrittenTokens.push(String(remapped));
          } else {
            rewrittenTokens.push(token);
          }
        }
        if (!rewrittenTokens.length) continue;
        rewritten.push(`${match[1].toUpperCase()}: ${rewrittenTokens.join(',')}`);
        continue;
      }

      if ((match = line.match(/^([FB])\s*:\s*(.+)$/i))) {
        const tokens = match[2].split(',').map(value => value.trim()).filter(Boolean);
        if (tokens.length && tokens.every(value => /^\d+$/.test(value))) {
          const ids = tokens.map(Number);
          const remaining = ids.filter(id => id !== deletedId).map(remapId);
          if (!remaining.length) {
            removedCount++;
            continue;
          }
          if (remaining.length !== ids.length) removedCount++;
          rewritten.push(`${match[1].toUpperCase()}: ${remaining.join(',')}`);
          continue;
        }
      }

      // Preserve malformed/unknown lines verbatim so the user can still correct them.
      rewritten.push(rawLine);
    }

    elements.constraintsInput.value = rewritten.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    return removedCount;
  }

  function removeStudentForTable(deletedId) {
    const students = parseStudents();
    if (deletedId < 1 || deletedId > students.length) return false;

    let currentStudentId = 0;
    let nextStudentNumber = 0;
    const rewritten = [];

    for (const sourceLine of elements.studentsInput.value.split(/\r?\n/)) {
      const trimmed = sourceLine.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        rewritten.push(sourceLine);
        continue;
      }

      currentStudentId += 1;
      if (currentStudentId === deletedId) continue;

      nextStudentNumber += 1;
      rewritten.push(`${nextStudentNumber}. ${stripStudentNumber(sourceLine)}`);
    }

    elements.studentsInput.value = rewritten.join('\n');
    return true;
  }

  function renumberTablesAfterDeletion(deletedId) {
    state.tables = state.tables.map(table => ({
      ...table,
      id: table.id > deletedId ? table.id - 1 : table.id
    }));
  }

  function deleteTable(tableId, askConfirmation = true) {
    const table = state.tables.find(item => item.id === Number(tableId));
    if (!table) return;

    const students = parseStudents();
    const hasStudent = table.id <= students.length;
    const confirmationText = hasStudent
      ? `¿Eliminar la mesa ${table.id} y también a la persona ${table.id} de la lista?`
      : `¿Eliminar la mesa ${table.id}?`;

    if (askConfirmation && !window.confirm(confirmationText)) return;

    clearAlternatives();
    state.tables = state.tables.filter(item => item.id !== table.id);
    state.cooperativeBlockPositions = [];

    let constraintsRemoved = 0;
    if (hasStudent) {
      removeStudentForTable(table.id);
      constraintsRemoved = rewriteConstraintsAfterDeletion(table.id);
      renumberTablesAfterDeletion(table.id);
    }

    state.selectedTableId = null;
    state.selectedTableIds.clear();
    markManualLayout();
    state.lastSolution = null;
    hideSolution();
    renderTables();
    updateUIState();
    updateDeleteButton();

    const suffix = hasStudent
      ? ` También se eliminó la persona ${table.id} y se renumeraron personas y mesas.${constraintsRemoved ? ` Se ajustaron las restricciones (${constraintsRemoved} referencia(s) eliminada(s)).` : ' Las restricciones se reajustaron automáticamente.'}`
      : '';
    showMessage(`Mesa ${table.id} eliminada.${suffix}`, 'success');
    saveStateSoon();
  }

  function deleteSelectedTable() {
    if (state.selectedTableId == null) return;
    deleteTable(state.selectedTableId, true);
  }

  function clearTables() {
    if (!state.tables.length) {
      showMessage('El espacio ya está vacía.', 'info');
      return;
    }

    const confirmed = window.confirm(
      '¿Eliminar todas las mesas del espacio? La lista de personas, las restricciones y las zonas protegidas se conservarán.'
    );
    if (!confirmed) return;

    clearAlternatives();
    state.tables = [];
    state.selectedTableId = null;
    state.selectedTableIds.clear();
    markManualLayout();
    state.lastSolution = null;
    hideSolution();
    renderTables();
    updateUIState();
    updateDeleteButton();
    showMessage('Espacio vaciado. La lista de personas y las restricciones se han conservado.', 'success');
    saveStateSoon();
  }

  function onTableContextMenu(event) {
    hideTableTooltip();
    event.preventDefault();
    const tableId = Number(event.currentTarget.dataset.tableId);
    state.selectedTableId = tableId;
    state.selectedTableIds = new Set([tableId]);
    renderTables();
    updateDeleteButton();
    deleteTable(tableId, true);
  }

  function nextAvailableTableId() {
    const usedIds = new Set(state.tables.map(table => table.id));
    let id = 1;
    while (usedIds.has(id)) id++;
    return id;
  }

  function findFreeTablePosition() {
    const width = Math.max(1, elements.classroom.clientWidth);
    const height = Math.max(1, elements.classroom.clientHeight);
    const halfW = state.tableWidth / 2;
    const halfH = state.tableHeight / 2;
    const gapX = 10;
    const gapY = 10;
    const stepX = state.tableWidth + gapX;
    const stepY = state.tableHeight + gapY;
    const marginX = 12;
    const marginY = 12;

    for (let y = halfH + marginY; y <= height - halfH - marginY + 0.1; y += stepY) {
      for (let x = halfW + marginX; x <= width - halfW - marginX + 0.1; x += stepX) {
        const overlaps = state.tables.some(table => {
          const geometry = tablePixelGeometry(table);
          const extents = tableVisualHalfExtents(table);
          return Math.abs(geometry.cx - x) < extents.halfW + halfW + gapX / 2 &&
                 Math.abs(geometry.cy - y) < extents.halfH + halfH + gapY / 2;
        });
        const zoneBlocked = rectOverlapsProtectedZone({ left: x - halfW, top: y - halfH, right: x + halfW, bottom: y + halfH });
        if (!overlaps && !zoneBlocked) return { x, y, width, height };
      }
    }

    // Si el espacio está muy lleno, buscamos cualquier punto que al menos no invada una zona protegida.
    for (let y = halfH; y <= height - halfH; y += 8) {
      for (let x = halfW; x <= width - halfW; x += 8) {
        const rect = { left: x - halfW, top: y - halfH, right: x + halfW, bottom: y + halfH };
        if (!rectOverlapsProtectedZone(rect)) return { x, y, width, height };
      }
    }
    return null;
  }

  function addTables(count = 1) {
    const numericCount = Math.floor(Number(count));
    if (!Number.isFinite(numericCount) || numericCount < 1 || numericCount > 999) {
      showMessage('Indica un número entero positivo de mesas entre 1 y 999.', 'error');
      elements.tableCountInput?.focus();
      return;
    }

    clearAlternatives();
    const safeCount = numericCount;
    let lastId = null;
    let addedCount = 0;

    for (let i = 0; i < safeCount; i++) {
      const id = nextAvailableTableId();
      const position = findFreeTablePosition();
      if (!position) break;
      state.tables.push({
        id,
        xNorm: position.width ? position.x / position.width : 0.1,
        yNorm: position.height ? position.y / position.height : 0.1,
        rotation: 0,
        locked: false
      });
      lastId = id;
      addedCount++;
    }

    if (!addedCount) {
      showMessage('No hay espacio libre suficiente fuera de las zonas protegidas para añadir una mesa.', 'error');
      return;
    }

    state.selectedTableId = lastId;
    state.selectedTableIds = new Set(lastId == null ? [] : [lastId]);
    markManualLayout();
    state.lastSolution = null;
    hideSolution();
    renderTables();
    updateUIState();
    showMessage(`${addedCount} ${addedCount === 1 ? 'mesa añadida' : 'mesas añadidas'} al espacio.${addedCount < safeCount ? ' No había espacio válido para añadir más sin invadir zonas protegidas.' : ''}`, addedCount < safeCount ? 'warning' : 'success');
    saveStateSoon();
  }

  function addTable() {
    addTables(1);
  }

  function resizeTables(delta) {
    const nextWidth = clamp(state.tableWidth + delta, MIN_TABLE_WIDTH, MAX_TABLE_WIDTH);
    const ratio = nextWidth / state.tableWidth;
    const nextHeight = Math.round(clamp(state.tableHeight * ratio, 36, 88));
    if (anyTableOverlapsProtectedZone(nextWidth, nextHeight)) {
      showMessage('No se puede cambiar el tamaño porque alguna mesa invadiría una zona protegida.', 'warning');
      return;
    }
    clearAlternatives();
    state.tableWidth = nextWidth;
    state.tableHeight = nextHeight;
    state.lastSolution = null;
    hideSolution();
    if (state.layoutActive) applySpaceLayout(state.spaceLayout, { message: false, save: false, scroll: false });
    else renderTables();
    saveStateSoon();
  }

  function calculateDistanceMatrix() {
    const n = state.tables.length;
    const matrix = Array.from({ length: n }, () => Array(n).fill(0));
    const width = Math.max(1, elements.classroom.clientWidth);
    const height = Math.max(1, elements.classroom.clientHeight);
    const maxDistance = Math.hypot(width, height);
    const positions = state.tables.map(table => ({
      x: table.xNorm * width,
      y: table.yNorm * height
    }));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = positions[i].x - positions[j].x;
        const dy = positions[i].y - positions[j].y;
        const d = clamp(Math.hypot(dx, dy) / maxDistance, 0, 1);
        matrix[i][j] = d;
        matrix[j][i] = d;
      }
    }

    return matrix;
  }

  function assignmentToStudentDistanceMatrix(assignment, studentCount, distanceMatrix) {
    const matrix = Array.from({ length: studentCount }, () => Array(studentCount).fill(0));
    for (let i = 0; i < studentCount; i++) {
      for (let j = i + 1; j < studentCount; j++) {
        const ti = assignment[i];
        const tj = assignment[j];
        const d = distanceMatrix[ti][tj];
        matrix[i][j] = d;
        matrix[j][i] = d;
      }
    }
    return matrix;
  }

  function averageGroupDistance(memberIdsA, memberIdsB, assignment, distanceMatrix) {
    let sum = 0;
    let count = 0;
    const sameGroup = memberIdsA === memberIdsB || (
      memberIdsA.length === memberIdsB.length &&
      memberIdsA.every((id, index) => id === memberIdsB[index])
    );

    if (sameGroup) {
      // Para relaciones de un grupo consigo mismo (p. ej. L-L o LxL),
      // se evalúa cada pareja distinta una sola vez: nunca persona↔ella misma
      // ni la misma relación en ambos sentidos.
      for (let i = 0; i < memberIdsA.length; i++) {
        for (let j = i + 1; j < memberIdsA.length; j++) {
          const ai = assignment[memberIdsA[i] - 1];
          const bi = assignment[memberIdsA[j] - 1];
          if (ai == null || bi == null) continue;
          sum += distanceMatrix[ai][bi];
          count++;
        }
      }
      return count ? sum / count : null;
    }

    for (const a of memberIdsA) {
      for (const b of memberIdsB) {
        const ai = assignment[a - 1];
        const bi = assignment[b - 1];
        if (ai == null || bi == null) continue;
        sum += distanceMatrix[ai][bi];
        count++;
      }
    }
    return count ? sum / count : 0;
  }

  function averageMemberY(memberIds, assignment) {
    if (!memberIds.length) return 0.5;
    let sum = 0;
    let count = 0;
    memberIds.forEach(id => {
      const tableIndex = assignment[id - 1];
      if (tableIndex == null || !state.tables[tableIndex]) return;
      sum += state.tables[tableIndex].yNorm;
      count++;
    });
    return count ? sum / count : 0.5;
  }

  function averageGroupY(groupMembers, assignment) {
    if (!groupMembers.length) return 0.5;
    return groupMembers.reduce((sum, memberIds) => sum + averageMemberY(memberIds, assignment), 0) / groupMembers.length;
  }

  function orderedBackPenalty(groupMembers, assignment) {
    if (groupMembers.length < 2) return 0;
    const ORDER_MARGIN = 0.04;
    const means = groupMembers.map(ids => averageMemberY(ids, assignment));
    let penalty = 0;
    for (let i = 0; i < means.length - 1; i++) {
      penalty += clamp(means[i] + ORDER_MARGIN - means[i + 1], 0, 1);
    }
    return penalty / (means.length - 1);
  }

  function averageMemberX(memberIds, assignment) {
    if (!memberIds.length) return 0.5;
    let sum = 0;
    let count = 0;
    memberIds.forEach(id => {
      const tableIndex = assignment[id - 1];
      if (tableIndex == null || !state.tables[tableIndex]) return;
      sum += state.tables[tableIndex].xNorm;
      count++;
    });
    return count ? sum / count : 0.5;
  }

  function resolveCooperativeBlocksToSlots(blockPositions = state.cooperativeBlockPositions) {
    if (!Array.isArray(blockPositions) || !blockPositions.length || !state.tables.length) return [];
    const unused = new Set(state.tables.map((_, index) => index));
    return blockPositions.map(block => block.map(position => {
      let bestIndex = null;
      let bestDistance = Infinity;
      for (const index of unused) {
        const table = state.tables[index];
        const distance = Math.hypot(table.xNorm - position.xNorm, table.yNorm - position.yNorm);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = index;
        }
      }
      if (bestIndex != null) unused.delete(bestIndex);
      return bestIndex;
    }).filter(index => index != null)).filter(block => block.length === 4);
  }

  function buildCooperativeABBCConstraint(students) {
    if (state.spaceLayout !== 'cooperative-abbc') return null;
    const blocks = resolveCooperativeBlocksToSlots();
    if (!blocks.length) return null;
    const groups = students.map(student => student.group || null);
    const counts = { A: 0, B: 0, C: 0 };
    groups.forEach(group => { if (group in counts) counts[group]++; });
    const targetComplete = Math.min(blocks.length, counts.A, Math.floor(counts.B / 2), counts.C);
    return {
      type: 'cooperativeABBC',
      blocks,
      groups,
      targetComplete,
      raw: 'Cooperativo ABBC',
      line: 0
    };
  }

  function evaluateCooperativeABBC(constraint, assignment) {
    const slotToStudent = new Map();
    assignment.forEach((slotIndex, studentIndex) => {
      if (slotIndex != null) slotToStudent.set(slotIndex, studentIndex);
    });
    const expected = ['A', 'B', 'B', 'C'];
    let completeCount = 0;
    let matchedTotal = 0;
    let patternMatches = 0;
    let completePatternSlots = 0;

    for (const block of constraint.blocks) {
      const blockGroups = block.map(slot => {
        const studentIndex = slotToStudent.get(slot);
        return studentIndex == null ? null : constraint.groups[studentIndex];
      });
      const counts = { A: 0, B: 0, C: 0 };
      blockGroups.forEach(group => { if (group in counts) counts[group]++; });
      const complete = counts.A === 1 && counts.B === 2 && counts.C === 1;
      if (complete) completeCount++;
      matchedTotal += Math.min(counts.A, 1) + Math.min(counts.B, 2) + Math.min(counts.C, 1);
      if (complete) {
        blockGroups.forEach((group, index) => {
          completePatternSlots++;
          if (group === expected[index]) patternMatches++;
        });
      }
    }

    const completeSatisfaction = constraint.targetComplete > 0
      ? clamp(completeCount / constraint.targetComplete, 0, 1)
      : 1;
    const partialSatisfaction = constraint.blocks.length
      ? matchedTotal / (constraint.blocks.length * 4)
      : 1;
    const patternSatisfaction = completePatternSlots
      ? patternMatches / completePatternSlots
      : 1;

    return {
      completeCount,
      targetComplete: constraint.targetComplete,
      partialSatisfaction: clamp(partialSatisfaction, 0, 1),
      completeSatisfaction,
      patternSatisfaction: clamp(patternSatisfaction, 0, 1)
    };
  }

  function calculateCost(assignment, constraints, distanceMatrix) {
    let total = 0;
    let maxPossible = 0;

    for (const c of constraints) {
      if (c.type === 'far' || c.type === 'together' || c.type === 'near') {
        const ai = c.a - 1;
        const bi = c.b - 1;
        const d = distanceMatrix[assignment[ai]][assignment[bi]];
        if (c.type === 'far') {
          total += WEIGHTS.far * (1 - d);
          maxPossible += WEIGHTS.far;
        } else if (c.type === 'together') {
          total += WEIGHTS.together * d;
          maxPossible += WEIGHTS.together;
        } else {
          total += WEIGHTS.near * d;
          maxPossible += WEIGHTS.near;
        }
      } else if (c.type === 'front' || c.type === 'back') {
        const weight = c.type === 'front' ? WEIGHTS.front : WEIGHTS.back;
        for (const studentId of c.ids) {
          const tableIndex = assignment[studentId - 1];
          const y = state.tables[tableIndex].yNorm;
          total += weight * (c.type === 'front' ? y : 1 - y);
          maxPossible += weight;
        }
      } else if (c.type === 'left' || c.type === 'right') {
        const weight = c.type === 'left' ? WEIGHTS.left : WEIGHTS.right;
        const xs = c.memberIds.map(studentId => {
          const tableIndex = assignment[studentId - 1];
          return tableIndex == null || !state.tables[tableIndex] ? null : state.tables[tableIndex].xNorm;
        }).filter(value => value != null);
        if (xs.length) {
          const avgX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
          total += weight * (c.type === 'left' ? avgX : 1 - avgX);
          maxPossible += weight;
        }
      } else if (c.type === 'groupFar' || c.type === 'groupTogether' || c.type === 'groupNear') {
        const d = averageGroupDistance(c.membersA, c.membersB, assignment, distanceMatrix);
        // Un grupo con una sola persona no tiene parejas internas que evaluar.
        // La restricción no añade coste ni domina artificialmente la solución.
        if (d == null) continue;
        if (c.type === 'groupFar') {
          total += GROUP_WEIGHTS.far * (1 - d);
          maxPossible += GROUP_WEIGHTS.far;
        } else if (c.type === 'groupTogether') {
          total += GROUP_WEIGHTS.together * d;
          maxPossible += GROUP_WEIGHTS.together;
        } else {
          total += GROUP_WEIGHTS.near * d;
          maxPossible += GROUP_WEIGHTS.near;
        }
      } else if (c.type === 'groupFront') {
        const avgY = averageGroupY(c.groupMembers, assignment);
        total += GROUP_WEIGHTS.front * avgY;
        maxPossible += GROUP_WEIGHTS.front;
      } else if (c.type === 'groupBack') {
        const avgY = averageGroupY(c.groupMembers, assignment);
        total += GROUP_WEIGHTS.back * (1 - avgY);
        maxPossible += GROUP_WEIGHTS.back;
        if (c.groups.length > 1) {
          total += GROUP_WEIGHTS.orderedBack * orderedBackPenalty(c.groupMembers, assignment);
          maxPossible += GROUP_WEIGHTS.orderedBack;
        }
      } else if (c.type === 'cooperativeABBC') {
        const evaluation = evaluateCooperativeABBC(c, assignment);
        total += COOPERATIVE_ABBC_WEIGHTS.composition * (1 - evaluation.completeSatisfaction);
        maxPossible += COOPERATIVE_ABBC_WEIGHTS.composition;
        if (evaluation.targetComplete > 0) {
          total += COOPERATIVE_ABBC_WEIGHTS.pattern * (1 - evaluation.patternSatisfaction);
          maxPossible += COOPERATIVE_ABBC_WEIGHTS.pattern;
        }
      }
    }

    return { total, maxPossible };
  }

  function getAssignmentLockInfo(studentCount) {
    const fixedAssignments = new Map();
    const reservedSlots = new Set();

    state.tables.forEach((table, slotIndex) => {
      if (!table.locked) return;
      reservedSlots.add(slotIndex);
      if (table.id >= 1 && table.id <= studentCount) {
        fixedAssignments.set(table.id - 1, slotIndex);
      }
    });

    const movableStudents = Array.from({ length: studentCount }, (_, index) => index)
      .filter(index => !fixedAssignments.has(index));
    const availableSlots = Array.from({ length: state.tables.length }, (_, index) => index)
      .filter(index => !reservedSlots.has(index));

    return { fixedAssignments, reservedSlots, movableStudents, availableSlots };
  }

  function generateRandomAssignment(studentCount, tableCount, lockInfo = getAssignmentLockInfo(studentCount)) {
    const assignment = Array(studentCount).fill(null);
    for (const [studentIndex, slotIndex] of lockInfo.fixedAssignments) {
      assignment[studentIndex] = slotIndex;
    }

    const shuffledSlots = shuffle(lockInfo.availableSlots);
    lockInfo.movableStudents.forEach((studentIndex, index) => {
      assignment[studentIndex] = shuffledSlots[index];
    });
    return assignment;
  }

  function mutateAssignment(assignment, tableCount, lockInfo) {
    const candidate = assignment.slice();
    const studentCount = candidate.length;
    const movableStudents = lockInfo?.movableStudents || Array.from({ length: studentCount }, (_, index) => index);
    const reservedSlots = lockInfo?.reservedSlots || new Set();
    if (studentCount === 0 || movableStudents.length === 0) return candidate;

    if (tableCount > studentCount && Math.random() < 0.32) {
      const studentIndex = movableStudents[Math.floor(Math.random() * movableStudents.length)];
      const used = new Set(candidate);
      const freeTables = [];
      for (let i = 0; i < tableCount; i++) {
        if (!used.has(i) && !reservedSlots.has(i)) freeTables.push(i);
      }
      if (freeTables.length) {
        candidate[studentIndex] = freeTables[Math.floor(Math.random() * freeTables.length)];
        return candidate;
      }
    }

    if (movableStudents.length > 1) {
      let ai = Math.floor(Math.random() * movableStudents.length);
      let bi = Math.floor(Math.random() * movableStudents.length);
      while (bi === ai) bi = Math.floor(Math.random() * movableStudents.length);
      const a = movableStudents[ai];
      const b = movableStudents[bi];
      [candidate[a], candidate[b]] = [candidate[b], candidate[a]];
    }

    return candidate;
  }

  function setProgressVisual(percent) {
    const value = clamp(Number(percent) || 0, 0, 100);
    if (elements.progressFill) elements.progressFill.style.width = `${value}%`;
    if (elements.progressPercent) elements.progressPercent.textContent = `${Math.round(value)}%`;
    if (elements.progressTrack) elements.progressTrack.setAttribute('aria-valuenow', String(Math.round(value)));
  }

  function startCalculationProgress(label) {
    cancelPendingPageTopScroll();
    const token = ++state.progressSequence;
    if (state.progressSession?.timer) clearInterval(state.progressSession.timer);
    state.progressSession = {
      token,
      startedAt: performance.now(),
      reported: 0,
      completed: false,
      completionLabel: 'Completado',
      timer: null,
      onHidden: []
    };

    if (elements.calculationProgress) elements.calculationProgress.hidden = false;
    if (elements.progressLabel) elements.progressLabel.textContent = label;
    setProgressVisual(0);

    state.progressSession.timer = setInterval(() => {
      const session = state.progressSession;
      if (!session || session.token !== token) return;
      const elapsed = performance.now() - session.startedAt;

      if (session.completed) {
        if (elapsed < MIN_PROGRESS_VISIBLE_MS) {
          const synthetic = Math.min(96, (elapsed / MIN_PROGRESS_VISIBLE_MS) * 96);
          setProgressVisual(Math.max(session.reported, synthetic));
          return;
        }

        setProgressVisual(100);
        if (elements.progressLabel) elements.progressLabel.textContent = session.completionLabel;
        clearInterval(session.timer);
        session.timer = null;
        setTimeout(() => {
          if (state.progressSession?.token !== token) return;
          const completedSession = state.progressSession;
          if (elements.calculationProgress) elements.calculationProgress.hidden = true;
          state.progressSession = null;
          for (const callback of completedSession.onHidden.splice(0)) {
            try { callback(); } catch (error) { console.warn('No se pudo completar una acción posterior al progreso:', error); }
          }
        }, 300);
        return;
      }

      const synthetic = Math.min(70, (elapsed / MIN_PROGRESS_VISIBLE_MS) * 70);
      setProgressVisual(Math.max(session.reported, synthetic));
    }, 60);

    return token;
  }

  function reportCalculationProgress(token, percent, label = null) {
    const session = state.progressSession;
    if (!session || session.token !== token) return;
    session.reported = Math.max(session.reported, clamp(Number(percent) || 0, 0, 98));
    if (label && elements.progressLabel) elements.progressLabel.textContent = label;
    setProgressVisual(session.reported);
  }

  function finishCalculationProgress(token, completionLabel = 'Completado') {
    const session = state.progressSession;
    if (!session || session.token !== token) return;
    session.completed = true;
    session.completionLabel = completionLabel;
  }

  async function optimizeAssignment(studentCount, constraints, distanceMatrix, onProgress = null, options = {}) {
    const tableCount = state.tables.length;
    const lockInfo = getAssignmentLockInfo(studentCount);
    const complexity = Math.max(1, constraints.length + studentCount);
    const iterationsPerRestart = Math.min(18000, Math.max(5000, complexity * 260));
    const restarts = Number.isFinite(options.restarts) ? Math.max(1, Math.floor(options.restarts)) : (tableCount > 35 ? 4 : 5);
    let globalBest = null;
    const restartSolutions = [];
    let evaluated = 0;
    const totalIterations = iterationsPerRestart * restarts;

    for (let restart = 0; restart < restarts; restart++) {
      let current = generateRandomAssignment(studentCount, tableCount, lockInfo);
      let currentScore = calculateCost(current, constraints, distanceMatrix).total;
      let best = current.slice();
      let bestScore = currentScore;
      const initialTemp = Math.max(0.08, currentScore / Math.max(1, constraints.length * 4));

      for (let i = 0; i < iterationsPerRestart; i++) {
        const progress = i / iterationsPerRestart;
        const temperature = Math.max(0.0005, initialTemp * Math.pow(0.002, progress));
        const candidate = mutateAssignment(current, tableCount, lockInfo);
        const candidateScore = calculateCost(candidate, constraints, distanceMatrix).total;
        const delta = candidateScore - currentScore;

        if (delta <= 0 || Math.random() < Math.exp(-delta / temperature)) {
          current = candidate;
          currentScore = candidateScore;
          if (currentScore < bestScore) {
            best = current.slice();
            bestScore = currentScore;
          }
        }

        evaluated++;
        if (i > 0 && i % 3000 === 0) {
          if (onProgress) onProgress(evaluated / totalIterations);
          await new Promise(requestAnimationFrame);
        }
      }

      const restartSolution = { assignment: best.slice(), score: bestScore, evaluated };
      restartSolutions.push(restartSolution);
      if (!globalBest || bestScore < globalBest.score) {
        globalBest = { assignment: best.slice(), score: bestScore };
      }
      if (onProgress) onProgress(evaluated / totalIterations);
      await new Promise(requestAnimationFrame);
    }

    if (onProgress) onProgress(1);
    return { ...globalBest, evaluated, candidates: restartSolutions };
  }

  function applyPositionAssignment(assignment, studentCount, slotPositionsOverride = null) {
    // La solución asigna cada unidad persona-mesa a una POSICIÓN existente del espacio.
    // Mesa 1 siempre sigue siendo de la persona 1, mesa 2 de la persona 2, etc.
    // Las mesas bloqueadas reservan su posición y nunca se desplazan.
    const slotPositions = Array.isArray(slotPositionsOverride)
      ? slotPositionsOverride.map(position => ({
          xNorm: position.xNorm,
          yNorm: position.yNorm,
          rotation: position.rotation == null ? null : normalizeRotation(position.rotation)
        }))
      : captureAssignmentSlots();
    const applySlotRotation = layoutUsesSlotRotation();
    const lockInfo = getAssignmentLockInfo(studentCount);
    const usedSlots = new Set(lockInfo.reservedSlots);

    for (let studentIndex = 0; studentIndex < studentCount; studentIndex++) {
      const tableId = studentIndex + 1;
      const table = state.tables.find(item => item.id === tableId);
      const slotIndex = assignment[studentIndex];
      const slot = slotPositions[slotIndex];
      if (!table || !slot) continue;

      if (!table.locked) {
        table.xNorm = slot.xNorm;
        table.yNorm = slot.yNorm;
        if (applySlotRotation && slot.rotation != null) table.rotation = normalizeRotation(slot.rotation);
      }
      usedSlots.add(slotIndex);
    }

    // Si hay mesas libres, ocupan las posiciones que no hayan sido utilizadas
    // por las unidades persona-mesa. Las mesas libres bloqueadas tampoco cambian.
    const freeSlotIndexes = slotPositions
      .map((_, index) => index)
      .filter(index => !usedSlots.has(index));

    const extraTables = state.tables
      .filter(table => table.id > studentCount && !table.locked)
      .sort((a, b) => a.id - b.id);

    extraTables.forEach((table, index) => {
      const slot = slotPositions[freeSlotIndexes[index]];
      if (!slot) return;
      table.xNorm = slot.xNorm;
      table.yNorm = slot.yNorm;
      if (applySlotRotation && slot.rotation != null) table.rotation = normalizeRotation(slot.rotation);
    });

    renderTables();
  }

  function describeConstraint(c, assignment, distanceMatrix) {
    if (c.type === 'far' || c.type === 'together' || c.type === 'near') {
      const d = distanceMatrix[assignment[c.a - 1]][assignment[c.b - 1]];
      const satisfaction = c.type === 'far' ? d : 1 - d;
      return { raw: c.raw, satisfaction: clamp(satisfaction, 0, 1) };
    }

    if (c.type === 'front' || c.type === 'back') {
      const values = c.ids.map(id => {
        const y = state.tables[assignment[id - 1]].yNorm;
        return c.type === 'front' ? 1 - y : y;
      });
      const satisfaction = values.reduce((a, b) => a + b, 0) / values.length;
      return { raw: c.raw, satisfaction: clamp(satisfaction, 0, 1) };
    }

    if (c.type === 'left' || c.type === 'right') {
      const values = c.memberIds.map(id => {
        const slotIndex = assignment[id - 1];
        const x = slotIndex == null || !state.tables[slotIndex] ? 0.5 : state.tables[slotIndex].xNorm;
        return c.type === 'left' ? 1 - x : x;
      });
      const satisfaction = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 1;
      return { raw: c.raw, satisfaction: clamp(satisfaction, 0, 1) };
    }

    if (c.type === 'groupFar' || c.type === 'groupTogether' || c.type === 'groupNear') {
      const d = averageGroupDistance(c.membersA, c.membersB, assignment, distanceMatrix);
      if (d == null) return { raw: c.raw, satisfaction: 1 };
      const satisfaction = c.type === 'groupFar' ? d : 1 - d;
      return { raw: c.raw, satisfaction: clamp(satisfaction, 0, 1) };
    }

    if (c.type === 'groupFront') {
      return { raw: c.raw, satisfaction: clamp(1 - averageGroupY(c.groupMembers, assignment), 0, 1) };
    }

    if (c.type === 'groupBack') {
      const backSatisfaction = clamp(averageGroupY(c.groupMembers, assignment), 0, 1);
      if (c.groups.length < 2) return { raw: c.raw, satisfaction: backSatisfaction };
      const orderSatisfaction = 1 - orderedBackPenalty(c.groupMembers, assignment);
      const satisfaction = (
        backSatisfaction * GROUP_WEIGHTS.back +
        orderSatisfaction * GROUP_WEIGHTS.orderedBack
      ) / (GROUP_WEIGHTS.back + GROUP_WEIGHTS.orderedBack);
      return { raw: c.raw, satisfaction: clamp(satisfaction, 0, 1) };
    }

    if (c.type === 'cooperativeABBC') {
      const evaluation = evaluateCooperativeABBC(c, assignment);
      const satisfaction = evaluation.targetComplete > 0
        ? (evaluation.completeSatisfaction * COOPERATIVE_ABBC_WEIGHTS.composition + evaluation.patternSatisfaction * COOPERATIVE_ABBC_WEIGHTS.pattern) /
          (COOPERATIVE_ABBC_WEIGHTS.composition + COOPERATIVE_ABBC_WEIGHTS.pattern)
        : 1;
      return { raw: c.raw, satisfaction: clamp(satisfaction, 0, 1) };
    }

    return { raw: c.raw, satisfaction: 0 };
  }

  function joinNames(names) {
    if (!names.length) return '';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} y ${names[1]}`;
    return `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`;
  }

  function studentDisplayName(students, id) {
    return students[id - 1]?.displayName || `Persona ${id}`;
  }

  function humanizeConstraint(constraint, students) {
    if (constraint.type === 'left' || constraint.type === 'right') {
      const parts = constraint.ids.map(id => studentDisplayName(students, id));
      if (constraint.groups.length === 1) parts.push(`las personas del grupo ${constraint.groups[0]}`);
      else if (constraint.groups.length > 1) parts.push(`las personas de los grupos ${joinNames(constraint.groups)}`);
      const subject = joinNames(parts);
      const singular = constraint.memberIds.length === 1;
      const side = constraint.type === 'left' ? 'izquierda' : 'derecha';
      return `${subject} ${singular ? 'debe situarse' : 'deben situarse'} lo más a la ${side} posible.`;
    }
    if (constraint.type === 'cooperativeABBC') {
      return 'El esquema Cooperativo ABBC debe conservar el máximo número posible de equipos con 1 persona del grupo A, 2 de grupo B y 1 de grupo C.';
    }
    if (constraint.type === 'far') {
      return `${studentDisplayName(students, constraint.a)} no debe sentarse junto a ${studentDisplayName(students, constraint.b)}; debe quedar lo más lejos posible.`;
    }
    if (constraint.type === 'together') {
      return `${studentDisplayName(students, constraint.a)} se debe sentar junto a ${studentDisplayName(students, constraint.b)}.`;
    }
    if (constraint.type === 'near') {
      return `${studentDisplayName(students, constraint.a)} se debe sentar cerca de ${studentDisplayName(students, constraint.b)}.`;
    }
    if (constraint.type === 'groupFar') {
      if (constraint.groupA === constraint.groupB) {
        return `Las personas del grupo ${constraint.groupA} deben sentarse lo más alejadas posible unas de otras.`;
      }
      return `Las personas del grupo ${constraint.groupA} deben situarse lo más lejos posible de las personas del grupo ${constraint.groupB}.`;
    }
    if (constraint.type === 'groupTogether') {
      if (constraint.groupA === constraint.groupB) {
        return `Las personas del grupo ${constraint.groupA} deben sentarse lo más cerca posible unas de otras.`;
      }
      return `Las personas del grupo ${constraint.groupA} deben situarse lo más cerca posible de las personas del grupo ${constraint.groupB}.`;
    }
    if (constraint.type === 'groupNear') {
      if (constraint.groupA === constraint.groupB) {
        return `Las personas del grupo ${constraint.groupA} deberían sentarse relativamente cerca unas de otras.`;
      }
      return `Las personas del grupo ${constraint.groupA} deberían situarse relativamente cerca de las personas del grupo ${constraint.groupB}.`;
    }
    if (constraint.type === 'groupFront') {
      if (constraint.groups.length === 1) {
        return `Las personas del grupo ${constraint.groups[0]} deben situarse lo más adelante posible.`;
      }
      return `Las personas de los grupos ${joinNames(constraint.groups)} deben situarse lo más adelante posible.`;
    }
    if (constraint.type === 'groupBack') {
      const groups = constraint.groups;
      if (groups.length === 1) {
        return `Las personas del grupo ${groups[0]} deben situarse lo más atrás posible.`;
      }
      const order = groups.slice(1).map((group, index) => `el grupo ${group} quede detrás del grupo ${groups[index]}`).join(' y ');
      return `Los grupos ${joinNames(groups)} deben situarse en la parte trasera, procurando que ${order}.`;
    }

    const names = constraint.ids.map(id => studentDisplayName(students, id));
    const subject = joinNames(names);
    const singular = names.length === 1;
    if (constraint.type === 'front') {
      return `${subject} ${singular ? 'se debe sentar' : 'se deben sentar'} lo más adelante posible.`;
    }
    return `${subject} ${singular ? 'se debe sentar' : 'se deben sentar'} lo más atrás posible.`;
  }

  function satisfactionLabel(value) {
    const percent = Math.round(clamp(value, 0, 1) * 100);
    if (percent >= 85) return { text: `${percent}% · muy bien`, className: 'score-good' };
    if (percent >= 65) return { text: `${percent}% · razonable`, className: 'score-medium' };
    return { text: `${percent}% · mejorable`, className: 'score-low' };
  }

  function setOutputHtml(html) {
    if (!elements.outputContent) return;
    elements.outputContent.innerHTML = html;
  }

  function resetOutput() {
    setOutputHtml('<span class="output-placeholder">Aquí aparecerán los resultados y la explicación de las restricciones después de organizar el espacio.</span>');
  }

  function updateOutputVisibility() {
    if (!elements.outputContent || !elements.toggleOutputBtn) return;
    elements.outputContent.hidden = state.outputCollapsed;
    elements.toggleOutputBtn.textContent = state.outputCollapsed ? 'Mostrar' : 'Ocultar';
    elements.toggleOutputBtn.setAttribute('aria-expanded', String(!state.outputCollapsed));
  }

  function toggleOutputVisibility() {
    state.outputCollapsed = !state.outputCollapsed;
    updateOutputVisibility();
    saveStateSoon();
  }

  function renderConstraintSummary(students, constraints, solution, distanceMatrix, contradictions = []) {
    if (!solution) {
      resetOutput();
      return;
    }

    const scoreInfo = calculateCost(solution.assignment, constraints, distanceMatrix);
    const quality = scoreInfo.maxPossible
      ? Math.max(0, Math.round((1 - scoreInfo.total / scoreInfo.maxPossible) * 100))
      : 100;

    if (!constraints.length) {
      setOutputHtml(
        `<div class="output-summary-head"><strong>Organización completada.</strong><span>No se han indicado restricciones.</span></div>` +
        `<div class="output-note">La distribución se ha generado sin criterios de proximidad, distancia, delante o detrás.</div>`
      );
      return;
    }

    const items = constraints.map(constraint => {
      const description = describeConstraint(constraint, solution.assignment, distanceMatrix);
      const score = satisfactionLabel(description.satisfaction);
      return `<li>${escapeHtml(humanizeConstraint(constraint, students))} <span class="constraint-score ${score.className}">${escapeHtml(score.text)}</span></li>`;
    }).join('');

    const warning = contradictions.length
      ? `<div class="output-note"><strong>Aviso:</strong> ${escapeHtml(contradictions.join(' '))}</div>`
      : '';

    setOutputHtml(
      `<div class="output-summary-head"><strong>Resumen de la organización</strong><span>Calidad global: ${quality}%</span><span>${constraints.length} restricción${constraints.length === 1 ? '' : 'es'}</span></div>` +
      `<ul class="output-list">${items}</ul>${warning}`
    );
  }

  function renderRandomOutput() {
    setOutputHtml(
      '<div class="output-summary-head"><strong>Distribución aleatoria aplicada.</strong></div>' +
      '<div class="output-note">Las restricciones no se han utilizado para generar esta distribución.</div>'
    );
  }

  function renderSolution(solution, constraints, distanceMatrix) {
    if (!solution) {
      hideSolution();
      return;
    }

    const scoreInfo = calculateCost(solution.assignment, constraints, distanceMatrix);
    const quality = scoreInfo.maxPossible
      ? Math.max(0, Math.round((1 - scoreInfo.total / scoreInfo.maxPossible) * 100))
      : 100;

    const weakest = constraints
      .map(c => describeConstraint(c, solution.assignment, distanceMatrix))
      .sort((a, b) => a.satisfaction - b.satisfaction)
      .slice(0, 3)
      .filter(item => item.satisfaction < 0.72);

    elements.solutionPanel.innerHTML = [
      `<span><strong>Calidad:</strong> ${quality}%</span>`,
      `<span><strong>Coste:</strong> ${scoreInfo.total.toFixed(3)}</span>`,
      `<span><strong>Restricciones:</strong> ${constraints.length}</span>`,
      `<span><strong>Evaluaciones:</strong> ${solution.evaluated.toLocaleString('es-ES')}</span>`,
      ...(weakest.length ? [`<span><strong>A mejorar:</strong> ${weakest.map(item => `${escapeHtml(item.raw)} (${Math.round(item.satisfaction * 100)}%)`).join(' · ')}</span>`] : [])
    ].join('');
    elements.solutionPanel.hidden = false;
  }

  function hideSolution() {
    elements.solutionPanel.hidden = true;
    elements.solutionPanel.innerHTML = '';
    resetOutput();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
    }[char]));
  }

  function getPdfExportColors() {
    const styles = getComputedStyle(document.body);
    const read = name => styles.getPropertyValue(name).trim();
    return {
      room: read('--room') || '#ffffff',
      grid: read('--room-grid') || 'rgba(0,0,0,.04)',
      table: read('--table') || '#ffffff',
      tableBorder: read('--table-border') || '#171717',
      tableText: read('--table-text') || '#171717',
      muted: read('--muted') || '#686868',
      zoneBorder: read('--muted') || '#686868',
      zoneFill: read('--surface-2') || '#f1f1ef'
    };
  }

  function fitCanvasText(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    const ellipsis = '…';
    let value = text;
    while (value.length > 1 && ctx.measureText(`${value}${ellipsis}`).width > maxWidth) {
      value = value.slice(0, -1);
    }
    return `${value}${ellipsis}`;
  }

  function renderClassroomToCanvas() {
    const sourceWidth = Math.max(1, elements.classroom.clientWidth);
    const sourceHeight = Math.max(1, elements.classroom.clientHeight);
    const exportWidth = 1600;
    const roomExportHeight = Math.max(1, Math.round(exportWidth * sourceHeight / sourceWidth));
    const spaceTitle = String(state.spaceName || '').trim();
    const titleAreaHeight = spaceTitle ? 86 : 0;
    const exportHeight = roomExportHeight + titleAreaHeight;
    const scaleX = exportWidth / sourceWidth;
    const scaleY = roomExportHeight / sourceHeight;
    const colors = getPdfExportColors();
    const students = parseStudents();
    const studentMap = new Map(students.map(student => [student.id, student]));

    const canvas = document.createElement('canvas');
    canvas.width = exportWidth;
    canvas.height = exportHeight;
    const ctx = canvas.getContext('2d', { alpha: false });

    ctx.fillStyle = colors.room;
    ctx.fillRect(0, 0, exportWidth, exportHeight);

    if (spaceTitle) {
      ctx.fillStyle = colors.tableText;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '700 34px Arial, sans-serif';
      ctx.fillText(fitCanvasText(ctx, spaceTitle, exportWidth - 80), exportWidth / 2, titleAreaHeight / 2);
    }

    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = Math.max(1, scaleX);
    ctx.beginPath();
    const gridX = 32 * scaleX;
    const gridY = 32 * scaleY;
    for (let x = gridX; x < exportWidth; x += gridX) {
      ctx.moveTo(Math.round(x) + 0.5, titleAreaHeight);
      ctx.lineTo(Math.round(x) + 0.5, exportHeight);
    }
    for (let y = gridY; y < roomExportHeight; y += gridY) {
      const shiftedY = titleAreaHeight + y;
      ctx.moveTo(0, Math.round(shiftedY) + 0.5);
      ctx.lineTo(exportWidth, Math.round(shiftedY) + 0.5);
    }
    ctx.stroke();

    // Las zonas protegidas forman parte de la estructura física del espacio y se exportan detrás de las mesas.
    ctx.save();
    ctx.setLineDash([9 * scaleX, 6 * scaleX]);
    ctx.lineWidth = Math.max(1.5, scaleX);
    for (const zone of state.zones) {
      const rect = zonePixelRect(zone, sourceWidth, sourceHeight);
      const left = rect.left * scaleX;
      const top = titleAreaHeight + rect.top * scaleY;
      const width = rect.width * scaleX;
      const height = rect.height * scaleY;
      ctx.fillStyle = colors.zoneFill;
      ctx.fillRect(left, top, width, height);
      ctx.strokeStyle = colors.zoneBorder;
      ctx.strokeRect(left, top, width, height);
      ctx.fillStyle = colors.muted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `700 ${Math.max(12, 9 * Math.min(scaleX, scaleY))}px Arial, sans-serif`;
      ctx.fillText('ZONA PROTEGIDA', left + width / 2, top + height / 2);
    }
    ctx.restore();

    const tableWidth = state.tableWidth * scaleX;
    const tableHeight = state.tableHeight * scaleY;
    const halfW = tableWidth / 2;
    const halfH = tableHeight / 2;

    for (const table of state.tables) {
      const student = studentMap.get(table.id);
      const rotation = normalizeRotation(table.rotation);
      const quarterTurn = rotation === 90 || rotation === 270;
      const visualHalfW = quarterTurn ? halfH : halfW;
      const visualHalfH = quarterTurn ? halfW : halfH;
      const cx = clamp(table.xNorm * exportWidth, visualHalfW, exportWidth - visualHalfW);
      const cy = titleAreaHeight + clamp(table.yNorm * roomExportHeight, visualHalfH, roomExportHeight - visualHalfH);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation * Math.PI / 180);
      const left = -halfW;
      const top = -halfH;

      ctx.fillStyle = colors.table;
      ctx.fillRect(left, top, tableWidth, tableHeight);
      ctx.strokeStyle = colors.tableBorder;
      ctx.lineWidth = Math.max(1.5, scaleX);
      ctx.strokeRect(left, top, tableWidth, tableHeight);

      ctx.fillStyle = colors.muted;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.font = `500 ${Math.max(12, 9 * scaleX)}px Arial, sans-serif`;
      ctx.fillText(String(table.id), left + 5 * scaleX, top + 4 * scaleY);

      const label = student ? student.displayName : 'Libre';
      ctx.fillStyle = student ? colors.tableText : colors.muted;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `600 ${Math.max(15, 12 * Math.min(scaleX, scaleY))}px Arial, sans-serif`;
      const fitted = fitCanvasText(ctx, label, Math.max(10, tableWidth - 12 * scaleX));
      ctx.fillText(fitted, 0, 1 * scaleY);
      ctx.restore();
    }

    ctx.strokeStyle = colors.tableBorder;
    ctx.lineWidth = Math.max(1.5, scaleX);
    ctx.strokeRect(0.75 * scaleX, titleAreaHeight + 0.75 * scaleY, exportWidth - 1.5 * scaleX, roomExportHeight - 1.5 * scaleY);

    return canvas;
  }

  function asciiBytes(value) {
    return new TextEncoder().encode(value);
  }

  function concatBytes(parts) {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
      output.set(part, offset);
      offset += part.length;
    }
    return output;
  }

  function dataUrlToBytes(dataUrl) {
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function buildSinglePageA4Pdf(jpegBytes, imageWidth, imageHeight) {
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const margin = 24;
    const availableWidth = pageWidth - margin * 2;
    const availableHeight = pageHeight - margin * 2;
    const scale = Math.min(availableWidth / imageWidth, availableHeight / imageHeight);
    const drawWidth = imageWidth * scale;
    const drawHeight = imageHeight * scale;
    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;
    const content = `q\n${drawWidth.toFixed(3)} 0 0 ${drawHeight.toFixed(3)} ${x.toFixed(3)} ${y.toFixed(3)} cm\n/Im0 Do\nQ\n`;
    const contentBytes = asciiBytes(content);

    const objects = [
      null,
      asciiBytes('<< /Type /Catalog /Pages 2 0 R >>'),
      asciiBytes('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),
      asciiBytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>`),
      concatBytes([
        asciiBytes(`<< /Length ${contentBytes.length} >>\nstream\n`),
        contentBytes,
        asciiBytes('endstream')
      ]),
      concatBytes([
        asciiBytes(`<< /Type /XObject /Subtype /Image /Width ${imageWidth} /Height ${imageHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`),
        jpegBytes,
        asciiBytes('\nendstream')
      ])
    ];

    const parts = [asciiBytes('%PDF-1.4\n')];
    const offsets = new Array(objects.length).fill(0);
    let length = parts[0].length;

    for (let id = 1; id < objects.length; id++) {
      offsets[id] = length;
      const objectBytes = concatBytes([
        asciiBytes(`${id} 0 obj\n`),
        objects[id],
        asciiBytes('\nendobj\n')
      ]);
      parts.push(objectBytes);
      length += objectBytes.length;
    }

    const xrefOffset = length;
    let xref = `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let id = 1; id < objects.length; id++) {
      xref += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
    }
    xref += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    parts.push(asciiBytes(xref));

    return concatBytes(parts);
  }

  function downloadClassroomPdf() {
    const originalText = elements.downloadPdfBtn.textContent;
    elements.downloadPdfBtn.disabled = true;
    elements.downloadPdfBtn.textContent = 'Preparando…';

    try {
      const canvas = renderClassroomToCanvas();
      const jpegBytes = dataUrlToBytes(canvas.toDataURL('image/jpeg', 0.96));
      const pdfBytes = buildSinglePageA4Pdf(jpegBytes, canvas.width, canvas.height);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ubicapp-plano.pdf';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showMessage('Plano descargado en PDF A4 vertical.', 'success');
    } catch (error) {
      console.error('No se pudo generar el PDF:', error);
      showMessage('No se pudo generar el PDF del plano.', 'error');
    } finally {
      elements.downloadPdfBtn.disabled = false;
      elements.downloadPdfBtn.textContent = originalText;
    }
  }

  function showMessage(text, type = 'error') {
    elements.message.textContent = text;
    elements.message.className = `message ${type}`;
    elements.message.hidden = !text;
  }

  function clearMessage() {
    elements.message.hidden = true;
    elements.message.textContent = '';
  }

  function renderStudentErrors(errors) {
    if (!elements.studentErrors) return;
    if (!errors.length) {
      elements.studentErrors.hidden = true;
      elements.studentErrors.innerHTML = '';
      return;
    }

    elements.studentErrors.innerHTML = `<ul>${errors.map(error => `<li>${escapeHtml(error)}</li>`).join('')}</ul>`;
    elements.studentErrors.hidden = false;
  }

  function renderConstraintErrors(errors) {
    if (!errors.length) {
      elements.constraintErrors.hidden = true;
      elements.constraintErrors.innerHTML = '';
      return;
    }

    elements.constraintErrors.innerHTML = `<ul>${errors.map(error => `<li>${escapeHtml(error)}</li>`).join('')}</ul>`;
    elements.constraintErrors.hidden = false;
  }

  function validateForSolve() {
    const students = parseStudents();
    const parsed = parseConstraints(students);
    const studentErrors = getStudentGroupErrors(students);
    const inputErrors = [...studentErrors, ...parsed.errors];
    renderStudentErrors(studentErrors);
    renderConstraintErrors(parsed.errors);

    if (!students.length) {
      showMessage('Añade al menos una persona.', 'error');
      return null;
    }

    if (students.length > state.tables.length) {
      showMessage(`Hay ${students.length} personas y solo ${state.tables.length} mesas. Añade al menos ${students.length - state.tables.length} mesa(s).`, 'error');
      return null;
    }

    const tableIds = new Set(state.tables.map(table => table.id));
    const missingTableIds = students
      .map(student => student.id)
      .filter(studentId => !tableIds.has(studentId));
    if (missingTableIds.length) {
      showMessage(`Falta(n) la(s) mesa(s) ${missingTableIds.join(', ')}. Cada persona debe conservar la mesa con su mismo número.`, 'error');
      return null;
    }

    if (inputErrors.length) {
      showMessage('Corrige las etiquetas de grupo o las restricciones marcadas antes de organizar.', 'error');
      return null;
    }

    const contradictions = findContradictions(parsed.constraints);
    if (contradictions.length) {
      showMessage(`Aviso: ${contradictions.join(' ')}`, 'warning');
    } else {
      clearMessage();
    }

    return { students, constraints: parsed.constraints, contradictions };
  }

  async function organize() {
    const valid = validateForSolve();
    if (!valid) return;

    clearAlternatives();
    const wantAlternatives = alternativesEnabled();
    const slotPositions = captureAssignmentSlots();
    const progressToken = startCalculationProgress(wantAlternatives ? 'Generando alternativas…' : 'Buscando una buena distribución…');
    elements.organizeBtn.disabled = true;
    elements.randomizeBtn.disabled = true;
    const oldText = elements.organizeBtn.textContent;
    elements.organizeBtn.textContent = 'Organizando…';

    // Da al navegador la oportunidad de pintar la barra antes de iniciar el cálculo.
    await new Promise(requestAnimationFrame);

    try {
      const distanceMatrix = calculateDistanceMatrix();
      const cooperativeConstraint = buildCooperativeABBCConstraint(valid.students);
      const solverConstraints = cooperativeConstraint
        ? [...valid.constraints, cooperativeConstraint]
        : valid.constraints;
      let solution;
      let alternatives = [];

      if (solverConstraints.length === 0) {
        if (wantAlternatives) {
          reportCalculationProgress(progressToken, 52, 'Generando tres distribuciones…');
          const candidates = [];
          const seen = new Set();
          for (let attempt = 0; attempt < 24 && candidates.length < 3; attempt++) {
            const assignment = generateRandomAssignment(valid.students.length, state.tables.length, getAssignmentLockInfo(valid.students.length));
            const signature = assignmentSignature(assignment);
            if (seen.has(signature)) continue;
            seen.add(signature);
            candidates.push({ assignment, score: 0, evaluated: 1, quality: null });
          }
          alternatives = candidates;
          solution = alternatives[0];
        } else {
          reportCalculationProgress(progressToken, 70, 'Generando distribución…');
          solution = {
            assignment: generateRandomAssignment(valid.students.length, state.tables.length, getAssignmentLockInfo(valid.students.length)),
            score: 0,
            evaluated: 1
          };
        }
      } else {
        solution = await optimizeAssignment(
          valid.students.length,
          solverConstraints,
          distanceMatrix,
          ratio => reportCalculationProgress(
            progressToken,
            ratio * 96,
            wantAlternatives
              ? 'Buscando alternativas distintas…'
              : (cooperativeConstraint ? 'Optimizando restricciones y equipos ABBC…' : 'Optimizando restricciones…')
          ),
          wantAlternatives ? { restarts: state.tables.length > 35 ? 8 : 10 } : {}
        );
        if (wantAlternatives) {
          alternatives = selectDiverseAlternatives(solution.candidates || [solution], 3, valid.students.length)
            .map(candidate => ({
              ...candidate,
              quality: solutionQuality(candidate, solverConstraints, distanceMatrix)
            }));
          solution = alternatives[0] || solution;
        }
      }

      if (wantAlternatives && alternatives.length) {
        setAlternatives(alternatives, slotPositions, {
          mode: 'organized',
          students: valid.students,
          constraints: solverConstraints,
          distanceMatrix,
          contradictions: valid.contradictions
        });
        applyAlternative(0);
        if (alternatives.length < 3) {
          showMessage(`Se han encontrado ${alternatives.length} alternativa(s) suficientemente distinta(s).`, 'warning');
        } else if (!valid.contradictions.length) {
          showMessage('Se han generado 3 alternativas distintas. Selecciona A, B o C para compararlas.', 'success');
        }
      } else {
        renderSolution(solution, solverConstraints, distanceMatrix);
        renderConstraintSummary(valid.students, solverConstraints, solution, distanceMatrix, valid.contradictions);
        applyPositionAssignment(solution.assignment, valid.students.length, slotPositions);
        if (!valid.contradictions.length) showMessage('Organización calculada: cada persona conserva su mismo número de mesa.', 'success');
      }

      state.layoutActive = false;
      state.lastSolution = null;
      saveStateSoon();
      finishCalculationProgress(progressToken, wantAlternatives ? 'Alternativas generadas' : 'Distribución completada');
      scheduleScrollAfterProgress(progressToken);
    } catch (error) {
      finishCalculationProgress(progressToken, 'No se pudo completar');
      throw error;
    } finally {
      elements.organizeBtn.textContent = oldText;
      updateUIState();
    }
  }

  function randomize() {
    const students = parseStudents();
    if (!students.length) {
      showMessage('Añade al menos una persona.', 'error');
      return;
    }
    if (students.length > state.tables.length) {
      showMessage(`Hay ${students.length} personas y solo ${state.tables.length} mesas.`, 'error');
      return;
    }

    const tableIds = new Set(state.tables.map(table => table.id));
    const missingTableIds = students.map(student => student.id).filter(id => !tableIds.has(id));
    if (missingTableIds.length) {
      showMessage(`Falta(n) la(s) mesa(s) ${missingTableIds.join(', ')}. Cada persona debe conservar la mesa con su mismo número.`, 'error');
      return;
    }

    clearAlternatives();
    const wantAlternatives = alternativesEnabled();
    const slotPositions = captureAssignmentSlots();
    const progressToken = startCalculationProgress(wantAlternatives ? 'Generando alternativas aleatorias…' : 'Generando distribución aleatoria…');
    reportCalculationProgress(progressToken, 28);

    if (wantAlternatives) {
      const candidates = [];
      const seen = new Set();
      for (let attempt = 0; attempt < 30 && candidates.length < 3; attempt++) {
        const assignment = generateRandomAssignment(students.length, state.tables.length, getAssignmentLockInfo(students.length));
        const signature = assignmentSignature(assignment);
        if (seen.has(signature)) continue;
        seen.add(signature);
        candidates.push({ assignment, score: 0, evaluated: 1, quality: null });
      }
      setAlternatives(candidates, slotPositions, { mode: 'random', students });
      if (candidates.length) applyAlternative(0);
      showMessage(`${candidates.length} alternativa(s) aleatoria(s) generada(s).`, 'success');
    } else {
      const assignment = generateRandomAssignment(students.length, state.tables.length, getAssignmentLockInfo(students.length));
      applyPositionAssignment(assignment, students.length, slotPositions);
      hideSolution();
      renderRandomOutput();
      showMessage('Posiciones aleatorias aplicadas manteniendo cada pareja persona-mesa.', 'success');
    }

    state.layoutActive = false;
    state.lastSolution = null;
    saveStateSoon();
    reportCalculationProgress(progressToken, 72);
    finishCalculationProgress(progressToken, wantAlternatives ? 'Alternativas generadas' : 'Distribución completada');
    scheduleScrollAfterProgress(progressToken);
  }

  function updateUIState() {
    const students = parseStudents();
    const parsed = parseConstraints(students);
    const studentErrors = getStudentGroupErrors(students);
    const inputErrors = [...studentErrors, ...parsed.errors];
    const nonEmptyConstraintLines = elements.constraintsInput.value
      .split(/\r?\n/)
      .filter(line => {
        const trimmed = line.trim();
        return trimmed && !trimmed.startsWith('#');
      }).length;

    elements.studentCountBadge.textContent = String(students.length);
    elements.constraintCountBadge.textContent = String(nonEmptyConstraintLines);
    elements.metrics.innerHTML = `
      <span>${state.tables.length} mesas</span>
      <span>${students.length} personas</span>
      <span>${nonEmptyConstraintLines} restricciones</span>
    `;

    const tableIds = new Set(state.tables.map(table => table.id));
    const missingRequiredTable = students.some(student => !tableIds.has(student.id));
    const insufficientTables = students.length > state.tables.length || students.length === 0 || missingRequiredTable;
    elements.organizeBtn.disabled = insufficientTables || inputErrors.length > 0;
    elements.randomizeBtn.disabled = insufficientTables;
    elements.clearTablesBtn.disabled = state.tables.length === 0;
    updateDeleteButton();
    renderStudentErrors(studentErrors);
    renderConstraintErrors(parsed.errors);
  }

  function syncHelpFrameTheme() {
    if (!elements.helpFrame) return;
    try {
      const frameBody = elements.helpFrame.contentDocument?.body;
      if (frameBody) frameBody.dataset.theme = state.theme;
    } catch (_) {
      // help.html reads the saved theme itself if direct frame access is unavailable.
    }
  }

  function setBackgroundInert(inert) {
    const targets = [document.querySelector('.info-bar'), document.querySelector('.app-shell'), document.querySelector('.site-footer')].filter(Boolean);
    for (const target of targets) {
      if ('inert' in target) target.inert = inert;
      if (inert) target.setAttribute('aria-hidden', 'true');
      else target.removeAttribute('aria-hidden');
    }
  }

  function openHelpModal() {
    if (!elements.helpModal || state.helpModalOpen) return;
    state.helpModalOpen = true;
    state.helpReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : elements.helpOpenBtn;
    state.helpReturnFocus?.blur?.();

    elements.helpModal.hidden = false;
    document.body.classList.add('help-modal-open');
    setBackgroundInert(true);

    if (elements.helpFrame && !elements.helpFrame.getAttribute('src')) {
      elements.helpFrame.setAttribute('src', elements.helpFrame.dataset.src || 'help.html?embedded=1');
    } else {
      try {
        elements.helpFrame?.contentWindow?.scrollTo(0, 0);
      } catch (_) {}
    }

    requestAnimationFrame(() => {
      syncHelpFrameTheme();
      elements.helpCloseBtn?.focus();
    });
  }

  function closeHelpModal() {
    if (!elements.helpModal || !state.helpModalOpen) return;
    state.helpModalOpen = false;
    elements.helpModal.hidden = true;
    document.body.classList.remove('help-modal-open');
    setBackgroundInert(false);

    const focusTarget = state.helpReturnFocus && document.contains(state.helpReturnFocus)
      ? state.helpReturnFocus
      : elements.helpOpenBtn;
    state.helpReturnFocus = null;
    requestAnimationFrame(() => focusTarget?.focus());
  }

  function onHelpModalBackdropClick(event) {
    if (event.target === elements.helpModal) closeHelpModal();
  }

  function onHelpModalKeyDown(event) {
    if (!state.helpModalOpen) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeHelpModal();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusables = [elements.helpCloseBtn, elements.helpFrame].filter(
      element => element && !element.hidden && !element.disabled
    );
    if (!focusables.length) {
      event.preventDefault();
      elements.helpModalDialog?.focus();
      return;
    }

    const currentIndex = focusables.indexOf(document.activeElement);
    if (event.shiftKey && currentIndex <= 0) {
      event.preventDefault();
      focusables[focusables.length - 1].focus();
    } else if (!event.shiftKey && currentIndex === focusables.length - 1) {
      event.preventDefault();
      focusables[0].focus();
    }
  }

  function setTheme(theme) {
    const allowed = ['light', 'dark', 'blue', 'warm'];
    state.theme = allowed.includes(theme) ? theme : 'light';
    document.body.dataset.theme = state.theme;
    elements.themeSelect.value = state.theme;
    syncHelpFrameTheme();
  }

  function saveStateSoon() {
    clearTimeout(state.saveTimer);
    elements.saveStatus.textContent = 'Guardando…';
    state.saveTimer = setTimeout(() => {
      const payload = {
        version: 3,
        tables: state.tables,
        tableWidth: state.tableWidth,
        tableHeight: state.tableHeight,
        theme: state.theme,
        spaceLayout: state.spaceLayout,
        layoutActive: state.layoutActive,
        students: elements.studentsInput.value,
        constraints: elements.constraintsInput.value,
        lastSolution: state.lastSolution,
        outputCollapsed: state.outputCollapsed,
        cooperativeBlockPositions: state.cooperativeBlockPositions,
        zones: state.zones,
        examplePreset: state.examplePreset,
        spaceName: state.spaceName
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      elements.saveStatus.textContent = 'Guardado';
      setTimeout(() => {
        if (elements.saveStatus.textContent === 'Guardado') elements.saveStatus.textContent = 'Listo';
      }, 1000);
    }, 180);
  }

  function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return false;

    try {
      const saved = JSON.parse(raw);
      if (!Array.isArray(saved.tables)) return false;

      state.tables = saved.tables
        .filter(table => Number.isFinite(table.id) && Number.isFinite(table.xNorm) && Number.isFinite(table.yNorm))
        .map(table => ({
          id: Number(table.id),
          xNorm: clamp(Number(table.xNorm), 0, 1),
          yNorm: clamp(Number(table.yNorm), 0, 1),
          rotation: normalizeRotation(table.rotation),
          locked: Boolean(table.locked)
        }));

      state.tableWidth = clamp(Number(saved.tableWidth) || INITIAL_TABLE_WIDTH, MIN_TABLE_WIDTH, MAX_TABLE_WIDTH);
      state.tableHeight = clamp(Number(saved.tableHeight) || INITIAL_TABLE_HEIGHT, 36, 88);
      state.lastSolution = null;
      state.selectedTableId = null;
      state.selectedTableIds.clear();
      elements.studentsInput.value = numberStudentLines(typeof saved.students === 'string' ? saved.students : defaultStudentsText());
      state.examplePreset = detectExamplePreset(elements.studentsInput.value);
      if (elements.exampleSelect) elements.exampleSelect.value = state.examplePreset;
      elements.constraintsInput.value = typeof saved.constraints === 'string' ? saved.constraints : '';
      state.spaceName = typeof saved.spaceName === 'string' ? saved.spaceName : '';
      if (elements.spaceNameInput) elements.spaceNameInput.value = state.spaceName;
      updateSpaceNameDisplay();
      setTheme(saved.theme || 'light');
      state.spaceLayout = Object.prototype.hasOwnProperty.call(SPACE_LAYOUT_LABELS, saved.spaceLayout) ? saved.spaceLayout : DEFAULT_SPACE_LAYOUT;
      state.layoutActive = state.spaceLayout === 'manual' ? false : (typeof saved.layoutActive === 'boolean' ? saved.layoutActive : false);
      state.outputCollapsed = Boolean(saved.outputCollapsed);
      state.zones = Array.isArray(saved.zones)
        ? saved.zones.filter(zone => Number.isFinite(zone.id) && Number.isFinite(zone.xNorm) && Number.isFinite(zone.yNorm) && Number.isFinite(zone.widthNorm) && Number.isFinite(zone.heightNorm))
            .map(zone => ({
              id: Number(zone.id),
              xNorm: clamp(Number(zone.xNorm), 0, 1),
              yNorm: clamp(Number(zone.yNorm), 0, 1),
              widthNorm: clamp(Number(zone.widthNorm), 0.01, 1),
              heightNorm: clamp(Number(zone.heightNorm), 0.01, 1)
            }))
        : [];
      state.selectedZoneId = null;
      state.zoneMode = false;
      state.zoneDraft = null;
      state.zoneDragging = null;
      state.cooperativeBlockPositions = Array.isArray(saved.cooperativeBlockPositions)
        ? saved.cooperativeBlockPositions.map(block => Array.isArray(block)
          ? block.filter(position => position && Number.isFinite(position.xNorm) && Number.isFinite(position.yNorm))
              .map(position => ({ xNorm: clamp(Number(position.xNorm), 0, 1), yNorm: clamp(Number(position.yNorm), 0, 1) }))
          : []).filter(block => block.length === 4)
        : [];
      if (elements.layoutSelect) elements.layoutSelect.value = state.spaceLayout;
      return true;
    } catch (error) {
      console.warn('No se pudo restaurar UbicApp:', error);
      return false;
    }
  }

  function prepareDidacticInitialState() {
    hideTableTooltip();
    clearAlternatives();
    makeInitialTables();
    elements.studentsInput.value = cooperativeStudentsText();
    state.examplePreset = 'cooperative';
    if (elements.exampleSelect) elements.exampleSelect.value = state.examplePreset;
    elements.constraintsInput.value = DIDACTIC_CONSTRAINTS_TEXT;
    state.spaceName = '';
    if (elements.spaceNameInput) elements.spaceNameInput.value = '';
    if (elements.personSearchInput) elements.personSearchInput.value = '';
    updateSpaceNameDisplay();
    state.spaceLayout = DIDACTIC_SPACE_LAYOUT;
    state.layoutActive = true;
    state.outputCollapsed = false;
    state.cooperativeBlockPositions = [];
    state.zones = [];
    state.selectedZoneId = null;
    state.selectedTableId = null;
    state.selectedTableIds.clear();
    setZoneMode(false);
    state.lastSolution = null;
    if (elements.layoutSelect) elements.layoutSelect.value = DIDACTIC_SPACE_LAYOUT;
    if (elements.generateAlternativesCheckbox) elements.generateAlternativesCheckbox.checked = true;
    clearMessage();
    hideSolution();
    applySpaceLayout(DIDACTIC_SPACE_LAYOUT, { message: false, save: false, scroll: false });
    updateOutputVisibility();
    updateExampleSelect();
    updateUIState();
  }

  function runDidacticInitialOrganize() {
    void organize().catch(error => {
      console.error('No se pudo organizar el ejemplo ABC:', error);
      showMessage('No se pudo completar la organización del ejemplo ABC.', 'error');
    });
  }

  function currentWorkspaceHasContent() {
    return Boolean(
      state.tables.length ||
      state.zones.length ||
      String(elements.studentsInput?.value || '').trim() ||
      String(elements.constraintsInput?.value || '').trim() ||
      String(state.spaceName || '').trim() ||
      state.alternatives.length
    );
  }

  function viewDidacticExample() {
    if (
      currentWorkspaceHasContent() &&
      !window.confirm('¿Quieres cargar el ejemplo y sustituir el contenido actual?')
    ) return;

    cancelPendingPageTopScroll();
    prepareDidacticInitialState();
    saveStateSoon();
    runDidacticInitialOrganize();
  }

  function prepareEmptyWorkspace(options = {}) {
    cancelPendingPageTopScroll();
    hideTableTooltip();
    clearAlternatives({ uncheck: true });

    state.tables = [];
    state.tableWidth = INITIAL_TABLE_WIDTH;
    state.tableHeight = INITIAL_TABLE_HEIGHT;
    state.spaceLayout = DEFAULT_SPACE_LAYOUT;
    state.layoutActive = false;
    state.lastSolution = null;
    state.selectedTableId = null;
    state.selectedTableIds.clear();
    state.cooperativeBlockPositions = [];
    state.zones = [];
    state.selectedZoneId = null;
    state.zoneDraft = null;
    state.zoneDragging = null;
    state.outputCollapsed = false;
    state.examplePreset = 'custom';
    state.spaceName = '';

    setZoneMode(false);

    elements.studentsInput.value = '';
    elements.constraintsInput.value = '';
    if (elements.spaceNameInput) elements.spaceNameInput.value = '';
    if (elements.personSearchInput) elements.personSearchInput.value = '';
    if (elements.exampleSelect) elements.exampleSelect.value = 'custom';
    if (elements.layoutSelect) elements.layoutSelect.value = DEFAULT_SPACE_LAYOUT;
    if (elements.generateAlternativesCheckbox) elements.generateAlternativesCheckbox.checked = false;

    updateSpaceNameDisplay();
    clearMessage();
    hideSolution();
    resetOutput();
    updateOutputVisibility();
    renderTables();
    updateExampleSelect();
    updateUIState();
    updateDeleteButton();

    if (options.save) saveStateSoon();
  }

  function newWorkspace() {
    if (!window.confirm('¿Quieres crear un nuevo espacio? Se eliminará la configuración actual.')) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    prepareEmptyWorkspace({ save: true });
  }

  function onStudentsChanged() {
    hideTableTooltip();
    clearAlternatives();
    state.lastSolution = null;
    updateExampleSelect();
    renderTables();
    hideSolution();
    updateUIState();
    saveStateSoon();
  }

  function onConstraintsChanged() {
    hideTableTooltip();
    clearAlternatives();
    state.lastSolution = null;
    hideSolution();
    updateUIState();
    saveStateSoon();
  }

  function scrollToPeopleList() {
    cancelPendingPageTopScroll();
    elements.peoplePanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function scrollToWorkspace() {
    cancelPendingPageTopScroll();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function hasEffectiveConstraints() {
    return String(elements.constraintsInput?.value || '')
      .split(/\r?\n/)
      .some(line => {
        const trimmed = line.trim();
        return Boolean(trimmed && !trimmed.startsWith('#'));
      });
  }

  async function applyLayoutFromSelector(layoutName) {
    const layout = Object.prototype.hasOwnProperty.call(SPACE_LAYOUT_LABELS, layoutName)
      ? layoutName
      : DEFAULT_SPACE_LAYOUT;

    if (layout === 'manual') {
      applySpaceLayout(layout);
      return;
    }

    const shouldOrganize = hasEffectiveConstraints();
    applySpaceLayout(layout, { scroll: !shouldOrganize });

    if (shouldOrganize) {
      await organize();
    }
  }

  function attachEvents() {
    elements.addTableBtn.addEventListener('click', addTable);
    elements.addTablesBtn.addEventListener('click', () => addTables(elements.tableCountInput.value));
    elements.tableCountInput.addEventListener('keydown', event => {
      if (event.key === 'Enter') {
        event.preventDefault();
        addTables(elements.tableCountInput.value);
      }
    });
    elements.tableCountInput.addEventListener('change', () => {
      const value = Math.floor(Number(elements.tableCountInput.value));
      elements.tableCountInput.value = String(Number.isFinite(value) && value > 0 ? value : 1);
    });
    elements.deleteTableBtn.addEventListener('click', deleteSelectedTable);
    elements.increaseSizeBtn.addEventListener('click', () => resizeTables(TABLE_SIZE_STEP));
    elements.decreaseSizeBtn.addEventListener('click', () => resizeTables(-TABLE_SIZE_STEP));
    elements.layoutSelect.addEventListener('change', event => {
      void applyLayoutFromSelector(event.target.value);
    });
    elements.clearTablesBtn.addEventListener('click', clearTables);
    elements.rotateTableBtn.addEventListener('click', rotateSelectedTable);
    elements.lockTableBtn.addEventListener('click', toggleSelectedTableLock);
    elements.addZoneBtn.addEventListener('click', activateZoneMode);
    if (elements.spaceNameInput) elements.spaceNameInput.addEventListener('input', onSpaceNameChanged);
    if (elements.personSearchInput) elements.personSearchInput.addEventListener('input', refreshPersonSearch);
    if (elements.peopleListBtn) elements.peopleListBtn.addEventListener('click', scrollToPeopleList);
    if (elements.viewExampleBtn) elements.viewExampleBtn.addEventListener('click', viewDidacticExample);
    elements.toggleOutputBtn.addEventListener('click', toggleOutputVisibility);
    elements.downloadPdfBtn.addEventListener('click', downloadClassroomPdf);
    elements.organizeBtn.addEventListener('click', organize);
    elements.randomizeBtn.addEventListener('click', randomize);
    if (elements.generateAlternativesCheckbox) {
      elements.generateAlternativesCheckbox.addEventListener('change', () => {
        if (!elements.generateAlternativesCheckbox.checked) clearAlternatives();
      });
    }
    elements.resetBtn.addEventListener('click', newWorkspace);
    elements.themeSelect.addEventListener('change', event => {
      setTheme(event.target.value);
      saveStateSoon();
    });
    if (elements.exampleSelect) {
      elements.exampleSelect.addEventListener('change', event => loadPeopleExample(event.target.value));
    }
    if (elements.clearPeopleBtn) elements.clearPeopleBtn.addEventListener('click', clearPeopleList);
    if (elements.viewSpaceBtn) elements.viewSpaceBtn.addEventListener('click', scrollToWorkspace);
    elements.studentsInput.addEventListener('input', onStudentsChanged);
    elements.studentsInput.addEventListener('blur', renumberStudents);
    elements.constraintsInput.addEventListener('input', onConstraintsChanged);
    elements.classroom.addEventListener('pointerdown', onClassroomPointerDown);
    elements.classroom.addEventListener('pointermove', onClassroomPointerMove);
    elements.classroom.addEventListener('pointerup', onClassroomPointerUp);
    elements.classroom.addEventListener('pointercancel', onClassroomPointerUp);
    if (elements.helpOpenBtn) elements.helpOpenBtn.addEventListener('click', openHelpModal);
    if (elements.helpOpenFooterBtn) elements.helpOpenFooterBtn.addEventListener('click', openHelpModal);
    if (elements.helpCloseBtn) elements.helpCloseBtn.addEventListener('click', closeHelpModal);
    if (elements.helpModal) elements.helpModal.addEventListener('click', onHelpModalBackdropClick);
    if (elements.helpFrame) elements.helpFrame.addEventListener('load', syncHelpFrameTheme);
    window.addEventListener('message', event => {
      if (event.source === elements.helpFrame?.contentWindow && event.data?.type === 'roomplanner-help-close') closeHelpModal();
    });
    document.addEventListener('keydown', onHelpModalKeyDown, true);
    document.addEventListener('keydown', onSelectionKeyDown);

    const resizeObserver = new ResizeObserver(() => {
      if (state.layoutActive) applySpaceLayout(state.spaceLayout, { message: false, save: false, scroll: false });
      else renderTables();
    });
    resizeObserver.observe(elements.classroom);
  }

  function getVisitCounterNamespace() {
    const hostname = String(window.location.hostname || '').trim().toLowerCase();
    if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return '';
    return hostname.replace(/^www\./, '');
  }

  function hideVisitCounter() {
    if (elements.visitCountSeparator) elements.visitCountSeparator.hidden = true;
    if (elements.visitCount) {
      elements.visitCount.hidden = true;
      elements.visitCount.textContent = '';
    }
  }

  async function updateVisitCounter() {
    if (!elements.visitCount || !elements.visitCountSeparator) return;

    const namespace = getVisitCounterNamespace();
    if (!namespace || !/^https?:$/.test(window.location.protocol)) {
      hideVisitCounter();
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), VISIT_COUNTER_TIMEOUT_MS);

    try {
      const url = `${VISIT_COUNTER_BASE_URL}/hit/${encodeURIComponent(namespace)}/${encodeURIComponent(VISIT_COUNTER_KEY)}?t=${Date.now()}`;
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        cache: 'no-store',
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Visit counter HTTP ${response.status}`);

      const data = await response.json();
      const value = Number(data?.value);
      if (!Number.isFinite(value) || value < 0) throw new Error('Invalid visit counter value');

      const formattedValue = String(Math.trunc(value)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      elements.visitCount.textContent = formattedValue;
      elements.visitCountSeparator.hidden = false;
      elements.visitCount.hidden = false;
    } catch (error) {
      hideVisitCounter();
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function initialize() {
    const loaded = loadState();
    if (!loaded) {
      prepareEmptyWorkspace({ save: false });
    }

    attachEvents();
    void updateVisitCounter();
    updateOutputVisibility();
    resetOutput();
    if (loaded) {
      if (elements.layoutSelect) elements.layoutSelect.value = state.spaceLayout;
      renderTables();
    }
    updateExampleSelect();
    updateSpaceNameDisplay();
    updateUIState();
    startSplashScreen();
  }


  initialize();
})();
