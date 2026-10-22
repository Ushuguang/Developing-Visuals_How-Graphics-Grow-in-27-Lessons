import { el, svg, table, button, selectControl, svgButton, format } from './utils.js';
import { CLASSIC_PALETTES, simulateCVD, rgbToHsl } from './models-03.js';
const ink='#123e37';
const S=(id,zh,en,from,to,explain)=>({id,label:[zh,en],codeTargets:[{block:0,from,to}],explain});
export const quizValues=()=>Array.from({length:8},(_,i)=>2+(i*1.3+0.5)%5+Math.sin(i)*1.2);
export function paletteParameters(H,S,L){
  return [[(H-30+360)%360,S*.6,L*1.1],[(H-30+360)%360,S,L],[H,S,L],[(H+30)%360,S,L],[(H+30)%360,S*.6,L*1.1],[(H+180)%360,S*.8,L*.95],[H,S*.2,L*1.4]].map(([h,s,l])=>({h,s,l,displayL:Math.max(0,Math.min(100,l)),clipped:l<0||l>100}));
}
export function transformRGB(rgb,mode){
  if(mode==='normal')return [...rgb];
  if(mode==='gray'){const y=Math.round(.299*rgb[0]+.587*rgb[1]+.114*rgb[2]);return [y,y,y];}
  return simulateCVD(rgb,mode);
}
export function paperMarks(kind){
  if(kind==='scatter')return Array.from({length:40},(_,i)=>({id:i,cat:i%5,x:20+(i*7)%180,y:15+(i*11)%80}));
  if(kind==='heat')return Array.from({length:70},(_,i)=>({id:i,cat:i,value:i/70,x:(i%14)*16,y:Math.floor(i/14)*22,width:16,height:22}));
  return Array.from({length:5},(_,i)=>({id:i,cat:i%2,x:20+i*36,y:20+(i%2)*5,width:30,height:70-i*5}));
}
function frame(root){root.replaceChildren();const controls=el('div',{className:'tv-controls'}),view=el('div'),readout=el('div');root.append(controls,view,readout);return {controls,view,readout};}
export function chapter03Extra(d3){return [quiz(d3),generator(d3),cvd(d3)];}

function quiz(d3){return {sectionId:'3.6',title:['同数据配色竞猜','Palette quiz'],goal:['先判断，再对照颜色的具体作用；八条数据始终不变。','Guess first, then inspect the color effect; all eight values stay fixed.'],source:['原四题名称与八条固定公式数据；A/C名称与实现差异待教师确认。','Original four cases/eight values; A/C labels need review.'],steps:[
 S('cards','① 四张同数据图','① Same-data charts',2,5,['先选一张你认为合适的方案，初始不展示答案。','Choose the scheme you consider suitable; answers start hidden.']),
 S('selection','② 选择状态','② Selection',6,10,['同一几何和数值，只改变palette及选中边框。','Fixed values/geometry; only colors and borders change.']),
 S('feedback','③ 判断理由','③ Explanation',11,11,['判断围绕课堂配色目标；示例不证明所有观察者都能分辨。','Classroom criteria, not universal vision claims.'])],
 create({root,signal,t,selectStep}){
  const {controls,view,readout}=frame(root);let answer=null;
  const names=['A：彩虹谱 Jet','B：红绿对比','C：颜色过多 12 色','D：Wong 8 色'];
  const palettes=[d3.interpolateRainbow,d3.interpolateRgb('#dc2626','#16a34a'),d3.interpolateSinebow,v=>CLASSIC_PALETTES['Wong 2011'][Math.floor(v*7.99)]];
  button(controls,t('再试一次','Try again'),()=>{answer=null;draw();},signal);
  function draw(){view.replaceChildren();view.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,180px),1fr));gap:10px';
   names.forEach((name,i)=>{const card=el('section',{className:'tv-card'}),title=button(card,name,()=>{answer=i;selectStep('feedback');},signal);title.setAttribute('aria-pressed',String(answer===i));const chart=svg('svg',{viewBox:'0 0 220 140',role:'img','aria-label':name});
    quizValues().forEach((v,j)=>{chart.append(svg('rect',{'data-id':j,x:8+j*25,y:112-v*14,width:21,height:v*14,fill:palettes[i](j/7)}),svg('text',{x:8+j*25,y:132},j+1));});card.append(chart);view.append(card);
   });readout.replaceChildren();
   if(answer!==null){readout.append(el('p',{role:'status'},t(answer===3?'按本题目标，D是原定答案：离散类别使用独立色。':'当前选项有误读风险；可继续比较D的离散类别色。',answer===3?'D is the original answer for this task: distinct colors encode categories.':'This option risks misreading; compare D’s categorical colors.')),el('p',{},t('A运行时是interpolateRainbow而非Jet；C虽名为12色，原实现只有8条。本图保留八条同数据，不伪造12条。','A uses Rainbow, not Jet; C names 12 but renders 8. Values stay fixed.')));}
  }
  draw();return {focus(id){if(id==='feedback'&&answer===null)readout.replaceChildren(el('p',{},t('请先投票，再查看本题解释。','Vote before viewing the explanation.')));},reset(){answer=null;draw();},destroy(){root.replaceChildren();}};
 }};}

function generator(d3){return {sectionId:'3.7',title:['一个公式，七个相同色样','Seven matching samples'],goal:['从同一个七色数组观察色轮、柱图和色样；核对S/L派生值。','One array drives the wheel, bars and swatches.'],source:['沿用原HSL派生公式。柱高为固定教学示意，非统计数据。','Original HSL formula; illustrative bar heights.'],steps:[
 S('analog','① 类比色','① Analogous',3,4,['H−30与H+30决定色轮方向，模360保持循环。','H±30 sets wheel positions; modulo 360 wraps hue.']),
 S('base','② 主色','② Main color',5,5,['主色索引2：同一数组同时供三个视图使用。','Main index 2; three views share one array.']),
 S('complement','③ 互补色','③ Complement',8,8,['H+180在对侧，S乘0.8，L乘0.95。','H+180 is opposite; multiply S by 0.8 and L by 0.95.']),
 S('light','④ 低饱和高亮','④ Light accent',9,9,['S×0.2、L×1.4显示原始派生值；L超100时仅显示层裁剪。','Raw S×0.2, L×1.4; display L clipped at 100.'])],
 create({root,signal,t,selectStep}){
  const {controls,view,readout}=frame(root);let H=220,S=70,L=55,chosen=2;const inputs=[];
  [['H',0,360,220],['S',20,100,70],['L',30,80,55]].forEach(([key,min,max,value])=>{const field=el('label',{className:'tv-field'},key),input=el('input',{type:'range',min,max,value}),out=el('output',{},value);field.append(input,out);controls.append(field);inputs.push([input,out]);input.addEventListener('input',()=>{if(key==='H')H=+input.value;if(key==='S')S=+input.value;if(key==='L')L=+input.value;out.textContent=input.value;draw();},{signal});});
  function draw(){const data=paletteParameters(H,S,L),colors=data.map(p=>d3.hsl(p.h,p.s/100,p.displayL/100).formatHex());view.replaceChildren();
   const wheel=svg('svg',{viewBox:'0 0 400 180',role:'img','aria-label':t('色轮与七色柱图','Color wheel and seven-color bars')});wheel.append(svg('circle',{cx:85,cy:85,r:58,fill:'none',stroke:'#97ae73'}));
   data.forEach((p,i)=>{const a=p.h*Math.PI/180,x=85+58*Math.cos(a),y=85-58*Math.sin(a),g=svg('g',{'aria-label':`#${i+1} ${colors[i]}`});g.append(svg('line',{x1:85,y1:85,x2:x,y2:y,stroke:colors[i]}),svg('circle',{cx:x,cy:y,r:i===chosen?10:6,fill:colors[i],stroke:ink}),svg('rect',{x:175+i*30,y:140-(i+3)*10,width:24,height:(i+3)*10,fill:colors[i],stroke:i===chosen?ink:'none'}),svg('text',{x:177+i*30,y:162},i+1));svgButton(g,()=>{chosen=i;selectStep(i===5?'complement':i===6?'light':i===2?'base':'analog');},signal);wheel.append(g);});view.append(wheel);
   const swatches=el('div',{className:'tv-controls'});colors.forEach((c,i)=>{const node=button(swatches,`${i+1} ${c}`,()=>{chosen=i;selectStep(i===5?'complement':i===6?'light':i===2?'base':'analog');},signal);node.style.borderTop=`12px solid ${c}`;node.setAttribute('aria-pressed',String(chosen===i));});view.append(swatches);
   const p=data[chosen],rgb=d3.rgb(colors[chosen]),hsl=rgbToHsl(rgb.r,rgb.g,rgb.b);readout.replaceChildren(table(['#','H','S','L',t('显示L','Display L')],[[chosen+1,format(p.h),format(p.s),format(p.l),format(p.displayL)]]),el('p',{},`RGB ${rgb.r}/${rgb.g}/${rgb.b} · HSL≈${hsl.map(format).join('/')}`));
   if(data.some(p=>p.clipped))readout.append(el('p',{},t('原L×1.4超100%；保留原值供理解，显示层限制到100%。与旧极限输出差异待教师确认。','L×1.4 exceeds 100%; raw value preserved, display clipped. Teacher review pending.')));
  }
  draw();return {focus(id){chosen=id==='base'?2:id==='complement'?5:id==='light'?6:chosen===2||chosen>4?0:chosen;draw();},reset(){H=220;S=70;L=55;chosen=2;inputs.forEach(([i,o],j)=>{i.value=[H,S,L][j];o.textContent=i.value;});draw();},destroy(){root.replaceChildren();}};
 }};}

function cvd(d3){return {sectionId:'3.8',title:['同一图形，原色与近似视角','Same geometry, original and simulated colors'],goal:['只转换本站SVG的fill，对照扫描数、RGB与同一对象的标签。','Compare trusted SVG fills, counts, RGB and labels.'],source:['科研论文风格教学示意，非论文原图；矩阵仅教学近似，非临床检测。','Research-figure-style illustration, not a published original; matrix approximation only, not clinical testing.'],steps:[
 S('parse','① 解析本站SVG','① Parse SVG',2,2,['DOMParser只处理下方本站生成的可信SVG，不接收用户粘贴。','Parse only this trusted generated SVG.']),
 S('scan','② 扫描fill','② Scan fill',3,6,['querySelectorAll(fill)得到实际可转换元素；不声称转换stroke/CSS/渐变。','Scan fills only, not strokes/CSS/gradients.']),
 S('simulate','③ RGB近似变换','③ RGB transform',7,8,['正常/近似灰度/三种CVD只改变颜色，数据位置不变。','Normal/gray/CVD change color, not position.']),
 S('serialize','④ 序列化结果','④ Serialize',10,10,['XMLSerializer输出变换后的可信SVG字符串，再显示该结果。','Serialize and display the transformed SVG.'])],
 create({root,signal,t,selectStep}){
  const {controls,view,readout}=frame(root);let kind='scatter',mode='deuteranopia',selected=0,current='parse';
  const kinds=selectControl(controls,t('原三图','Three original examples'),[['scatter',t('五类别散点','Five-class scatter')],['heat','Viridis '+t('热图','heatmap')],['bars',t('红绿柱图','Red–green bars')]],kind,v=>{kind=v;selected=0;draw();},signal);
  const modes=selectControl(controls,t('近似视角','Simulated view'),[['normal',t('正常','Normal')],['protanopia','Protanopia'],['deuteranopia','Deuteranopia'],['tritanopia','Tritanopia'],['gray',t('近似灰度','Approximate grayscale')]],mode,v=>{mode=v;selectStep('simulate');},signal);
  function make(){const chart=svg('svg',{viewBox:'0 0 240 130',role:'img','aria-label':kind});
   paperMarks(kind).forEach(mark=>{const color=kind==='scatter'?CLASSIC_PALETTES['Wong 2011'][mark.cat]:kind==='heat'?d3.interpolateViridis(mark.value):['#dc2626','#16a34a'][mark.cat];const attrs={'data-mark':mark.id,'data-cat':mark.cat,fill:color};let node;
    if(kind==='scatter')node=svg(mark.cat%2?'rect':'circle',mark.cat%2?{...attrs,x:mark.x-4,y:mark.y-4,width:8,height:8}:{...attrs,cx:mark.x,cy:mark.y,r:4});else node=svg('rect',{...attrs,x:mark.x,y:mark.y,width:mark.width,height:mark.height});
    node.setAttribute('stroke',mark.id===selected?ink:'none');node.setAttribute('stroke-width','2');node.setAttribute('aria-label',`#${mark.id+1}, ${kind==='heat'?format(mark.value):String.fromCharCode(65+mark.cat)}`);chart.append(node);
    if(mark.id===selected)chart.append(svg('text',{x:mark.x+6,y:Math.max(12,mark.y-4)},kind==='heat'?format(mark.value):String.fromCharCode(65+mark.cat)));
   });return chart;
  }
  function draw(){const original=make(),raw=new XMLSerializer().serializeToString(original),doc=new DOMParser().parseFromString(raw,'image/svg+xml'),nodes=[...doc.querySelectorAll('[fill]')];let before,after;
   nodes.forEach(node=>{const c=d3.rgb(node.getAttribute('fill')),rgb=[Math.round(c.r),Math.round(c.g),Math.round(c.b)],result=transformRGB(rgb,mode);node.setAttribute('fill',`rgb(${result.join(',')})`);if(+node.dataset.mark===selected){before=rgb;after=result;}});
   const serialized=new XMLSerializer().serializeToString(doc),parsed=new DOMParser().parseFromString(serialized,'image/svg+xml'),transformed=document.importNode(parsed.documentElement,true);
   view.replaceChildren();view.style.cssText='display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:8px';
   [[t('原图','Original'),original],[t('近似结果','Simulated result'),transformed]].forEach(([label,chart])=>{const box=el('section',{className:'tv-card'});box.append(el('h4',{},label),chart);view.append(box);chart.querySelectorAll('[data-mark]').forEach(node=>svgButton(node,()=>{selected=+node.dataset.mark;selectStep('simulate');},signal));});
   readout.replaceChildren(el('p',{className:'tv-result'},`${current}: ${nodes.length} fill · #${selected+1} RGB [${before}] → [${after}]\nXML ${serialized.length} ${t('字符；仅fill转换','characters; fill conversion only')}`),el('p',{},t(kind==='heat'?'热图每格有可聚焦的值标签；颜色表示0–69/70。':'类别用字母A–E及圆/方形辅助；点击对象，两图同一ID同时框选。',kind==='heat'?'Each heatmap cell has a focusable value label; color represents 0–69/70.':'Letters A–E and circle/square shapes supplement color; selecting a mark outlines the same ID in both views.')));
   if(kind!=='heat')readout.append(el('p',{},(kind==='scatter'?['A','B','C','D','E']:['A','B']).join(' · ')));
  }
  draw();return {focus(id){current=id;draw();},reset(){kind='scatter';mode='deuteranopia';selected=0;current='parse';kinds.value=kind;modes.value=mode;draw();},destroy(){root.replaceChildren();}};
 }};}
