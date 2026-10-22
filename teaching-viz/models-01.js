export const COLUMN_MAP = Object.freeze({ '序号': 'id', '姓名': 'name', '性别': 'gender', '生日': 'birthday', '年龄': 'age', '班级': 'class' });

// Identical to the original first-chapter demo. Invalid values remain observable.
export function transformRow(d) {
  return {
    id: +d['序号'], name: d['姓名'].trim(), gender: d['性别'].trim(),
    birthday: new Date(d['生日']), age: +d['年龄'], class: d['班级'].trim()
  };
}
export function inspectRow(raw) {
  const value = transformRow(raw), issues = [];
  for (const key of ['序号', '年龄']) {
    if (!String(raw[key] ?? '').trim()) issues.push(`${key}: empty → +'' = 0`);
    else if (!Number.isFinite(value[COLUMN_MAP[key]])) issues.push(`${key}: NaN`);
  }
  if (!Number.isFinite(value.birthday.getTime())) issues.push('生日: Invalid Date');
  return { value, issues };
}
let rowsPromise;
export function loadRawStudents(d3) {
  if (!rowsPromise) rowsPromise = d3.csv('./data/newstudent.csv').catch(error => { rowsPromise = null; throw error; });
  return rowsPromise;
}
export function displayValue(value) {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.toISOString().slice(0, 10) : 'Invalid Date';
  return typeof value === 'string' ? JSON.stringify(value) : String(value);
}
export function joinMembers(before, after, keyed = true) {
  if (!keyed) return { enter: after.slice(before.length), update: after.slice(0, before.length), exit: before.slice(after.length) };
  const old = new Set(before), next = new Set(after);
  return { enter: after.filter(id => !old.has(id)), update: after.filter(id => old.has(id)), exit: before.filter(id => !next.has(id)) };
}
export function dikwVertices(height, topWidth, index, cx = 300) {
  const y = 20 + index * 80, bottomWidth = topWidth + 60;
  return [[cx - topWidth / 2, y], [cx + topWidth / 2, y], [cx + bottomWidth / 2, y + height], [cx - bottomWidth / 2, y + height]];
}
export function operationModel(d3, name) {
  const specs = {
    map: () => ({ input: [1, 2, 3], result: [1, 2, 3].map(x => x * x), links: [[0], [1], [2]], code: '[1,2,3].map(x => x*x)' }),
    reduce: () => ({ input: [2, 3, 4], result: [2, 3, 4].reduce((sum, x) => sum + x, 0), stages: [2, 5, 9], links: [[0], [0, 1], [0, 1, 2]], code: '[2,3,4].reduce((sum,x) => sum+x, 0)' }),
    cross: () => ({ input: ['A', 'B', 1, 2, 3], result: d3.cross(['A', 'B'], [1, 2, 3]), links: [[0, 2], [0, 3], [0, 4], [1, 2], [1, 3], [1, 4]], code: 'd3.cross(["A","B"], [1,2,3])' }),
    merge: () => ({ input: [[1, 2], [3]], result: d3.merge([[1, 2], [3]]), links: [[0], [0], [1]], code: 'd3.merge([[1,2],[3]])' }),
    pairs: () => ({ input: ['a', 'b', 'c', 'd'], result: d3.pairs(['a', 'b', 'c', 'd']), links: [[0, 1], [1, 2], [2, 3]], code: 'd3.pairs(["a","b","c","d"])' }),
    transpose: () => ({ input: [1, 2, 3, 4, 5, 6], result: d3.transpose([[1, 2, 3], [4, 5, 6]]), links: [[0, 3], [1, 4], [2, 5]], code: 'd3.transpose([[1,2,3],[4,5,6]])' }),
    zip: () => ({ input: ['A', 'B', 'C', 1, 2, 3], result: d3.zip(['A', 'B', 'C'], [1, 2, 3]), links: [[0, 3], [1, 4], [2, 5]], code: 'd3.zip(["A","B","C"], [1,2,3])' }),
    filter: () => ({ input: [1, 2, 3, 4], result: [1, 2, 3, 4].filter(x => x > 2), stages: ['1 ×', '2 ×', '3 ✓', '4 ✓'], links: [[0], [1], [2], [3]], code: '[1,2,3,4].filter(x => x>2)' })
  };
  if (!specs[name]) throw new Error('Unknown operation');
  return specs[name]();
}
