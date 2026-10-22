import { loadStudents, parseClassNotes, mapToCountTree, treeCount, countHierarchy } from './models-02.js';
import { el, svg, table, selectControl, button, format } from './utils.js';

export function chapter02(d3) {
  return [flowDefinition(d3), {
    sectionId: '2.2',
    title: ['从新生表到嵌套 Map', 'From student rows to nested Maps'],
    goal: ['跟随真实行，观察专业键、班级键与计数如何改变输出。', 'Follow actual rows through major keys, class keys and count reduction.'],
    source: ['同源 newstudent.csv · DeepSeek 合成教学数据，不代表真实学生分布。', 'Same newstudent.csv · DeepSeek synthetic teaching data; no real student distribution is implied.'],
    steps: [
      { id: 'rows', label: ['① 输入行', '① Input rows'], codeTargets: [{ block: 0, from: 3, to: 3 }], explain: ['输入是同一份新生数组。选择一行以追踪其归属，源文件不会改变。', 'The input is the same student array. Choose a row to trace its groups; the source stays unchanged.'] },
      { id: 'major', label: ['② 专业键', '② Major key'], codeTargets: [{ block: 0, from: 5, to: 5 }], explain: ['d => d.major 决定外层 Map 的键；同专业的真实行进入同一个桶。', 'd => d.major defines the outer Map keys; actual rows with the same major share a bucket.'] },
      { id: 'class', label: ['③ 班级键', '③ Class key'], codeTargets: [{ block: 0, from: 6, to: 6 }], explain: ['在每个专业桶内，d => d.class 再生成班级子桶；成员仍是原来的行。', 'Within each major, d => d.class creates class buckets; members remain the original rows.'] },
      { id: 'count', label: ['④ 归约计数', '④ Reduce count'], codeTargets: [{ block: 0, from: 4, to: 4 }], explain: ['v => v.length 把每个班级的成员数组变为人数。子组人数之和等于父组人数。', 'v => v.length replaces each class member array with its count. Child counts sum to their parent count.'] },
      { id: 'map', label: ['⑤ 遍历 Map', '⑤ Read Map'], codeTargets: [{ block: 0, from: 9, to: 14 }], explain: ['rollup 返回 Map，不是 JSON。展开树是从这份 Map 派生的只读视图，不代表另一次聚合。', 'rollup returns a Map, not JSON. The expandable tree is a read-only view derived from that same Map.'] },
      { id: 'regex', label: ['⑥ 解析对照', '⑥ Parsing contrast'], codeTargets: [{ block: 1, from: 3, to: 4 }, { block: 1, from: 9, to: 9 }], explain: ['讲义用 match 捕获专业与班级号；原演示用 replace 去掉尾部数字/班字。两种写法在异常名称上可能不同。', 'The lecture uses match to capture a major and suffix; the original demo uses replace to strip trailing digits/班. Unusual names can produce different results.'] }
    ],
    async create(ctx) {
      const { root, signal, t, selectStep } = ctx;
      const rows = await loadStudents(d3);
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      if (!rows.length) throw new Error(t('新生 CSV 没有可用记录。', 'The student CSV has no records.'));
      const grouped = d3.group(rows, d => d.major, d => d.class);
      const counts = d3.rollup(rows, v => v.length, d => d.major, d => d.class);
      const tree = mapToCountTree(counts);
      let step = 'rows', selected = rows[0], regexPart = 'major';
      let viewEvents = new AbortController();
      const abortView = () => viewEvents.abort();
      signal.addEventListener('abort', abortView, { once: true });
      const make = (tag, text = '', attrs = {}) => {
        const node = document.createElement(tag);
        node.textContent = text;
        for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
        return node;
      };
      const on = (node, event, action) => node.addEventListener(event, action, { signal: viewEvents.signal });
      const add = (parent, tag, text, attrs) => parent.appendChild(make(tag, text, attrs));
      const action = (parent, label, run, pressed) => {
        const node = add(parent, 'button', label, { type: 'button', 'data-focus': label });
        if (pressed !== undefined) node.setAttribute('aria-pressed', String(pressed));
        on(node, 'click', run); return node;
      };
      const choose = (id, row) => { if (row) selected = row; selectStep(id); };
      function show() {
        const active = document.activeElement;
        const focused = root.contains(active) ? active.dataset.focus : null;
        viewEvents.abort(); viewEvents = new AbortController();
        root.replaceChildren();
        if (focused) queueMicrotask(() => {
          if (!signal.aborted) [...root.querySelectorAll('[data-focus]')].find(node => node.dataset.focus === focused)?.focus({ preventScroll: true });
        });
        const note = add(root, 'p', t(`已加载 ${rows.length} 行 · 本步：${step} · 已选 #${selected.id} ${selected.name}`, `Loaded ${rows.length} rows · Step: ${step} · Selected #${selected.id} ${selected.name}`));
        note.className = 'tv-result';
        if (step === 'regex') { showRegex(); return; }
        const label = add(root, 'label', t('追踪真实行 ', 'Trace an actual row '));
        const select = add(label, 'select', '', { 'aria-label': t('选择新生数据行', 'Select a student data row'), 'data-focus': 'trace-row' });
        select.style.maxWidth = '100%';
        rows.forEach((row, i) => {
          const option = add(select, 'option', `#${row.id} ${row.name} · ${row.class}`, { value: String(i) });
          option.selected = row === selected;
        });
        on(select, 'change', () => { selected = rows[+select.value]; show(); });
        const cols = add(root, 'div');
        cols.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));gap:12px;margin-top:12px;align-items:start';
        const input = add(cols, 'section'); add(input, 'h4', t('A / 原始行', 'A / Input rows'));
        add(input, 'p', t('局部显示 6 行；完整数组参与分组。', 'Showing 6 rows; grouping uses the entire array.'));
        const chosenIndex = rows.indexOf(selected);
        const sample = rows.slice(Math.max(0, Math.min(chosenIndex, rows.length - 6)), Math.max(0, Math.min(chosenIndex, rows.length - 6)) + 6);
        for (const row of sample) action(input, `#${row.id} ${row.name} · ${row.class}`, () => choose('major', row), row === selected).style.cssText = 'display:block;max-width:100%;text-align:left;margin:5px 0;white-space:normal';
        if (step === 'rows') return;
        const groups = add(cols, 'section'); add(groups, 'h4', t('B / 分桶', 'B / Buckets'));
        for (const [major, classes] of grouped) {
          const group = add(groups, 'div');
          group.style.cssText = `padding:8px;border:1px ${major === selected.major ? 'solid' : 'dashed'} currentColor;margin:6px 0;border-radius:6px`;
          const members = [...classes.values()].flat();
          action(group, `${major} · ${members.length} ${t('行', 'rows')}`, () => choose('major', members[0]), major === selected.major);
          if (step === 'major') { add(group, 'p', members.slice(0, 3).map(d => d.name).join('、') + (members.length > 3 ? '…' : '')); continue; }
          for (const [cls, students] of classes) {
            const value = step === 'class' ? `[${students.slice(0, 2).map(d => d.name).join('、')}${students.length > 2 ? '…' : ''}]` : String(counts.get(major).get(cls));
            action(group, `${cls} → ${value}`, () => choose(step === 'class' ? 'class' : 'count', students[0]), cls === selected.class).style.cssText = 'display:block;margin:5px 0;max-width:100%;white-space:normal;text-align:left';
          }
          if (step !== 'class') add(group, 'small', `${[...counts.get(major).values()].join(' + ')} = ${members.length}`);
        }
        if (!['count', 'map'].includes(step)) return;
        const output = add(cols, 'section'); add(output, 'h4', t('C / 嵌套 Map', 'C / Nested Map'));
        add(output, 'p', `Map(${counts.size}) → Map → number`);
        add(output, 'p', t(`人数守恒：树叶合计 ${treeCount(tree)} = CSV ${rows.length} 行`, `Count conserved: leaf total ${treeCount(tree)} = ${rows.length} CSV rows`));
        const lines = ['Map {'];
        for (const [major, classes] of counts) {
          lines.push(`  ${major} => Map {`);
          for (const [cls, n] of classes) lines.push(`    ${cls} => ${n}`);
          lines.push('  }');
        }
        lines.push('}');
        add(output, 'pre', lines.join('\n')).style.cssText = 'overflow:auto;max-width:100%;white-space:pre;font-size:12px';
        const details = add(output, 'details');
        details.open = step === 'map';
        add(details, 'summary', t('展开只读树（由 Map 转换）', 'Expand read-only tree (derived from Map)'));
        const list = add(details, 'ul');
        for (const major of tree.children) {
          const item = add(list, 'li');
          action(item, `${major.name} (${treeCount(major)})`, () => choose('major', rows.find(d => d.major === major.name)));
          const children = add(item, 'ul');
          for (const cls of major.children) action(add(children, 'li'), `${cls.name}: ${cls.value}`, () => choose('count', rows.find(d => d.class === cls.name)));
        }
      }
      function showRegex() {
        add(root, 'p', t('以下仅做解析对照，不把异常微案例写入 CSV。', 'This compares parsing only; the unusual example is not written to the CSV.'));
        const controls = add(root, 'div');
        action(controls, '.+? → ' + t('专业捕获', 'major capture'), () => { regexPart = 'major'; show(); }, regexPart === 'major');
        action(controls, '\\d+班 → ' + t('班级号捕获', 'suffix capture'), () => { regexPart = 'suffix'; show(); }, regexPart === 'suffix');
        const cases = [[selected.class, t('当前真实班级', 'Current actual class')], ['软件工程班', t('教学示意 · 异常格式', 'Teaching illustration · unusual format')]];
        for (const [value, title] of cases) {
          const parsed = parseClassNotes(value);
          const card = add(root, 'section'); add(card, 'h4', title);
          const parts = add(card, 'p');
          add(parts, regexPart === 'major' && parsed.matched ? 'mark' : 'span', parsed.lectureMajor);
          if (parsed.matched) add(parts, regexPart === 'suffix' ? 'mark' : 'span', parsed.suffix);
          add(card, 'p', `match → ${parsed.matched ? `m[1] = ${parsed.lectureMajor}; m[2] = ${parsed.suffix}` : t(`null → fallback cls = ${parsed.lectureMajor}`, `null → fallback cls = ${parsed.lectureMajor}`)}`);
          add(card, 'p', `replace(/[\\d班]+$/, "") → ${parsed.demoMajor || t('空字符串', 'empty string')}`);
        }
        add(root, 'p', t('两种解析规则并非对所有名称等价；分组图沿用原演示的 replace 规则。', 'These parsing rules are not equivalent for every name; the grouping view uses the original demo’s replace rule.'));
      }
      show();
      return {
        focus(id) { step = id; show(); },
        reset() { step = 'rows'; selected = rows[0]; regexPart = 'major'; show(); },
        destroy() { viewEvents.abort(); signal.removeEventListener('abort', abortView); root.replaceChildren(); }
      };
    }
  }, treeDefinition(d3), listDefinition(d3)];
}

function flowDefinition(d3) {
  return {
    sectionId:'2.1', title:['同一案例，三个观察角度','One case, three viewpoints'],
    goal:['把流程阶段与真实新生数据对应，再区分数据流、映射选择和交互反馈。','Connect stages to actual student data, then distinguish flow, mapping choices and feedback.'],
    source:['同源合成新生 CSV；模型顺序与原讲义一致。','Same synthetic student CSV; model order follows the original notes.'],
    steps:[
      {id:'marker',label:['① 定义箭头','① Define marker'],codeTargets:[{block:0,from:2,to:8}],explain:['marker 定义可复用的箭头形状；图中箭头头部来自这个 SVG 定义。','marker defines a reusable arrowhead; the flow arrows reference this SVG definition.']},
      {id:'links',label:['② 连接阶段','② Connect stages'],codeTargets:[{block:0,from:11,to:13}],explain:['marker-end 引用箭头定义，相邻阶段由真实 line 元素连接。','marker-end references the arrowhead; actual line elements connect adjacent stages.']},
      {id:'bind',label:['③ 绑定节点','③ Bind nodes'],codeTargets:[{block:0,from:16,to:17}],explain:['data(nodes).join("g") 将五条阶段数据对应到五个 SVG 节点。','data(nodes).join("g") maps five stage records to five SVG groups.']},
      {id:'select',label:['④ 点击反馈','④ Click feedback'],codeTargets:[{block:0,from:18,to:22}],explain:['点击节点实际更新 selected class 和案例说明；反馈改变视图状态，不改变 CSV。','Clicking a node updates its selected class and case details. Feedback changes view state, not the CSV.']}
    ],
    async create(ctx){
      const {root,t,signal,selectStep}=ctx, rows=await loadStudents(d3);if(signal.aborted)throw new DOMException('Aborted','AbortError');
      let model='Card',stage=0,step='marker',expanded=true;
      root.replaceChildren();
      selectControl(root,t('模型视角','Model viewpoint'),['Card','Mackinlay','van Wijk'],model,v=>{model=v;stage=v==='Mackinlay'?2:v==='van Wijk'?4:0;draw();},signal);
      const chart=svg('svg',{viewBox:'0 0 400 420',role:'img','aria-label':t('新生案例流程','Student case pipeline')}), detail=el('div',{className:'tv-card'});root.append(chart,detail);
      const labels=[t('原始数据','Raw data'),t('数据变换','Transform'),t('视觉映射','Mapping'),t('视图渲染','Render'),t('用户交互','Interaction')];
      const records=labels.map((label,id)=>({label,id}));
      const defs=d3.select(chart).append('defs');defs.append('marker').attr('id','tv-flow-arrow-02').attr('viewBox','0 -5 10 10').attr('refX',8).attr('markerWidth',6).attr('markerHeight',6).attr('orient','auto').append('path').attr('d','M0,-5L10,0L0,5').attr('fill','#123e37');
      d3.select(chart).selectAll('line').data(records.slice(0,-1)).join('line').attr('x1',200).attr('x2',200).attr('y1',d=>d.id*80+62).attr('y2',d=>d.id*80+91).attr('stroke','#617e36').attr('marker-end','url(#tv-flow-arrow-02)');
      const nodes=d3.select(chart).selectAll('g').data(records).join('g').attr('transform',d=>`translate(60,${d.id*80+15})`).attr('tabindex',0).attr('role','button').on('click',(_,d)=>{stage=d.id;selectStep('select');}).on('keydown',(e,d)=>{if(['Enter',' '].includes(e.key)){e.preventDefault();stage=d.id;selectStep('select');}});
      nodes.append('rect').attr('width',280).attr('height',48).attr('rx',4);nodes.append('text').attr('x',140).attr('y',31).attr('text-anchor','middle').style('font-size','20px').text(d=>`${d.id+1} / ${d.label}`);
      const counts=d3.rollup(rows,v=>v.length,d=>d.class);
      function draw(){
        nodes.classed('selected',d=>d.id===stage).attr('aria-pressed',d=>String(d.id===stage));nodes.select('rect').attr('fill',d=>d.id===stage?'#dfeaa5':'#f7f9ef').attr('stroke','#123e37').attr('stroke-width',d=>d.id===stage?3:1);
        d3.select(chart).selectAll('line').attr('stroke-width',step==='links'?4:1.5);defs.select('path').attr('fill',step==='marker'?'#647f31':'#123e37');
        const values=[`${rows.length} ${t('合成新生行','synthetic student rows')}`, [...counts].map(([k,v])=>`${k}: ${v}`).join(' / '), t('专业/班级 → 层级；年龄 → 位置；性别 → 色调','Major/class → hierarchy; age → position; gender → hue'),t('2.3 布局坐标 → 2.4 HTML 树形列表','2.3 layout coordinates → 2.4 HTML tree list'),t('点击展开 → 参数改变 → 树的可见状态改变','Click expand → parameter changes → visible tree state changes')];
        detail.replaceChildren(el('strong',{},`${model} / ${labels[stage]}`),el('p',{},values[stage]));
        if(step==='bind')detail.append(table(['id',t('阶段数据','Stage record')],records.map(d=>[d.id,d.label])));
        if(model==='Card')detail.append(el('p',{},t('2.2 变换 → 2.3 映射 → 2.4 渲染与交互；本段代码负责流程图本身的绘制。','2.2 transform → 2.3 mapping → 2.4 rendering/interaction; this code draws the flow diagram itself.')));
        if(model==='Mackinlay')detail.append(table([t('真实行','Actual row'),t('年龄→位置值','Age → position value'),t('性别→类别','Gender → category')],rows.slice(0,3).map(d=>[d.name,d.age,d.gender])));
        if(model==='van Wijk'){
          const toggle=el('button',{type:'button'},t(expanded?'收起树：反馈到视图':'展开树：反馈到视图',expanded?'Collapse tree: update view':'Expand tree: update view'));
          toggle.onclick=()=>{expanded=!expanded;stage=4;selectStep('select');};detail.append(toggle);
          detail.append(el('p',{},expanded?[...counts].map(([k,v])=>`${k} (${v})`).join(' → '):t('树已收起；原数据和计数没有改变。','Tree collapsed; source data and counts are unchanged.')));
        }
      }
      draw();return{focus(id){step=id;draw();},reset(){model='Card';stage=0;step='marker';expanded=true;root.querySelector('select').value='Card';draw();},destroy(){root.replaceChildren();}};
    }
  };
}

function treeDefinition(d3) {
  return {
    sectionId: '2.3', title: ['关系不变，位置如何算出？', 'Same relationships, computed positions'],
    goal: ['看同一节点的层级关系、布局坐标和屏幕位置，改变间距后核对身份与边数。', 'Compare hierarchy, layout coordinates and screen position; verify identities and edge counts after spacing changes.'],
    source: ['同源合成新生 CSV；图中坐标来自实际 d3.tree，不演示算法内部扫描。', 'Same synthetic student CSV; actual d3.tree coordinates, without invented internal scans.'],
    steps: [
      { id: 'hierarchy', label: ['① 层级', '① Hierarchy'], codeTargets: [{block:0,from:2,to:2}], explain: ['hierarchy 创建 parent、children、depth；数据尚未决定屏幕位置。', 'hierarchy creates parent, children and depth; these relationships do not yet determine screen position.'] },
      { id: 'layout', label: ['② 布局大小', '② Layout size'], codeTargets: [{block:0,from:5,to:6}], explain: ['size([360,720]) 限定布局坐标范围；横向画树时屏幕横坐标取 y，纵坐标取 x。', 'size([360,720]) bounds layout coordinates. A horizontal tree uses y horizontally and x vertically.'] },
      { id: 'separation', label: ['③ 节点间距', '③ Separation'], codeTargets: [{block:1,from:1,to:3}], explain: ['兄弟节点取 1，非兄弟取滑块值；参数改变坐标，不改变同一棵树的父子关系。', 'Siblings use 1; non-siblings use the slider value. Coordinates change, while parent-child relationships remain.'] },
      { id: 'links', label: ['④ 父子连线', '④ Parent links'], codeTargets: [{block:0,from:9,to:10}], explain: ['links() 每条边都有 source/target，连线使用这两个节点真实的 y/x。', 'Each links() edge has a source and target; paths use those nodes’ actual y/x coordinates.'] },
      { id: 'coordinates', label: ['⑤ 节点坐标', '⑤ Coordinates'], codeTargets: [{block:0,from:13,to:14}], explain: ['descendants() 提供所有节点。选一个节点，对照 x/y 与 translate(y,x)。', 'descendants() provides every node. Select one to compare x/y with translate(y,x).'] }
    ],
    async create(ctx) {
      const {root,signal,t,selectStep}=ctx, rows=await loadStudents(d3);
      if(signal.aborted)throw new DOMException('Aborted','AbortError');
      let step='hierarchy', keys='major:class', sep=2, height=360, mode='both', selected='';
      root.replaceChildren();
      const controls=el('div',{className:'tv-controls'});root.append(controls);
      selectControl(controls,t('分组层次','Grouping'),[['major:class',t('专业→班级','Major → class')],['major:class:gender',t('专业→班级→性别','Major → class → gender')],['gender:major:class',t('性别→专业→班级','Gender → major → class')]],keys,v=>{keys=v;selected='';draw();},signal);
      const view=selectControl(controls,t('观察方式','View'),[['both',t('前后对照','Compare')],['topology',t('只看关系','Relationships')],['layout',t('只看坐标','Coordinates')]],mode,v=>{mode=v;draw();},signal);
      const field=el('label',{className:'tv-field'},t('非兄弟间距','Non-sibling separation'));
      const slider=el('input',{type:'range',min:0.1,max:3,step:0.1,value:sep}), value=el('output',{},sep);
      field.append(slider,value);controls.append(field);
      slider.addEventListener('input',()=>{sep=+slider.value;value.textContent=sep;selectStep('separation');},{signal});
      selectControl(controls,t('size 第一项','First size value'),[['240','240'],['360','360'],['480','480']],height,v=>{height=+v;selectStep('layout');},signal);
      const nodeSelect=selectControl(controls,t('选择真实节点（与图中相同）','Choose an actual node (same as the diagram)'),[],'',id=>{selected=id;selectStep('coordinates');},signal);
      const status=el('p',{className:'tv-result'}), topology=el('div',{className:'tv-card'}), canvas=svg('svg',{viewBox:'0 0 1040 560',role:'img','aria-label':t('实际树布局及坐标','Actual tree layout and coordinates')}), details=el('div');
      root.append(status,topology,canvas,details);
      const g=d3.select(canvas).append('g').attr('transform','translate(180,50)');
      const path=d3.linkHorizontal().x(d=>d.y).y(d=>d.x);
      function draw(){
        const data=countHierarchy(d3,rows,keys.split(':')), h=d3.hierarchy(data);
        d3.tree().size([height,720]).separation((a,b)=>a.parent===b.parent?1:sep)(h);
        const nodes=h.descendants(), links=h.links(); if(!nodes.some(n=>n.data.id===selected))selected=nodes[0].data.id;
        const chosen=nodes.find(n=>n.data.id===selected);
        nodeSelect.replaceChildren(...nodes.map(n=>el('option',{value:n.data.id},`${n.data.name} · depth ${n.depth} · (${format(n.x)}, ${format(n.y)})`)));nodeSelect.value=selected;
        status.textContent=t(`${rows.length} 行 → ${nodes.length} 节点 / ${links.length} 边；边数 = 节点数 − 1`,`${rows.length} rows → ${nodes.length} nodes / ${links.length} edges; edges = nodes − 1`);
        topology.hidden=mode==='layout';canvas.style.display=mode==='topology'?'none':'block';
        topology.replaceChildren(el('strong',{},t('布局前：层级关系（不含位置）','Before layout: hierarchy only')));
        const list=el('ul');topology.append(list);
        for(const n of nodes){
          const li=el('li'),pick=el('button',{type:'button','aria-pressed':String(n.data.id===selected)},`${'· '.repeat(n.depth)}${n.data.name} · depth ${n.depth}`);
          li.style.marginLeft=`${n.depth*8}px`;pick.style.maxWidth='100%';li.append(pick);list.append(li);
          pick.onclick=()=>{selected=n.data.id;selectStep('coordinates');queueMicrotask(()=>{if(!signal.aborted)topology.querySelector('button[aria-pressed="true"]')?.focus({preventScroll:true});});};
        }
        g.selectAll('rect').data([height]).join('rect').attr('width',720).attr('height',d=>d).attr('fill','none').attr('stroke','#a4b877').attr('stroke-dasharray',step==='layout'?'3 3':'1 0');
        g.selectAll('path').data(links,d=>d.target.data.id).join('path').attr('d',path).attr('fill','none').attr('stroke',step==='links'?'#123e37':'#a4b877').attr('stroke-width',d=>d.target.data.id===selected?3:1.5);
        const node=g.selectAll('g.tv-tree-node').data(nodes,d=>d.data.id).join(enter=>{const group=enter.append('g').attr('class','tv-tree-node');group.append('circle');group.append('text').attr('class','name');group.append('text').attr('class','coordinate');return group;});
        node.attr('transform',d=>`translate(${d.y},${d.x})`).attr('role','button').attr('tabindex',0).attr('aria-label',d=>`${d.data.name}; x ${format(d.x)}, y ${format(d.y)}`).attr('aria-pressed',d=>String(d.data.id===selected)).on('click',(_,d)=>{selected=d.data.id;selectStep('coordinates');}).on('keydown',(e,d)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selected=d.data.id;selectStep('coordinates');}});
        node.select('circle').attr('r',d=>d.data.id===selected?8:5).attr('fill',d=>d.data.id===selected?'#123e37':'#dfeb91').attr('stroke','#123e37');
        node.select('text.name').attr('x',-12).attr('y',-12).attr('text-anchor','end').style('font-size','24px').text(d=>d.data.name);
        node.select('text.coordinate').attr('x',-12).attr('y',23).attr('text-anchor','end').style('font-size','22px').text(d=>d.data.id===selected?`(${format(d.x)},${format(d.y)})`:'');
        details.replaceChildren(table([t('节点','Node'),'depth',t('父节点','Parent'),'x / y','SVG translate(y,x)'],[[chosen.data.name,chosen.depth,chosen.parent?.data.name??'—',`${format(chosen.x)} / ${format(chosen.y)}`,`${format(chosen.y)}, ${format(chosen.x)}`]]));
      }
      draw();
      return {focus(id){step=id;draw();},reset(){step='hierarchy';keys='major:class';sep=2;height=360;mode='both';selected='';slider.value=2;value.textContent='2';view.value='both';controls.querySelectorAll('select')[0].value=keys;controls.querySelectorAll('select')[2].value='360';draw();},destroy(){d3.select(canvas).selectAll('*').interrupt();root.replaceChildren();}};
    }
  };
}

function listDefinition(d3){
  return{
    sectionId:'2.4',title:['一次点击，哪些监听器收到了？','One click: which listeners received it?'],
    goal:['操作同一新生树的展开和选择，核对真实捕获/冒泡、classed 与 duration。','Expand and select the same student tree; inspect actual capture/bubble events, classed and duration.'],
    source:['同源合成新生 CSV；日志来自实际监听器。原示例逐 li 绑定，委托对照只在父 ul 绑定选择处理。','Same synthetic student CSV; logs come from actual listeners. The original binds each li; delegation contrast handles selection on the parent ul.'],
    steps:[
      {id:'build',label:['① 递归列表','① Recursive list'],codeTargets:[{block:1,from:3,to:6}],explain:['递归建立真实 ul/li；子列表与当前数据层级对应，不是 SVG 假列表。','Recursion builds actual ul/li elements matching the data hierarchy, not a simulated SVG list.']},
      {id:'stop',label:['② 阻止冒泡','② Stop propagation'],codeTargets:[{block:0,from:5,to:9}],explain:['勾选后，折叠按钮实际调用 stopPropagation，父 li/ul 的冒泡监听器收不到该次点击。','When checked, the toggle actually calls stopPropagation; ancestor li/ul bubble listeners do not receive that click.']},
      {id:'selected',label:['③ 选中 class','③ Selected class'],codeTargets:[{block:0,from:12,to:15}],explain:['选中通过真实 classed 改变 DOM class。逐节点监听与父 ul 委托可对照；观察 target/currentTarget。','Selection changes an actual DOM class via classed. Compare per-node handling with parent-ul delegation and inspect target/currentTarget.']},
      {id:'duration',label:['④ 展开时长','④ Duration'],codeTargets:[{block:2,from:3,to:6},{block:2,from:9,to:10},{block:3,from:5,to:7}],explain:['淡入实际使用 transition().duration(ms)，重放前 interrupt；关闭动画或 ms=0 时直接显示最终状态。','Fade-in uses transition().duration(ms), interrupted before replay. Disabled animation or ms=0 shows the final state immediately.']}
    ],
    async create(ctx){
      const {root,t,signal,selectStep}=ctx,rows=await loadStudents(d3);if(signal.aborted)throw new DOMException('Aborted','AbortError');
      const data=countHierarchy(d3,rows);
      root.replaceChildren();let step='build',stop=true,delegated=false,duration=500,events=[],treeEvents=new AbortController();
      const controls=el('div',{className:'tv-controls'});root.append(controls);
      const stopLabel=el('label'),stopInput=el('input',{type:'checkbox'});stopInput.checked=true;stopLabel.append(stopInput,document.createTextNode(t(' 阻止折叠按钮冒泡',' Stop toggle bubbling')));controls.append(stopLabel);
      stopInput.addEventListener('change',()=>{stop=stopInput.checked;selectStep('stop');},{signal});
      selectControl(controls,t('选择处理方式','Selection handler'),[['node',t('逐 li 监听（原写法）','Per-li listeners (original)')],['delegate',t('父 ul 委托对照','Parent-ul delegation contrast')]],'node',v=>{delegated=v==='delegate';selectStep('selected');},signal);
      const timing=el('label',{className:'tv-field'},t('淡入时长（ms）','Fade-in duration (ms)')),slider=el('input',{type:'range',min:0,max:1500,step:50,value:500}),out=el('output');timing.append(slider,out);controls.append(timing);
      slider.addEventListener('input',()=>{duration=+slider.value;selectStep('duration');},{signal});
      const info=el('p',{className:'tv-result'}),tree=el('div',{className:'tv-event-tree tv-card'}),log=el('pre',{className:'tv-result','aria-label':t('实际点击事件日志','Actual click event log')});root.append(info,tree,log);
      const showLog=()=>{log.textContent=events.length?events.slice(-24).join('\n'):t('点击树中的折叠按钮或节点名称，观察本次事件。','Click a tree toggle or node name to inspect that event.');};
      function record(event){
        if(!tree.contains(event.target))return;
        const name=node=>node===document?'document':node.nodeName.toLowerCase()+(node.dataset?.name?`[${node.dataset.name}]`:'')+(node.classList?.contains('toggle')?'.toggle':'');
        events.push(`${event.eventPhase===1?'capture':event.eventPhase===2?'target':'bubble'} | target=${name(event.target)} | currentTarget=${name(event.currentTarget)}`);
        showLog();
      }
      document.addEventListener('click',event=>{if(tree.contains(event.target)){events=[];record(event);queueMicrotask(()=>{if(!signal.aborted)showLog();});}},{capture:true,signal});
      document.addEventListener('click',record,{signal});
      const choose=li=>{
        d3.select(tree).selectAll('li').classed('selected',function(){return this===li;}).style('background-color',function(){return this===li?'#dfeaa5':'';});
        selectStep('selected');info.textContent+=t(`；当前选中 ${li.dataset.name}`,`; selected ${li.dataset.name}`);
      };
      function attach(node,type,fn,capture=false){node.addEventListener(type,fn,{capture,signal:treeEvents.signal});}
      function build(){
        treeEvents.abort();treeEvents=new AbortController();d3.select(tree).selectAll('*').interrupt();tree.replaceChildren();
        const main=el('ul',{'data-name':'root'});tree.append(main);
        function item(node,parent){
          const li=el('li',{'data-name':node.name}),row=el('span',{'data-name':node.name,className:'label'});li.style.margin='8px 0';parent.append(li);li.append(row);
          attach(li,'click',record,true);attach(li,'click',event=>{record(event);if(!delegated)choose(li);});attach(row,'click',record,true);attach(row,'click',record);
          const pick=el('button',{type:'button','data-name':node.name},node.name+(node.children?` (${treeCount(node)})`:`: ${node.value}`));
          pick.style.cssText='max-width:100%;min-height:44px';row.append(pick);attach(pick,'click',record);
          if(node.children){
            const toggle=el('button',{type:'button',className:'toggle','aria-label':t(`展开或收起 ${node.name}`,`Expand or collapse ${node.name}`),'aria-expanded':'true','data-name':node.name},'−');row.prepend(toggle);
            const ul=el('ul',{'data-name':node.name});li.append(ul);ul.style.paddingLeft='18px';
            attach(ul,'click',record,true);attach(ul,'click',record);
            attach(toggle,'click',event=>{
              record(event);if(stop)event.stopPropagation();
              ul.hidden=!ul.hidden;toggle.textContent=ul.hidden?'+':'−';toggle.setAttribute('aria-expanded',String(!ul.hidden));
              const ms=ctx.reducedMotion?0:duration;d3.select(ul).interrupt().style('opacity',1);
              if(!ul.hidden&&ms>0)d3.select(ul).style('opacity',0).transition().duration(ms).style('opacity',1);
              selectStep(stop?'stop':'build');
            });
            node.children.forEach(child=>item(child,ul));
          }
        }
        attach(main,'click',record,true);attach(main,'click',event=>{record(event);if(delegated){const li=event.target.closest('li');if(main.contains(li))choose(li);}});
        item(data,main);showLog();
      }
      function focus(){
        if(ctx.reducedMotion)d3.select(tree).selectAll('ul').interrupt().style('opacity',1);
        const effective=ctx.reducedMotion?0:duration;out.textContent=`${duration}ms → ${effective}ms`;
        info.textContent=t(`输入 ${rows.length} 行；${delegated?'父 ul 委托':'逐 li 监听'}；有效时长 ${effective}ms`,`${rows.length} input rows; ${delegated?'parent-ul delegation':'per-li listeners'}; effective duration ${effective}ms`);
        tree.style.borderWidth=step==='build'?'2px':'1px';
      }
      const abortTree=()=>treeEvents.abort();signal.addEventListener('abort',abortTree,{once:true});
      build();focus();return{
        focus(id){step=id;focus();},reset(){step='build';stop=true;delegated=false;duration=500;events=[];stopInput.checked=true;slider.value='500';controls.querySelector('select').value='node';build();focus();},
        destroy(){treeEvents.abort();signal.removeEventListener('abort',abortTree);d3.select(tree).selectAll('*').interrupt();root.replaceChildren();}
      };
    }
  };
}
