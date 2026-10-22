/* Directory links navigate directly; pointer hover and keyboard focus preview. */
const label = (zh,en) => `data-preview-zh="${zh}" data-preview-en="${en}"`;
const text = (x,y,zh,en,extra='') => `<text x="${x}" y="${y}" ${label(zh,en)} ${extra}>${zh}</text>`;
let figureId = 0;
const frame = body => { const gridId = `preview-grid-${++figureId}`; return `<svg viewBox="0 0 640 230" aria-hidden="true" focusable="false"><defs><pattern id="${gridId}" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".65" fill="#78935a" opacity=".24"/></pattern></defs><rect width="640" height="230" fill="url(#${gridId})" opacity=".45"/>${body}</svg>`; };

function dataArt() {
  let dots='',rows='';
  for(let i=0;i<22;i++) {
    const noise = seed => { const value=Math.sin(seed*12.9898)*43758.5453; return value-Math.floor(value); };
    const x=65+noise(i+1)*164,y=52+noise(i+79)*113;
    dots+=`<circle cx="${x}" cy="${y}" r="${i%4===0?5:3.5}" fill="${i%3===0?'#9aad64':'#315c45'}" opacity=".8"/>`;
  }
  for(let row=0;row<5;row++) {
    const y=67+row*22;
    rows+=`<g class="data-row" style="--delay:${row*80}ms;--start-y:${40-row*20}px"><circle cx="381" cy="${y}" r="3.3" fill="#6f894e"/><path d="M403 ${y}h${33+row%2*15} M481 ${y}h${40-row%3*8}" stroke="#627952" stroke-width="3" stroke-linecap="round"/></g>`;
  }
  return frame(`<g>${dots}</g><path d="M251 112h66m-9-6 9 6-9 6" fill="none" stroke="#71875c" stroke-width="1.3"/><rect x="352" y="36" width="204" height="150" rx="2" fill="#fafbf2" stroke="#a6b68b"/><path d="M352 54h204M389 54v132M465 54v132" stroke="#d2dcc1"/>${rows}${text(145,211,'原始记录','Raw records','text-anchor="middle"')}${text(454,211,'结构化数据','Structured data','text-anchor="middle"')}`);
}
function flowArt() {
  const names=[['数据','Data'],['变换','Transform'],['映射','Mapping'],['视图','View']];
  let body='<path class="flow-track" d="M120 112H520" fill="none" stroke="#9daf80" stroke-width="1.5"/>';
  names.forEach(([zh,en],i)=>{
    const x=46+i*148;
    body+=`<g class="flow-node" style="--delay:${i*210}ms"><rect x="${x}" y="77" width="108" height="72" rx="2" fill="${i===3?'#dce8a5':'#f7f9ec'}" stroke="#8ca373"/><circle cx="${x+13}" cy="90" r="2" fill="#79965b"/>${text(x+54,120,zh,en,'text-anchor="middle"')}</g>`;
    if(i<3)body+=`<path d="M${x+122} 107l6 5-6 5" fill="none" stroke="#79905e"/>`;
  });
  body+=text(320,202,'从数据到图表的完整链路','The path from data to a chart','text-anchor="middle"');
  return frame(body);
}
function colorArt() {
  const ring=['#234f44','#7f9c67','#dce88e','#c0b16b','#b5bdac','#6d8b88'];
  const scale=['#173e36','#436952','#799563','#a9bf79','#d2e19b','#edf2cb'];
  let body='<g class="color-ring">';
  ring.forEach((color,i)=>{body+=`<circle cx="168" cy="111" r="62" fill="none" stroke="${color}" stroke-width="25" stroke-dasharray="62 328" transform="rotate(${i*60-90} 168 111)"/>`;});
  body+='</g><circle cx="168" cy="111" r="39" fill="#f5f7e7"/><circle cx="168" cy="111" r="4" fill="#b6c389"/>';
  scale.forEach((color,i)=>{body+=`<rect class="color-swatch" style="--delay:${i*85}ms;--swatch:${color}" x="${318+i*39}" y="64" width="36" height="95" rx="1" fill="${color}"/>`;});
  return frame(body+text(168,211,'色相与搭配','Hue & harmony','text-anchor="middle"')+text(433,211,'亮度与色彩映射','Lightness & color mapping','text-anchor="middle"'));
}
function curveArt() {
  const points=[[88,167],[114,148],[144,157],[175,128],[205,136],[232,99],[263,119],[291,104],[321,75],[354,96],[387,65],[421,83],[456,55],[493,67],[528,42],[558,52]];
  let body='<path d="M65 31v153h511" fill="none" stroke="#8b9e75" stroke-width="1.2"/><path d="M65 134h511M65 84h511" stroke="#ced8bc" stroke-dasharray="3 5"/>';
  points.forEach(([x,y],i)=>{body+=`<circle class="curve-dot" cx="${x}" cy="${y}" r="4.5" fill="#78935c" style="--delay:${i*30}ms"/>`;});
  body+='<path class="preview-curve" pathLength="1" d="M82 165C146 157 170 130 227 121S300 87 351 84 434 64 476 61 524 43 564 46" fill="none" stroke="#214e3e" stroke-width="2.7" stroke-linecap="round"/>';
  return frame(body+text(45,36,'y','y')+text(579,190,'x','x')+text(320,218,'散点中的关系与趋势','Relationships & trends in points','text-anchor="middle"'));
}
function timeArt() {
  let body='<path d="M56 45v130h235" fill="none" stroke="#9bae85"/><path d="M56 112h235M56 76h235" stroke="#d4ddc2" stroke-dasharray="3 5"/><path class="preview-curve" pathLength="1" d="M61 139 78 130 94 143 111 103 128 118 144 76 161 86 178 112 195 88 212 58 228 77 244 45 261 63 283 43" fill="none" stroke="#315e46" stroke-width="2.6" stroke-linejoin="round"/>';
  for(let row=0;row<7;row++)for(let col=0;col<12;col++){
    const level=(col*7+row*3+col*row)%5;
    body+=`<rect class="heat-cell" style="--delay:${col*70}ms;--cell-opacity:${.22+level*.17}" x="${350+col*17}" y="${48+row*17}" width="13" height="13" rx="1" fill="#668648" opacity="${.22+level*.17}"/>`;
  }
  return frame(body+text(173,211,'沿时间观察变化','Change over time','text-anchor="middle"')+text(450,211,'日历中的节律','Patterns in a calendar','text-anchor="middle"'));
}

export function initChapterExplorer() {
  const cards=document.querySelector('#chapters .cards');
  if(!cards || cards.dataset.explorerReady) return;
  const originals=[...cards.querySelectorAll(':scope > .card')];
  if(originals.length!==5) return;
  cards.dataset.explorerReady='true';
  const root=document.createElement('div'); root.className='chapter-explorer';
  const directory=document.createElement('div'); directory.className='chapter-directory';
  const heading=document.createElement('div'); heading.className='directory-heading';
  heading.innerHTML=`<span ${label('章节目录','CONTENTS')}>章节目录</span><span>01—05</span>`;
  const hint=document.createElement('p'); hint.className='directory-hint';
  hint.innerHTML=`<span class="hint-hover" ${label('悬停预览 · 点击进入','Hover to preview · Click to open')}>悬停预览 · 点击进入</span><span class="hint-touch" ${label('点击进入章节','Tap a chapter to open')}>点击进入章节</span>`;
  const tabs=document.createElement('nav'); tabs.className='chapter-tabs';
  tabs.setAttribute('aria-label','课程章节');
  directory.append(heading,hint,tabs); root.append(directory);
  cards.before(root); root.append(cards); cards.classList.add('chapter-panels');
  const arts=[dataArt,flowArt,colorArt,curveArt,timeArt];
  const buttons=[],panels=[];
  originals.forEach((card,index)=>{
    const number=String(index+1).padStart(2,'0');
    const button=document.createElement('a'); button.className='chapter-tab';
    button.href=card.getAttribute('href'); button.id=`chapter-tab-${number}`;
    const title=card.querySelector('h3');
    button.innerHTML=`<span class="chapter-tab-number">${number}</span><span class="chapter-tab-title" data-i18n="${title.dataset.i18n}">${title.textContent}</span><span class="chapter-tab-arrow" aria-hidden="true">↗</span>`;
    const panel=document.createElement('div'); panel.id=`chapter-preview-${number}`; panel.className='chapter-pane';
    panel.setAttribute('role','region'); panel.setAttribute('aria-labelledby',button.id);
    const art=document.createElement('div'); art.className=`chapter-art art-${number}`; art.setAttribute('aria-hidden','true');
    art.innerHTML=`<div class="art-topline"><span>FIG. ${number}</span><span ${label('章节示意','ILLUSTRATION')}>章节示意</span></div>${arts[index]()}`;
    panel.append(art,card); cards.append(panel); tabs.append(button); buttons.push(button); panels.push(panel);
    // Never intercept clicks: native links also preserve Enter, middle-click,
    // Ctrl/Cmd-click, context-menu opening, and direct navigation on touch.
    button.addEventListener('pointerenter',event=>{
      if(event.pointerType!=='touch') select(index);
    });
    button.addEventListener('focus',()=>select(index));
  });
  let current=0;
  function play(panel) {
    panel.classList.remove('art-playing');
    void panel.offsetWidth;
    panel.classList.add('art-playing');
  }
  function select(index) {
    current=index;
    buttons.forEach((button,i)=>{
      const active=i===index;
      button.dataset.previewActive=String(active);
      panels[i].hidden=!active;
    });
    play(panels[index]);
  }
  function translate() {
    const en=document.documentElement.lang==='en';
    root.querySelectorAll('[data-preview-zh]').forEach(el=>{el.textContent=en?el.dataset.previewEn:el.dataset.previewZh;});
    tabs.setAttribute('aria-label',en?'Course chapters':'课程章节');
  }
  document.addEventListener('wbl:localechange',translate);
  select(0); translate();
  if('IntersectionObserver' in window) {
    new IntersectionObserver(entries=>{
      if(entries[0].isIntersecting) play(panels[current]);
    },{threshold:.2}).observe(root);
  }
}
