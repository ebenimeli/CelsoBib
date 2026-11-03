/**
 * Rúbrica v1.1 — generador PDF autónomo (sin dependencias ni conexión).
 * Usa las fuentes PDF estándar Helvetica con codificación Windows-1252,
 * adecuada para el español (acentos, ñ, signos, € y comillas tipográficas).
 * No carga, almacena ni envía datos fuera del navegador.
 */
(function () {
  'use strict';
  const W = 595.28, H = 841.89, M = 42, CW = W - M * 2;
  const cp1252 = new Map([[0x20AC,128],[0x201A,130],[0x0192,131],[0x201E,132],[0x2026,133],[0x2020,134],[0x2021,135],[0x02C6,136],[0x2030,137],[0x0160,138],[0x2039,139],[0x0152,140],[0x017D,142],[0x2018,145],[0x2019,146],[0x201C,147],[0x201D,148],[0x2022,149],[0x2013,150],[0x2014,151],[0x02DC,152],[0x2122,153],[0x0161,154],[0x203A,155],[0x0153,156],[0x017E,158],[0x0178,159]]);
  function ansi(s) {
    let r='';
    for (const ch of String(s == null ? '' : s)) {
      const u=ch.codePointAt(0);
      if ((u >= 32 && u <= 126) || (u >= 160 && u <= 255)) r+=String.fromCharCode(u);
      else if(cp1252.has(u)) r+=String.fromCharCode(cp1252.get(u));
      else if (u===9||u===10||u===13) r+=' ';
      else if (u===0x200B) continue;
      else r+='?';
    }
    return r;
  }
  function pdfLiteral(s){return '('+ansi(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)')+')';}
  function rgb(hex){const h=hex.replace('#','');return [0,2,4].map(i=>(parseInt(h.slice(i,i+2),16)/255).toFixed(3)).join(' ');}
  function pdfBytes(raw){const u=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)u[i]=raw.charCodeAt(i)&255;return u;}
  function filenameSlug(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,65).toLowerCase()||'rubrica';}
  function isFailingGrade(n){return typeof n==='number' && Number.isFinite(n) && n<5;}

  class Document {
    constructor(options={}){this.width=options.landscape?H:W;this.height=options.landscape?W:H;this.contentWidth=this.width-M*2;this.pageHeading=options.heading||'INFORME DE EVALUACIÓN';this.pages=[];this.current=null;this.y=0;this.measureCanvas=document.createElement('canvas');this.ctx=this.measureCanvas.getContext('2d');this.newPage();}
    newPage(){this.current=[];this.pages.push(this.current);this.y=65;this.rect(0,0,this.width,6,'#315b9e');this.text(M,32,'RÚBRICA',9,'bold','#315b9e');this.text(this.width-M-this.measure(this.pageHeading,7.6),32,this.pageHeading,7.6,'regular','#728099');this.line(M,42,this.width-M,42,'#e4eaf3');}
    cmd(v){this.current.push(v);}
    rect(x,y,w,h,fill){this.cmd(`${rgb(fill)} rg ${x.toFixed(2)} ${(this.height-y-h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);}
    // Rectángulo vectorial con esquinas redondeadas (coordenadas de página: origen superior).
    roundRect(x,y,w,h,r,fill){
      const k=0.55228475, yy=this.height-y-h,rr=Math.min(r,w/2,h/2);
      const n=v=>v.toFixed(2);
      this.cmd(`${rgb(fill)} rg ${n(x+rr)} ${n(yy)} m ${n(x+w-rr)} ${n(yy)} l ${n(x+w-rr+k*rr)} ${n(yy)} ${n(x+w)} ${n(yy+rr-k*rr)} ${n(x+w)} ${n(yy+rr)} c ${n(x+w)} ${n(yy+h-rr)} l ${n(x+w)} ${n(yy+h-rr+k*rr)} ${n(x+w-rr+k*rr)} ${n(yy+h)} ${n(x+w-rr)} ${n(yy+h)} c ${n(x+rr)} ${n(yy+h)} l ${n(x+rr-k*rr)} ${n(yy+h)} ${n(x)} ${n(yy+h-rr+k*rr)} ${n(x)} ${n(yy+h-rr)} c ${n(x)} ${n(yy+rr)} l ${n(x)} ${n(yy+rr-k*rr)} ${n(x+rr-k*rr)} ${n(yy)} ${n(x+rr)} ${n(yy)} c h f`);
    }
    line(x1,y1,x2,y2,color='#dfe5ed'){this.cmd(`${rgb(color)} RG 0.6 w ${x1.toFixed(2)} ${(this.height-y1).toFixed(2)} m ${x2.toFixed(2)} ${(this.height-y2).toFixed(2)} l S`);}
    text(x,baseline,text,size=9,weight='regular',color='#27364b'){
      const str=pdfLiteral(text); this.cmd(`BT /${weight==='bold'?'F2':'F1'} ${size.toFixed(2)} Tf ${rgb(color)} rg 1 0 0 1 ${x.toFixed(2)} ${(this.height-baseline).toFixed(2)} Tm ${str} Tj ET`);
    }
    measure(s,size=9,weight='regular'){
      if(this.ctx){this.ctx.font=`${weight==='bold'?'700 ':''}${size}px Arial`;return this.ctx.measureText(ansi(s)).width * 1.04;}
      return String(s).length*size*.55;
    }
    wrap(value,width,size=9,weight='regular'){
      const result=[];
      for(const paragraph of String(value == null ? '' : value).split(/\r?\n/)){
        if(!paragraph.trim()){result.push('');continue;}
        let current='';
        const words=paragraph.trim().split(/\s+/);
        for(const word of words){
          const candidate=current?current+' '+word:word;
          if(this.measure(candidate,size,weight)<=width){current=candidate;continue;}
          if(current){result.push(current);current='';}
          if(this.measure(word,size,weight)<=width){current=word;continue;}
          // Split unusually long unbreakable words; never let text escape its cell.
          let bit='';
          for(const char of word){
            if(bit && this.measure(bit+char,size,weight)>width){result.push(bit);bit='';}
            bit+=char;
          }
          current=bit;
        }
        if(current)result.push(current);
      }
      return result.length?result:[''];
    }
    ensure(height){if(this.y+height>this.height-55)this.newPage();}
    paragraph(text,size=9,color='#536178',leading=13,weight='regular'){
      const lines=this.wrap(text,this.contentWidth,size,weight);
      for(const l of lines){this.ensure(leading+3);this.text(M,this.y+size,l,size,weight,color);this.y+=leading;}
      this.y+=5;
    }
    title(text){const lines=this.wrap(text,this.contentWidth,18,'bold');for(const l of lines){this.ensure(27);this.text(M,this.y+18,l,18,'bold','#1d2d46');this.y+=24;}this.y+=5;}
    section(name){this.ensure(45);this.y+=19;this.text(M,this.y,name,12,'bold','#243c61');this.y+=15;this.line(M,this.y,this.width-M,this.y,'#e3eaf3');this.y+=13;}
    meta(label,value){const txt=`${label}: ${value}`;this.paragraph(txt,9.3,'#45536b',14);}
    table(headings,rows,widths,options={}){
      const hh=29, pad=8, lh=12, fs=8.6;
      const header=()=>{
        this.ensure(hh+35);
        this.rect(M,this.y,this.contentWidth,hh,'#eef3fa');let x=M;
        for(let i=0;i<headings.length;i++){this.text(x+pad,this.y+18,headings[i],8,'bold','#355681');x+=widths[i];}
        this.y+=hh;
      };
      header();
      for(let r=0;r<rows.length;r++){
        const wrapped=rows[r].map((v,i)=>this.wrap(v,widths[i]-pad*2,fs,i===0?'bold':'regular'));
        const maxLines=Math.max(...wrapped.map(a=>a.length));
        let offset=0;
        // Mantener las filas completas cuando caben en una página nueva.
        if(maxLines*lh+pad*2>this.height-55-this.y && maxLines*lh+pad*2<=this.height-55-65-hh){this.newPage();header();}
        while(offset<maxLines){
          if(this.y+pad*2+lh>this.height-55){this.newPage();header();}
          const room=Math.max(1,Math.floor((this.height-55-this.y-pad*2)/lh));
          const amount=Math.min(room,maxLines-offset);
          const rh=amount*lh+pad*2;
          this.rect(M,this.y,this.contentWidth,rh,r%2===0?'#ffffff':'#f9fbfe');
          let x=M;
          for(let col=0;col<rows[r].length;col++){
            const slice=wrapped[col].slice(offset,offset+amount);
            slice.forEach((str,j)=>{
              const failed=col===options.gradeColumn && offset+j===0 && isFailingGrade(options.grades?.[r]);
              if(failed){
                // Fondo solo bajo la nota; el aviso 'Provisional' queda fuera del rectángulo.
                const pillWidth=Math.min(widths[col]-pad*2,Math.max(31,this.measure(str,fs,'bold')+13));
                this.roundRect(x+pad-3,this.y+pad-3+j*lh,pillWidth,lh+6,5,'#bb3042');
                this.text(x+pad+3,this.y+pad+fs+j*lh,str,fs,'bold','#ffffff');
              }else{
                this.text(x+pad,this.y+pad+fs+j*lh,str,fs,col===0?'bold':'regular',col===rows[r].length-1?'#315b9e':'#334155');
              }
            });
            x+=widths[col];
          }
          this.line(M,this.y+rh,this.width-M,this.y+rh,'#e6ebf2');
          this.y+=rh;
          offset+=amount;
          if(offset<maxLines){this.newPage();header();}
        }
      }
    }
    // Casillas dibujadas como vectores: nunca dependen de fuentes especiales.
    square(x,y,size=10){this.cmd(`${rgb('#8090a4')} RG 0.85 w ${x.toFixed(2)} ${(this.height-y-size).toFixed(2)} ${size.toFixed(2)} ${size.toFixed(2)} re S`);}
    choiceGrid(rubric){
      const n=rubric.levels.length;
      const criterionWidth=this.width>700?78:67;
      const itemWidth=this.width>700?(n>=8?208:265):235;
      const choiceWidth=(this.contentWidth-itemWidth-criterionWidth)/n;
      const pad=7,fs=8.1,lh=11.5,hh=43;
      const header=()=>{
        this.ensure(hh+31);
        this.rect(M,this.y,this.contentWidth,hh,'#eaf1fb');
        this.text(M+pad,this.y+21,'ELEMENTO',8.3,'bold','#355681');
        this.text(M+itemWidth+pad,this.y+21,'CRITERIOS',7.3,'bold','#355681');
        let x=M+itemWidth+criterionWidth;
        rubric.levels.forEach((level,i)=>{
          const title=`N${i+1}`;
          const mark=`${Number(level.value).toLocaleString('es-ES',{maximumFractionDigits:2})}/10`;
          this.text(x+(choiceWidth-this.measure(title,8,'bold'))/2,this.y+17,title,8,'bold','#355681');
          this.text(x+(choiceWidth-this.measure(mark,7.2))/2,this.y+31,mark,7.2,'regular','#355681');
          x+=choiceWidth;
        });
        this.y+=hh;
      };
      header();
      for(let i=0;i<rubric.items.length;i++){
        const item=rubric.items[i];
        const a=this.wrap(item.label,itemWidth-pad*2,fs,'bold');
        const b=this.wrap(item.criteria.join(', '),criterionWidth-pad*2,fs);
        let offset=0;
        const total=Math.max(a.length,b.length,1);
        while(offset<total){
          const maxRows=Math.max(1,Math.floor((this.height-55-this.y-pad*2)/lh));
          // No separar una fila si cabe entera en la siguiente página.
          if(total-offset>maxRows && total-offset<=Math.floor((this.height-55-65-hh-pad*2)/lh)){
            this.newPage();header();
          }
          if(this.y+pad*2+lh>this.height-55){this.newPage();header();}
          const room=Math.max(1,Math.floor((this.height-55-this.y-pad*2)/lh));
          const amount=Math.min(room,total-offset);
          const rh=Math.max(30,amount*lh+pad*2);
          this.rect(M,this.y,this.contentWidth,rh,i%2?'#f7faff':'#ffffff');
          a.slice(offset,offset+amount).forEach((line,j)=>this.text(M+pad,this.y+pad+fs+j*lh,line,fs,'bold','#26384e'));
          b.slice(offset,offset+amount).forEach((line,j)=>this.text(M+itemWidth+pad,this.y+pad+fs+j*lh,line,fs,'regular','#344b68'));
          if(offset===0){
            let x=M+itemWidth+criterionWidth;
            for(let k=0;k<n;k++){this.square(x+(choiceWidth-10)/2,this.y+(rh-10)/2,10);x+=choiceWidth;}
          }
          this.line(M,this.y+rh,this.width-M,this.y+rh,'#e4eaf2');
          this.y+=rh;
          offset+=amount;
          if(offset<total){this.newPage();header();}
        }
      }
    }
    conclusion(label,grade,detail,rawGrade=null){
      this.ensure(92);this.y+=12;this.rect(M,this.y,this.contentWidth,72,'#eaf1fb');this.text(M+15,this.y+22,label.toUpperCase(),9,'bold','#52729d');this.text(M+15,this.y+48,detail,9,'regular','#536b90');
      if(isFailingGrade(rawGrade)){
        const size=26,width=this.measure(grade,size,'bold')+22;
        const x=this.width-M-width-12;
        this.roundRect(x,this.y+18,width,42,9,'#bb3042');
        this.text(x+11,this.y+48,grade,size,'bold','#ffffff');
      }else this.text(this.width-M-92,this.y+48,grade,26,'bold','#254d89');
      this.y+=77;
    }
    build(){
      // Page numbering is drawn once total page count is known.
      for(let i=0;i<this.pages.length;i++){
        const page=this.pages[i];this.current=page;
        this.line(M,this.height-42,this.width-M,this.height-42,'#e2e8f1');this.text(M,this.height-29,'Generado con Rúbrica · Documento local',7.6,'regular','#8a97a8');
        this.text(this.width-M-68,this.height-29,`Página ${i+1} de ${this.pages.length}`,7.6,'regular','#8a97a8');
      }
      const objects=new Map();
      objects.set(1,'<< /Type /Catalog /Pages 2 0 R >>');
      objects.set(3,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
      objects.set(4,'<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
      const refs=[]; let id=5;
      for(const p of this.pages){
        const contentId=id++,pageId=id++;
        const stream=p.join('\n')+'\n';
        objects.set(contentId,`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
        objects.set(pageId,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${this.width} ${this.height}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`);
        refs.push(`${pageId} 0 R`);
      }
      objects.set(2,`<< /Type /Pages /Kids [ ${refs.join(' ')} ] /Count ${refs.length} >>`);
      let raw='%PDF-1.4\n%âãÏÓ\n';const offsets=[0];
      for(let i=1;i<id;i++){
        offsets[i]=raw.length;
        raw+=`${i} 0 obj\n${objects.get(i)}\nendobj\n`;
      }
      const xref=raw.length;
      raw+=`xref\n0 ${id}\n0000000000 65535 f \n`;
      for(let i=1;i<id;i++)raw+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
      raw+=`trailer\n<< /Size ${id} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
      return new Blob([pdfBytes(raw)],{type:'application/pdf'});
    }
  }
  function displayScore(n){return n==null?'Pendiente':Number(n).toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function makePdf(data){
    const doc=new Document();
    doc.title('Informe de evaluación');
    doc.meta('Actividad',data.activity);
    if(data.student.trim())doc.meta('Alumno/a',data.student.trim());
    doc.meta('Fecha',new Date().toLocaleDateString('es-ES',{year:'numeric',month:'long',day:'numeric'}));
    doc.meta('Estado',data.incomplete?'Provisional · Hay elementos pendientes':'Evaluación completa');
    doc.meta('Progreso',`${data.progress} de ${data.total} elementos calificados`);
    doc.section('Detalle de evaluación');
    doc.table(['ELEMENTO','CRITERIOS','NIVEL','NOTA'],data.rows.map(r=>[r.element,r.criteria.join(', '),r.level||'Pendiente',displayScore(r.score)]),[215,83,141,72.28],{gradeColumn:3,grades:data.rows.map(r=>r.score)});
    doc.section('Resumen por criterios');
    doc.table(['CRITERIO','DESCRIPCIÓN','PESO','NOTA'],data.criteria.map(c=>[c.code,c.description||'Sin descripción',String(c.weight).replace('.',','),displayScore(c.grade)+(c.partial&&c.grade!=null?'\n(provisional)':'')]),[84,258,59,110.28],{gradeColumn:3,grades:data.criteria.map(c=>c.grade)});
    doc.conclusion('Calificación final',data.final==null?'—':displayScore(data.final),data.final==null?'Sin elementos calificados':data.incomplete?'Calificación provisional':'Evaluación completa',data.final);
    if(data.incomplete){doc.paragraph('Aviso: los elementos pendientes no se han contabilizado como ceros. Las calificaciones se actualizarán cuando se complete la evaluación.',8.8,'#85652c',13);}
    return doc.build();
  }
  function makeTemplatePdf(rubric){
    // Solo recibe la configuración de la rúbrica, nunca el estado de la evaluación.
    const doc=new Document({landscape:rubric.levels.length>=4,heading:'PLANTILLA SIN CALIFICAR'});
    doc.title('Rúbrica de evaluación · Plantilla vacía');
    doc.meta('Actividad',rubric.name);
    doc.meta('Contenido',`${rubric.criteria.length} criterios · ${rubric.items.length} elementos · ${rubric.levels.length} niveles de logro`);
    doc.section('Criterios de evaluación y ponderaciones');
    const criterionWidth=doc.width>700?[85,doc.contentWidth-85-76,76]:[72,doc.contentWidth-72-69,69];
    doc.table(['CRITERIO','DESCRIPCIÓN','PESO'],rubric.criteria.map(c=>[c.code,c.description||'Sin descripción',String(c.weight).replace('.',',')]),criterionWidth);
    doc.section('Niveles de logro');
    const levelWidth=doc.width>700?[148,77,doc.contentWidth-225]:[115,75,doc.contentWidth-190];
    doc.table(['NIVEL','PUNTOS','DESCRIPCIÓN'],rubric.levels.map((l,i)=>[`N${i+1} · ${l.label}`,`${Number(l.value).toLocaleString('es-ES',{maximumFractionDigits:2})}/10`,l.description||'—']),levelWidth);
    doc.section('Matriz de evaluación');
    doc.paragraph('Marca una sola casilla por elemento. Las columnas N1, N2, etc. corresponden a los niveles descritos arriba. Todas las opciones están sin seleccionar.',8.8,'#536178',13);
    doc.choiceGrid(rubric);
    return doc.build();
  }
  function downloadBlob(blob,name){
    const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=name;
    document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),30000);
  }
  window.RubricPDF={
    download(data){
      const blob=makePdf(data);
      const name=`informe-${filenameSlug(data.activity)}${data.student.trim()?'-'+filenameSlug(data.student):''}.pdf`;
      const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=name;
      document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),30000);
    },
    createBlob:makePdf,
    downloadTemplate(rubric){downloadBlob(makeTemplatePdf(rubric),`rubrica-vacia-${filenameSlug(rubric.name)}.pdf`);},
    createTemplateBlob:makeTemplatePdf
  };
})();
