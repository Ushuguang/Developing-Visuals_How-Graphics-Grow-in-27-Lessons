import { el, svg, table, selectControl, button, svgButton, format } from './utils.js';
import { storyCase, storyScaleSpec, storyEventFrame, storyStage } from './models-05-story.js';

const range = (block, from, to = from) => ({ block, from, to });
const step = (id, label, codeTargets, explain) => ({ id, label, codeTargets, explain });

export function storyDefinition(d3) {
  return {
    sectionId: '5.5',
    title: ['从时间轨道到角色叙事', 'From time tracks to character stories'],
    goal: ['逐步看见：时间→控制点→整组绑定→曲线→事件。可换校园协作微案例理解聚散。', 'See time→points→whole-array binding→curves→events. Try the constructed campus example to explore gathering and separation.'],
    source: ['默认保留《侏罗纪公园》5角色/27点/两事件；剧情教学示意，非逐秒标注。校园案例明确构造。y仅为叙事布局。', 'Default: original Jurassic Park, 5 roles/27 points/2 events; not frame-accurate annotation. Campus data is constructed. y is narrative layout.'],
    steps: [
      step('time', ['① 时间轨道', '① Time tracks'], [range(0, 2, 4)], ['先不画关系曲线：各角色水平轨道只说明何时有控制点。黄色时间定位线使用同一 xScale。', 'Before relationship curves, horizontal tracks show sample times only. The yellow time guide uses the same xScale.']),
      step('points', ['② 输入控制点', '② Input points'], [range(0, 8, 14)], ['圆点与表格是所选角色原始 {time,y}；点击点反选该行。y经过演示的 yScale，不是人数或物理距离。', 'Dots and table show the selected role’s actual {time,y}. Click a dot to select its row. yScale maps layout, not population or distance.']),
      step('datum', ['③ 一组数据→一条线', '③ One array→one path'], [range(0, 25, 27)], ['datum(c.points) 把整个数组绑定到一条真实 path。虚线框圈定该角色，数组不是一行一条路径。', 'datum(c.points) binds the whole array to one actual path. The box encloses that role: one path per array, not per row.']),
      step('curve', ['④ 同点两种连线', '④ Two curves, same points'], [range(0, 19, 22), range(2, 5)], ['虚线是 curveLinear，彩线是 Catmull-Rom；相同控制点始终不变。调 alpha 只改变曲线参数，不把 alpha=0 冒称直线。', 'Dashed: curveLinear. Coloured: Catmull-Rom. Points stay fixed; alpha changes curve parameterization. Alpha=0 is not a linear-curve switch.']),
      step('events', ['⑤ 事件层与同刻对齐', '⑤ Events and time alignment'], [range(1, 9, 19)], ['事件红圈、垂线与角色同一时刻共享 x。只有确实存在该时刻控制点的角色才显示实心交点，其余不补值。', 'Event circles, guides and same-time role points share x. Solid markers require actual samples; missing values are not invented.'])
    ],
    create(ctx) {
      const { root, t, signal, selectStep } = ctx;
      let caseId = 'original', role = 0, index = 0, eventIndex = 0, alpha = 0.5, current = 'time', layer = 'both', timeCursor = null;
      let viewEvents = new AbortController();
      const stopView = () => viewEvents.abort();
      signal.addEventListener('abort', stopView, { once: true });
      const caseBar = el('div');
      const controls = el('div', { className: 'tv-controls' });
      const inputs = el('details');
      inputs.append(el('summary', {}, t('调整输入：角色 / 点 / 事件 / alpha', 'Adjust inputs: role / point / event / alpha')), controls);
      const chart = svg('svg', { viewBox: '0 0 800 460', role: 'group', tabindex: 0, 'aria-label': t('分步 Storyline 图解', 'Step-by-step Storyline view') });
      const caption = el('p', { className: 'tv-result', 'aria-live': 'polite' });
      const result = el('div');
      root.replaceChildren(caseBar, caption, chart, inputs, result);
      const caseSelect = selectControl(caseBar, t('案例', 'Case'), [['original', t('侏罗纪公园 · 原例', 'Jurassic Park · original')], ['campus', t('校园小组协作 · 构造微案例', 'Campus teamwork · constructed')]], caseId, value => {
        caseId = value; role = index = eventIndex = 0; timeCursor = null; refreshControls(); selectStep('time');
      }, signal);
      caseSelect.parentElement.style.cssText = 'display:flex;flex-direction:row;align-items:center;gap:8px;margin:0;min-width:0';
      caseSelect.style.cssText = 'flex:1;min-width:0;width:auto';
      const roleSelect = selectControl(controls, t('角色', 'Role'), [], 0, value => {
        role = +value; index = 0; timeCursor = null; refreshPoints(); selectStep('datum');
      }, signal);
      const pointSelect = selectControl(controls, t('控制点', 'Control point'), [], 0, value => { index = +value; selectStep('points'); }, signal);
      const eventSelect = selectControl(controls, t('事件', 'Event'), [], 0, value => { eventIndex = +value; layer = 'both'; layerSelect.value = layer; selectStep('events'); }, signal);
      const layerSelect = selectControl(controls, t('事件步图层筛选', 'Event-step layer filter'), [['both', t('角色+事件', 'Roles + events')], ['roles', t('只看角色', 'Roles only')], ['events', t('只看事件', 'Events only')]], layer, value => { layer = value; draw(); }, signal);
      const alphaLabel = el('label', { className: 'tv-field' }, 'Catmull-Rom alpha');
      const slider = el('input', { type: 'range', min: 0, max: 1, step: 0.1, value: alpha });
      const alphaValue = el('output', {}, alpha);
      alphaLabel.append(slider, alphaValue); controls.append(alphaLabel);
      slider.addEventListener('input', () => { alpha = +slider.value; alphaValue.textContent = alpha; selectStep('curve'); }, { signal });
      button(controls, t('定位会合/冲突时刻', 'Find meeting/conflict time'), () => { eventIndex = 0; eventSelect.value = '0'; layer = 'both'; layerSelect.value = layer; selectStep('events'); }, signal);

      const data = () => storyCase(caseId);
      function refreshPoints() {
        pointSelect.replaceChildren(...data().characters[role].points.map((point, i) => el('option', { value: i }, `${point.time} min / y=${point.y}`)));
        pointSelect.value = index;
      }
      function refreshControls() {
        roleSelect.replaceChildren(...data().characters.map((character, i) => el('option', { value: i }, character.name)));
        eventSelect.replaceChildren(...data().events.map((event, i) => el('option', { value: i }, event.name)));
        roleSelect.value = role; eventSelect.value = eventIndex; refreshPoints();
      }
      function choosePoint(roleIndex, pointIndex) {
        role = roleIndex; index = pointIndex; timeCursor = null; roleSelect.value = role; refreshPoints(); selectStep('points');
      }
      function interactive(node, label, action, key = label) {
        node.setAttribute('aria-label', label);
        node.setAttribute('data-story-action', key);
        return svgButton(node, action, viewEvents.signal);
      }
      function addText(x, y, text, attrs = {}) {
        const node = svg('text', { x, y, style: 'font-size:20px', ...attrs }, text);
        chart.append(node); return node;
      }
      function makePath(character, scaleX, scaleY, curve) {
        return d3.line().x(point => scaleX(point.time)).y(point => scaleY(point.y)).curve(curve)(character.points);
      }
      function draw() {
        const focused = root.contains(document.activeElement) ? document.activeElement.getAttribute('data-story-action') : null;
        viewEvents.abort(); viewEvents = new AbortController();
        chart.replaceChildren(); result.replaceChildren();
        const stage = storyStage(current);
        root.dataset.stage = chart.dataset.stage = current;
        const selected = data().characters[role], point = selected.points[index], spec = storyScaleSpec(data());
        const x = d3.scaleLinear().domain(spec.xDomain).range(spec.xRange);
        const y = d3.scaleLinear().domain(spec.yDomain).range(spec.yRange);
        const frame = storyEventFrame(data(), eventIndex), focusTime = current === 'events' ? frame.event.time : current === 'time' ? timeCursor ?? point.time : point.time;
        layerSelect.disabled = current !== 'events';
        const source = caseId === 'original' ? t('原例：剧情结构示意，非逐秒标注', 'Original: story structure, not exact film annotation') : t('构造教学微案例：分工→会合→再分工', 'Constructed example: separate tasks→meet→split again');
        caption.textContent = `${source}\n${selected.name} · ${current} · t=${focusTime} min → x=${format(x(focusTime))} px`;
        const axis = d3.select(chart).append('g').attr('transform', 'translate(0,420)').call(d3.axisBottom(x).ticks(6));
        axis.selectAll('text').style('font-size', '20px');
        axis.selectAll('.tick').each(function(value) {
          interactive(this, t(`时间尺度 ${value} 分钟`, `Time scale ${value} minutes`), () => { timeCursor = value; selectStep('time'); });
        });
        addText(110, 455, t('横轴：时间 / 分钟；y：手工叙事布局', 'x: time / minutes; y: manual story layout'), { style: 'font-size:18px' });
        const guide = svg('line', { x1: x(focusTime), x2: x(focusTime), y1: 30, y2: 420, stroke: current === 'events' ? '#b52a2a' : '#b2a126', 'stroke-width': current === 'time' ? 5 : 2, 'stroke-dasharray': current === 'time' ? 'none' : '7 5', 'data-story-guide': current });
        chart.append(guide);
        if (stage.mode === 'tracks') drawTracks(x, focusTime);
        else if (stage.mode === 'events') drawEvents(x, y, frame);
        else drawRole(x, y, selected);
        if (current === 'time') {
          result.append(table([t('输入时间', 'Input time'), 'domain', 'range', t('实际 x', 'Actual x')], [[`${focusTime} min`, JSON.stringify(spec.xDomain), JSON.stringify(spec.xRange), format(x(focusTime)) + ' px']]));
          result.append(el('p', {}, t('水平轨道不是角色关系曲线。点一个样本进入控制点步骤；点时间刻度反选时间步骤。', 'Horizontal tracks are not relationship curves. Select a sample for points; select an axis tick for time.')));
        }
        if (stage.points) showPointTable(x, y, selected);
        if (current === 'datum') {
          const binder = el('p', { className: 'tv-result', 'data-story-binding': 'whole-array' }, `c.points: Array(${selected.points.length}) → .datum(c.points) → path[data-role="${role}"] × 1`);
          result.prepend(binder);
          result.append(el('p', {}, t('彩色路径的 __data__ 就是整组 points；表格列出同一组对象，既没有拆成多条线，也没有改动坐标。', 'The coloured path’s __data__ is the whole points array. The table shows those same objects; no extra paths or coordinate changes.')));
        }
        if (current === 'curve') result.prepend(el('p', { className: 'tv-result' }, t(`彩色实线：Catmull-Rom alpha=${alpha}；黑色虚线：curveLinear。圆点完全相同。`, `Solid colour: Catmull-Rom alpha=${alpha}; dashed black: curveLinear. Identical control points.`)));
        if (focused) queueMicrotask(() => {
          if (!signal.aborted) ([...root.querySelectorAll('[data-story-action]')].find(node => node.dataset.storyAction === focused) ?? chart).focus({ preventScroll: true });
        });
      }
      function drawTracks(x, time) {
        const gap = 310 / Math.max(1, data().characters.length - 1);
        data().characters.forEach((character, i) => {
          const trackY = 65 + i * gap;
          chart.append(svg('line', { x1: x(character.points[0].time), x2: x(character.points.at(-1).time), y1: trackY, y2: trackY, stroke: '#c1cbbb', 'stroke-width': 4, 'data-story-track': i }));
          addText(105, trackY + 5, character.name === 'Alan Grant & Kids' ? 'Alan & Kids' : character.name.split(' / ')[0], { 'text-anchor': 'end', style: 'font-size:18px' });
          character.points.forEach((point, j) => {
            const mark = svg('circle', { cx: x(point.time), cy: trackY, r: point.time === time ? 8 : 5, fill: character.color, stroke: '#fff', 'stroke-width': 1 });
            interactive(mark, `${character.name} t=${point.time}`, () => choosePoint(i, j), `point:${i}:${j}`); chart.append(mark);
          });
        });
      }
      function drawRole(x, y, character) {
        const smooth = d3.curveCatmullRom.alpha(alpha);
        if (current === 'curve') {
          const skeleton = svg('path', { d: makePath(character, x, y, d3.curveLinear), fill: 'none', stroke: '#123e37', 'stroke-width': 4, 'stroke-dasharray': '9 7', 'data-story-skeleton': '' });
          interactive(skeleton, t('线性骨架：反选曲线步骤', 'Linear skeleton: select curve step'), () => selectStep('curve')); chart.append(skeleton);
        }
        if (current === 'points') {
          chart.append(svg('path', { d: makePath(character, x, y, d3.curveLinear), fill: 'none', stroke: '#d4dbc9', 'stroke-width': 2 }));
        } else {
          const path = d3.select(chart).append('path').datum(character.points)
            .attr('d', d3.line().x(point => x(point.time)).y(point => y(point.y)).curve(smooth))
            .attr('fill', 'none').attr('stroke', character.color).attr('stroke-width', current === 'datum' ? 7 : 4)
            .attr('data-role', role).attr('data-bound-count', character.points.length).attr('data-alpha', alpha).node();
          interactive(path, t('整组 points 绑定一条 path', 'Whole points array bound to one path'), () => selectStep('datum'));
        }
        if (current === 'datum') {
          const xs = character.points.map(point => x(point.time)), ys = character.points.map(point => y(point.y));
          chart.append(svg('rect', { x: Math.min(...xs) - 8, y: Math.min(...ys) - 12, width: Math.max(...xs) - Math.min(...xs) + 16, height: Math.max(...ys) - Math.min(...ys) + 24, fill: 'none', stroke: character.color, 'stroke-width': 2, 'stroke-dasharray': '8 6', 'pointer-events': 'none', 'data-story-array-box': '' }));
          addText(120, 25, `Array(${character.points.length}) → datum → 1 path`, { style: 'font-size:24px' });
        }
        character.points.forEach((point, j) => {
          const active = j === index, mark = svg('circle', { cx: x(point.time), cy: y(point.y), r: active ? 9 : 6, fill: active ? '#e1eb91' : '#fffef8', stroke: character.color, 'stroke-width': 3, 'data-story-point': j, 'data-time': point.time, 'data-layout-y': point.y });
          interactive(mark, `${character.name}: t=${point.time}, y=${point.y}`, () => choosePoint(role, j), `point:${role}:${j}`); chart.append(mark);
          if (active) addText(x(point.time) > 650 ? x(point.time) - 15 : x(point.time) + 15, Math.max(48, y(point.y) - 15), `{${point.time}, ${point.y}}`, { 'text-anchor': x(point.time) > 650 ? 'end' : 'start' });
        });
      }
      function showPointTable(x, y, character) {
        const grid = table(['#', t('原 time', 'Raw time'), t('原 y', 'Raw y'), 'SVG x', 'SVG y'], character.points.map((point, j) => [j + 1, point.time, point.y, format(x(point.time)), format(y(point.y))]));
        grid.querySelectorAll('tbody tr').forEach((row, j) => {
          if (j === index) row.style.background = '#e1eb91';
          const cell = row.querySelector('td'); cell.replaceChildren();
          button(cell, `#${j + 1}`, () => choosePoint(role, j), viewEvents.signal).dataset.storyAction = `point:${role}:${j}`;
        });
        result.append(grid);
      }
      function drawEvents(x, y, frame) {
        if (layer !== 'events') data().characters.forEach((character, i) => {
          const path = svg('path', { d: makePath(character, x, y, d3.curveCatmullRom.alpha(alpha)), fill: 'none', stroke: character.color, 'stroke-width': character.width, opacity: frame.roles[i].related ? 1 : 0.2 });
          interactive(path, character.name, () => { role = i; index = 0; roleSelect.value = role; refreshPoints(); selectStep('datum'); }); chart.append(path);
          const sample = frame.roles[i].point;
          if (sample) chart.append(svg('circle', { cx: x(sample.time), cy: y(sample.y), r: 7, fill: character.color, stroke: '#fff', 'stroke-width': 2, 'data-event-sample-role': i }));
        });
        if (layer !== 'roles') data().events.forEach((event, i) => {
          const group = svg('g', { 'data-story-event': i });
          group.append(svg('circle', { cx: x(event.time), cy: y(event.y), r: i === eventIndex ? 24 : 18, fill: '#dc262633', stroke: i === eventIndex ? '#b52a2a' : '#d88e8e', 'stroke-width': 3 }), svg('circle', { cx: x(event.time), cy: y(event.y), r: 4, fill: '#b52a2a' }));
          const labelY = i % 2 ? Math.min(395, y(event.y) + 64) : Math.max(55, y(event.y) - 64);
          group.append(svg('line', { x1:x(event.time), x2:x(event.time), y1:y(event.y)+(i%2?24:-24), y2:labelY+(i%2?-18:8), stroke:'#b52a2a', 'stroke-width':1.5, 'stroke-dasharray':'4 3' }));
          const label = svg('text', { x: x(event.time), y:labelY, 'text-anchor': 'middle', 'data-event-label':i, style:'fill:#a12424;font-size:24px;paint-order:stroke;stroke:#fffef8;stroke-width:5px;stroke-linejoin:round' }, event.name);
          group.append(label); interactive(group, event.name, () => { eventIndex = i; eventSelect.value = i; selectStep('events'); }); chart.append(group);
        });
        result.append(el('h4', {}, frame.event.name), el('p', {}, t(frame.event.desc, frame.event.descEn ?? frame.event.desc)));
        result.append(table([t('角色', 'Role'), t('该时刻原控制点 y', 'Actual sampled y'), t('该事件时间轴 x', 'Event-time axis x')], frame.roles.map(({ character, point, related }) => [`${related ? '● ' : ''}${character.name}`, point ? point.y : t('无该刻控制点', 'No sample at this time'), format(x(frame.event.time))])));
        result.append(el('p', { className: 'tv-result' }, `${t('事件锚点', 'Event anchor')}: time=${frame.event.time}, layout y=${frame.event.y} → SVG (${format(x(frame.event.time))}, ${format(y(frame.event.y))})`));
        result.append(el('p', {}, t('● 按事件文字标记相关角色，不是位置相等的证明。无控制点者不插造样本；曲线仅用于叙事连接。', '● marks roles named in the event, not equal positions. Missing samples stay missing; curves are narrative connections.')));
      }
      refreshControls(); draw();
      return {
        focus(id) { const changed = current !== id; current = id; if (id === 'events' && changed) { layer = 'both'; layerSelect.value = layer; } draw(); },
        reset() { caseId = 'original'; role = index = eventIndex = 0; timeCursor = null; alpha = 0.5; layer = 'both'; current = 'time'; caseSelect.value = caseId; layerSelect.value = layer; slider.value = alpha; alphaValue.textContent = alpha; refreshControls(); draw(); },
        destroy() { viewEvents.abort(); signal.removeEventListener('abort', stopView); root.replaceChildren(); }
      };
    }
  };
}
