import { el, button } from './utils.js';

const instances = new WeakMap();
export const t = (zh, en) => document.documentElement.lang.startsWith('en') ? (en ?? zh) : zh;
const word = value => Array.isArray(value) ? t(...value) : value;

export function waitForScene(pending, { signal, timeoutMs = 15000, message = 'Data loading timed out' }) {
  return new Promise((resolve, reject) => {
    const finish = (fn, value) => { clearTimeout(timer); signal.removeEventListener('abort', abort); fn(value); };
    const abort = () => finish(reject, new DOMException('Aborted', 'AbortError'));
    const timer = setTimeout(() => finish(reject, Error(message)), timeoutMs);
    if (signal.aborted) { abort(); return; }
    signal.addEventListener('abort', abort, { once: true });
    Promise.resolve(pending).then(value => finish(resolve, value), error => finish(reject, error));
  });
}

export function createStepState(ids) {
  if (!ids.length || new Set(ids).size !== ids.length) throw Error('Steps need unique IDs');
  let index = 0;
  return {
    get id() { return ids[index]; }, get index() { return index; },
    select(id) { const next = ids.indexOf(id); if (next >= 0) index = next; return ids[index]; },
    next() { index = Math.min(index + 1, ids.length - 1); return ids[index]; },
    previous() { index = Math.max(0, index - 1); return ids[index]; },
    reset() { index = 0; return ids[index]; }
  };
}

export function createLinkedLesson(article, definition, d3) {
  if (instances.has(article)) return instances.get(article);
  const codePanel = article.querySelector('.tab-panel[data-panel="code"]');
  const panel = article.querySelector('.tab-panel[data-panel="mapping"]');
  if (!codePanel || !panel) return null;
  const lifetime = new AbortController();
  const originalPres = [...codePanel.querySelectorAll('pre')];
  const sources = originalPres.map(pre => ({ pre, code: pre.querySelector('code') ?? pre, html: (pre.querySelector('code') ?? pre).innerHTML }));
  const state = createStepState(definition.steps.map(step => step.id));
  const host = el('section', { className: 'tv-host', 'data-linked-section': definition.sectionId });
  const id = `linked-lesson-${definition.sectionId.replace('.', '-')}`;
  const body = el('div', { className: 'tv-body', id, hidden: true });
  const title = el('h3'), goal = el('p', { className: 'tv-goal' });
  const workspace = el('div', { className: 'tv-workspace' });
  const left = el('div', { className: 'tv-code-pane' });
  const steps = el('div', { className: 'tv-steps', role: 'group' });
  const codeView = el('div', { className: 'tv-code-view' });
  const figure = el('div', { className: 'tv-figure', role: 'group' });
  const source = el('p', { className: 'tv-source' });
  const explain = el('p', { className: 'tv-explain', 'aria-live': 'polite' });
  const controls = el('div', { className: 'tv-actions' });
  const position = el('span', { className: 'tv-position' });
  let active = false, scene = null, aborter = null, version = 0, feedback = null, revealFrame = 0;
  let stepEvents = new AbortController();
  const placeholders = new Map();
  left.append(steps, codeView); workspace.append(left, figure);
  body.append(title, goal, workspace, source, explain, controls); host.append(body); panel.replaceChildren(host);
  const previous = button(controls, '', () => { state.previous(); render(); revealFigure(); }, lifetime.signal);
  controls.append(position);
  const next = button(controls, '', () => { state.next(); render(); revealFigure(); }, lifetime.signal);
  const resetButton = button(controls, '', () => { state.reset(); scene?.reset?.(); render(); }, lifetime.signal);
  const zoomButton = button(controls, '', () => {
    const zoomed = host.classList.toggle('tv-zoom');
    zoomButton.setAttribute('aria-pressed', String(zoomed));
  }, lifetime.signal);
  zoomButton.className = 'tv-zoom-toggle'; host.prepend(zoomButton);
  const motionLabel = el('label', { className: 'tv-motion' });
  const motion = el('input', { type: 'checkbox' }); motion.checked = definition.motionByDefault !== true;
  const motionText = el('span'); motionLabel.append(motion, motionText); controls.append(motionLabel);
  const full = button(controls, '', () => { hide(); article.querySelector('.tab-btn[data-tab="demo"]')?.click(); }, lifetime.signal);
  const closeButton = button(controls, '', () => {
    hide(); const codeTab = article.querySelector('.tab-btn[data-tab="code"]'); codeTab?.click(); codeTab?.focus();
  }, lifetime.signal);
  const mobileStep = el('label', { className:'tv-mobile-step' });
  const mobileStepLabel = el('span');
  const mobileStepSelect = el('select'); mobileStep.append(mobileStepLabel, mobileStepSelect);
  mobileStepSelect.addEventListener('change', () => selectStep(mobileStepSelect.value), { signal:lifetime.signal });

  function labels() {
    stepEvents.abort(); stepEvents = new AbortController();
    title.textContent = `${definition.sectionId} · ${word(definition.title)}`;
    goal.textContent = word(definition.goal); source.textContent = word(definition.source);
    figure.setAttribute('aria-label', word(definition.title)); steps.setAttribute('aria-label', t('关键代码步骤', 'Key code steps'));
    previous.textContent = t('← 上一步', '← Previous'); next.textContent = t('下一步 →', 'Next →');
    resetButton.textContent = t('重置', 'Reset'); full.textContent = t('原完整演示', 'Original demo'); closeButton.textContent = t('返回关键代码', 'Back to key code');
    zoomButton.textContent = t('放大图形', 'Enlarge figure');
    zoomButton.hidden = !active;
    zoomButton.setAttribute('aria-pressed', String(host.classList.contains('tv-zoom')));
    motionText.textContent = t('关闭动态效果', 'Disable motion');
    mobileStepLabel.textContent = t('图解步骤', 'Diagram step');
    mobileStepSelect.setAttribute('aria-label', mobileStepLabel.textContent);
    mobileStepSelect.replaceChildren();
    steps.replaceChildren();
    definition.steps.forEach((step, index) => {
      const targets = step.codeTargets ?? [];
      const lineLabel = targets.map(target => `${target.block + 1}:${target.from}${target.to > target.from ? `–${target.to}` : ''}`).join(', ');
      const label = word(step.label).replace(/^[①②③④⑤⑥⑦⑧⑨⑩]\s*/, '');
      const node = button(steps, `${index + 1}. ${label}${lineLabel ? ` [${lineLabel}]` : ''}`, () => selectStep(step.id, true), stepEvents.signal);
      mobileStepSelect.append(el('option', { value:step.id }, `${index + 1}. ${label}`));
      node.dataset.step = step.id;
    });
  }
  function attachCode() {
    const blocks = new Set(definition.steps.flatMap(step => (step.codeTargets ?? []).map(target => target.block)));
    for (const index of blocks) {
      const item = sources[index]; if (!item) continue;
      const placeholder = document.createComment(`original-code-${index}`);
      item.pre.before(placeholder); placeholders.set(index, placeholder);
      const raw = item.code.textContent;
      item.code.replaceChildren();
      const lines = raw.split('\n');
      lines.forEach((line, i) => item.code.append(el('span', { className: 'tv-code-line', 'data-line': i + 1 }, line + (i < lines.length - 1 ? '\n' : ''))));
      item.pre.classList.add('tv-original-code'); item.pre.dataset.codeBlock = `${t('代码块', 'Block')} ${index + 1}`; codeView.append(item.pre);
    }
  }
  function detachCode() {
    for (const [index, placeholder] of placeholders) {
      const item = sources[index]; item.code.innerHTML = item.html;
      item.pre.classList.remove('tv-original-code'); delete item.pre.dataset.codeBlock; placeholder.replaceWith(item.pre);
    }
    placeholders.clear();
  }
  function render() {
    if (!active || !scene) return;
    const step = definition.steps[state.index];
    mobileStepSelect.value = step.id;
    steps.querySelectorAll('button').forEach(node => node.setAttribute('aria-pressed', String(node.dataset.step === step.id)));
    codeView.querySelectorAll('.tv-code-line').forEach(node => node.classList.remove('tv-line-active'));
    for (const target of step.codeTargets ?? []) {
      sources[target.block]?.code.querySelectorAll('.tv-code-line').forEach(node => {
        const line = Number(node.dataset.line); if (line >= target.from && line <= (target.to ?? target.from)) node.classList.add('tv-line-active');
      });
    }
    const selectedLine = codeView.querySelector('.tv-line-active');
    if (selectedLine) codeView.scrollTop = Math.max(0, selectedLine.offsetTop - codeView.offsetTop - 28);
    position.textContent = `${state.index + 1} / ${definition.steps.length}`;
    previous.disabled = state.index === 0; next.disabled = state.index === definition.steps.length - 1;
    explain.textContent = word(step.explain);
    try {
      scene.focus(step.id);
      feedback?.cancel();
      if (definition.stepFeedback && !motion.checked && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
        feedback = figure.animate([{ opacity:.55, transform:'translateY(5px)' },{ opacity:1, transform:'translateY(0)' }], { duration:220, easing:'ease-out' });
      }
    }
    catch (error) { showError(error); }
  }
  function revealFigure() {
    if (!definition.stepFeedback || host.getBoundingClientRect().width >= 780) return;
    cancelAnimationFrame(revealFrame);
    revealFrame = requestAnimationFrame(() => { if (active) figure.scrollIntoView({ behavior:'instant', block:'start' }); });
  }
  function selectStep(id, reveal = false) { state.select(id); render(); if (reveal) revealFigure(); }
  function setStatus(text) { if (active) explain.textContent = text; }
  function showError(error) {
    aborter?.abort(); scene?.destroy?.(); scene = null;
    steps.querySelectorAll('button').forEach(node => { node.disabled = true; });
    previous.disabled = next.disabled = resetButton.disabled = true;
    figure.replaceChildren(el('p', { role: 'status' }, t('图解暂时不可用，可继续阅读原讲义或打开完整演示。', 'The linked view is unavailable. The original notes and demo remain accessible.')));
    const retry = el('button', { type: 'button' }, t('重试', 'Retry'));
    retry.onclick = () => { hide(); show(); }; figure.append(retry);
    explain.textContent = error?.message ?? t('数据加载失败', 'Data could not be loaded');
  }
  async function show() {
    if (active) return;
    active = true; const request = ++version; aborter = new AbortController();
    body.hidden = false; labels(); attachCode();
    const renderMount = el('div', { className: 'tv-scene' });
    renderMount.append(el('p', { role: 'status' }, t('正在读取本节教学数据…', 'Loading this section’s data…')));
    figure.replaceChildren(...(definition.stepFeedback ? [mobileStep,renderMount] : [renderMount]));
    steps.querySelectorAll('button').forEach(node => { node.disabled = true; });
    previous.disabled = next.disabled = resetButton.disabled = true;
    try {
      const pending = Promise.resolve(definition.create({ root: renderMount, article, d3, signal: aborter.signal, selectStep, t, setStatus,
        get reducedMotion() { return motion.checked || matchMedia('(prefers-reduced-motion: reduce)').matches; } }));
      pending.then(result => { if (!active || request !== version || aborter?.signal.aborted) result?.destroy?.(); }, () => {});
      const result = await waitForScene(pending, { signal: aborter.signal,
        message: t('数据读取超时，请检查网络后重试。', 'Data loading timed out. Check your connection and retry.') });
      if (!active || request !== version) { result?.destroy?.(); return; }
      scene = result; resetButton.disabled = false; steps.querySelectorAll('button').forEach(node => { node.disabled = false; }); render();
    } catch (error) {
      if (active && request === version && error?.name !== 'AbortError') showError(error);
    }
  }
  function hide() {
    if (!active) return;
    active = false; ++version; cancelAnimationFrame(revealFrame); feedback?.cancel(); aborter?.abort(); scene?.destroy?.(); scene = null;
    figure.replaceChildren(); detachCode(); body.hidden = true; labels();
  }
  motion.addEventListener('change', () => {
    if (motion.checked && active && scene) { feedback?.cancel(); d3.select(figure).selectAll('*').interrupt(); render(); }
  }, { signal: lifetime.signal });
  steps.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault(); event.key === 'ArrowRight' ? state.next() : state.previous(); render();
      steps.querySelector(`[data-step="${state.id}"]`)?.focus();
    }
  }, { signal: lifetime.signal });
  document.addEventListener('click', event => {
    const link = event.target.closest('.chapter-nav a[data-chapter]'); if (link && link.dataset.chapter !== article.id) hide();
  }, { signal: lifetime.signal });
  const syncPanel = () => { if (panel.classList.contains('active')) show(); else hide(); };
  const observer = new MutationObserver(syncPanel);
  observer.observe(panel, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('hashchange', () => { if (location.hash && location.hash !== `#${article.id}`) hide(); }, { signal: lifetime.signal });
  document.addEventListener('wbl:localechange', () => { const reopen = active; hide(); labels(); if (reopen) show(); }, { signal: lifetime.signal });
  const controller = { show, hide, selectStep, reset() { state.reset(); scene?.reset?.(); render(); },
    destroy() { hide(); stepEvents.abort(); lifetime.abort(); observer.disconnect(); host.remove(); instances.delete(article); } };
  instances.set(article, controller); labels(); queueMicrotask(syncPanel); return controller;
}
export function registerLinkedLessons(d3, definitions) {
  document.body.dataset.teachingReady = '1';
  document.dispatchEvent(new Event('teaching:ready'));
  return definitions.map(definition => {
    const article = document.getElementById(`ch-${definition.sectionId.replace('.', '-')}`);
    return article ? createLinkedLesson(article, definition, d3) : null;
  }).filter(Boolean);
}
