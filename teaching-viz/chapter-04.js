import { el, svg, table, button, selectControl, svgButton, format } from './utils.js';
import { loadCrime, toLong, CRIME_METRICS, coordinateScales, coordinateTrace, inspectCell, valuesForCase, syntheticField, lineAtAngle, CURVES } from './models-04.js';

const ink = '#123e37', lime = '#dfeb91';
const crimeSource = ['原课堂 Crime CSV，州级记录；保留原数值，统计来源及单位待核实。', 'Original classroom Crime CSV, state records; values preserved, original provenance and units pending review.'];
const step = (id, zh, en, block, from, to, explainZh, explainEn) => ({ id, label: [zh,en], codeTargets: [{ block, from, to }], explain: [explainZh,explainEn] });
function shell(root, title) {
  root.replaceChildren();
  const controls = el('div', { className:'tv-controls' }), status = el('p', { className:'tv-result' }), chart = svg('svg', { viewBox:'0 0 560 330', role:'img', 'aria-label':title }), details = el('div');
  root.append(controls,status,chart,details); return { controls,status,chart,details };
}
function addText(chart,x,y,text,attrs={}) { const node=svg('text',{x,y,...attrs},text);chart.append(node);return node; }
function labelRange(root,t,zh,en,min,max,value,update,signal,stepValue=1) {
  const field=el('label',{className:'tv-field'});field.append(el('span',{},t(zh,en)));
  const input=el('input',{type:'range',min,max,step:stepValue,value}),output=el('output',{},value);field.append(input,output);root.append(field);
  input.addEventListener('input',()=>{output.textContent=input.value;update(+input.value);},{signal});
  return {input,output,set(v){input.value=v;output.textContent=v;}};
}
function stateSelector(controls,rows,t,value,change,signal) {
  return selectControl(controls,t('追踪州','Trace state'),rows.map(row=>[row.state,row.state]),value,change,signal);
}
function assertActive(signal) { if(signal.aborted)throw new DOMException('Aborted','AbortError'); }

export function chapter04(d3) { return [wideDefinition(d3), coordinatesDefinition(d3), curvesDefinition(d3), angleDefinition(d3), marchingDefinition(d3)]; }

function wideDefinition(d3) {
  return {
    sectionId:'4.1', title:['一行宽表，三行长表','One wide row, three long rows'],
    goal:['追踪同一州的三个值，理解 flatMap 只改变结构，不改变数值。','Trace three values from one state: flatMap changes structure, not values.'], source:crimeSource,
    steps:[
      step('types','① 类型','① Types',0,2,2,'autoType 让数字列可计算；原 CSV 的字段和值仍可追溯。','autoType makes numeric fields usable in calculations; source fields remain traceable.'),
      step('row','② 原行','② Source row',1,2,2,'flatMap 为每个源行展开结果；此处只观察选中州。','flatMap expands each input row; here we inspect one selected state.'),
      step('keys','③ 三个指标','③ Three metrics',1,3,5,'map 逐个取 murder、robbery、burglary 作为 metric。','map selects murder, robbery and burglary as metric keys.'),
      step('values','④ 原值守恒','④ Values preserved',1,6,6,'value: d[key] 直接读取源单元格，没有求和或改数。','value: d[key] reads the original cell, without summing or changing its value.')
    ],
    async create({root,signal,t,selectStep}) {
      const rows=await loadCrime(d3);assertActive(signal);if(!rows.length)throw Error('Empty Crime CSV');
      let selected=rows[0].state,current='types',metric='murder';
      const {controls,status,chart,details}=shell(root,t('宽表到长表值追踪','Wide-to-long value tracing'));
      const select=stateSelector(controls,rows,t,selected,v=>{selected=v;draw();},signal);
      const metricSelect=selectControl(controls,t('高亮指标','Highlight metric'),CRIME_METRICS,metric,v=>{metric=v;selectStep('values');},signal);
      function draw(){
        const row=rows.find(r=>r.state===selected),long=toLong([row]),all=toLong(rows);
        status.textContent=t(`${rows.length} 个原行 × 3 指标 = ${all.length} 个结果行；当前 ${selected}`,`${rows.length} original rows × 3 metrics = ${all.length} result rows; current ${selected}`);
        chart.replaceChildren();
        addText(chart,15,25,t('输入：同一行','Input: one row'));addText(chart,310,25,t('输出：三个观测','Output: three observations'));
        const y0=75;
        CRIME_METRICS.forEach((key,i)=>{
          const y=y0+i*76,on=key===metric;
          chart.append(svg('rect',{x:10,y:y-28,width:210,height:55,fill:on?lime:'#f0f4e4',stroke:ink}));
          addText(chart,20,y-6,key);addText(chart,20,y+15,current==='types'?`"${row[key]}" → ${row[key]} · ${typeof row[key]}`:String(row[key]));
          if(current==='types'||current==='row')return;
          chart.append(svg('path',{d:`M220,${y} L300,${y}`,stroke:ink,'stroke-width':on?3:1,'stroke-dasharray':on?'':'3 3'}));
          const g=svg('g',{'aria-label':`${key}: ${row[key]}`});
          g.append(svg('rect',{x:300,y:y-28,width:250,height:55,fill:on?lime:'#fffef8',stroke:ink}));
          g.append(svg('text',{x:312,y:y-6},`${selected} · ${key}`));g.append(svg('text',{x:312,y:y+15},current==='values'?`value = ${row[key]}`:'metric = '+key));
          svgButton(g,()=>{metric=key;metricSelect.value=key;selectStep('values');},signal);chart.append(g);
        });
        details.replaceChildren(table(['state',...CRIME_METRICS],[[row.state,...CRIME_METRICS.map(key=>row[key])]]));
        if(['keys','values'].includes(current))details.append(table(['state','metric','value'],long.map(r=>[r.state,r.metric,r.value])));
        details.append(el('p',{},t('值与源单元格逐项相等；不是统计归约。','Every value equals its source cell; this is not aggregation.')));
      }
      draw();return {focus(id){current=id;draw();},reset(){selected=rows[0].state;metric='murder';current='types';select.value=selected;metricSelect.value=metric;draw();},destroy(){root.replaceChildren();}};
    }
  };
}

function coordinatesDefinition(d3) {
  return {
    sectionId:'4.2', title:['同一个点的三级坐标','Three coordinate stages for one point'],
    goal:['用实际比例尺核对原值、内部坐标和加 margin 后的 SVG 坐标。','Verify input values, internal coordinates and SVG coordinates after the margin offset.'], source:crimeSource,
    steps:[
      step('domain','① 数据范围','① Domain',0,2,3,'原数据 x=murder、y=robbery；domain 来自同一份 CSV。','The original x=murder and y=robbery domains come from the same CSV.'),
      step('range','② 内部坐标','② Internal range',0,4,4,'内部宽度为画布宽度减左右 margin；此时尚未加偏移。','Internal width is the canvas width minus side margins; no offset is added yet.'),
      step('margin','③ margin','③ Margin',0,7,9,'第二层 scale 将内部坐标平移到 SVG 区域。','The second scale translates the internal coordinates into the SVG plotting region.'),
      step('point','④ 点的位置','④ Point position',0,12,12,'圆点 cx/cy 和下方表格取同一组真实 scale 结果。','Circle cx/cy and the table use the same real scale results.'),
      step('log','⑤ 对数比较','⑤ Log comparison',1,3,5,'对数定义域从1开始，只接受正值；刻度与点使用同一个比例尺。','The log domain starts at 1 and accepts positive values; ticks and points share the same scale.')
    ],
    async create({root,signal,t,selectStep}) {
      const rows=await loadCrime(d3);assertActive(signal);
      let selected=rows[0].state,width=720,type='linear',current='domain';
      const {controls,status,chart,details}=shell(root,t('数据到SVG坐标','Data-to-SVG coordinates'));
      const select=stateSelector(controls,rows,t,selected,v=>{selected=v;selectStep('point');},signal);
      const sizes=selectControl(controls,t('SVG 宽度','SVG width'),[['540','540'],['720','720']],width,v=>{width=+v;draw();},signal);
      const scales=selectControl(controls,t('x 比例尺','x scale'),['linear','log','sqrt'],type,v=>{type=v;selectStep(v==='log'?'log':'point');},signal);
      function draw(){
        const model=coordinateScales(d3,rows,width,type),row=rows.find(r=>r.state===selected),valid=coordinateTrace(row,model.maxX,model.maxY,width,360,type);
        chart.replaceChildren();chart.setAttribute('viewBox',`0 0 ${width} 360`);
        if(!valid){status.textContent=t('当前值不能用于该比例尺。','The current value is invalid for this scale.');details.replaceChildren();return;}
        const x=model.xScreen(model.xData(row.murder)),y=model.yScreen(model.yData(row.robbery));
        status.textContent=`${selected}: (${row.murder}, ${row.robbery}) → (${format(model.xData(row.murder))}, ${format(model.yData(row.robbery))}) → (${format(x)}, ${format(y)})`;
        chart.append(svg('rect',{x:0,y:30,width:50,height:290,fill:current==='margin'?lime:'#f0f4e4'}));
        const g=d3.select(chart);
        g.append('g').attr('transform','translate(50,320)').call(d3.axisBottom(model.xData).ticks(5));
        g.append('g').attr('transform','translate(50,30)').call(d3.axisLeft(model.yData).ticks(4));
        g.selectAll('circle.tv-crime-point').data(rows.filter(r=>type!=='log'||r.murder>0),r=>r.state).join('circle').attr('class','tv-crime-point').attr('cx',r=>model.xScreen(model.xData(r.murder))).attr('cy',r=>model.yScreen(model.yData(r.robbery))).attr('r',r=>r.state===selected?7:3).attr('fill',r=>r.state===selected?ink:'#9cad7b').attr('role','button').attr('tabindex',0).attr('aria-label',r=>`${r.state}, ${r.murder}, ${r.robbery}`).on('click',(_,r)=>{selected=r.state;select.value=selected;selectStep('point');}).on('keydown',(e,r)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selected=r.state;select.value=selected;selectStep('point');}});
        chart.append(svg('path',{d:`M50,${y} H${x} V320`,fill:'none',stroke:ink,'stroke-dasharray':'4 4'}));
        addText(chart,55,20,'robbery · '+t('原CSV值','source CSV value'));addText(chart,width/2,354,'murder · '+t('原CSV值','source CSV value'),{'text-anchor':'middle'});
        details.replaceChildren(table([t('阶段','Stage'),'x','y'],[[t('数据','Data'),row.murder,row.robbery],[t('内部','Internal'),format(model.xData(row.murder)),format(model.yData(row.robbery))],['SVG',format(x),format(y)]]));
        details.append(el('p',{},t(`margin 左50、上30；内部 ${model.innerW}×${model.innerH}。SVG坐标不是设备物理像素。`,`Margins: left 50, top 30; internal ${model.innerW}×${model.innerH}. SVG coordinates are not physical device pixels.`)));
      }
      draw();return {focus(id){current=id;if(id==='log'){type='log';scales.value='log';}draw();},reset(){selected=rows[0].state;width=720;type='linear';current='domain';select.value=selected;sizes.value='720';scales.value=type;draw();},destroy(){root.replaceChildren();}};
    }
  };
}

function marchingDefinition() {
  return {
    sectionId:'4.5', title:['四个角，怎样确定等值线？','How four corners determine a contour'],
    goal:['对照四位 case、跨阈值边和交点，识别原查表中的待确认差异。','Compare case bits, threshold-crossing edges and intersections; inspect the original table’s pending discrepancy.'],
    source:['教学示意单格及原程序合成标量场；不来自 Crime 的地理位置。','Illustrative cell and original program-generated scalar field; no Crime geography is implied.'],
    steps:[
      step('corners','① 四角输入','① Corner values',1,3,6,'角顺序 TL/TR/BR/BL，权重8/4/2/1；严格大于阈值才为1。','Corner order TL/TR/BR/BL, weights 8/4/2/1; a value must be strictly above the threshold to yield 1.'),
      step('bits','② 四位编码','② Four-bit case',1,2,6,'四个判断通过按位或合成0–15。修改阈值后重新计算。','Four comparisons are combined with bitwise OR into 0–15; changing the threshold recalculates the case.'),
      step('edges','③ 跨阈值边','③ Crossing edges',0,1,3,'边号为左0、下1、右2、上3。两端一大一小时才存在交点。','Edges are left 0, bottom 1, right 2, top 3; intersections occur when endpoint classifications differ.'),
      step('lookup','④ 查表核对','④ Check the table',1,8,8,'原查表与角/边编号存在不一致，默认图呈现可核验几何；原表可展开对照。','The original table differs from the corner/edge numbering. The main view shows verifiable geometry; expand the original table for comparison.'),
      step('interpolation','⑤ 阈值交点','⑤ Intersections',0,3,20,'补充几何核对用线性插值，不把原中点近似冒称精确交点。5/10是鞍点，当前示意固定分开高值角。','Supplemental checks use linear interpolation; original edge midpoints are not exact intersections. Cases 5/10 use a stated fixed pairing that separates high corners.')
    ],
    create({root,signal,t,selectStep}) {
      let preset=1,values=valuesForCase(1),threshold=0.5,current='corners',field=false;
      const {controls,status,chart,details}=shell(root,t('Marching Squares 单格几何','Marching Squares cell geometry'));
      root.append(el('p',{},t('原查表与几何核对（待教师确认）。实线连接实际跨阈值边；原演示保留。','Original lookup versus geometry check (teacher review pending). Solid lines connect actual crossing edges; the original demo is preserved.')));
      const cases=el('details');cases.append(el('summary',{},t('选择16种case（0–15）','Choose any of the 16 cases (0–15)')));
      const buttons=el('div',{className:'tv-controls'});cases.append(buttons);root.insertBefore(cases,chart);
      for(let code=0;code<16;code++)button(buttons,code.toString(2).padStart(4,'0')+' · '+code,()=>{preset=code;values=valuesForCase(code);threshold=0.5;slider.set(threshold);selectStep('bits');},signal);
      const slider=labelRange(controls,t,'阈值','Threshold',0,1,threshold,v=>{threshold=v;selectStep('interpolation');},signal,0.05);
      button(controls,t('不等角值示意','Unequal-value example'),()=>{values=[0.1,0.9,0.6,0.2];threshold=0.5;slider.set(threshold);selectStep('interpolation');},signal);
      button(controls,t('查看原合成场','Show original synthetic field'),()=>{field=!field;draw();},signal);
      function draw(){
        const cell=inspectCell(values,threshold);chart.replaceChildren();chart.setAttribute('viewBox','0 0 560 330');
        status.textContent=`TL/TR/BR/BL = ${values.map(format).join('/')} ; > ${format(threshold)} → ${cell.code.toString(2).padStart(4,'0')} = ${cell.code}${cell.saddle?t(' · 鞍点：固定分开高值角',' · saddle: high corners separated'):''}`;
        if(field)showField();else showCell(cell);
        details.replaceChildren(table([t('角','Corner'),t('原值','Value'),'> threshold','bit'],values.map((v,i)=>[['TL','TR','BR','BL'][i],format(v),v>threshold?1:0,[8,4,2,1][i]])));
        const legacy=el('details');legacy.append(el('summary',{},t('展开原查表 / 中点近似','Inspect original lookup / midpoint approximation')));
        legacy.append(el('p',{},`EDGE_TABLE[${cell.code}] = ${JSON.stringify(cell.original)}`));
        legacy.append(el('p',{},t(cell.mismatch?'原配对包含未跨阈值的边，待教师确认；没有替换原课件。':'本case配对端点都在跨阈值边上，原中点仍与插值点不同。',cell.mismatch?'The original pairing includes an edge that does not cross the threshold; teacher review is pending. Original notes remain intact.':'For this case the paired edges cross the threshold; original midpoints may still differ from interpolated points.')));
        const old=svg('svg',{viewBox:'0 0 260 220',role:'img','aria-label':t('原查表中点示意','Original lookup midpoint illustration')});
        old.append(svg('rect',{x:40,y:25,width:160,height:160,fill:'none',stroke:ink}));
        const mids=[[40,105],[120,185],[200,105],[120,25]];
        cell.original.forEach(([a,b])=>old.append(svg('line',{x1:mids[a][0],y1:mids[a][1],x2:mids[b][0],y2:mids[b][1],stroke:ink,'stroke-dasharray':'5 4','stroke-width':3})));
        legacy.append(old);details.append(legacy);
      }
      function showCell(cell){
        const x=140,y=55,size=210;
        chart.append(svg('rect',{x,y,width:size,height:size,fill:'#f7f9ef',stroke:ink}));
        const positions=[[x,y],[x+size,y],[x+size,y+size],[x,y+size]];
        positions.forEach(([cx,cy],i)=>{
          const node=svg('g',{'aria-label':`${['TL','TR','BR','BL'][i]} ${values[i]}`});
          node.append(svg('circle',{cx,cy,r:9,fill:values[i]>threshold?ink:'#fffef8',stroke:ink,'stroke-width':2}));
          node.append(svg('text',{x:cx+(i===0||i===3?-12:12),y:cy+(i<2?-16:27),'text-anchor':i===0||i===3?'end':'start'},`${['TL','TR','BR','BL'][i]} ${format(values[i])}`));
          svgButton(node,()=>selectStep('bits'),signal);chart.append(node);
        });
        [[x-28,y+size/2],[x+size/2,y+size+30],[x+size+24,y+size/2],[x+size/2,y-28]].forEach(([a,b],i)=>addText(chart,a,b,`e${i}`,{'text-anchor':'middle'}));
        if(current==='corners'||current==='bits')return;
        cell.points.forEach((point,edge)=>{if(!point)return;const node=svg('circle',{cx:x+point.x*size,cy:y+point.y*size,r:7,fill:lime,stroke:ink,'stroke-width':2,'aria-label':`edge ${edge}, f=${format(point.fraction)}`});svgButton(node,()=>selectStep('interpolation'),signal);chart.append(node);});
        if(current==='edges')return;
        cell.geometry.forEach(([a,b])=>{const p=cell.points[a],q=cell.points[b];if(p&&q)chart.append(svg('line',{x1:x+p.x*size,y1:y+p.y*size,x2:x+q.x*size,y2:y+q.y*size,stroke:ink,'stroke-width':4}));});
        addText(chart,20,320,t('交点 = A + (阈值−vA)/(vB−vA) × (B−A)','Intersection = A + (threshold−vA)/(vB−vA) × (B−A)'));
      }
      function showField(){
        const size=32,x0=80,y0=20;
        for(let y=0;y<8;y++)for(let x=0;x<8;x++){const v=syntheticField(x,y);chart.append(svg('rect',{x:x0+x*size,y:y0+y*size,width:size,height:size,fill:v>threshold?lime:'#f0f4e4',stroke:'#97ae73'}));}
        for(let y=0;y<7;y++)for(let x=0;x<7;x++){
          const c=inspectCell([syntheticField(x,y),syntheticField(x+1,y),syntheticField(x+1,y+1),syntheticField(x,y+1)],threshold);
          c.geometry.forEach(([a,b])=>{const p=c.points[a],q=c.points[b];if(p&&q)chart.append(svg('line',{x1:x0+(x+p.x)*size+size/2,y1:y0+(y+p.y)*size+size/2,x2:x0+(x+q.x)*size+size/2,y2:y0+(y+q.y)*size+size/2,stroke:ink,'stroke-width':2}));});
        }
        addText(chart,20,310,t('程序合成8×8标量场 · 格心值 · 几何核对线','Program-generated 8×8 scalar field · cell-center values · checked geometry'));
      }
      draw();return {focus(id){current=id;draw();},reset(){preset=1;values=valuesForCase(preset);threshold=0.5;current='corners';field=false;slider.set(threshold);draw();},destroy(){root.replaceChildren();}};
    }
  };
}

function curvesDefinition(d3) {
  return {
    sectionId:'4.3',title:['同一组点，不同的连接方式','Same points, different connections'],goal:['固定点与数值，观察 curve 如何改变 path；插值连接不等于统计回归。','Keep points and values fixed; observe how curve changes the path. Geometric interpolation is not statistical regression.'],source:crimeSource,
    steps:[step('points','① 固定输入','① Fixed input',0,2,3,'点的位置由x/y比例尺确定，不随曲线选型移动。','Point positions depend on x/y scales, not the curve choice.'),step('curve','② 连接方式','② Curve',0,4,4,'所有原十种curve入口保留；默认先比较linear、step、catmullRom。','All ten original curve choices remain; start with linear, step and catmullRom.'),step('datum','③ 整体绑定','③ Bind array',0,6,6,'datum绑定整个有序点数组到一条path。','datum binds an entire ordered array to one path.'),step('path','④ path输出','④ Path output',0,6,6,'attr(d,line)输出真实路径命令，不产生回归参数。','attr(d,line) produces actual path commands, not regression parameters.')],
    async create({root,signal,t,selectStep}){
      const rows=await loadCrime(d3);assertActive(signal);
      const micro=[{x:0,y:2},{x:1,y:5},{x:2,y:3},{x:3,y:7},{x:4,y:4},{x:5,y:6}];
      let name='linear',source='micro',current='points';const {controls,status,chart,details}=shell(root,t('固定点与曲线路径','Fixed points and curve paths'));
      ['linear','step','catmullRom'].forEach(key=>button(controls,key,()=>{name=key;all.value=name;selectStep('curve');},signal));
      const extra=el('details');extra.append(el('summary',{},t('全部十种曲线','All ten curves')));controls.append(extra);
      const all=selectControl(extra,t('曲线','Curve'),CURVES.map(([key])=>key),name,v=>{name=v;selectStep('curve');},signal);
      const input=selectControl(controls,t('数据','Data'),[['micro',t('教学示意：6个有序点','Illustration: six ordered points')],['crime',t('Crime原案例','Original Crime example')]],source,v=>{source=v;draw();},signal);
      function draw(){
        const points=source==='micro'?micro:rows.map(r=>({x:r.population,y:r.murder})).sort((a,b)=>a.x-b.x);
        const x=(source==='crime'?d3.scaleLog():d3.scaleLinear()).domain(d3.extent(points,p=>p.x)).range([50,530]);const y=d3.scaleLinear().domain([0,d3.max(points,p=>p.y)*1.1]).range([280,20]);
        const api=CURVES.find(([key])=>key===name)[1],line=d3.line().x(p=>x(p.x)).y(p=>y(p.y)).curve(d3[api]),path=line(points);
        chart.replaceChildren();const g=d3.select(chart);g.append('g').attr('transform','translate(0,280)').call(d3.axisBottom(x).ticks(5));g.append('g').attr('transform','translate(50,0)').call(d3.axisLeft(y).ticks(4));
        g.append('path').datum(points).attr('d',line).attr('fill','none').attr('stroke',ink).attr('stroke-width',current==='path'?4:2);
        g.selectAll('circle').data(points).join('circle').attr('cx',p=>x(p.x)).attr('cy',p=>y(p.y)).attr('r',4).attr('fill',lime).attr('stroke',ink).attr('role','button').attr('tabindex',0).attr('aria-label',p=>`${p.x}, ${p.y}`).on('click',()=>selectStep('datum')).on('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectStep('datum');}});
        status.textContent=`${points.length} ${t('固定点','fixed points')} · d3.${api} · path ${path.length} ${t('字符','characters')}`;
        details.replaceChildren(el('p',{},source==='micro'?t('教学示意；x为顺序，y为示意值。不是Crime统计。','Illustration; x is order, y illustrative values. Not Crime statistics.'):t('x=population，y=murder，均为原CSV值。按人口排序连接只作几何示意，不证明州际连续关系或统计趋势。','x=population, y=murder, original CSV values. Connections sorted by population illustrate geometry, not continuous state relationships or statistical trends.')),el('pre',{className:'tv-result'},path.slice(0,180)+(path.length>180?'…':'')),el('p',{},t('原回归代码仍保留在关键代码中；本图不加载额外回归库。','The original regression code remains available. This view loads no additional regression library.')));
      }
      draw();return {focus(id){current=id;draw();},reset(){name='linear';source='micro';current='points';all.value=name;input.value=source;draw();},destroy(){root.replaceChildren();}};
    }
  };
}

function angleDefinition() {
  return {sectionId:'4.4',title:['角度与端点，同步核对','Angles and endpoints checked together'],goal:['保留原角度实验，核对角度、弧度、sin/cos与端点。','Keep the original angle experiment and verify degrees, radians, sin/cos and endpoints.'],source:['原lineAtAngle几何教学示意；不是新增感知实验结论。','Original lineAtAngle geometry illustration; no new perceptual experiment is claimed.'],
    steps:[step('radians','① 角度→弧度','① Radians',0,3,3,'弧度=角度×π/180。','Radians = degrees × π/180.'),step('cos','② 横向投影','② Horizontal projection',0,7,7,'终点x由240×cos(r)加起点得到。','Endpoint x adds 240×cos(r) to the origin.'),step('sin','③ 纵向投影','③ Vertical projection',0,8,8,'SVG的y向下，向上投影要减240×sin(r)。','SVG y points downward; the upward projection subtracts 240×sin(r).'),step('slider','④ 参数与尺寸','④ Parameter and size',1,2,5,'仅按原5–85°调整，不把几何演示当作人眼误差实测。','Use the original 5–85° range; a geometry illustration is not a measurement of human perception.')],
    create({root,signal,t,selectStep}){
      let angle=45,current='radians',aspect=1;const {controls,status,chart,details}=shell(root,t('角度与端点投影','Angle and endpoint projections'));chart.setAttribute('viewBox','0 0 520 320');
      const slider=labelRange(controls,t,'原角度范围','Original angle range',5,85,angle,v=>{angle=v;selectStep('slider');},signal);
      const ratio=selectControl(controls,t('补充：横向映射比例','Supplement: horizontal mapping ratio'),[['0.75','0.75×'],['1','1×'],['1.5','1.5×']],1,v=>{aspect=+v;selectStep('slider');},signal);
      function draw(){const original=lineAtAngle(angle),p={...original,x1:original.x1*aspect,x2:original.x2*aspect},r=angle*Math.PI/180;chart.setAttribute('viewBox',`0 0 ${520*aspect} 320`);chart.replaceChildren();chart.append(svg('path',{d:`M${p.x1},${p.y1} H${p.x2} V${p.y2}`,fill:'none',stroke:'#97ae73','stroke-dasharray':'4 4'}),svg('line',{...p,stroke:ink,'stroke-width':4}));[[p.x1,p.y1],[p.x2,p.y2]].forEach(([cx,cy])=>chart.append(svg('circle',{cx,cy,r:6,fill:lime,stroke:ink})));addText(chart,p.x1,275,`(${p.x1},${p.y1})`);addText(chart,p.x2+8,p.y2+10,`(${format(p.x2)},${format(p.y2)})`);addText(chart,20,25,`${angle}° · r=${format(r)}`);
        status.textContent=`Δx = 240 × cos(${format(r)}) = ${format(original.x2-original.x1)}\nΔy = −240 × sin(${format(r)}) = ${format(p.y2-p.y1)}\n${t('横向映射','Horizontal mapping')} ×${aspect} → ${t('显示倾角','Displayed angle')} ${format(Math.atan2(original.y1-original.y2,(original.x2-original.x1)*aspect)*180/Math.PI)}°`;
        details.replaceChildren(el('p',{},t(`当前焦点 ${current}；长度240，起点(100,240)。原数据角度不变；横向映射可改变显示倾角。`,`Focus ${current}; length 240, origin (100,240). The data angle stays fixed; horizontal mapping changes its displayed angle.`)));
      }
      draw();return {focus(id){current=id;draw();},reset(){angle=45;aspect=1;ratio.value='1';current='radians';slider.set(angle);draw();},destroy(){root.replaceChildren();}};
    }
  };
}
