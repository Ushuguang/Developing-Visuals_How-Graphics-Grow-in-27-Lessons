import { el, svg, table, selectControl, button, format } from './utils.js';
import { localKey } from './models-05.js';
import { inspectSpiralSegment, constructionState, actualSampling, weeklyIllustration, boundsFor, leaseSpiralListeners } from './chapter-05-spiral-model.js';
const ink='#123e37',lime='#dfeb91',muted='#97ae73',accent='#b34c35';
const range=(block,from,to=from)=>({block,from,to});
const step=(id,label,codeTargets,explain)=>({id,label,codeTargets,explain});
function waitForSVG(mount,signal){
  const ready=()=>{const chart=mount?.querySelector('svg.spiral-svg');return chart?.querySelector('path.seg')?chart:null;};
  const found=ready();if(found)return Promise.resolve(found);
  return new Promise((resolve,reject)=>{
    if(!mount||signal.aborted){reject(new DOMException('Aborted','AbortError'));return;}
    const cleanup=()=>{observer.disconnect();signal.removeEventListener('abort',abort);};
    const abort=()=>{cleanup();reject(new DOMException('Aborted','AbortError'));};
    const observer=new MutationObserver(()=>{const node=ready();if(node){cleanup();resolve(node);}});
    observer.observe(mount,{childList:true,subtree:true});signal.addEventListener('abort',abort,{once:true});
  });
}
export function spiralDefinition(d3){return{
  sectionId:'5.4',title:['把一个日期扇环拆开看','Dissect one date segment'],
  goal:['逐步看清半径、投影、角增量、四顶点与闭合；再比较两种周期布局。','Inspect radius, projections, angle increments, vertices and closure; then compare two cycle layouts.'],
  source:['主案例沿用原日期与天气、原几何。讲义L公式与运行A圆弧分别标示；补充周周期例是模拟数据。','Original dates, weather and geometry. Lecture L formulas and running A arcs are labeled separately; the weekly example uses simulated data.'],
  steps:[
    step('radius',['① 半径','① Radius'],[range(0,8,14)],['圆心到起点P的实线就是r=bθ；圆周仅标相同半径，不表示一年。','The line from the origin to P is r=bθ; the circle marks a radius, not a year.']),
    step('projection',['② x/y投影','② x/y projections'],[range(0,11,12)],['半径拆成横向x与纵向y；直角、带符号读数和投影线对应同一个P。','Split the radius into signed x/y components; guides and readouts refer to the same P.']),
    step('delta',['③ 动态角增量','③ Angle increment'],[range(1,2,3),range(1,9,11)],['首、当前、末扇环都取自原图；半径变大时Δθ缩小，近似弧长仍约22。','First, selected and last segments come from the original figure; larger radius gives smaller Δθ, keeping approximate arc length near 22.']),
    step('vertices',['④ 四个顶点','④ Four vertices'],[range(2,3,10)],['默认按原讲义coords公式标四点；可切原运行几何，对照不同厚度约定。','Default vertices follow lecture coords; compare the running geometry’s different thickness convention.']),
    step('path',['⑤ 逐段闭合','⑤ Build and close'],[range(2,11)],['默认逐个执行原代码M/L/L/L/Z；切到原demo可比较M/A/L/A/Z。只有Z才闭合。','Execute the printed M/L/L/L/Z one command at a time; compare the demo’s M/A/L/A/Z. Only Z closes it.'])
  ],
  async create(ctx){
    const {root,article,signal,t,selectStep}=ctx;
    const original=await waitForSVG(article.querySelector('.demo-mount'),signal);
    if(signal.aborted)throw new DOMException('Aborted','AbortError');
    const segments=d3.select(original).selectAll('path.seg'),segs=segments.data();
    if(!segs.length)throw Error(t('原图尚无日期扇环，请打开原演示后重试。','No original date segments yet; open the demo and retry.'));
    let selected=0,current='radius',mode='demo',vertex=0,pathStage=0,restored=false;
    const placeholder=document.createComment('original-spiral-position');original.before(placeholder);
    let releaseBorrow=()=>placeholder.replaceWith(original);
    function restore(){if(restored)return;restored=true;releaseBorrow();}
    signal.addEventListener('abort',restore,{once:true});
    root.replaceChildren();
    const controls=el('div',{className:'tv-controls'}),heading=el('h4'),caption=el('p',{className:'tv-result'});
    const plot=svg('svg',{viewBox:'0 0 400 300',role:'img','aria-label':t('当前步骤的日期几何','Date geometry for the active step'),'data-spiral-main':''});
    const tools=el('div',{className:'tv-controls'}),output=el('div'),details=el('details'),weekly=el('details');
    details.append(el('summary',{},t('查看原全年图，点击定位日期','Open original year; click a date')));
    details.append(original);weekly.append(el('summary',{},t('教学微案例：为什么“一圈”不自动等于一周？','Micro-example: why a turn is not automatically a week')));
    root.append(heading,plot,tools,caption,controls,output,details,weekly);
    const dateSelect=selectControl(controls,t('原图日期','Original date'),segs.map((d,i)=>[String(i),`${i+1} / ${localKey(d.date)}`]),0,v=>{selected=+v;draw();},signal);
    for(const [zh,en,index]of [['首','First',0],['中','Middle',Math.floor(segs.length/2)],['末','Last',segs.length-1]])button(controls,t(zh,en),()=>{selected=index;dateSelect.value=String(index);draw();},signal);
    const modeSelect=selectControl(controls,t('公式来源','Formula source'),[['demo',t('原运行几何：A圆弧','Running geometry: A arcs')],['lecture',t('讲义公式对照：L四边形','Lecture formula: L polygon')]],mode,v=>{mode=v;pathStage=0;draw();},signal);
    const context=d3.select(original).append('g').attr('class','teaching-overlay').attr('pointer-events','none');
    releaseBorrow=leaseSpiralListeners(segments,d3.select,original,placeholder,context,(_,d)=>{selected=segs.indexOf(d);dateSelect.value=String(selected);selectStep('vertices');});
    const put=(parent,tag,attrs={},text='')=>{const n=svg(tag,attrs,text);parent.append(n);return n;};
    const text=(parent,x,y,value,attrs={})=>put(parent,'text',{x,y,style:'font-size:18px',...attrs},value);
    const ownedButton=(parent,label,fn,pressed)=>{const n=el('button',{type:'button'},label);n.onclick=()=>{if(!signal.aborted)fn();};if(pressed!==undefined)n.setAttribute('aria-pressed',String(pressed));parent.append(n);return n;};
    function fit(points,pad=30){
      const b=boundsFor(points),scale=Math.min((400-pad*2)/Math.max(b.width,1),(300-pad*2)/Math.max(b.height,1));
      const group=put(plot,'g',{transform:`translate(${200-scale*(b.x+b.width/2)},${150-scale*(b.y+b.height/2)}) scale(${scale})`});
      return {group,scale};
    }
    function line(g,a,b,color=ink,dashed=false,width=3){return put(g,'line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,stroke:color,'stroke-width':width,'vector-effect':'non-scaling-stroke',...(dashed?{'stroke-dasharray':'5 4'}:{})});}
    function point(g,p,r=5,fill=ink,scale=1){return put(g,'circle',{cx:p.x,cy:p.y,r:r/scale,fill,stroke:ink,'stroke-width':1,'vector-effect':'non-scaling-stroke'});}
    function worldText(g,p,value,scale,dx=8,dy=-8){return put(g,'text',{x:p.x+dx/scale,y:p.y+dy/scale,style:`font-size:${18/scale}px;paint-order:stroke;stroke:#fffef8;stroke-width:${3/scale}px;stroke-linejoin:round;fill:${ink}`},value);}
    function draw(){
      if(signal.aborted||restored)return;
      const d=segs[selected],sample=inspectSpiralSegment(d,mode),actual=inspectSpiralSegment(d,'demo');
      root.dataset.stage=current;plot.dataset.stage=current;plot.dataset.formula=mode;plot.dataset.pathStage=String(pathStage);
      heading.textContent=t({radius:'一根半径：角度决定离圆心多远',projection:'同一个P：把半径拆成x和y',delta:'同样约22长度，为什么外圈转角更小？',vertices:'四个位置：先外侧，再沿内侧返回',path:'从移动到闭合：每次只增加一个命令'}[current],{radius:'One radius: angle sets distance',projection:'One P, two signed components',delta:'Near-equal length, smaller outer angles',vertices:'Four positions: outer side then inner return',path:'From move to closure, one command at a time'}[current]);
      caption.textContent=`${localKey(d.date)} · ${d.value==null?t('原天气无记录','No source weather value'):`${d.value}°C`}\n`+(mode==='demo'?t('原运行：boxSize=22，coilGap=30.8，ringT=1.4。','Running: boxSize=22, coilGap=30.8, ringT=1.4.'):t('讲义公式对照：boxSize=32、coilGap=38.4；角度输入仍取当前原扇环，不冒充讲义365步重跑结果。','Lecture formula: boxSize=32, coilGap=38.4; t0/t1 remain the selected original inputs, not a rerun of the lecture loop.'));
      plot.replaceChildren();tools.replaceChildren();output.replaceChildren();
      context.selectAll('*').remove();context.append('path').attr('d',actual.path).attr('fill','none').attr('stroke',ink).attr('stroke-width',4);
      if(current==='radius')radius(sample);
      else if(current==='projection')projection(sample);
      else if(current==='delta')increments();
      else if(current==='vertices')vertices(sample);
      else buildPath(sample);
    }
    function radius(s){
      const r=s.p.r,origin={x:0,y:0},{group:g,scale}=fit([{x:-r,y:-r},{x:r,y:r}],34);
      put(g,'circle',{cx:0,cy:0,r,fill:'none',stroke:muted,'stroke-width':1,'vector-effect':'non-scaling-stroke'});
      line(g,origin,{x:r,y:0},muted,true,1);line(g,origin,s.p,ink,false,5);point(g,origin,5,ink,scale);point(g,s.p,7,lime,scale);
      worldText(g,origin,'O',scale,7,24);worldText(g,s.p,'P',scale);
      text(plot,12,24,`θ=${format(segs[selected].t0)} rad`);text(plot,12,285,`r=bθ=${format(s.b)}×${format(segs[selected].t0)}=${format(r)}`);
      output.append(el('p',{},t(`θ增加2π时，按当前公式计算半径增加${format(2*Math.PI*s.b)}。圆周在这里是几何参考，没有赋予日历周期。`,`A 2π increase in θ adds ${format(2*Math.PI*s.b)} to radius in this formula. The circle is a geometric reference, not a calendar cycle.`)));
      ownedButton(tools,t('分解成x/y →','Decompose x/y →'),()=>selectStep('projection'));
    }
    function projection(s){
      const origin={x:0,y:0},p=s.p,R=p.r,{group:g,scale}=fit([{x:-R,y:-R},{x:R,y:R}],35),x={x:p.x,y:0},y={x:0,y:p.y};
      line(g,{x:-R,y:0},{x:R,y:0},muted,false,1);line(g,{x:0,y:-R},{x:0,y:R},muted,false,1);
      line(g,origin,p,muted,false,2);line(g,origin,x,ink,false,5);line(g,x,p,accent,false,5);line(g,y,p,muted,true,1);
      point(g,p,7,lime,scale);point(g,origin,4,ink,scale);worldText(g,p,'P',scale);worldText(g,x,'x',scale,8,24);worldText(g,y,'y',scale,-21,-8);
      const size=9/scale,sx=p.x>=0?-1:1,sy=p.y>=0?1:-1;
      put(g,'path',{d:`M${x.x+sx*size},0 L${x.x+sx*size},${sy*size} L${x.x},${sy*size}`,fill:'none',stroke:ink,'stroke-width':1,'vector-effect':'non-scaling-stroke'});
      text(plot,10,25,`x=r cosθ=${format(p.x)}`);text(plot,10,285,`y=r sinθ=${format(p.y)}`,{style:`font-size:18px;fill:${accent}`});
      output.append(table(['r','θ (rad)','x','y'],[[format(p.r),format(segs[selected].t0),format(p.x),format(p.y)]]),el('p',{},t('深绿横线对应cos；棕色竖线对应sin。SVG的y向下为正，负值仍保留。','Green horizontal = cos; brown vertical = sin. SVG y points downward; signs are preserved.')));
    }
    function increments(){
      const rows=actualSampling(segs,selected),max=Math.max(...rows.map(r=>r.delta));
      caption.textContent+=t('\n本步固定用原运行公式，避免混用参数。','\nThis step always uses the running formula.');
      plot.dataset.formula='demo';modeSelect.disabled=true;
      rows.forEach((row,i)=>{const y=50+i*88,width=row.delta/max*230;
        text(plot,10,y,`#${row.index+1} · r=${format(row.r)}`);
        put(plot,'rect',{x:10,y:y+12,width,height:25,fill:row.index===selected?ink:lime,stroke:ink});
        text(plot,250,y+31,`${format(row.delta)} rad`);
      });
      output.append(table([t('原扇环','Segment'),'r','Δθ',t('近似长度','Approx. length')],rows.map(r=>[r.index+1,format(r.r),format(r.delta),format(r.estimatedLength)])),el('p',{},t('长度按√(b²+r²)×Δθ计算，不把r×Δθ误当精确螺旋弧长。','Length uses √(b²+r²)×Δθ, not r×Δθ as an exact spiral arc length.')));
      ownedButton(tools,t('追踪外圈末扇环','Trace the last outer segment'),()=>{selected=segs.length-1;dateSelect.value=String(selected);draw();});
    }
    function vertices(s){
      const {group:g,scale}=fit(s.vertices,48);
      put(g,'path',{d:s.path,fill:'#edf2d7',stroke:muted,'stroke-width':1,'vector-effect':'non-scaling-stroke'});
      s.vertices.forEach((p,i)=>{const next=s.vertices[(i+1)%4];line(g,p,next,i===vertex?ink:muted,i!==vertex,i===vertex?4:1);point(g,p,i===vertex?9:5,i===vertex?ink:lime,scale);worldText(g,p,String(i+1),scale,i<2?9:-26,i%2?-12:24);});
      const names=[t('起点外','Outer start'),t('终点外','Outer end'),t('终点内','Inner end'),t('起点内','Inner start')];
      names.forEach((name,i)=>ownedButton(tools,`${i+1} ${name}`,()=>{vertex=i;draw();},vertex===i));
      output.append(table(['#',t('位置','Position'),'x','y'],s.vertices.map((p,i)=>[i+1,names[i],format(p.x),format(p.y)])),el('p',{},t(`选中${vertex+1}：${names[vertex]}。局部放大倍率${format(scale)}，坐标值未改变。`,`Selected ${vertex+1}: ${names[vertex]}. Magnification ${format(scale)}; coordinates are unchanged.`)));
      if(mode==='demo')output.append(el('p',{},t('这里是运行A圆弧：内半径r、外半径r+1.4；原代码的±coilGap/2请切“讲义公式”查看。','Running arcs use inner r and outer r+1.4. Switch to lecture formulas for the code’s ±coilGap/2.')));
      else output.append(el('p',{},t('这里直接执行讲义coords(t,sign)：r±coilGap/2。只比较相同角度输入，不冒充原demo的四点。','This executes lecture coords(t,sign): r±coilGap/2 for the same angle inputs; these are not claimed to be the running demo vertices.')));
      ownedButton(tools,t('用这些点构造路径 →','Construct the path →'),()=>selectStep('path'));
    }
    function buildPath(s){
      const c=constructionState(s,pathStage),{group:g,scale}=fit(s.vertices,48);
      put(g,'path',{d:s.path,fill:'none',stroke:muted,'stroke-width':1,'stroke-dasharray':'3 4','vector-effect':'non-scaling-stroke'});
      put(g,'path',{d:c.path,fill:c.closed?lime:'none',stroke:ink,'stroke-width':4,'vector-effect':'non-scaling-stroke','data-built-path':''});
      s.vertices.forEach((p,i)=>{if(i<=Math.min(pathStage,3)){point(g,p,5,lime,scale);worldText(g,p,String(i+1),scale,i<2?9:-26,i%2?-12:24);}});
      point(g,c.cursor,9,ink,scale);
      const labels=mode==='demo'?['M','A₁','L','A₂','Z']:['M','L₁','L₂','L₃','Z'];
      labels.forEach((label,i)=>ownedButton(tools,`${i+1}. ${label}`,()=>{pathStage=i;draw();},pathStage===i));
      const next=ownedButton(tools,t('增加下一条命令 →','Add next command →'),()=>{pathStage=Math.min(4,pathStage+1);draw();});next.disabled=pathStage===4;
      ownedButton(tools,t('从M重新构造','Restart at M'),()=>{pathStage=0;draw();});
      output.append(el('p',{className:'tv-result'},`${labels[pathStage]} · ${c.closed?t('已闭合并填色','Closed and filled'):pathStage===0?t('仅移动到点1，尚未画边','Moved to point 1; no edge yet'):t('路径尚未闭合，不填色','Open path; no fill')}`),el('pre',{className:'tv-result'},c.path));
      output.append(el('p',{},mode==='demo'?t('实线是当前已执行命令，虚线仅供定位。运行路径A是圆弧，不把它写成原讲义L。','Solid = executed commands; dashed = reference. Running A commands are arcs, distinct from lecture L commands.'):t('当前与原代码return的M/L/L/L/Z一一对应；Z从点4回到点1。','Matches the original return’s M/L/L/L/Z; Z returns from point 4 to point 1.')));
    }
    function prepareWeekly(){
      const rows=weeklyIllustration(),choices=el('div',{className:'tv-controls'}),views=el('div'),note=el('p');
      views.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,170px),1fr));gap:10px';
      weekly.append(el('p',{},t('教学模拟：两周学习活跃度[2,3,6,5,4,8,1]重复；不是天气，不改变课程CSV。两图14个ID/数值完全相同。','Simulated two-week study activity [2,3,6,5,4,8,1], repeated; not weather. Both views share all 14 IDs/values.')),choices,views,note);
      let traced=0;
      for(let day=0;day<7;day++)ownedButton(choices,`${t('日序','Day phase')} ${day+1}`,()=>{traced=day;renderWeek();});
      function renderWeek(){views.replaceChildren();
        for(const [key,zh,en]of [['equal','原等弧长公式','Original near-equal arc sampling'],['weekly','教学设定：每7天一圈','Teaching rule: seven days per turn']]){
          const card=el('section',{className:'tv-card'}),chart=svg('svg',{viewBox:'0 0 260 260',role:'img','aria-label':t(zh,en),'data-week-layout':key});card.append(el('strong',{},t(zh,en)),chart);views.append(card);
          const R=Math.max(...rows.map(d=>d[key].r))*1.15,scale=108/R,g=put(chart,'g',{transform:`translate(130,130) scale(${scale})`});
          const points=rows.map(d=>d[key]);put(g,'path',{d:points.map((p,i)=>`${i?'L':'M'}${p.x},${p.y}`).join(' '),fill:'none',stroke:muted,'stroke-width':1,'vector-effect':'non-scaling-stroke'});
          rows.forEach(row=>{const p=row[key],active=row.day===traced;point(g,p,active?7:4,active?ink:lime,scale);if(active)worldText(g,p,`${row.id+1}`,scale,8,row.id<7?-10:24);});
          const first=rows[traced][key],second=rows[traced+7][key];line(g,first,second,accent,true,2);
        }
        const a=rows[traced],b=rows[traced+7];note.textContent=t(`追踪第${a.id+1}/${b.id+1}天：值均为${a.value}。等弧长图相位差${format((b.equal.theta-a.equal.theta)%(2*Math.PI))}rad；周映射相差2π，所以同一日序沿同一方向排列。`,`Days ${a.id+1}/${b.id+1} both have value ${a.value}. Equal-arc phase difference=${format((b.equal.theta-a.equal.theta)%(2*Math.PI))}rad; weekly mapping differs by 2π and aligns their directions.`);
      }
      renderWeek();return ()=>{traced=0;renderWeek();};
    }
    const resetWeekly=prepareWeekly();
    draw();
    return {focus(id){if(current!==id){current=id;if(id==='vertices'||id==='path'){mode='lecture';modeSelect.value=mode;}if(id==='delta'){mode='demo';modeSelect.value=mode;}if(id==='path')pathStage=0;}modeSelect.disabled=current==='delta';draw();},reset(){selected=0;current='radius';mode='demo';vertex=0;pathStage=0;dateSelect.value='0';modeSelect.value='demo';modeSelect.disabled=false;details.open=false;weekly.open=false;resetWeekly();draw();},destroy(){signal.removeEventListener('abort',restore);restore();root.replaceChildren();delete root.dataset.stage;}};
  }
};}
