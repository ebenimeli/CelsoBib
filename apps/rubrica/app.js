/** Rúbrica v1.1 — interfaz y motor de evaluación. Sin dependencias externas. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const state = { rubric: null, selections: [], student: '' };
  let levelsCustomized = false;

  const refs = {
    configSection: $('configSection'), configBody: $('configBody'), toggleConfig: $('toggleConfig'),
    form: $('configForm'), activity: $('activityName'), criteria: $('criteriaInput'), elements: $('elementsInput'),
    levelCount: $('levelCount'), levelsBody: $('levelsBody'), configAlert: $('configAlert'),
    assessment: $('assessmentSection'), assessmentTitle: $('assessmentTitle'), student: $('studentName'),
    itemsBody: $('itemsBody'), summaryBody: $('summaryBody'), itemsCount: $('itemsCount'),
    progressText: $('progressText'), progressBar: $('progressBar'), progressFill: $('progressFill'),
    finalScore: $('finalScore'), finalDescription: $('finalDescription'), finalState: $('finalState'),
    summaryState: $('summaryState'),
    splash: $('splashScreen'), floatingGrade: $('floatingGrade'), floatingScore: $('floatingScore'), floatingStatus: $('floatingStatus')
  };
  const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' });
  const scoreFormat = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function codeKey(code) { return String(code).trim().toLocaleUpperCase('es'); }
  function isCode(code) { return /^[^\s,\/]+$/u.test(code); }
  function parseDecimal(text) {
    const str = String(text).trim();
    if (!/^[+-]?(?:\d+(?:[.,]\d+)?|[.,]\d+)$/u.test(str)) return null;
    const n = Number(str.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  function formatScore(n) { return n === null || n === undefined ? '—' : scoreFormat.format(n); }
  // Compara siempre el valor real, nunca el resultado redondeado para pantalla.
  function isFailingGrade(n) { return typeof n === 'number' && Number.isFinite(n) && n < 5; }
  function renderGrade(cell, value) {
    cell.replaceChildren();
    if (isFailingGrade(value)) {
      const badge = document.createElement('span');
      badge.className = 'grade-fail';
      badge.textContent = formatScore(value);
      badge.setAttribute('aria-label', `Calificación insuficiente: ${formatScore(value)}`);
      cell.appendChild(badge);
    } else {
      cell.textContent = formatScore(value);
    }
  }
  function formatWeight(n) { return Number(n).toLocaleString('es-ES', { maximumFractionDigits: 6 }); }
  function isAssessmentStarted() { return !!state.student.trim() || state.selections.some(v => v !== null); }

  function defaultLevels(count) {
    if (count === 2) return [{ label: 'Sí', value: '10' }, { label: 'No', value: '0' }];
    if (count === 3) return [{ label: 'Alto', value: '10' }, { label: 'Medio', value: '7' }, { label: 'Bajo', value: '4' }];
    if (count === 4) return [{ label: 'Excelente', value: '10' }, { label: 'Notable', value: '8' }, { label: 'Básico', value: '6' }, { label: 'Insuficiente', value: '4' }];
    if (count === 5) return [{ label: 'Excelente', value: '10' }, { label: 'Muy bien', value: '8' }, { label: 'Adecuado', value: '6' }, { label: 'En proceso', value: '4' }, { label: 'Inicial', value: '0' }];
    return Array.from({ length: count }, (_, i) => ({ label: `Nivel ${i + 1}`, value: String(Math.round((10 - 10 * i / (count - 1)) * 100) / 100).replace('.', ',') }));
  }
  function readLevelFields() {
    return [...refs.levelsBody.querySelectorAll('tr')].map(row => ({
      label: row.querySelector('.level-label').value,
      value: row.querySelector('.score-input').value,
      description: row.querySelector('.level-description').value
    }));
  }
  function renderLevelFields(levels) {
    refs.levelsBody.replaceChildren();
    levels.forEach((level, idx) => {
      const tr = document.createElement('tr');
      const first = document.createElement('td');
      const name = document.createElement('input');
      name.type = 'text'; name.className = 'level-label'; name.value = level.label;
      name.maxLength = 100; name.setAttribute('aria-label', `Etiqueta del nivel ${idx + 1}`);
      const last = document.createElement('td');
      const value = document.createElement('input');
      value.type = 'text'; value.className = 'score-input'; value.inputMode = 'decimal';
      value.value = level.value; value.maxLength = 12;
      value.setAttribute('aria-label', `Puntuación del nivel ${idx + 1}`);
      const details = document.createElement('td');
      const description = document.createElement('textarea');
      description.className = 'level-description'; description.rows = 2;
      description.maxLength = 1000; description.value = level.description ?? '';
      description.placeholder = 'Descripción opcional del nivel';
      description.setAttribute('aria-label', `Descripción del nivel ${idx + 1}`);
      details.appendChild(description);
      first.appendChild(name);last.appendChild(value);tr.append(first,last,details);
      refs.levelsBody.appendChild(tr);
    });
  }
  function changeLevelCount() {
    const n = Number(refs.levelCount.value);
    const previous = readLevelFields();
    const next = defaultLevels(n);
    if(levelsCustomized) for(let i=0;i<Math.min(previous.length,n);i++)next[i]=previous[i];
    renderLevelFields(next);
  }
  function setCollapsed(collapsed) {
    refs.configSection.classList.toggle('is-collapsed', collapsed);
    refs.configBody.hidden = collapsed;
    refs.toggleConfig.setAttribute('aria-expanded', String(!collapsed));
    $('toggleConfigLabel').textContent = collapsed ? 'Mostrar configuración' : 'Ocultar';
  }
  function showNotice(message, success=false) {
    refs.configAlert.textContent=message;
    refs.configAlert.classList.toggle('success',success);
    refs.configAlert.hidden=false;
  }
  function hideNotice() { refs.configAlert.hidden=true; refs.configAlert.textContent=''; }
  function showFieldErrors(errors) {
    const fields = { activity: ['activityError',refs.activity], criteria: ['criteriaError',refs.criteria], elements: ['elementsError',refs.elements], levels: ['levelsError',refs.levelCount] };
    for(const [k,[id,input]] of Object.entries(fields)) {
      const message=(errors[k]||[]).join('\n');
      $(id).textContent=message;
      $(id).hidden=!message;
      input.setAttribute('aria-invalid', String(!!message));
    }
  }
  function clearErrors(){showFieldErrors({});hideNotice();}
  function addError(errors,key,message){(errors[key] ||= []).push(message);}

  function parseRubric() {
    const errors={};
    const name=refs.activity.value.trim();
    if(!name)addError(errors,'activity','Introduce un nombre para la actividad.');
    const criteria=new Map();
    const rawCriteria=refs.criteria.value.split(/\r?\n/u);
    rawCriteria.forEach((raw,i)=>{
      if(!raw.trim())return;
      const chunks=raw.split('/').map(s=>s.trim());
      if(chunks.length>3||chunks.length<1||!isCode(chunks[0])){
        addError(errors,'criteria',`Línea ${i+1}: utiliza «código / descripción / peso», con un código sin espacios.`);return;
      }
      const code=chunks[0],key=codeKey(code);
      if(criteria.has(key)){addError(errors,'criteria',`Línea ${i+1}: el criterio «${code}» está duplicado.`);return;}
      let description='',weightText='';
      if(chunks.length===2){
        if(parseDecimal(chunks[1])!==null)weightText=chunks[1];
        else description=chunks[1];
      } else if(chunks.length===3){description=chunks[1];weightText=chunks[2];}
      const weight=weightText===''?1:parseDecimal(weightText);
      if(weight===null || weight<=0){addError(errors,'criteria',`Línea ${i+1}: el peso debe ser un número positivo (coma o punto decimal).`);return;}
      criteria.set(key,{key,code,description,weight});
    });

    const items=[];
    refs.elements.value.split(/\r?\n/u).forEach((raw,i)=>{
      if(!raw.trim())return;
      const chunks=raw.split('/');
      if(chunks.length!==2||!chunks[0].trim()||!chunks[1].trim()){
        addError(errors,'elements',`Línea ${i+1}: utiliza «elemento / código, código».`);return;
      }
      const label=chunks[0].trim();
      const rawCodes=chunks[1].split(',').map(s=>s.trim());
      if(rawCodes.some(code=>!isCode(code))){addError(errors,'elements',`Línea ${i+1}: comprueba que cada código esté correctamente escrito.`);return;}
      const keys=[...new Set(rawCodes.map(codeKey))];
      rawCodes.forEach(code=>{
        const key=codeKey(code);
        if(!criteria.has(key))criteria.set(key,{key,code,description:'',weight:1});
      });
      items.push({label,keys});
    });
    if(items.length===0)addError(errors,'elements','Añade al menos un elemento de evaluación.');

    const levels=readLevelFields().map((l,i)=>{
      const label=l.label.trim(),value=parseDecimal(l.value),description=l.description.trim();
      if(!label)addError(errors,'levels',`Nivel ${i+1}: la etiqueta no puede estar vacía.`);
      if(value===null || value<0 || value>10)addError(errors,'levels',`Nivel ${i+1}: introduce una puntuación entre 0 y 10.`);
      return {label,value,description};
    });
    const seen=new Set();
    levels.forEach((l,i)=>{const key=l.label.toLocaleLowerCase('es');if(l.label&&seen.has(key))addError(errors,'levels',`Nivel ${i+1}: la etiqueta «${l.label}» está repetida.`);seen.add(key);});

    if(Object.keys(errors).length)return {errors};
    const used=new Set(items.flatMap(item=>item.keys));
    const criteriaUsed=[...criteria.values()].filter(c=>used.has(c.key)).sort((a,b)=>collator.compare(a.code,b.code));
    const unassigned=[...criteria.values()].filter(c=>!used.has(c.key));
    const result={name,criteria:criteriaUsed,items:items.map(item=>({label:item.label,criteria:item.keys.map(key=>criteria.get(key).code),keys:item.keys})),levels};
    return {rubric:result, unused:unassigned};
  }
  function showRubric(event){
    if(event)event.preventDefault();
    hideNotice();
    const parsed=parseRubric();
    showFieldErrors(parsed.errors||{});
    if(parsed.errors){
      setCollapsed(false);
      const first=Object.keys(parsed.errors)[0];
      ({activity:refs.activity,criteria:refs.criteria,elements:refs.elements,levels:refs.levelCount})[first].focus();return;
    }
    const same=state.rubric && JSON.stringify(state.rubric)===JSON.stringify(parsed.rubric);
    if(state.rubric&&!same&&isAssessmentStarted()&&!window.confirm('La nueva configuración reiniciará la evaluación del alumno actual. ¿Quieres continuar?'))return;
    if(!same){
      state.rubric=parsed.rubric;
      state.selections=Array(parsed.rubric.items.length).fill(null);
      state.student='';refs.student.value='';
      renderAssessment();
    }
    refs.assessment.hidden=false;
    refs.floatingGrade.hidden=false;
    document.body.classList.add('has-active-assessment');
    setCollapsed(true);
    scheduleFloatingPlacement();
    if(parsed.unused.length){
      // Las definiciones no utilizadas se omiten: no intervienen en ninguna nota.
      console.info('Criterios no utilizados:',parsed.unused.map(c=>c.code).join(', '));
    }
    refs.assessment.scrollIntoView({behavior:'smooth',block:'start'});
  }

  function criterionColor(code){
    let hash=0;
    for(const ch of code)hash=(hash*31+ch.charCodeAt(0))>>>0;
    const hue=hash%360;
    return {background:`hsl(${hue} 64% 92%)`,color:`hsl(${hue} 42% 28%)`};
  }
  function makePill(criterion){
    const span=document.createElement('span');span.className='criterion-pill';
    span.textContent=criterion.code;
    const description=criterion.description||'Sin descripción';
    span.title=`${criterion.code}: ${description} · Peso ${formatWeight(criterion.weight)}`;
    span.tabIndex=0;
    span.setAttribute('aria-label',span.title);
    const color=criterionColor(criterion.key);
    span.style.backgroundColor=color.background;span.style.color=color.color;
    return span;
  }
  function makeCell(text,cl='',label=''){
    const td=document.createElement('td');
    if(cl)td.className=cl;
    if(label)td.dataset.label=label;
    if(text!==undefined&&text!==null)td.textContent=String(text);
    return td;
  }
  function renderAssessment(){
    const r=state.rubric;if(!r)return;
    refs.assessmentTitle.textContent=r.name;
    refs.itemsCount.textContent=`${r.items.length} ${r.items.length===1?'elemento':'elementos'}`;
    refs.itemsBody.replaceChildren();
    const byKey=new Map(r.criteria.map(c=>[c.key,c]));
    r.items.forEach((item,rowIndex)=>{
      const tr=document.createElement('tr');
      const name=makeCell(item.label,'item-label');
      const codes=makeCell(null,'','Criterios');
      const pillGroup=document.createElement('div');pillGroup.className='criterion-pills';
      item.keys.forEach(key=>pillGroup.appendChild(makePill(byKey.get(key))));
      codes.appendChild(pillGroup);
      const levelCell=makeCell(null,'','Nivel de logro');
      const choices=document.createElement('div');choices.className='level-options';choices.setAttribute('role','group');choices.setAttribute('aria-label',`Nivel de logro: ${item.label}`);
      r.levels.forEach((level,index)=>{
        const b=document.createElement('button');b.type='button';b.className='level-choice';b.dataset.row=String(rowIndex);b.dataset.level=String(index);
        b.textContent=level.label;
        // Mismo tooltip nativo que los códigos de criterio; sin descripción, sin tooltip.
        const levelDescription=(level.description||'').trim();
        if(levelDescription)b.title=levelDescription;
        b.setAttribute('aria-pressed',String(state.selections[rowIndex]===index));
        b.setAttribute('aria-label',`${level.label}, ${formatScore(level.value)} puntos${levelDescription?`. ${levelDescription}`:''}`);
        choices.appendChild(b);
      });
      levelCell.appendChild(choices);
      const score=makeCell('—','row-score pending-score','Nota');score.dataset.scoreRow=String(rowIndex);
      tr.append(name,codes,levelCell,score);refs.itemsBody.appendChild(tr);
    });
    updateGrades();
  }
  function calcGrades(){
    const rubric=state.rubric;if(!rubric)return null;
    const scores=rubric.items.map((_,i)=>state.selections[i]===null?null:rubric.levels[state.selections[i]].value);
    const progress=scores.filter(score=>score!==null).length;
    const criteria=rubric.criteria.map(c=>{
      const relevant=rubric.items.map((item,i)=>item.keys.includes(c.key)?scores[i]:undefined).filter(v=>v!==undefined);
      const graded=relevant.filter(v=>v!==null);
      const grade=graded.length?graded.reduce((a,b)=>a+b,0)/graded.length:null;
      return {...c,grade,partial:graded.length<relevant.length};
    });
    const assessed=criteria.filter(c=>c.grade!==null);
    const totalWeight=assessed.reduce((sum,c)=>sum+c.weight,0);
    const final=totalWeight>0?assessed.reduce((sum,c)=>sum+c.grade*c.weight,0)/totalWeight:null;
    return {scores,criteria,progress,total:rubric.items.length,final,incomplete:progress<rubric.items.length};
  }
  // Escoge la esquina que menos interfiera con botones y notas visibles.
  // Se evalúa la esquina inferior derecha en primer lugar, pero se evita
  // cubrir acciones importantes (por ejemplo, Descargar informe PDF).
  let placementFrame=0;
  function scheduleFloatingPlacement(){
    if(refs.floatingGrade.hidden || placementFrame)return;
    placementFrame=requestAnimationFrame(()=>{placementFrame=0;placeFloatingGrade();});
  }
  function placeFloatingGrade(){
    if(refs.floatingGrade.hidden)return;
    const width=innerWidth,height=innerHeight,inset=width<=630?10:20;
    const cw=refs.floatingGrade.offsetWidth,ch=refs.floatingGrade.offsetHeight;
    const candidates=[
      {name:'bottom-right',x:width-inset-cw,y:height-inset-ch},
      {name:'bottom-left',x:inset,y:height-inset-ch},
      {name:'top-right',x:width-inset-cw,y:inset},
      {name:'top-left',x:inset,y:inset}
    ];
    const obstacles=[];
    const check=(element)=>{
      const r=element.getBoundingClientRect();
      if(r.width>0&&r.height>0&&r.bottom>0&&r.top<height&&r.right>0&&r.left<width)obstacles.push(r);
    };
    ['newStudent','newStudentBottom','downloadPDF','downloadTemplatePDF','studentName'].forEach(id=>check($(id)));
    for(const tr of refs.itemsBody.rows){
      const r=tr.getBoundingClientRect();
      if(r.bottom<0||r.top>height)continue;
      for(const el of tr.querySelectorAll('button,.row-score'))check(el);
    }
    for(const el of refs.summaryBody.querySelectorAll('.row-score'))check(el);
    check(refs.finalScore);
    const overlap=(a,b)=>Math.max(0,Math.min(a.x+cw,b.right)-Math.max(a.x,b.left)) * Math.max(0,Math.min(a.y+ch,b.bottom)-Math.max(a.y,b.top));
    let best=candidates[0],min=Infinity;
    for(let i=0;i<candidates.length;i++){
      // Pequeña preferencia por la esquina inferior derecha cuando haya empate.
      const cost=obstacles.reduce((total,r)=>total+overlap(candidates[i],r),0)+i*12;
      if(cost<min){min=cost;best=candidates[i];}
    }
    refs.floatingGrade.dataset.position=best.name;
    const heading=refs.assessment.querySelector('.assessment-heading').getBoundingClientRect();
    document.body.classList.toggle('grade-at-heading',width<=630 && best.name==='top-right' && heading.bottom>0 && heading.top<height);
  }

  function updateGrades(){
    if(!state.rubric)return;
    const computed=calcGrades();
    computed.scores.forEach((score,i)=>{
      const td=refs.itemsBody.querySelector(`[data-score-row="${i}"]`);
      if(!td)return;
      renderGrade(td,score);
      td.classList.toggle('pending-score',score===null);
      td.title=score===null?'Elemento pendiente':'Puntuación del elemento';
    });
    refs.progressText.textContent=`${computed.progress} de ${computed.total}`;
    const pct=computed.total?computed.progress/computed.total*100:0;
    refs.progressFill.style.width=`${pct}%`;
    refs.progressBar.setAttribute('aria-valuemax',String(computed.total));
    refs.progressBar.setAttribute('aria-valuenow',String(computed.progress));
    refs.progressBar.setAttribute('aria-valuetext',`${computed.progress} de ${computed.total} elementos`);

    refs.summaryBody.replaceChildren();
    computed.criteria.forEach(c=>{
      const tr=document.createElement('tr');
      const code=makeCell(null,'','Criterio');code.appendChild(makePill(c));
      const description=makeCell(c.description||'Sin descripción','summary-description','Descripción');
      const weight=makeCell(formatWeight(c.weight),'weight-cell','Peso');
      const score=makeCell(null,'row-score','Nota');
      renderGrade(score,c.grade);
      score.classList.toggle('pending-score',c.grade===null);
      if(c.grade!==null && c.partial){const status=document.createElement('span');status.className='tiny-status';status.textContent='Provisional';score.appendChild(status);}
      tr.append(code,description,weight,score);refs.summaryBody.appendChild(tr);
    });
    refs.summaryState.className='summary-status';
    if(computed.progress===0){refs.summaryState.textContent='Sin calificar';refs.summaryState.classList.add('empty');}
    else if(computed.incomplete)refs.summaryState.textContent='Evaluación provisional';
    else{refs.summaryState.textContent='Evaluación completa';refs.summaryState.classList.add('complete');}
    const displayedFinal=formatScore(computed.final);
    refs.finalScore.textContent=displayedFinal;
    refs.finalScore.classList.toggle('grade-fail',isFailingGrade(computed.final));
    // Mismo cálculo y misma cadena formateada que en el resumen principal.
    refs.floatingScore.textContent=displayedFinal;
    refs.floatingScore.classList.toggle('grade-fail',isFailingGrade(computed.final));
    refs.floatingStatus.hidden=computed.progress===computed.total;
    refs.floatingStatus.textContent=computed.progress===0?'Sin calificar':'Provisional';
    scheduleFloatingPlacement();
    if(computed.progress===0){refs.finalState.textContent='Sin calificar';refs.finalDescription.textContent='Selecciona un nivel para empezar a calificar.';}
    else if(computed.incomplete){refs.finalState.textContent='Nota provisional';refs.finalDescription.textContent=`Quedan ${computed.total-computed.progress} ${computed.total-computed.progress===1?'elemento pendiente':'elementos pendientes'}. Solo cuentan los criterios con alguna nota.`;}
    else{refs.finalState.textContent='Evaluación completa';refs.finalDescription.textContent='Media ponderada de los criterios, según sus pesos.';}
  }
  function handleChoice(event){
    const target=event.target.closest('button[data-row][data-level]');
    if(!target||!state.rubric)return;
    const row=Number(target.dataset.row),level=Number(target.dataset.level);
    state.selections[row]=state.selections[row]===level?null:level;
    const siblings=target.parentElement.querySelectorAll('button[data-level]');
    siblings.forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.level)===state.selections[row])));
    updateGrades();
  }
  function newStudent(){
    if(!state.rubric)return;
    if(isAssessmentStarted()&&!window.confirm('Se borrarán el nombre y las calificaciones de esta evaluación. ¿Quieres calificar a otro alumno?'))return;
    state.selections=Array(state.rubric.items.length).fill(null);
    state.student='';refs.student.value='';
    refs.itemsBody.querySelectorAll('button[data-level]').forEach(b=>b.setAttribute('aria-pressed','false'));
    updateGrades();
    refs.student.focus();
  }
  function downloadTemplatePdf(){
    // El botón está en Configuración: exporta los campos visibles, incluso antes de activar la rúbrica.
    const parsed=parseRubric();
    showFieldErrors(parsed.errors||{});
    if(parsed.errors){
      showNotice('Corrige los campos señalados antes de descargar la rúbrica vacía.');
      setCollapsed(false);
      const first=Object.keys(parsed.errors)[0];
      ({activity:refs.activity,criteria:refs.criteria,elements:refs.elements,levels:refs.levelCount})[first].focus();
      return;
    }
    if(!window.RubricPDF){window.alert('No se ha podido preparar el generador PDF. Comprueba que el proyecto está completo.');return;}
    try{
      // Solo configuración: nunca se accede al nombre ni a las notas de los alumnos.
      window.RubricPDF.downloadTemplate(parsed.rubric);
    }catch(error){console.error(error);window.alert('No se ha podido generar la rúbrica vacía. Revisa los datos e inténtalo de nuevo.');}
  }
  function downloadPdf(){
    if(!state.rubric||!window.RubricPDF){window.alert('No se ha podido preparar el generador PDF. Comprueba que el proyecto está completo.');return;}
    try{
      const calc=calcGrades();
      window.RubricPDF.download({
        activity:state.rubric.name,
        student:refs.student.value,
        rows:state.rubric.items.map((item,i)=>({element:item.label,criteria:item.criteria,level:state.selections[i]===null?null:state.rubric.levels[state.selections[i]].label,score:calc.scores[i]})),
        criteria:calc.criteria,progress:calc.progress,total:calc.total,final:calc.final,incomplete:calc.incomplete
      });
    }catch(error){console.error(error);window.alert('No se ha podido generar el PDF. Revisa los datos e inténtalo de nuevo.');}
  }
  function downloadJson(value,name,mime){
    const blob=new Blob([value],{type:mime});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }
  function exportConfiguration(){
    const parsed=parseRubric();showFieldErrors(parsed.errors||{});
    if(parsed.errors){showNotice('Corrige los campos señalados antes de guardar la configuración.');return;}
    const payload={format:'rubric-maker',version:1,activity:refs.activity.value.trim(),criteriaText:refs.criteria.value,elementsText:refs.elements.value,levels:readLevelFields()};
    const slug=payload.activity.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'').toLowerCase().slice(0,55)||'rubrica';
    downloadJson(JSON.stringify(payload,null,2),`${slug}.json`,'application/json');
    showNotice('Se ha descargado la configuración de la rúbrica en JSON.',true);
  }
  function loadConfiguration(payload){
    if(!payload || payload.format!=='rubric-maker'||payload.version!==1 || typeof payload.activity!=='string' || typeof payload.criteriaText!=='string' || typeof payload.elementsText!=='string' || !Array.isArray(payload.levels) || payload.levels.length<2||payload.levels.length>10 || payload.levels.some(l=>!l||typeof l.label!=='string'||(typeof l.value!=='string'&&typeof l.value!=='number')||(l.description!==undefined&&typeof l.description!=='string'))){throw new Error('Formato de configuración no reconocido.');}
    if((refs.activity.value.trim()||refs.elements.value.trim()||isAssessmentStarted())&&!window.confirm('Se reemplazarán los campos de configuración actuales. ¿Continuar?'))return false;
    refs.activity.value=payload.activity.slice(0,200);
    refs.criteria.value=payload.criteriaText;
    refs.elements.value=payload.elementsText;
    refs.levelCount.value=String(payload.levels.length);
    renderLevelFields(payload.levels.map(l=>({label:l.label,value:String(l.value),description:l.description??''})));
    levelsCustomized=true;
    clearErrors();
    setCollapsed(false);
    showNotice('Configuración cargada. Comprueba los datos y pulsa «Usar esta rúbrica».',true);
    refs.configSection.scrollIntoView({behavior:'smooth',block:'start'});
    return true;
  }
  const example={format:'rubric-maker',version:1,activity:'A02. Building the Main Loop',criteriaText:'1.1 / Presentación y entrega del trabajo / 1\n2.3 / Desarrollo de programas mediante estructuras de control / 3\n2.4 / Comprobación, organización y depuración / 2',elementsText:'El archivo tiene el nombre solicitado / 1.1\nLas variables están correctamente inicializadas / 2.3\nLa variable nflips está configurada como deslizador / 2.3\nEl programa ejecuta un bucle correctamente / 2.3, 2.4\nSe actualiza el contador correspondiente a cada resultado / 2.3\nEl código está organizado y es fácil de seguir / 2.4',levels:defaultLevels(4)};

  // Pantalla inicial ficticia (2,7 s + 0,3 s de transición suave).
  function finishSplash(){
    refs.splash.hidden=true;
    document.querySelector('.app-shell').inert=false;
    document.body.classList.remove('splash-active');
  }
  function startSplash(){
    // Timeout independiente de una carga real: un fallo CSS no dejará la app bloqueada.
    window.setTimeout(()=>refs.splash.classList.add('is-leaving'),2700);
    window.setTimeout(finishSplash,3050);
  }

  // Eventos y arranque
  window.addEventListener('scroll',scheduleFloatingPlacement,{passive:true});
  window.addEventListener('resize',scheduleFloatingPlacement);
  refs.levelCount.addEventListener('change',changeLevelCount);
  refs.levelsBody.addEventListener('input',()=>{levelsCustomized=true;});
  refs.toggleConfig.addEventListener('click',()=>setCollapsed(!refs.configBody.hidden));
  refs.form.addEventListener('submit',showRubric);
  refs.itemsBody.addEventListener('click',handleChoice);
  refs.student.addEventListener('input',()=>{state.student=refs.student.value;});
  $('newStudent').addEventListener('click',newStudent);
  $('newStudentBottom').addEventListener('click',newStudent);
  $('downloadPDF').addEventListener('click',downloadPdf);
  $('downloadTemplatePDF').addEventListener('click',downloadTemplatePdf);
  $('saveConfig').addEventListener('click',exportConfiguration);
  $('loadExample').addEventListener('click',()=>loadConfiguration(example));
  $('importConfig').addEventListener('click',()=>$('importFile').click());
  $('importFile').addEventListener('change',async(event)=>{
    const file=event.target.files?.[0];if(!file)return;
    try{const payload=JSON.parse(await file.text());loadConfiguration(payload);}
    catch(error){showNotice(`No se ha podido importar el archivo: ${error.message}`);setCollapsed(false);}
    finally{event.target.value='';}
  });
  renderLevelFields(defaultLevels(4));
  startSplash();
})();
