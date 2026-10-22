// Small DOM helpers: course data is always inserted as text, never executed.
export function el(tag, attrs = {}, text = '') {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') node.className = value;
    else if (value !== false && value != null) node.setAttribute(key, String(value));
  }
  if (text !== '') node.textContent = String(text);
  return node;
}
export function svg(tag, attrs = {}, text = '') {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  node.textContent = String(text);
  return node;
}
export function table(headers, rows) {
  const wrap = el('div', { className: 'tv-table-scroll', tabindex: 0 });
  const node = el('table');
  const head = el('thead'), tr = el('tr');
  headers.forEach(text => tr.append(el('th', { scope: 'col' }, text)));
  head.append(tr); node.append(head);
  const body = el('tbody');
  rows.forEach(values => { const row = el('tr'); values.forEach(v => row.append(el('td', {}, v))); body.append(row); });
  node.append(body); wrap.append(node); return wrap;
}
export function button(root, label, fn, signal) {
  const node = el('button', { type: 'button' }, label);
  node.addEventListener('click', fn, { signal }); root.append(node); return node;
}
export function selectControl(root, label, options, value, onChange, signal) {
  const field = el('label', { className: 'tv-field' }); field.append(el('span', {}, label));
  const node = el('select', { 'aria-label':label });
  options.forEach(option => {
    const [v, text] = Array.isArray(option) ? option : [option, option];
    node.append(el('option', { value: v }, text));
  });
  node.value = String(value); node.addEventListener('change', () => onChange(node.value), { signal });
  field.append(node); root.append(field); return node;
}
export function svgButton(node, fn, signal) {
  node.setAttribute('role', 'button'); node.setAttribute('tabindex', '0');
  // These owned SVG nodes are replaced by their scene. Property handlers avoid
  // retaining removed marks in a long-lived AbortSignal across redraws.
  node.onclick = event => { if (!signal?.aborted) fn(event); };
  node.onkeydown = event => {
    if (!signal?.aborted && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); fn(event); }
  }; return node;
}
export function format(value) { return Number.isFinite(value) ? Number(value.toFixed(3)).toString() : String(value); }
