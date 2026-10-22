import { el, svg, table, selectControl, button, svgButton, format } from './utils.js';
import { COLUMN_MAP, inspectRow, loadRawStudents, displayValue, dikwVertices, operationModel } from './models-01.js';

const target = (block, from, to = from) => [{ block, from, to }];
const step = (id, zh, en, codeTargets, a, b) => ({ id, label: [zh, en], codeTargets, explain: [a, b] });
const source = ['newstudent.csv · DeepSeek 合成教学数据；微案例另有标注。', 'newstudent.csv · DeepSeek synthetic data; micro-examples are labelled.'];
const chart = (root, label, w = 400, h = 210) => { const node = svg('svg', { viewBox: `0 0 ${w} ${h}`, role: 'img', 'aria-label': label }); root.append(node); return node; };

function csvDefinition(d3) {
  return {
    sectionId: '1.1', title: ['一行 CSV 如何变成可计算对象', 'How a CSV row becomes a typed object'],
    goal: ['追踪同一格的原值、字段名、结果、类型与异常。', 'Trace one cell’s raw value, key, result, type and errors.'], source,
    steps: [
      step('map', '字段映射', 'Field mapping', target(0, 2, 9), '只改字段名，不改原值。', 'Rename keys; keep values.'),
      step('number', '数字转换', 'Number conversion', [{ block: 1, from: 4, to: 4 }, { block: 1, from: 7, to: 7 }], '一元 + 转 number；空串→0，非法数字→NaN，均须检查。', 'Unary +: empty→0, invalid→NaN. Check both.'),
      step('trim', '去首尾空白', 'Trim whitespace', [{ block: 1, from: 5, to: 5 }, { block: 1, from: 8, to: 8 }], '无空白则不变；切到空白微案例可看差异。', 'Clean rows stay unchanged; try the whitespace micro-example.'),
      step('date', '日期对象', 'Date object', target(1, 6), 'Date 对象也可能无效；instanceof 之外须检查时间戳。', 'A Date object may be invalid; also check its timestamp.'),
      step('load', '异步加载与类型', 'Loading and types', target(2, 2, 6), '显示实际加载行数；与原演示共享转换函数。', 'Actual loaded count; conversion is shared with the original demo.')
    ],
    async create(ctx) {
      const { root, t, signal } = ctx;
      const rows = await loadRawStudents(d3);
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      if (!rows.length) throw Error(t('CSV 没有记录', 'CSV has no records'));
      let index = 0, mode = 'real', current = 'map';
      const controls = el('div'), view = el('div'); root.replaceChildren(controls, view);
      const rowControl = selectControl(controls, t('选择实际 CSV 行', 'Actual CSV row'), rows.map((r, i) => [i, `#${r['序号']} ${r['姓名']}`]), 0, value => { index = +value; draw(); }, signal);
      const caseControl = selectControl(controls, t('数据来源', 'Input source'), [['real', t('实际加载行', 'Actual loaded row')], ['space', t('教学微案例：首尾空白', 'Micro-example: whitespace')], ['invalid', t('教学微案例：空值 / 非法值', 'Micro-example: empty / invalid values')]], mode, value => { mode = value; draw(); }, signal);
      function draw() {
        const raw = { ...rows[index] };
        if (mode === 'space') { raw['姓名'] = `  ${raw['姓名']} `; raw['班级'] += '  '; }
        if (mode === 'invalid') { raw['序号'] = ''; raw['年龄'] = '十八'; raw['生日'] = 'not-a-date'; }
        const { value, issues } = inspectRow(raw);
        view.replaceChildren(el('p', { className: 'tv-result' }, t(`加载完成 ${rows.length} 行 · ${mode === 'real' ? '实际 CSV 行' : '教学微案例，不写回 CSV'}`, `Loaded ${rows.length} rows · ${mode === 'real' ? 'Actual CSV row' : 'Micro-example; CSV stays unchanged'}`)));
        const fields = ['序号', '姓名', '年龄', '班级', '生日'];
        const active = current === 'number' ? ['序号', '年龄'] : current === 'trim' ? ['姓名', '班级'] : current === 'date' ? ['生日'] : fields;
        const node = table([t('原始值（字符串）', 'Raw string'), t('映射 → 内部名', 'Mapped key'), t('转换结果', 'Converted value'), t('类型 / 验证', 'Type / validation')], fields.map(key => {
          const v = value[COLUMN_MAP[key]], converted = current !== 'map';
          return [displayValue(raw[key]).replaceAll(' ', '·'), `${key} → ${COLUMN_MAP[key]}`, displayValue(converted ? v : raw[key]), converted ? v instanceof Date ? `Date · valid=${Number.isFinite(v.getTime())}` : typeof v : 'string'];
        }));
        [...node.querySelectorAll('tbody tr')].forEach((tr, i) => { if (active.includes(fields[i])) { tr.style.background = '#eef2c9'; tr.setAttribute('data-active-field', fields[i]); } });
        view.append(node, el('p', {}, t('· 表示空格；源数据不变。其余字段见原完整演示。', '· marks spaces; source unchanged. Other fields: original demo.')));
        if (issues.length) view.append(el('p', { role: 'status' }, t('异常提示：', 'Validation issues: ') + issues.join('；')));
        if (current === 'load') view.append(el('p', {}, `d3.csv → ${rows.length} × transformRow → Array(${rows.length}); typeof age = ${typeof value.age}; birthday instanceof Date = ${value.birthday instanceof Date}`));
      }
      draw(); return { focus(id) { current = id; draw(); }, reset() { index = 0; mode = 'real'; rowControl.value = '0'; caseControl.value = 'real'; draw(); }, destroy() { root.replaceChildren(); } };
    }
  };
}

function joinDefinition(d3) {
  const selectorSteps = [
    ['select', 'd3.select', 'Select first'], ['selectAll', 'd3.selectAll', 'Select all'],
    ['nestedSelect', 'selection.select', 'First per group'], ['nestedAll', 'selection.selectAll', 'Descendants per group'],
    ['child', 'selectChild', 'First direct child'], ['children', 'selectChildren', 'All direct children']
  ];
  return {
    sectionId: '1.5', title: ['看清选择集与 Data-Join 三态', 'Inspect selections and Data-Join states'],
    goal: ['看清选择集，再比较按 ID / 索引匹配的三态。', 'Inspect selections, then compare ID/index matching.'],
    source: ['教学微案例 A/B/C/D 与嵌套 DOM；三态取自真实 D3 selection。', 'Micro-examples: A/B/C/D and nested DOM; actual D3 selection membership.'],
    steps: [...selectorSteps.map(([id, zh, en]) => step(id, zh, en, target(2, id === 'select' ? 3 : 6), '边框标实际命中节点。直接子元素≠所有后代；后四项为原讲解扩展，非下方代码。', 'Outlines mark actual hits. Children ≠ descendants; the last four extend the lecture, not this code.')),
      step('key', '身份绑定', 'Bind identities', target(1, 3, 6), '切换 key 会重置；比较 DOM 编号可见 ID / 索引匹配差异。', 'Key changes reset the set. Compare DOM numbers for ID/index matching.'),
      step('enter', 'enter 新增', 'enter', target(0, 5), '输入 A/B/C → B/C/D 时，仅 D 是 enter。', 'For A/B/C → B/C/D, only D enters.'),
      step('update', 'update 复用', 'update', target(0, 6), '稳定 key 复用 B/C 节点，重排保留身份。', 'Stable keys reuse B/C nodes across reordering.'),
      step('exit', 'exit 移除', 'exit', target(0, 7), '从 exit selection 采集名单后移除，再核对 DOM。', 'Collect exit membership before removal; check remaining DOM.'),
      step('join', 'join 最终状态', 'Joined state', target(0, 2, 8), '变更数据才执行 join；点步骤只聚焦结果。', 'Dataset changes execute join; steps only focus the result.')],
    async create(ctx) {
      const { root, t, signal } = ctx;
      let current = 'select', keyed = true, serial = 0, cursor = 0, report;
      const controls = el('div'), microscope = el('div'), output = el('div'), info = el('div');
      root.replaceChildren(controls, microscope, output, info);
      const keyControl = selectControl(controls, t('绑定方式', 'Binding mode'), [['key', 'd => d.id'], ['index', t('无 key：索引', 'No key: index')]], 'key', value => { keyed = value === 'key'; resetSet(); }, signal);
      const datasets = [['A', 'B', 'C'], ['B', 'C', 'D'], ['A', 'B', 'C', 'D'], ['B', 'C', 'D'], ['D', 'B', 'C']];
      button(controls, t('变更数据集 →', 'Change dataset →'), () => { cursor = (cursor + 1) % datasets.length; perform(datasets[cursor]); ctx.selectStep('join'); }, signal);
      button(controls, t('恢复 A/B/C', 'Restore A/B/C'), resetSet, signal);
      const lens = chart(microscope, t('DOM 选择器透视镜', 'DOM selector microscope'), 400, 215);
      const lensRoot = d3.select(lens).append('g').attr('data-lens-root', '');
      for (let i = 0; i < 2; i++) {
        const group = lensRoot.append('g').attr('data-group', `g${i + 1}`).attr('transform', `translate(${25 + i * 190},30)`);
        group.append('rect').attr('x', 0).attr('y', 0).attr('width', 170).attr('height', 150).attr('rx', 8).attr('fill', '#f7f8f0').attr('stroke', '#bcc6b6');
        group.append('text').attr('x', 8).attr('y', 20).text(`g${i + 1}`);
        group.append('circle').attr('cx', 40).attr('cy', 65).attr('r', 20).attr('data-node', `${i + 1}a`).attr('data-level', 'direct');
        const nested = group.append('g').attr('data-nested', '');
        nested.append('circle').attr('cx', 120).attr('cy', 105).attr('r', 20).attr('data-node', `${i + 1}b`).attr('data-level', 'nested');
        group.append('text').attr('x', 8).attr('y', 145).attr('font-size', 10).text('circle + g > circle');
      }
      const stateSvg = chart(output, t('真实 Data-Join 节点身份', 'Actual Data-Join node identities'), 400, 90);
      const dots = d3.select(stateSvg).append('g');
      function perform(ids, initial = false) {
        const before = dots.selectAll('g[data-id]').data().map(d => d.id);
        const update = keyed ? dots.selectAll('g[data-id]').data(ids.map(id => ({ id })), d => d.id) : dots.selectAll('g[data-id]').data(ids.map(id => ({ id })));
        report = { before, after: ids, enter: update.enter().data().map(d => d.id), update: update.data().map(d => d.id), exit: update.exit().data().map(d => d.id) };
        const joined = update.join(
          enter => { const g = enter.append('g').attr('data-dom', () => ++serial); g.append('circle').attr('r', 23).attr('cy', 34); g.append('text').attr('text-anchor', 'middle').attr('y', 39); g.append('text').attr('class', 'identity').attr('text-anchor', 'middle').attr('y', 75).attr('font-size', 11); return g; },
          s => s, exit => exit.remove());
        joined.attr('data-id', d => d.id).attr('transform', (_, i) => `translate(${50 + i * 93},0)`);
        joined.select('text').text(d => d.id); joined.select('text.identity').text(function() { return `DOM #${this.parentNode.dataset.dom}`; });
        if (initial) report = { ...report, enter: [], update: [], exit: [] };
        draw();
      }
      function draw() {
        const groups = lensRoot.selectAll('g[data-group]');
        const selectors = {
          select: () => d3.select(lens.querySelector('circle')), selectAll: () => d3.selectAll(lens.querySelectorAll('circle')),
          nestedSelect: () => groups.select('circle'), nestedAll: () => groups.selectAll('circle'),
          child: () => groups.selectChild('circle'), children: () => groups.selectChildren('circle')
        };
        const selected = selectors[current]?.();
        lensRoot.selectAll('circle').attr('fill', '#e1eb91').attr('stroke', '#9cae9c').attr('stroke-width', 1);
        selected?.attr('stroke', '#123e37').attr('stroke-width', 5);
        microscope.hidden = !selectors[current]; output.hidden = !!selectors[current];
        info.replaceChildren();
        if (selected) info.append(el('p', { className: 'tv-result' }, t('选中 ', 'Selected ') + `${selected.size()}: ` + selected.nodes().map(n => `${n.dataset.node} (${n.dataset.level})`).join(', ')));
        else {
          info.append(el('p', { className: 'tv-result' }, `${report.before.join('/')} → ${report.after.join('/')} · ${keyed ? 'key=id' : 'key=index'}`));
          info.append(table(['enter', 'update', 'exit'], [[report.enter.join(', ') || '∅', report.update.join(', ') || '∅', report.exit.join(', ') || '∅']]));
          dots.selectAll('circle').attr('fill', d => report.enter.includes(d.id) ? '#e1eb91' : '#93c7bd').attr('stroke', d => current === 'enter' && report.enter.includes(d.id) || current === 'update' && report.update.includes(d.id) || ['join', 'key'].includes(current) ? '#123e37' : '#b8c3b9').attr('stroke-width', 3);
          info.append(el('p', {}, t(`DOM ${dots.selectAll('g[data-id]').size()} 个；exit 已移除，名单保留。`, `${dots.selectAll('g[data-id]').size()} DOM nodes; exit removed, list retained.`)));
        }
      }
      function resetSet() { cursor = 0; serial = 0; dots.selectAll('*').remove(); perform(datasets[0], true); }
      resetSet();
      return { focus(id) { current = id; draw(); }, reset() { keyed = true; keyControl.value = 'key'; current = 'select'; resetSet(); }, destroy() { dots.selectAll('*').interrupt(); root.replaceChildren(); } };
    }
  };
}

function dikwDefinition(d3) {
  return {
    sectionId: '1.2', title: ['同一新生案例的 DIKW 四层', 'Four DIKW levels, one student example'], source,
    goal: ['分清记录、统计、待验证模式和情境判断，再看梯形路径。', 'Separate records, statistics, hypotheses and judgements; inspect the path.'],
    steps: [
      step('M', 'M 起点', 'M start', target(0, 5), 'M 移至红点（左上角），不画线。', 'M moves to the red point (upper-left), without drawing.'),
      step('L', 'L 三条边', 'L three edges', target(0, 6, 8), 'L 连接右上→右下→左下；剩余闭合边由 Z 产生。', 'L connects upper-right→lower-right→lower-left; Z closes the last edge.'),
      step('Z', 'Z 闭合', 'Z close', target(0, 9), 'Z 回到起点，闭合当前层。', 'Z returns to the start, closing this layer.'),
      step('event', '事件选层', 'Select by event', target(1, 4, 9), '点击或键盘选层，同步同一案例卡。', 'Click or use the keyboard to select a layer and its case card.'),
      step('fill', 'fill 填色', 'fill', target(1, 7), '仅改变选中层填色，几何与数据不变。', 'Change only the selected fill; keep geometry and data.')
    ],
    async create(ctx) {
      const { root, signal, t } = ctx, rows = await loadRawStudents(d3);
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const levels = [['Wisdom', '智慧', 60, 60, '#9333ea'], ['Knowledge', '知识', 80, 90, '#0891b2'], ['Information', '信息', 100, 120, '#059669'], ['Data', '数据', 120, 150, '#64748b']];
      let chosen = 3, current = 'M';
      const controls = el('div'), holder = el('div'), detail = el('div'); root.replaceChildren(controls, holder, detail);
      const picker = selectControl(controls, t('选择 DIKW 层', 'Choose DIKW level'), levels.map((l, i) => [i, t(l[1], l[0])]), chosen, value => { chosen = +value; draw(); }, signal);
      button(controls, t('案例向上一层 ↑', 'Next case level ↑'), () => { chosen = chosen === 0 ? 3 : chosen - 1; picker.value = String(chosen); draw(); }, signal);
      const node = chart(holder, t('可选 DIKW 金字塔及路径坐标', 'Selectable DIKW pyramid and path coordinates'), 600, 400), layerNodes = [];
      node.setAttribute('viewBox', '180 0 240 400');
      const vertices = levels.map(([, , h, topW], i) => dikwVertices(h, topW, i));
      levels.forEach((level, i) => {
        const group = svg('g'), p = vertices[i], path = svg('path', { d: `M ${p[0]} L ${p[1]} L ${p[2]} L ${p[3]} Z`, fill: level[4], stroke: 'white', 'stroke-width': 2 });
        const label = svg('text', { x: 300, y: (p[0][1] + p[2][1]) / 2, 'text-anchor': 'middle', 'dominant-baseline': 'middle', style: 'fill:white;font-size:14px' }, `${t(level[1], level[0])}`);
        group.append(path, label); svgButton(group, () => { chosen = i; picker.value = String(i); ctx.selectStep('event'); }, signal); group.setAttribute('aria-label', t(level[1], level[0])); node.append(group); layerNodes.push(path);
      });
      const overlay = svg('g', { 'pointer-events': 'none' }); node.append(overlay);
      function draw() {
        layerNodes.forEach((path, i) => { path.setAttribute('stroke', i === chosen ? '#123e37' : 'white'); path.setAttribute('stroke-width', i === chosen ? 5 : 2); path.setAttribute('fill', i === chosen && current === 'fill' ? d3.color(levels[i][4]).brighter(0.5).formatHex() : levels[i][4]); });
        const p = vertices[chosen]; overlay.replaceChildren();
        if (current === 'M') overlay.append(svg('circle', { cx: p[0][0], cy: p[0][1], r: 7, fill: '#c63b32', stroke: 'white', 'stroke-width': 2 }));
        if (current === 'L' || current === 'Z') overlay.append(svg('path', { d: current === 'L' ? `M ${p[0]} L ${p[1]} L ${p[2]} L ${p[3]}` : `M ${p[3]} L ${p[0]}`, fill: 'none', stroke: '#c63b32', 'stroke-width': 6, 'stroke-dasharray': '7 4' }));
        detail.replaceChildren(el('h4', {}, t(levels[chosen][1], levels[chosen][0])));
        if (chosen === 3) detail.append(table([t('姓名', 'Name'), t('年龄', 'Age'), t('班级', 'Class')], [[rows[0]['姓名'], rows[0]['年龄'], rows[0]['班级']]]));
        if (chosen === 2) detail.append(table([t('班级', 'Class'), t('人数（真实聚合）', 'Count (actual aggregate)')], [...d3.rollup(rows, v => v.length, d => d['班级'])]));
        if (chosen === 1) detail.append(el('p', {}, t('待验证假设：班级间年龄差异是否稳定？须独立数据、统计与情境证据；合成表不能证明因果。', 'Hypothesis: do class age differences persist? Independent data, statistics and context are needed; synthetic rows cannot prove causation.')));
        if (chosen === 0) detail.append(el('p', {}, t('决策问题示意：是否调整教学支持？须结合需求、资源、公平性和教师判断，不能由此表自动决策。', 'Decision example: adjust learning support? Needs, resources, fairness and teacher judgement are required; this table cannot decide.')));
        detail.append(el('p', {}, `M ${p[0]} → L ${p[1]} → L ${p[2]} → L ${p[3]} → Z`), el('p', {}, t('几何沿用原演示；原代码是另一组单梯形示例参数。', 'Geometry follows the original demo; code uses other sample dimensions.')));
      }
      draw(); return { focus(id) { current = id; draw(); }, reset() { chosen = 3; current = 'M'; picker.value = '3'; draw(); }, destroy() { root.replaceChildren(); } };
    }
  };
}

function scalesDefinition(d3) {
  return {
    sectionId: '1.3', title: ['先辨尺度，再选视觉通道', 'Identify the scale, then choose a visual channel'], source,
    goal: ['同数据比较两种编码，追踪 domain → range。', 'Compare encodings of identical data; trace domain → range.'],
    steps: [
      step('field', '字段与尺度', 'Field and scale', target(0, 2, 6), '先辨四尺度；每种尺度不只对应一种图。', 'Identify the four scales; none implies a unique chart type.'),
      step('domain', '输入 domain', 'Input domain', target(0, 3, 6), 'domain 是输入范围或类别集合。', 'Domain: input range or category set.'),
      step('range', '输出 range', 'Output range', target(0, 3, 6), '微图 range=[0,240] 适应同屏；仍用原 scaleLinear/scaleBand，原代码 [0,800] 保留。', 'Local range=[0,240]; same scaleLinear/scaleBand APIs. Original [0,800] stays.'),
      step('channel', '通道对照', 'Compare channels', target(1, 3, 9), '只换编码，数据/顺序/标签不变；无序色相难表达数值大小。', 'Change encoding only; keep data/order/labels. Unordered hue obscures magnitude.')
    ],
    async create(ctx) {
      const { root, t, signal } = ctx, rows = await loadRawStudents(d3);
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const classes = [...new Set(rows.map(d => d['班级']))].slice(0, 3);
      const examples = {
        nominal: { title: t('名义 · 合成表班级', 'Nominal · classes from synthetic CSV'), values: classes, labels: classes, note: t('类别没有大小顺序；色相区分类别。', 'Categories have no magnitude order; hue distinguishes categories.') },
        ordinal: { title: t('序数 · 教学模拟等级', 'Ordinal · illustrative levels'), values: [1, 2, 3], labels: [t('初', 'Low'), t('中', 'Medium'), t('高', 'High')], note: t('等级有序，间距未必相等；用明暗或有序位置。', 'Levels are ordered; intervals need not be equal. Use ordered lightness or position.') },
        interval: { title: t('区间 · 模拟摄氏温度', 'Interval · illustrative Celsius'), values: [-5, 0, 5], labels: ['−5°C', '0°C', '5°C'], note: t('差值可比；0°C非真实零点，不能比较倍数。', 'Compare differences, not ratios; 0°C is not absolute zero.') },
        ratio: { title: t('比率 · 合成表前3人年龄', 'Ratio · first 3 synthetic ages'), values: rows.slice(0, 3).map(d => +d['年龄']), labels: rows.slice(0, 3).map(d => `${d['姓名']} ${d['年龄']}`), note: t('年龄有真实零点；位置/长度显示大小。', 'Age has meaningful zero; position/length shows magnitude.') }
      };
      let kind = 'nominal', bad = false, current = 'field';
      const controls = el('div'), view = el('div'); root.replaceChildren(controls, view);
      const choose = selectControl(controls, t('① 识别尺度', '① Identify scale'), Object.entries(examples).map(([key, value]) => [key, value.title]), kind, value => { kind = value; draw(); }, signal);
      const encoding = selectControl(controls, t('② 选择编码', '② Choose encoding'), [['good', t('合适的编码', 'Appropriate encoding')], ['bad', t('常见不恰当编码', 'Common inappropriate encoding')]], 'good', value => { bad = value === 'bad'; ctx.selectStep('channel'); }, signal);
      function draw() {
        const example = examples[kind], nominal = kind === 'nominal';
        const domain = nominal ? example.values : kind === 'ordinal' ? [1, 3] : kind === 'interval' ? [-5, 5] : [0, 100];
        const scale = nominal ? d3.scaleBand().domain(domain).range([0, 240]) : d3.scaleLinear().domain(domain).range([0, 240]);
        const color = d3.scaleOrdinal().domain(example.values).range(d3.schemeTableau10);
        view.replaceChildren(el('h4', {}, example.title), el('p', { className: 'tv-result' }, `${nominal ? 'scaleBand' : 'scaleLinear'} · domain=${JSON.stringify(domain)} → range=[0,240] · ${current}`));
        const node = chart(view, t('相同数据的编码对照', 'Same-data encoding comparison'), 400, 185);
        example.values.forEach((value, i) => {
          const y = 35 + i * 54, p = scale(value), usePosition = !nominal && kind !== 'ordinal' && !bad;
          if (current === 'domain') node.append(svg('rect', { x: 0, y: y - 14, width: 133, height: 28, rx: 4, fill: '#e1eb91' }));
          node.append(svg('text', { x: 4, y: y + 5, 'font-size': 11 }, example.labels[i]));
          node.append(svg('line', { x1: 140, y1: y, x2: 380, y2: y, stroke: '#b8c5b3' }));
          const fill = nominal ? bad ? d3.interpolateBlues((i + 1) / example.values.length) : color(value) : bad ? color(value) : kind === 'ordinal' ? d3.interpolateBlues((value + 1) / 4) : '#123e37';
          node.append(svg('circle', { cx: 140 + (usePosition ? p : 120), cy: y, r: 12, fill, stroke: current === 'channel' ? '#123e37' : '#b4bca9', 'stroke-width': 2 }));
          if (current === 'range') node.append(svg('line', { x1: 140 + p, x2: 140 + p, y1: y - 18, y2: y + 18, stroke: '#c63b32', 'stroke-width': 3 }));
          node.append(svg('text', { x: 140, y: y + 23, 'font-size': 10 }, `${displayValue(value)} → ${format(p)} px`));
        });
        if (current === 'range') view.append(el('p', {}, t('红刻线标 scale 的 px 输出；圆点仍表达当前编码。', 'Red ticks: scale output in px; circles: selected encoding.')));
        view.append(el('p', {}, example.note), el('p', {}, bad ? nominal ? t('误用：明暗暗示班级高低。', 'Misuse: lightness suggests class rank.') : t('误用：无序色相难比较差值/大小；标签仍可读。', 'Misuse: unordered hues obscure magnitude/differences; labels remain.') : t('图例：类别→色相；等级→明暗；温度/年龄→位置。px 为 scale 输出。', 'Legend: categories→hue; levels→lightness; temperature/age→position. px: scale output.')));
      }
      draw(); return { focus(id) { current = id; draw(); }, reset() { kind = 'nominal'; bad = false; current = 'field'; choose.value = 'nominal'; encoding.value = 'good'; draw(); }, destroy() { root.replaceChildren(); } };
    }
  };
}

function operationsDefinition(d3) {
  const names = ['map', 'reduce', 'cross', 'merge', 'pairs', 'transpose', 'zip', 'filter'];
  const targets = { map: target(0, 5), reduce: target(0, 6, 7), cross: target(1, 2, 5), filter: target(0, 4) };
  const notes = [
    ['每个输入一一映射到平方值。', 'Each input maps to its squared value.'], ['把值依次汇入累积器，从 0 开始。', 'Values enter an accumulator starting at 0.'],
    ['2×3 个组合，每组由两端共同决定。', '2×3 combinations; each depends on both inputs.'], ['一层数组展开，顺序不变。', 'Flatten one array level, preserving order.'],
    ['4 个输入产生 3 对相邻元素。', 'Four inputs produce three adjacent pairs.'], ['2×3 矩阵变为 3×2；线连接同一列。', 'A 2×3 matrix becomes 3×2; lines connect a column.'],
    ['同一索引成组，不是所有组合。', 'Group equal indices, rather than all combinations.'], ['逐个判断 >2，保留 3、4。', 'Test >2 per item; retain 3 and 4.']
  ];
  return {
    sectionId: '1.4', title: ['逐项追踪：输入—操作—输出', 'Trace input—operation—output'],
    goal: ['8 操作可单步、完整显示、重置；连线追踪输出来源。', 'Step, finish or reset eight operations; trace output sources.'],
    source: ['教学微数组；原案例、8 操作与 group / rollup 扩展全部保留。', 'Micro-arrays; original cases, eight operations and group/rollup remain.'],
    steps: names.map((name, i) => step(name, name, name, targets[name] ?? [], notes[i][0] + (targets[name] ? '' : ' 原 pre 未列出；右图补充调用。'), notes[i][1] + (targets[name] ? '' : ' Absent from original pre; call added in figure.'))),
    async create(ctx) {
      const { root, signal, t } = ctx;
      let name = 'map', count = 0;
      const controls = el('div'), view = el('div'); root.replaceChildren(controls, view);
      const select = selectControl(controls, t('选择操作', 'Operation'), names, name, value => { ctx.selectStep(value); }, signal);
      const once = button(controls, t('单步 →', 'Step →'), () => { count++; draw(); }, signal);
      button(controls, t('查看完整结果', 'Show full result'), () => { count = operationModel(d3, name).links.length; draw(); }, signal);
      button(controls, t('重置运算', 'Reset operation'), () => { count = 0; draw(); }, signal);
      button(controls, t('查看原完整案例', 'Original complete examples'), () => ctx.article.querySelector('.tab-btn[data-tab="demo"]')?.click(), signal);
      function draw() {
        const model = operationModel(d3, name), outputs = model.stages ?? model.result;
        count = Math.min(count, model.links.length); once.disabled = count >= model.links.length;
        const partial = name === 'reduce' ? count ? model.stages[count - 1] : 0 : name === 'filter' ? model.input.slice(0, count).filter(x => x > 2) : model.result.slice(0, count);
        view.replaceChildren(el('p', { className: 'tv-result' }, `${t('补充操作代码', 'Supplemental operation code')}: ${model.code}`));
        const node = chart(view, t('输入与当前输出的来源连线', 'Input links to the current output'), 400, 250);
        node.append(svg('text', { x: 35, y: 20 }, t('输入', 'Input')), svg('text', { x: 160, y: 20 }, name), svg('text', { x: 292, y: 20 }, t('输出', 'Output')));
        const yIn = i => 55 + i * 31, yOut = i => 55 + i * 31;
        if (count) model.links[count - 1].forEach(i => node.append(svg('line', { x1: 92, y1: yIn(i), x2: 290, y2: yOut(count - 1), stroke: '#6c8b3e', 'stroke-width': 2 })));
        model.input.forEach((v, i) => { const active = count && model.links[count - 1].includes(i); node.append(svg('rect', { x: 4, y: yIn(i) - 17, width: 88, height: 26, rx: 4, fill: active ? '#e1eb91' : '#f0f3e5', stroke: '#b3c398' }), svg('text', { x: 12, y: yIn(i) }, JSON.stringify(v))); });
        outputs.forEach((v, i) => { const visible = i < count; node.append(svg('rect', { x: 290, y: yOut(i) - 17, width: 108, height: 26, rx: 4, fill: visible ? '#e1eb91' : '#f0f3e5', stroke: visible && i === count - 1 ? '#123e37' : '#b3c398' }), svg('text', { x: 298, y: yOut(i), opacity: visible ? 1 : 0.3 }, visible ? JSON.stringify(v) : '…')); });
        view.append(el('p', { className: 'tv-result', 'aria-live': 'polite' }, `${count}/${model.links.length} · ${t('当前结果', 'Current result')}: ${JSON.stringify(partial)}`));
        if (name === 'reduce') view.append(el('p', {}, t('右侧是累积中间值；最终输出为数 9。', 'Right: accumulator states. Final output: scalar 9.')));
        if (name === 'filter') view.append(el('p', {}, t('× / ✓ 为判定记录；输出数组只保留通过值。', '× / ✓ log tests; output retains passing values only.')));
        if (['transpose', 'zip'].includes(name)) view.append(el('p', {}, t('左前3项/后3项分别为两行（数组）；连线对应同列/索引。', 'Inputs 1–3 / 4–6 form two rows (arrays); links match columns/indices.')));
        if (name === 'cross') view.append(el('p', {}, 'A/B × 1/2/3 → 2×3 = 6'));
      }
      draw(); return { focus(id) { if (id !== name) { name = id; count = 0; select.value = id; } draw(); }, reset() { name = 'map'; count = 0; select.value = 'map'; draw(); }, destroy() { root.replaceChildren(); } };
    }
  };
}

export function chapter01(d3) { return [csvDefinition(d3), dikwDefinition(d3), scalesDefinition(d3), operationsDefinition(d3), joinDefinition(d3)]; }
