import { el, svg, table, selectControl, button, svgButton, format } from './utils.js';
import { rgbToHsl, simulateCVD, CLASSIC_PALETTES } from './models-03.js';
import { chapter03Extra } from './chapter-03-extra.js';

const target = (block, from, to = from) => [{ block, from, to }];
const step = (id, zh, en, block, from, to, explain, english) => ({ id, label:[zh,en], codeTargets:target(block,from,to), explain:[explain,english] });
function frame(ctx) {
  ctx.root.replaceChildren();
  const controls=el('div',{className:'tv-controls'}), plot=el('div'), readout=el('div',{className:'tv-result'});
  ctx.root.append(controls,plot,readout); return {controls,plot,readout};
}
function slider(ctx, parent, label, min, max, value, change, increment=1) {
  const field=el('label',{className:'tv-field'}), name=el('span',{},label), input=el('input',{type:'range',min,max,step:increment,value});
  field.append(name,input); parent.append(field);
  input.addEventListener('input',()=>change(+input.value),{signal:ctx.signal}); return input;
}
function canvas(title, width=420, height=270) {
  const node=svg('svg',{viewBox:`0 0 ${width} ${height}`,role:'img','aria-label':title}); node.append(svg('title',{},title)); return node;
}
function cellsChart(d3, values, color, ctx, onPick) {
  const node=canvas(ctx.t('固定格点：格内显示真实输入值','Fixed cells: each label shows its input'),420,200);
  values.forEach((value,i)=>{
    const g=svg('g',{'data-key':i,transform:`translate(${8+i%6*68},${12+Math.floor(i/6)*36})`,'aria-label':`${i+1}: ${value}`});
    g.append(svg('rect',{width:60,height:30,fill:color(value),'data-value':value,stroke:'#123e37','stroke-width':.5}));
    const rgb=d3.rgb(color(value));
    const text=svg('text',{x:30,y:21,'text-anchor':'middle'},value);text.style.fill=(rgb.r*.299+rgb.g*.587+rgb.b*.114)>140?'#123e37':'#fff';
    g.append(text); if(onPick)svgButton(g,()=>onPick(i),ctx.signal); node.append(g);
  });return node;
}

export function colormapModel(d3, semantic, misuse=false) {
  const values=Array.from({length:30},(_,i)=>semantic==='category'?'ABCDEF'[i%6]:semantic==='midpoint'?i*10-145:i*10);
  const names=['A','B','C','D','E','F'];
  const seq=d3.scaleSequential(d3.interpolateViridis).domain([0,290]);
  const diverging=value=>d3.interpolateRdBu((value+145)/290);
  const cat=d3.scaleOrdinal(names,d3.schemeTableau10);
  const recommended=semantic==='category'?cat:semantic==='midpoint'?diverging:seq;
  const wrong=semantic==='category'?value=>seq(names.indexOf(value)*58):semantic==='midpoint'?value=>seq(value+145):value=>d3.interpolateRdBu(value/290);
  return {values,color:misuse?wrong:recommended,recommended,wrong};
}

function colormap(d3) {
  return {sectionId:'3.2',title:['先看数据语义，再选颜色','Choose colors from data meaning'],
    goal:['只改变颜色，观察相同数值是否被暗示了不应有的中心或顺序。','Change only color and inspect the implied midpoint or ordering.'],
    source:['教学构造的 30 格数据；仅演示三类映射，不代表原页面所称的真实州级统计。','30 constructed teaching cells; these are mapping examples, not verified state statistics.'],
    steps:[
      step('ordered','有序数值','Ordered values',1,3,3,'没有特殊中点时，顺序型色带表达由少到多。','Without a meaningful midpoint, a sequential scale expresses increasing values.'),
      step('midpoint','语义中点','Meaningful midpoint',1,2,2,'偏差 0 有意义；正负值在同一中点两侧。','Zero is meaningful for deviations; negative and positive values lie on opposite sides.'),
      step('sequential','连续色值','Sequential colors',0,2,2,'scaleSequential 读取实际数值，不重复除以值域上限。','scaleSequential receives actual values, without dividing by the domain maximum twice.'),
      step('diverging','发散插值','Diverging interpolation',0,5,6,'RdBu 的输入是归一化 t；本图 -145→0，0→0.5，145→1。','RdBu receives normalized t: −145→0, 0→0.5, 145→1.'),
      step('category','无序类别','Unordered categories',0,9,9,'固定类别域使 A–F 的颜色含义稳定；类别没有大小顺序。','A fixed categorical domain keeps A–F colors stable; categories have no magnitude order.')],
    create(ctx){
      const {controls,plot,readout}=frame(ctx);let semantic='ordered',misuse=false,current='ordered';
      const choice=selectControl(controls,ctx.t('数据语义','Data meaning'),[['ordered',ctx.t('非负数值','Nonnegative values')],['midpoint',ctx.t('以 0 为中心的偏差','Deviation around zero')],['category',ctx.t('无序类别 A–F','Unordered A–F')]],semantic,v=>{semantic=v;ctx.selectStep(v);},ctx.signal);
      const recommended=button(controls,ctx.t('推荐方案','Recommended'),()=>{misuse=false;draw();},ctx.signal);
      const wrong=button(controls,ctx.t('常见误用','Common misuse'),()=>{misuse=true;draw();},ctx.signal);
      function draw(){
        const model=colormapModel(d3,semantic,misuse);plot.replaceChildren(cellsChart(d3,model.values,model.color,ctx,()=>ctx.selectStep(semantic==='midpoint'?'diverging':semantic==='category'?'category':'sequential')));
        recommended.setAttribute('aria-pressed',String(!misuse));wrong.setAttribute('aria-pressed',String(misuse));
        const legend=el('div',{className:'tv-card'});legend.append(el('strong',{},ctx.t('图例 · 数值与位置不变','Legend · values and positions stay fixed')));
        const keys=semantic==='category'?['A','B','C','D','E','F']:semantic==='midpoint'?[-145,0,145]:[0,145,290];
        legend.append(table([ctx.t('输入','Input'),ctx.t('显示色值','Displayed color')],keys.map(v=>[v,model.color(v)])));plot.append(legend);
        readout.textContent=semantic==='category'?ctx.t('A–F 是名称；明暗次序容易让人误以为有大小。','A–F are names; a lightness ramp can falsely imply order.'):semantic==='midpoint'?ctx.t('0 = 无偏差。发散色带两侧对应负/正方向；白色不等于缺失。','0 = no deviation. Diverging hues mark negative/positive directions; white is not missing data.'):ctx.t('范围 0–290；145 只是范围中点，并无特殊语义。','Range 0–290; 145 is only the range midpoint, with no special meaning.');
        plot.dataset.semantic=semantic;plot.dataset.misuse=String(misuse);plot.dataset.step=current;
      }
      return {focus(id){current=id;if(['ordered','midpoint','category'].includes(id)){semantic=id;choice.value=id;}if(id==='diverging'){semantic='midpoint';choice.value=semantic;}if(id==='sequential'){semantic='ordered';choice.value=semantic;}draw();},reset(){semantic='ordered';misuse=false;choice.value=semantic;draw();},destroy(){}};
    }};
}

function models(d3) {
 return {sectionId:'3.1',title:['同一个颜色，三组坐标','One color, three coordinate systems'],goal:['观察 RGB 输入怎样成为 HSL 和 Lab 数值；色样始终是同一个颜色。','Follow RGB inputs into HSL and Lab while keeping one color sample.'],source:['原 rgbToHsl 与 D3 颜色转换；最终显示以设备为准。CMYK 印刷模型仍在原讲义中。','Original rgbToHsl and D3 conversions; display depends on the device. CMYK remains in the lecture.'],steps:[
  step('normalize','通道归一化','Normalize channels',0,2,2,'0–255 除以 255，进入 0–1 范围。','Divide 0–255 by 255 to enter the 0–1 range.'),
  step('minmax','最大与最小','Maximum and minimum',0,3,4,'最大最小通道决定亮度与后续分支。','Channel extrema determine lightness and the subsequent branch.'),
  step('chroma','差值与饱和度','Chroma and saturation',0,7,8,'d=max−min；灰色通道相同，色差为 0。','d=max−min; equal gray channels have zero chroma.'),
  step('hue','色相分支','Hue branch',0,9,16,'实际最大通道选择分支，最终 H 转换为角度。','The maximum channel chooses the branch; H becomes an angle.'),
  step('d3','D3 读数','D3 readings',2,1,5,'用 d3.hsl(c)、d3.lab(c) 读出同色坐标；原代码中的方法写法保留待校对。','Read the same color with d3.hsl(c) and d3.lab(c); the original method notation is retained for review.')],
 create(ctx){const f=frame(ctx);let rgb=[100,50,200],current='normalize';const inputs=[];
  ['R','G','B'].forEach((name,i)=>inputs.push(slider(ctx,f.controls,name,0,255,rgb[i],v=>{rgb[i]=v;draw();})));
  const sample=el('div',{className:'tv-card'});sample.style.height='76px';const values=el('div');const gradients=el('details');gradients.append(el('summary',{},ctx.t('拓展：相同端点的 RGB / Lab 插值','More: RGB / Lab interpolation with the same endpoints')));
  f.plot.append(sample,values,gradients);
  [['RGB',d3.interpolateRgb],['Lab',d3.interpolateLab]].forEach(([name,fn])=>{gradients.append(el('p',{},`${name}: #ff0080 → #00b7a8`));const line=el('div');line.style.display='flex';for(let i=0;i<24;i++){const cell=el('span',{title:fn('#ff0080','#00b7a8')(i/23)});cell.style.cssText=`flex:1;height:26px;background:${fn('#ff0080','#00b7a8')(i/23)}`;line.append(cell);}gradients.append(line);});
  function draw(){const hsl=rgbToHsl(...rgb),color=d3.rgb(...rgb),lab=d3.lab(color),dh=d3.hsl(color);sample.style.background=color.formatHex();sample.setAttribute('aria-label',color.formatHex());
   values.replaceChildren(table(['RGB','HSL','Lab'],[[rgb.join(', '),hsl.map(format).join(', '),[lab.l,lab.a,lab.b].map(format).join(', ')]]));
   const normalized=rgb.map(v=>v/255),max=Math.max(...normalized),min=Math.min(...normalized);
   f.readout.textContent=`${current}\nRGB / 255 = [${normalized.map(format)}]\nmax=${format(max)}, min=${format(min)}, d=${format(max-min)}\nH=${format(hsl[0])}°, S=${format(hsl[1])}%, L=${format(hsl[2])}%\n${ctx.t('与 D3 饱和度/亮度差','Saturation/lightness difference from D3')}: ${format(hsl[1]-dh.s*100)}, ${format(hsl[2]-dh.l*100)}${max===min?ctx.t('\n灰色 H 在 D3 中未定义；手写函数约定为 0。','\nFor gray, D3 hue is undefined; the hand-written function uses 0.'):''}`;
  }
  return{focus(id){current=id;draw();},reset(){rgb=[100,50,200];inputs.forEach((n,i)=>n.value=rgb[i]);draw();},destroy(){}};
 }};
}

function labSlice(d3){return{sectionId:'3.3',title:['固定 L*，读懂 a*–b* 切片','Read an a*–b* slice at fixed L*'],goal:['定位一个 Lab 点，区分未裁剪 RGB 数值和屏幕可显示颜色。','Locate one Lab point and distinguish unclipped RGB values from displayable colors.'],source:['D3 Lab→RGB 实际计算；二维采样切片，不代表完整三维色域或打印色域。','Actual D3 Lab→RGB conversion; this sampled 2D slice is not a complete 3D or printing gamut.'],steps:[
 step('lab','定位 Lab 点','Locate Lab point',0,2,2,'L* 固定，a* 为横轴、b* 为纵轴。','L* is fixed; a* is horizontal and b* vertical.'),
 step('rgb','转换 RGB','Convert to RGB',0,3,3,'rgb() 的原通道可能越界；displayable() 判断此采样能否在 sRGB 显示。','Raw rgb() channels can be out of range; displayable() checks sampled sRGB displayability.'),
 step('hex','屏幕输出','Screen output',0,4,4,'formatHex 输出裁剪后的屏幕色；越界点不能当作精确原色。','formatHex outputs a clipped display color; out-of-gamut points are not exact reproductions.'),
 step('interpolation','相同端点插值','Same-endpoint interpolation',1,2,7,'黑白端点保持不变，对比中间色值。','Keep black and white endpoints fixed and compare intermediate colors.')],create(ctx){
 const f=frame(ctx);let L=50,a=30,b=-20;const inputs=[];
 [[ctx.t('亮度 L*','Lightness L*'),0,100,L,v=>{L=v;paint();draw();}],["a*",-120,120,a,v=>{a=v;draw();}],["b*",-120,120,b,v=>{b=v;draw();}]].forEach(args=>inputs.push(slider(ctx,f.controls,...args)));
 const wrap=el('div');wrap.style.cssText='position:relative;width:100%;max-width:300px';const raster=el('canvas',{width:240,height:240,'aria-label':ctx.t('灰色斜纹为超出 sRGB 的采样','Gray hatching marks samples outside sRGB')});raster.style.cssText='display:block;width:100%;height:auto';
 const overlay=canvas('a* horizontal; b* vertical',240,240);overlay.style.cssText='position:absolute;inset:0;width:100%;height:100%';
 const point=svg('circle',{r:6,fill:'none',stroke:'#111','stroke-width':3});overlay.append(svg('line',{x1:0,y1:120,x2:240,y2:120,stroke:'#123e3770'}),svg('line',{x1:120,y1:0,x2:120,y2:240,stroke:'#123e3770'}),point);wrap.append(raster,overlay);f.plot.append(wrap,el('p',{},ctx.t('横轴 a*: −120→120；纵轴 b*: 120→−120；斜纹 = 超出 sRGB。','a*: −120→120 horizontally; b*: 120→−120 vertically. Hatching = outside sRGB.')));
 const gradients=el('div');f.plot.append(gradients);
 function paint(){const c=raster.getContext('2d');for(let y=0;y<240;y+=4)for(let x=0;x<240;x+=4){const rgb=d3.lab(L,x-120,120-y).rgb();c.fillStyle=rgb.displayable()?rgb.formatHex():((x+y)%8?'#dadfd0':'#8d9c80');c.fillRect(x,y,4,4);}}
 function draw(){const c=d3.lab(L,a,b),rgb=c.rgb();point.setAttribute('cx',a+120);point.setAttribute('cy',120-b);f.readout.textContent=`Lab(${L}, ${a}, ${b})\nRGB(${[rgb.r,rgb.g,rgb.b].map(format).join(', ')})\n${rgb.displayable()?ctx.t('sRGB 范围内','Within sRGB'):ctx.t('超出 sRGB，下面是裁剪输出','Outside sRGB; output below is clipped')}\nformatHex()=${c.formatHex()}`;}
 paint();draw();return{focus(id){gradients.replaceChildren();if(id==='interpolation'){for(const [name,fn] of [['Lab',d3.interpolateLab],['RGB',d3.interpolateRgb]])gradients.append(el('p',{},`${name}: [0, .5, 1] → ${[0,.5,1].map(v=>fn('#000000','#ffffff')(v)).join(' / ')}`));}draw();},reset(){L=50;a=30;b=-20;[L,a,b].forEach((v,i)=>inputs[i].value=v);paint();draw();},destroy(){}};
}};}

function hueFigure(d3,hs,colors,chosen,ctx,onPick){const node=canvas(ctx.t('色相方向与固定柱图','Hue directions and fixed bars'),420,250);node.append(svg('circle',{cx:110,cy:110,r:76,fill:'none',stroke:'#b4c594'}));
 hs.forEach((h,i)=>{const angle=h*Math.PI/180,x=110+76*Math.cos(angle),y=110+76*Math.sin(angle);const g=svg('g',{'aria-label':`${i+1}: ${format(h)}°`});g.append(svg('line',{x1:110,y1:110,x2:x,y2:y,stroke:colors[i],'stroke-width':i===chosen?4:2}),svg('circle',{cx:x,cy:y,r:i===chosen?8:5,fill:colors[i],stroke:'#123e37'}));if(onPick)svgButton(g,()=>onPick(i),ctx.signal);node.append(g);});
 colors.forEach((color,i)=>{const h=25+(i*19)%95;node.append(svg('rect',{x:228+i*25,y:205-h,width:18,height:h,fill:color,stroke:i===chosen?'#123e37':'none','stroke-width':3}),svg('text',{x:237+i*25,y:225,'text-anchor':'middle'},i+1));});return node;}

function harmony(d3){return{sectionId:'3.4',title:['色轮上的关系怎样进入图表','From hue relationships to chart colors'],goal:['固定五根柱子的值，只改变教师五种规则下的色相。','Keep five bar values fixed and change hue using the five classroom rules.'],source:['原 palette(baseH, offset) 公式；固定柱图是教学示意，非论文原图。','Original palette(baseH, offset); fixed bars are teaching illustrations, not paper figures.'],steps:[
 step('rule','五种规则','Five rules',0,2,8,'规则决定 offset；原五类名称与公式保留。','The rule selects offset; all five original names and formulas are preserved.'),
 step('wrap','色相取模','Hue wraparound',0,13,13,'(350+30)%360 = 20°，转过一圈回到起点。','(350+30)%360 = 20°; hues wrap after a full turn.'),
 step('color','色相变色值','Hue to color',0,14,14,'同一颜色数组同时驱动色轮与柱图。','One color array drives both hue markers and bars.')],create(ctx){const f=frame(ctx);let H=210,offset=30,chosen=2;const rules=[[0,ctx.t('单色','Monochromatic')],[30,ctx.t('类比','Analogous')],[180,ctx.t('互补','Complementary')],[120,ctx.t('三等分','Triadic')],[150,ctx.t('分裂互补','Split')]];
 const rule=selectControl(f.controls,ctx.t('色系','Rule'),rules,offset,v=>{offset=+v;draw();},ctx.signal);const hue=slider(ctx,f.controls,'H (°)',0,360,H,v=>{H=v;draw();});
 function draw(){const hs=[-2,-1,0,1,2].map(i=>(H+i*offset+360)%360),colors=hs.map(h=>d3.hsl(h,.6,.55).formatHex());f.plot.replaceChildren(hueFigure(d3,hs,colors,chosen,ctx,i=>{chosen=i;ctx.selectStep('color');}));f.readout.textContent=`H=${H}°, offset=${offset}°\n${hs.map((h,i)=>`${i+1}: H=${h}°, ${colors[i]}`).join('\n')}\n${ctx.t('柱高固定；只有颜色改变。','Bar heights stay fixed; only colors change.')}${offset===0?ctx.t('\n本段公式 offset=0，五色相同；亮度变化的理论仍见原讲义。','\nWith offset=0 this formula repeats one color; see the lecture for lightness variation.'):''}`;}
 return{focus(id){if(id==='wrap')chosen=4;else if(id==='rule')chosen=2;draw();},reset(){H=210;offset=30;chosen=2;rule.value=offset;hue.value=H;draw();},destroy(){}};
}};}

function classic(d3){return{sectionId:'3.5',title:['同一数据，试用经典色板','Try classic palettes on fixed data'],goal:['按数据语义试色，比较原色、灰度与 CVD 教学近似。','Match palettes to data meaning and compare original, gray and approximate CVD views.'],source:['沿用 CLASSIC_PALETTES 原色值与名称；固定图形为教学示意，作者来源见原讲义。','Original CLASSIC_PALETTES values and names; fixed charts are teaching illustrations. Author attributions remain in the lecture.'],steps:[
 step('array','色板索引','Palette indices',0,2,5,'离散索引始终对应同一个类别位置。','Each discrete index continues to refer to the same category position.'),
 step('sequential','顺序采样','Sequential samples',0,6,6,'Viridis 用于连续数值；同一梯度的取样位置可以追踪。','Viridis represents continuous values with traceable sampling positions.'),
 step('diverging','偏差采样','Deviation samples',0,7,7,'RdBu 需要有意义的中心；原数组中无效色值独立提示，不能伪装成正常色。','RdBu needs a meaningful center; invalid original tokens are reported instead of silently rendered.')],create(ctx){const f=frame(ctx);let name='Wong 2011',mode='normal';
 const names=Object.keys(CLASSIC_PALETTES),choice=selectControl(f.controls,ctx.t('经典色板','Palette'),names,name,v=>{name=v;ctx.selectStep(v==='Viridis (seq)'?'sequential':v==='RdBu (div)'?'diverging':'array');},ctx.signal);
 const modeChoice=selectControl(f.controls,ctx.t('显示方式','Display mode'),[['normal',ctx.t('原色','Original')],['gray',ctx.t('灰度近似','Approximate grayscale')],['deuteranopia',ctx.t('绿盲近似','Approximate deuteranopia')]],mode,v=>{mode=v;draw();},ctx.signal);
 function draw(){const raw=CLASSIC_PALETTES[name],invalid=raw.filter(c=>!d3.color(c));if(invalid.length){f.plot.replaceChildren(el('p',{},ctx.t('原色板存在无效色值，保留待教师校对：','Invalid original palette token retained for teacher review: ')+invalid.join(', ')));f.readout.textContent=JSON.stringify(raw);return;}
 const display=raw.map(hex=>{const c=d3.rgb(hex);if(mode==='gray'){const y=Math.round(.299*c.r+.587*c.g+.114*c.b);return d3.rgb(y,y,y).formatHex();}return mode==='normal'?hex:d3.rgb(...simulateCVD([c.r,c.g,c.b],mode)).formatHex();});
 const continuous=name.includes('(seq)')||name.includes('(div)');const values=Array.from({length:30},(_,i)=>continuous?i/29:'ABCDEF'[i%6]);const scale=continuous?d3.scaleLinear(d3.range(display.length).map(i=>i/(display.length-1)),display):d3.scaleOrdinal(['A','B','C','D','E','F'],display);
 f.plot.replaceChildren(cellsChart(d3,values.map(v=>typeof v==='number'?+v.toFixed(2):v),scale,ctx,()=>ctx.selectStep('array')));f.readout.textContent=`${name} · ${raw.length} ${ctx.t('色','colors')}\n${ctx.t(continuous?'连续/偏差语义：格点 0–1（RdBu 中心 .5）':'类别 A–F，无大小次序',continuous?'Continuous/deviation values: 0–1 (RdBu center .5)':'Categories A–F, without ordering')}\n${raw.map((c,i)=>`${i}: ${c} → ${display[i]}`).join('\n')}`;
 }
 return{focus(id){if(id==='sequential'){name='Viridis (seq)';choice.value=name;}if(id==='diverging'){name='RdBu (div)';choice.value=name;}draw();},reset(){name='Wong 2011';mode='normal';choice.value=name;modeChoice.value=mode;draw();},destroy(){}};
}};}

export function chapter03(d3) { return [models(d3),colormap(d3),labSlice(d3),harmony(d3),classic(d3),...chapter03Extra(d3)]; }
