import { el, svg, table, selectControl, button, format } from './utils.js';
import { localKey, calendarCell, loadWeather, loadNames, yearWindow } from './models-05.js';
import { peakRecord, compareYears, calendarFrame, weatherExtremes } from './models-05-names-calendar.js';

const step = (id, label, codeTargets, explain) => ({ id, label, codeTargets, explain });
const range = (block, from, to = from) => ({ block, from, to });
const show = (node, visible) => { node.style.display = visible ? '' : 'none'; };
const numberText = value => value == null ? '—' : format(value);
const ink = '#123e37', lime = '#dfeaa5', pale = '#edf2e7';

export function namesDefinition(d3) {
  return {
    sectionId: '5.2', title: ['从年份到人名流行曲线', 'From years to name-frequency curves'],
    goal: ['逐层建立年份解析、时间轴、三线追踪和同窗比较。', 'Build year parsing, the time axis, three-series tracking and shared-window comparison.'],
    source: ['保留原 french_names.json，三个名字与原值不变；来源待核，不作人口学推断。', 'Original french_names.json; names and values are unchanged. Provenance awaits review; no demographic inference.'],
    steps: [
      step('parse', ['① 年份解析', '① Parse year'], [range(0, 2, 4)], ['先看 number → 字符串 → 本地 Date；还没有折线。', 'First inspect number → string → local Date; no line chart yet.']),
      step('scale', ['② 时间映射', '② Time scale'], [range(1, 2, 4)], ['只建立时间轴与选年位置，domain 中的同一年映射到唯一 x。', 'Build only the time axis and selected-year position: one year maps to one x.']),
      step('track', ['③ 三线追踪', '③ Track three lines'], [range(2, 16, 22)], ['加上三条原折线；同一条参考线同时读取三个真实频率。', 'Add all three original curves; one crosshair reads three actual frequencies.']),
      step('window', ['④ 时间窗口', '④ Time window'], [range(1, 3)], ['补充窗口过滤与概览框；三条线一起裁切，点的频率不改变。', 'Add filtering and an overview window; all lines are cropped together without changing frequencies.'])
    ],
    async create(ctx) {
      const { root, t, signal, selectStep } = ctx, data = await loadNames();
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const names = ['Marie', 'Jean', 'Camille'], colors = ['#db2777', '#2563eb', '#059669'];
      const parse = d3.timeParse('%Y'), allYears = data.names.Marie.map(d => ({ year: parse(String(d.year)) }));
      const bisect = d3.bisector(d => d.year).center;
      let current = 'parse', year = 1965, chosen = 'all', windowChoice = 'middle', compareYear = 2000;
      root.replaceChildren();
      const heading = el('p', { className: 'tv-card', 'aria-live': 'polite' });
      const controls = el('div', { className: 'tv-controls' }); root.append(heading, controls);
      const windowSelect = selectControl(controls, t('共同时间窗（第④步）', 'Shared window (step ④)'), [['all', '1900–2020'], ['middle', '1950–2000'], ['recent', '1980–2020']], windowChoice, value => { windowChoice = value; selectStep('window'); }, signal);
      const nameSelect = selectControl(controls, t('突出人名', 'Highlight name'), [['all', t('三条一起', 'All three')], ...names], chosen, value => { chosen = value; selectStep(current === 'window' ? 'window' : 'track'); }, signal);
      const yearField = el('label', { className: 'tv-field' }, t('追踪年份', 'Track year'));
      const slider = el('input', { type: 'range', min: 1900, max: 2020, value: year }), out = el('output');
      yearField.append(slider, out); root.append(yearField);
      slider.addEventListener('input', () => { year = +slider.value; selectStep(current === 'window' ? 'window' : current === 'scale' ? 'scale' : current === 'parse' ? 'parse' : 'track'); }, { signal });
      const parsePane = el('div', { className: 'tv-card', 'data-part': 'year-parse' });
      const chart = svg('svg', { viewBox: '0 0 500 300', role: 'group', 'aria-label': t('时间轴与三个人名曲线', 'Time axis and three name-frequency curves') });
      const overview = svg('svg', { viewBox: '0 0 500 92', role: 'img', 'aria-label': t('同一原数据的全程概览与窗口', 'Full source-data overview and selected window') });
      const result = el('div'); root.append(parsePane, overview, chart, result);
      const x = d3.scaleTime().range([55, 475]), y = d3.scaleLinear().domain([0, d3.max(names.flatMap(name => data.names[name]), d => d.count) * 1.1]).range([245, 30]);
      const globalX = x.copy().domain([new Date(1900, 0, 1), new Date(2020, 0, 1)]), smallY = y.copy().range([65, 12]);
      const xAxis = d3.select(chart).append('g').attr('transform', 'translate(0,245)');
      const yAxis = d3.select(chart).append('g').attr('transform', 'translate(55,0)');
      const line = d3.line().x(d => x(parse(String(d.year)))).y(d => y(d.count)).curve(d3.curveMonotoneX);
      const series = names.map((name, i) => d3.select(chart).append('path').attr('class', 'tv-name-series').attr('data-name', name).attr('fill', 'none').attr('stroke', colors[i]));
      const cross = d3.select(chart).append('line').attr('stroke', ink).attr('stroke-dasharray', '5 3');
      const pointsLayer = d3.select(chart).append('g'), axisMarker = d3.select(chart).append('g');
      axisMarker.append('circle').attr('r', 7).attr('fill', ink); axisMarker.append('text').attr('y', -14).attr('text-anchor', 'middle').style('font-size', '20px');
      const overlay = d3.select(chart).append('rect').attr('x', 55).attr('y', 30).attr('width', 420).attr('height', 215).attr('fill', 'transparent');
      overlay.on('pointermove', event => {
        const selected = allYears[bisect(allYears, x.invert(d3.pointer(event, chart)[0]))];
        year = Math.max(bounds()[0], Math.min(bounds()[1], selected.year.getFullYear())); slider.value = year;
        selectStep(current === 'window' ? 'window' : 'track');
      });
      const smallLine = d3.line().x(d => globalX(parse(String(d.year)))).y(d => smallY(d.count)).curve(d3.curveMonotoneX);
      names.forEach((name, i) => d3.select(overview).append('path').datum(data.names[name]).attr('d', smallLine).attr('stroke', colors[i]).attr('stroke-width', 1.7).attr('fill', 'none'));
      const windowBox = d3.select(overview).append('rect').attr('y', 5).attr('height', 67).attr('fill', '#dfeaa555').attr('stroke', ink).attr('stroke-width', 2);
      d3.select(overview).append('text').attr('x', 55).attr('y', 89).style('font-size', '15px').text('1900');
      d3.select(overview).append('text').attr('x', 475).attr('y', 89).attr('text-anchor', 'end').style('font-size', '15px').text('2020');
      const tasks = el('details', { className: 'tv-card' }); tasks.append(el('summary', {}, t('探究：文件里的峰值与两年变化', 'Explore peaks and two-year changes in this file'))); root.append(tasks);
      const peakButtons = el('div', { className: 'tv-controls' }); tasks.append(peakButtons);
      names.forEach(name => button(peakButtons, t(`定位 ${name} 峰值`, `Find ${name} peak`), () => {
        year = peakRecord(data.names[name]).year; chosen = name; nameSelect.value = name; slider.value = year; selectStep('track');
      }, signal));
      const compareLabel = el('label', { className: 'tv-field' }, t('与追踪年份比较：另一年', 'Compare tracked year against'));
      const compareInput = el('input', { type: 'number', min: 1900, max: 2020, step: 1, value: compareYear }); compareLabel.append(compareInput); tasks.append(compareLabel);
      const comparisons = el('div'); tasks.append(comparisons);
      compareInput.addEventListener('change', () => { const value = +compareInput.value; if (Number.isInteger(value) && value >= 1900 && value <= 2020) { compareYear = value; updateComparison(); } else compareInput.value = compareYear; }, { signal });
      function bounds() { return current !== 'window' || windowChoice === 'all' ? [1900, 2020] : windowChoice === 'middle' ? [1950, 2000] : [1980, 2020]; }
      function updateComparison() {
        comparisons.replaceChildren(table([t('人名', 'Name'), String(year), String(compareYear), t('差值（原频率）', 'Difference (source frequency)')], compareYears(data.names, year, compareYear).map(d => [d.name, numberText(d.first), numberText(d.second), numberText(d.change)])));
      }
      function draw() {
        root.dataset.stage = current; chart.dataset.stage = current;
        const [start, end] = bounds(); year = Math.max(start, Math.min(end, year)); slider.min = start; slider.max = end; slider.value = year; out.textContent = year;
        x.domain([new Date(start, 0, 1), new Date(end, 0, 1)]);
        const hasLines = current === 'track' || current === 'window';
        show(parsePane, current === 'parse'); show(chart, current !== 'parse'); show(overview, current === 'window'); show(tasks, hasLines);
        windowSelect.disabled = current !== 'window';
        heading.textContent = t(...{
          parse: ['输入年份 → String(year) → timeParse("%Y") → 本地 Date', 'Year value → String(year) → timeParse("%Y") → local Date'],
          scale: ['只建立时间轴：同一年，只对应一个 x', 'Build the time axis only: one year, one x'],
          track: ['三条原折线，共用同一年参考线', 'Three original curves share one year crosshair'],
          window: [`全程概览 → ${start}–${end} 窗口放大，三条线同步`, `Full overview → ${start}–${end} zoom window, synchronized across all series`]
        }[current]);
        parsePane.replaceChildren(el('p', { className: 'tv-result' }, `JSON: ${year} (number)\nString(year): "${year}"\ntimeParse('%Y'): ${parse(String(year)).toString()}`));
        xAxis.call(d3.axisBottom(x).ticks(4).tickFormat(d3.timeFormat('%Y'))); xAxis.selectAll('text').style('font-size', '18px');
        yAxis.style('display', hasLines ? null : 'none').call(d3.axisLeft(y).ticks(4));
        const values = names.map((name, i) => {
          const filtered = yearWindow(data.names[name], start, end), value = data.names[name].find(d => d.year === year)?.count;
          series[i].datum(filtered).attr('d', line).attr('display', hasLines ? null : 'none').attr('stroke-width', chosen === name ? 4 : 2.2).attr('opacity', chosen === 'all' || chosen === name ? 1 : 0.2);
          return { name, value, x: x(parse(String(year))), y: value == null ? null : y(value), color: colors[i], count: filtered.length };
        });
        axisMarker.attr('transform', `translate(${x(parse(String(year)))},245)`); axisMarker.select('text').text(year); axisMarker.attr('display', current === 'scale' ? null : 'none');
        cross.attr('x1', x(parse(String(year)))).attr('x2', x(parse(String(year)))).attr('y1', hasLines ? 30 : 185).attr('y2', 245).attr('stroke-width', current === 'scale' ? 3 : 1.5);
        overlay.attr('pointer-events', hasLines ? 'all' : 'none');
        pointsLayer.selectAll('circle').data(hasLines ? values.filter(d => d.y != null) : [], d => d.name).join('circle').attr('cx', d => d.x).attr('cy', d => d.y).attr('r', 6).attr('fill', d => d.color).attr('stroke', '#fff').attr('stroke-width', 1.5);
        windowBox.attr('x', globalX(new Date(start, 0, 1))).attr('width', globalX(new Date(end, 0, 1)) - globalX(new Date(start, 0, 1)));
        result.replaceChildren(el('p', { className: 'tv-result' }, current === 'parse' ? t('还未绘制坐标轴或折线；数据类型变了，年份没有变。', 'No axes or curves yet: the type changes, the year does not.') : `${year} → x=${format(x(parse(String(year))))}\ndomain=${start}–${end}; range=[55,475]`));
        if (hasLines) result.append(table([t('人名', 'Name'), t('原频率', 'Source frequency'), 'SVG x / y', t('窗口点数', 'Window points')], values.map(d => [d.name, numberText(d.value), `${format(d.x)} / ${numberText(d.y)}`, d.count])));
        updateComparison();
      }
      const adjustments = el('details', { className: 'tv-card' });
      adjustments.append(el('summary', {}, t('调整输入：年份 / 人名 / 时间窗', 'Adjust inputs: year / name / time window')), controls, yearField);
      root.replaceChildren(heading, parsePane, chart, overview, result, adjustments, tasks);
      draw(); return {
        focus(id) { current = id; draw(); },
        reset() { current = 'parse'; year = 1965; chosen = 'all'; windowChoice = 'middle'; compareYear = 2000; windowSelect.value = 'middle'; nameSelect.value = 'all'; compareInput.value = '2000'; tasks.open = false; adjustments.open = false; draw(); },
        destroy() { d3.select(chart).selectAll('*').interrupt(); overlay.on('pointermove', null); root.replaceChildren(); }
      };
    }
  };
}

export function calendarDefinition(d3) {
  return {
    sectionId: '5.3', title: ['同一天，六步落进日历', 'One date, six steps into a calendar'],
    goal: ['从366天的序列，逐层建立星期、周列、格点、温度色和月份边界。', 'Build weekday, week column, cell, temperature color and month boundary from 366 dates.'],
    source: ['保留原 weather_2024.csv；来源待核。灰色表示缺失而非0°C；周偏移与原简化公式明确对照。', 'Original weather_2024.csv; provenance awaits review. Gray means missing, not 0°C. Week offsets are explicitly compared with the original simplified formula.'],
    steps: [
      step('days', ['① 全年日期', '① Year range'], [range(0, 2, 4)], ['先看366天的一维日期序列；固定高亮同一个输入日期。', 'Start with a one-dimensional sequence of 366 dates; keep the same input date highlighted.']),
      step('weekday', ['② 星期行', '② Weekday rows'], [range(1, 6, 7)], ['按星期分成七个桶，桶内人数来自真实日期计数；还没有周列。', 'Partition dates into seven weekday buckets using actual counts; no week columns yet.']),
      step('week', ['③ 周列', '③ Week columns'], [range(1, 1, 5)], ['再按实际周边界分桶，查看选中周的七个日期；原floor(dayIndex/7)另列对照。', 'Group by actual week boundaries and inspect the selected week; compare the original floor(dayIndex/7) separately.']),
      step('cell', ['④ 格点定位', '④ Cell position'], [range(1, 16, 17)], ['把周列和星期行组合成无色格点；只突出当前日期的横纵定位。', 'Combine week columns and weekday rows into uncolored cells; emphasize the selected date’s two coordinates.']),
      step('color', ['⑤ 温度色值', '⑤ Temperature color'], [range(1, 19), range(0, 7)], ['现在才加入原温度，色标指针与选中格使用同一个color(value)。', 'Only now add source temperatures; the legend marker and selected cell use the same color(value).']),
      step('month', ['⑥ 月份边界', '⑥ Month boundaries'], [range(2, 2, 5)], ['在同一热图上加入跨月折线，显示选中日与七天前是否同月。', 'Add month boundaries to the same heatmap and compare the selected date with seven days earlier.'])
    ],
    async create(ctx) {
      const { root, t, signal, selectStep } = ctx, raw = await loadWeather(d3);
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
      const byKey = new Map(raw.map(d => [d.date, Number.isFinite(d.temp_max) ? d.temp_max : null]));
      const days = d3.timeDay.range(new Date(2024, 0, 1), new Date(2025, 0, 1));
      let selectedKey = '2024-02-29', weekStart = 0, whole = false, palette = 'RdYlBu', current = 'days';
      root.replaceChildren();
      const heading = el('p', { className: 'tv-card', 'aria-live': 'polite' }), controls = el('div', { className: 'tv-controls' }); root.append(heading, controls);
      const date = el('input', { type: 'date', min: '2024-01-01', max: '2024-12-31', value: selectedKey, 'aria-label': t('追踪日期', 'Trace date') }); controls.append(date);
      date.addEventListener('change', () => { if (days.some(d => localKey(d) === date.value)) { selectedKey = date.value; draw(); } else date.value = selectedKey; }, { signal });
      const weekSelect = selectControl(controls, t('周起点', 'Week starts'), [['0', t('周日', 'Sunday')], ['1', t('周一', 'Monday')]], 0, value => { weekStart = +value; draw(); }, signal);
      const rangeSelect = selectControl(controls, t('格点视野（第④步起）', 'Cell view (from step ④)'), [['micro', t('四周放大', 'Four-week zoom')], ['year', t('查看整年', 'Whole year')]], 'micro', value => { whole = value === 'year'; if (['days', 'weekday', 'week'].includes(current)) selectStep('cell'); else draw(); }, signal);
      const paletteSelect = selectControl(controls, 'colormap', ['RdYlBu', 'Viridis', 'Cividis'], palette, value => { palette = value; selectStep('color'); }, signal);
      const picks = el('div', { className: 'tv-controls' }); root.append(picks);
      for (const [label, key] of [[t('闰日', 'Leap day'), '2024-02-29'], [t('跨周前一天', 'Before week change'), '2024-01-06'], [t('跨周后一天', 'After week change'), '2024-01-07']]) button(picks, label, () => { selectedKey = key; date.value = key; draw(); }, signal);
      const chart = svg('svg', { role: 'group', 'aria-label': t('日期分阶段构建日历', 'Build a calendar from dates in stages') });
      const result = el('div'), strip = el('div', { className: 'tv-controls' }); root.append(chart, strip, result);
      const marks = d3.select(chart).append('g'), labels = d3.select(chart).append('g'), guides = d3.select(chart).append('g'), borders = d3.select(chart).append('g');
      const legend = el('div', { className: 'tv-card', 'data-part': 'temperature-legend' }); root.append(legend);
      const tasks = el('details', { className: 'tv-card' }); tasks.append(el('summary', {}, t('探究：源文件里哪天最热/最冷？', 'Explore: which source dates are warmest/coldest?'))); root.append(tasks);
      const comparison = el('details', { className: 'tv-card' }); comparison.append(el('summary', {}, t('同一份温度：趋势折线 / 日历视角', 'Same temperatures: trend line / calendar view')));
      const trend = svg('svg', { viewBox: '0 0 500 160', role: 'img', 'aria-label': t('同一原温度数据的全年折线', 'Annual line of the same source temperatures') });
      comparison.append(trend, el('p', {}, t('折线看全年高低，日历对齐星期；图形不证明周末或节假日造成温差。', 'A line shows annual variation; a calendar aligns weekdays. Neither proves weekend or holiday causation.'))); root.append(comparison);
      const tx = d3.scaleTime().domain([days[0], days.at(-1)]).range([45, 480]), ty = d3.scaleLinear().domain(d3.extent(raw.filter(d => Number.isFinite(d.temp_max)), d => d.temp_max)).nice().range([125, 15]);
      d3.select(trend).append('g').attr('transform', 'translate(0,125)').call(d3.axisBottom(tx).ticks(4).tickFormat(d3.timeFormat('%m')));
      d3.select(trend).append('g').attr('transform', 'translate(45,0)').call(d3.axisLeft(ty).ticks(3));
      d3.select(trend).append('path').datum(days).attr('d', d3.line().defined(d => byKey.get(localKey(d)) != null).x(d => tx(d)).y(d => ty(byKey.get(localKey(d))))).attr('fill', 'none').attr('stroke', ink).attr('stroke-width', 2);
      const extremes = weatherExtremes(calendarFrame(days, 0, selectedKey).cells, byKey);
      for (const [label, cell] of [[t('定位最高温', 'Find highest temperature'), extremes.max], [t('定位最低温', 'Find lowest temperature'), extremes.min]]) {
        const b = button(tasks, label, () => { if (cell) { selectedKey = cell.key; date.value = cell.key; selectStep('color'); } }, signal); b.disabled = !cell;
      }
      const captions = {
        days: ['输入：按时间排序的366天，还没有星期/周坐标', 'Input: 366 ordered dates, without weekday/week coordinates'],
        weekday: ['按星期分成7桶：当前日期落在哪一行？', 'Seven weekday buckets: which row receives the selected date?'],
        week: ['按周边界分桶：选中周有哪些日期？', 'Bucket by week boundaries: which dates belong to the selected week?'],
        cell: ['组合两维坐标：周列 × 星期行，暂不编码温度', 'Combine week column × weekday row; temperature is not encoded yet'],
        color: ['原温度 → 同一color(value) → 日历格与色标指针', 'Source temperature → same color(value) → cell and legend marker'],
        month: ['同一热图 + 月份边界：与7天前比较年月', 'Same heatmap + month boundaries: compare with seven days earlier']
      };
      const weekdayLabels = () => weekStart ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      function activate(cell, focusStep = null) { selectedKey = cell.key; date.value = cell.key; if (focusStep) selectStep(focusStep); else draw(); }
      function keyAction(event, cell, focusStep) { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); activate(cell, focusStep); } }
      function draw() {
        const activeChip = strip.contains(document.activeElement) ? document.activeElement.dataset.date : null;
        if (activeChip) queueMicrotask(() => { if (!signal.aborted) [...strip.querySelectorAll('button')].find(node => node.dataset.date === activeChip)?.focus({ preventScroll: true }); });
        root.dataset.stage = current; chart.dataset.stage = current; heading.textContent = t(...captions[current]);
        const renderedCellSize = whole ? 14 : 44, frame = calendarFrame(days, weekStart, selectedKey, whole, renderedCellSize), selected = frame.selected, rowNames = weekdayLabels();
        const color = d3.scaleSequential(d3[`interpolate${palette}`]).domain([30, -5]);
        const grid = ['cell', 'color', 'month'].includes(current), colored = current === 'color' || current === 'month';
        const valid = frame.cells.filter(d => byKey.get(d.key) != null).length;
        paletteSelect.disabled = !colored; rangeSelect.disabled = !grid; weekSelect.disabled = current === 'days';
        marks.selectAll('rect').attr('role', null).attr('aria-label', null).attr('tabindex', null).on('keydown', null);
        guides.selectAll('*').remove(); borders.selectAll('*').remove(); labels.selectAll('*').remove(); strip.replaceChildren();
        show(legend, colored); show(tasks, colored); show(comparison, colored);
        if (current === 'days') {
          chart.setAttribute('viewBox', '0 0 500 170');
          const x = d3.scaleLinear().domain([1, 366]).range([20, 480]);
          marks.selectAll('rect').data(frame.cells, d => d.key).join('rect').attr('x', d => x(d.day)).attr('y', 65).attr('width', 1.2).attr('height', d => d.key === selectedKey ? 60 : 28).attr('fill', d => d.key === selectedKey ? ink : '#97ac79').attr('stroke', 'none').attr('tabindex', -1).on('click', (_, d) => activate(d));
          guides.append('line').attr('x1', x(selected.day)).attr('x2', x(selected.day)).attr('y1', 35).attr('y2', 130).attr('stroke', ink).attr('stroke-width', 2);
          labels.append('text').attr('x', x(selected.day)).attr('y', 25).attr('text-anchor', 'middle').style('font-size', '19px').text(`${selected.key} / #${selected.day}`);
          labels.append('text').attr('x', 20).attr('y', 155).style('font-size', '16px').text('2024-01-01'); labels.append('text').attr('x', 480).attr('y', 155).attr('text-anchor', 'end').style('font-size', '16px').text('2024-12-31');
        } else if (current === 'weekday') {
          chart.setAttribute('viewBox', '0 0 500 300'); const x = d3.scaleLinear().domain([0, 54]).range([0, 330]);
          marks.selectAll('rect').data(frame.weekdays, d => `row-${d.row}`).join('rect').attr('x', 110).attr('y', d => 12 + d.row * 40).attr('width', d => x(d.members.length)).attr('height', 28).attr('fill', d => d.row === selected.row ? ink : pale).attr('stroke', ink).attr('stroke-width', d => d.row === selected.row ? 3 : 1).attr('tabindex', 0).attr('role', 'button').attr('aria-label', d => `${rowNames[d.row]}: ${d.members.length}`).on('click', (_, d) => activate(d.members.find(c => c.key === selectedKey) ?? d.members[0])).on('keydown', (event, d) => keyAction(event, d.members[0]));
          frame.weekdays.forEach(d => { labels.append('text').attr('x', 6).attr('y', 34 + d.row * 40).style('font-size', '22px').text(`${rowNames[d.row]} / ${d.row}`); labels.append('text').attr('x', 455).attr('y', 34 + d.row * 40).style('font-size', '20px').text(d.members.length); });
          strip.append(el('p', {}, `${selected.key} → ${rowNames[selected.row]} → row ${selected.row}`));
        } else if (current === 'week') {
          chart.setAttribute('viewBox', '0 0 500 210'); const x = d3.scaleBand().domain(frame.weeks.map(d => d.column)).range([25, 485]).padding(0.15), y = d3.scaleLinear().domain([0, 7]).range([145, 35]);
          marks.selectAll('rect').data(frame.weeks, d => `week-${d.column}`).join('rect').attr('x', d => x(d.column)).attr('y', d => y(d.members.length)).attr('width', x.bandwidth()).attr('height', d => 145 - y(d.members.length)).attr('fill', d => d.column === selected.column ? ink : '#b9c9a0').attr('stroke', 'none').attr('tabindex', -1).on('click', (_, d) => activate(d.members.find(c => c.key === selectedKey) ?? d.members[0]));
          const axis = guides.append('g').attr('transform', 'translate(0,145)'); axis.call(d3.axisBottom(x).tickValues([0, selected.column, frame.weeks.at(-1).column])); axis.selectAll('text').style('font-size', '18px');
          labels.append('text').attr('x', 25).attr('y', 20).style('font-size', '18px').text(t('柱高 = 该周包含的日期数（最多7）', 'Bar height = dates in that week (up to 7)'));
          labels.append('text').attr('x', 250).attr('y', 195).attr('text-anchor', 'middle').style('font-size', '18px').text(t(`当前周列 ${selected.column}`, `Selected week column ${selected.column}`));
          frame.weeks[selected.column].members.forEach(cell => { const chip = el('button', { type: 'button', 'data-date': cell.key, 'aria-pressed': String(cell.key === selectedKey) }, `${cell.key.slice(5)} ${rowNames[cell.row]}`); chip.onclick = () => activate(cell); strip.append(chip); });
        } else {
          const columns = whole ? frame.weeks.length : 4, cellSize = whole ? 14 : 44, width = columns * cellSize + 60;
          chart.setAttribute('viewBox', `0 0 ${width} ${7 * cellSize + 48}`);
          const px = d => 44 + (d.column - frame.firstColumn) * cellSize, py = d => 25 + d.row * cellSize;
          const rects = marks.selectAll('rect').data(frame.visible, d => d.key).join('rect').attr('x', px).attr('y', py).attr('width', cellSize).attr('height', cellSize).attr('fill', d => colored ? byKey.get(d.key) == null ? '#d4d6cf' : color(byKey.get(d.key)) : d.key === selectedKey ? lime : '#f4f6ed').attr('stroke', d => d.key === selectedKey ? ink : '#fff').attr('stroke-width', d => d.key === selectedKey ? 3 : 1).attr('tabindex', 0).attr('role', 'button').attr('aria-label', d => `${d.key}: ${colored ? byKey.get(d.key) ?? t('无数据', 'No data') : `week ${d.column}, row ${d.row}`}`).on('click', (_, d) => activate(d)).on('keydown', (event, d) => keyAction(event, d));
          rowNames.forEach((name, row) => labels.append('text').attr('x', 2).attr('y', 25 + row * cellSize + cellSize * .7).style('font-size', `${whole ? 10 : 13}px`).text(name));
          if (!whole) frame.visible.forEach(cell => labels.append('text').attr('x', px(cell) + cellSize / 2).attr('y', py(cell) + cellSize * .65).attr('text-anchor', 'middle').attr('pointer-events', 'none').style('font-size', '17px').attr('fill', colored ? '#fff' : ink).attr('paint-order', colored ? 'stroke' : null).attr('stroke', colored ? '#123e3766' : 'none').attr('stroke-width', colored ? 2 : 0).text(cell.date.getDate()));
          if (current === 'cell') {
            guides.append('rect').attr('x', 44).attr('y', py(selected)).attr('width', columns * cellSize).attr('height', cellSize).attr('fill', 'none').attr('stroke', '#617e36').attr('stroke-dasharray', '4 3');
            guides.append('rect').attr('x', px(selected)).attr('y', 25).attr('width', cellSize).attr('height', 7 * cellSize).attr('fill', 'none').attr('stroke', ink).attr('stroke-dasharray', '4 3');
          }
          if (current === 'month') {
            frame.boundaries.forEach(cell => borders.append('line').attr('x1', px(cell)).attr('x2', px(cell)).attr('y1', py(cell)).attr('y2', py(cell) + cellSize).attr('stroke', '#b5453c').attr('stroke-width', whole ? 2 : 3));
            frame.boundaries.filter(cell => cell.date.getDate() === 1 && cell.row !== 0).forEach(cell => borders.append('line').attr('x1', px(cell)).attr('x2', px(cell) + cellSize).attr('y1', py(cell)).attr('y2', py(cell)).attr('stroke', '#b5453c').attr('stroke-width', whole ? 2 : 3));
          }
        }
        marks.selectAll('rect').attr('data-selected', d => String(d.key === selectedKey || d.row === selected.row && current === 'weekday' || d.column === selected.column && current === 'week'));
        const value = byKey.get(selectedKey), before = new Date(selected.date.getFullYear(), selected.date.getMonth(), selected.date.getDate() - 7), sameMonth = before.getMonth() === selected.date.getMonth() && before.getFullYear() === selected.date.getFullYear();
        result.replaceChildren(el('p', { className: 'tv-result' }, `${selectedKey} / #${selected.day}\n${t('输入', 'Input')}: ${days.length} ${t('天', 'days')} · ${t('有效温度', 'valid temperatures')} ${valid} / ${t('缺失', 'missing')} ${days.length - valid}`));
        if (current !== 'days') result.append(el('p', { className: 'tv-result' }, `row=${selected.row} (${rowNames[selected.row]})${current !== 'weekday' ? `; week=${selected.column}` : ''}`));
        if (current === 'week') result.append(el('p', {}, t(`正确周列=${selected.column}；原简化floor(dayIndex/7)=${Math.floor((selected.day - 1) / 7)}，二者不可默认为相同。`, `Actual week column=${selected.column}; original simplified floor(dayIndex/7)=${Math.floor((selected.day - 1) / 7)}. They are not assumed equivalent.`)));
        if (grid) result.append(el('p', { className: 'tv-result' }, `cellSize=${renderedCellSize}; x=week×cellSize=${selected.x}; y=row×cellSize=${selected.y}\nSVG x=44+(week−${frame.firstColumn})×cellSize=${44 + (selected.column - frame.firstColumn) * renderedCellSize}; SVG y=25+row×cellSize=${25 + selected.y}`));
        if (colored) {
          result.append(el('p', { className: 'tv-result' }, value == null ? t('当前日期无温度数据', 'No temperature record for this date') : `${value}°C → ${color(value)}`));
          legend.replaceChildren(el('p', {}, t('原色标：−5°C → 30°C；指针是当前值', 'Original color scale: −5°C → 30°C; marker shows the selected value')));
          const bar = el('div'); bar.style.cssText = 'display:flex;position:relative;height:24px;margin:14px 0 22px';
          for (let i = 0; i < 24; i++) { const swatch = el('span'); swatch.style.cssText = `flex:1;background:${color(-5 + i * 35 / 23)}`; bar.append(swatch); }
          if (value != null) { const marker = el('strong', {}, '▼'); marker.style.cssText = `position:absolute;top:-17px;left:${Math.max(0, Math.min(100, (value + 5) / 35 * 100))}%;transform:translateX(-50%);color:${ink}`; bar.append(marker); }
          legend.append(bar, el('small', {}, value != null && (value < -5 || value > 30) ? t('值超出色标范围，指针停在端点；表中保留原值。', 'Value exceeds the color domain; the marker is pinned to the edge and the original value is retained.') : '−5°C                                              30°C'));
        }
        if (current === 'month') result.append(el('p', { className: 'tv-card' }, `${selectedKey} ↔ ${localKey(before)} → ${t(sameMonth ? '同月：不是月界首周' : '跨月：属于月份边界', sameMonth ? 'Same month: not a boundary week' : 'Different month: part of the month boundary')}`));
      }
      const adjustments = el('details', { className: 'tv-card' });
      adjustments.append(el('summary', {}, t('调整输入：日期 / 周起点 / 视野 / 色图', 'Adjust inputs: date / week start / view / colormap')), controls, picks);
      root.replaceChildren(heading, chart, legend, strip, result, adjustments, tasks, comparison);
      draw(); return {
        focus(id) { current = id; draw(); },
        reset() { current = 'days'; selectedKey = '2024-02-29'; weekStart = 0; whole = false; palette = 'RdYlBu'; date.value = selectedKey; weekSelect.value = '0'; rangeSelect.value = 'micro'; paletteSelect.value = 'RdYlBu'; tasks.open = false; comparison.open = false; adjustments.open = false; draw(); },
        destroy() { d3.select(chart).selectAll('*').interrupt(); root.replaceChildren(); }
      };
    }
  };
}
