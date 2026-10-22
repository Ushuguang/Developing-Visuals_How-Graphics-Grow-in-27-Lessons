export const CRIME_METRICS = ['murder', 'robbery', 'burglary'];
let crimePromise;
export function loadCrime(d3) {
  return crimePromise ??= d3.csv(new URL('../lesson-04/data/crime.csv', import.meta.url).href, d3.autoType)
    .catch(error => { crimePromise = null; throw error; });
}
export function toLong(rows, metrics = CRIME_METRICS) {
  return rows.flatMap(row => metrics.map(metric => ({ state: row.state, metric, value: row[metric] })));
}
export const MARGIN = Object.freeze({ t: 30, r: 20, b: 40, l: 50 });
export function coordinateTrace(row, maxX, maxY, width = 720, height = 360, type = 'linear') {
  const innerW = width - MARGIN.l - MARGIN.r, innerH = height - MARGIN.t - MARGIN.b;
  const x = row.murder, y = row.robbery;
  if (![x, y, maxX, maxY, innerW, innerH].every(Number.isFinite) || maxX <= 0 || maxY <= 0 || innerW <= 0 || innerH <= 0 || (type === 'log' && (x <= 0 || maxX <= 1)) || (type === 'sqrt' && x < 0)) return null;
  const ratio = type === 'log' ? Math.log(x) / Math.log(maxX) : type === 'sqrt' ? Math.sqrt(x / maxX) : x / maxX;
  const internal = { x: ratio * innerW, y: innerH * (1 - y / maxY) };
  return { input: { x, y }, internal, screen: { x: MARGIN.l + internal.x, y: MARGIN.t + internal.y }, innerW, innerH };
}
export function coordinateScales(d3, rows, width = 720, type = 'linear') {
  const height = 360, innerW = width - 70, innerH = height - 70;
  const maxX = d3.max(rows, row => row.murder), maxY = d3.max(rows, row => row.robbery);
  const xData = (type === 'log' ? d3.scaleLog().domain([1, maxX]) : type === 'sqrt' ? d3.scaleSqrt().domain([0, maxX]) : d3.scaleLinear().domain([0, maxX])).range([0, innerW]);
  const yData = d3.scaleLinear().domain([0, maxY]).range([innerH, 0]);
  const xScreen = d3.scaleLinear().domain([0, innerW]).range([50, 50 + innerW]);
  const yScreen = d3.scaleLinear().domain([innerH, 0]).range([30 + innerH, 30]);
  return { width, height, innerW, innerH, maxX, maxY, xData, yData, xScreen, yScreen };
}

// Exact original classroom table. Do not silently correct its edge/bit mismatch.
export const ORIGINAL_EDGE_TABLE = [[], [[3,0]], [[0,1]], [[3,1]], [[1,2]], [[3,0],[1,2]], [[0,2]], [[3,2]], [[2,3]], [[2,0]], [[0,1],[2,3]], [[2,1]], [[1,3]], [[1,0]], [[0,3]], []];
// Supplemental geometry check: pairs connect actual crossing edges. In the two
// saddle cases this fixed rule separates the high corners; it is not a claim
// that the original demo implemented an asymptotic decider.
export const GEOMETRY_EDGE_TABLE = [[], [[0,1]], [[1,2]], [[0,2]], [[2,3]], [[0,1],[2,3]], [[1,3]], [[0,3]], [[3,0]], [[3,1]], [[0,3],[1,2]], [[3,2]], [[0,2]], [[1,2]], [[0,1]], []];
export const CORNER_NAMES = ['tl', 'tr', 'br', 'bl'];
const corners = [[0,0], [1,0], [1,1], [0,1]];
const edgeCorners = [[0,3], [3,2], [2,1], [1,0]]; // left/bottom/right/top
export function encodeCase(values, threshold) {
  if (!Number.isFinite(threshold) || values.length !== 4 || !values.every(Number.isFinite)) return null;
  return values.reduce((code, value, index) => code | (value > threshold ? 1 << (3 - index) : 0), 0);
}
export function valuesForCase(code) {
  if (!Number.isInteger(code) || code < 0 || code > 15) throw new RangeError('case 0–15 required');
  return [8,4,2,1].map(bit => code & bit ? 1 : 0);
}
export function edgeIntersections(values, threshold) {
  if (encodeCase(values, threshold) === null) return [];
  return edgeCorners.map(([a,b]) => {
    if ((values[a] > threshold) === (values[b] > threshold)) return null;
    const f = (threshold - values[a]) / (values[b] - values[a]);
    return { x: corners[a][0] + f * (corners[b][0] - corners[a][0]), y: corners[a][1] + f * (corners[b][1] - corners[a][1]), fraction: f };
  });
}
export function inspectCell(values, threshold) {
  const code = encodeCase(values, threshold);
  if (code === null) return { code, points: [], original: [], geometry: [], mismatch: true, saddle: false };
  const points = edgeIntersections(values, threshold);
  const original = ORIGINAL_EDGE_TABLE[code], geometry = GEOMETRY_EDGE_TABLE[code];
  return { code, points, original, geometry, mismatch: original.some(pair => pair.some(edge => !points[edge])), saddle: code === 5 || code === 10 };
}
export function syntheticField(x, y) {
  return Math.exp(-((x - 3.5) ** 2 + (y - 4) ** 2) / 6) + 0.3 * Math.exp(-((x - 1) ** 2 + (y - 6) ** 2) / 3);
}
export function lineAtAngle(angle, length = 240, origin = { x: 100, y: 240 }) {
  const r = angle * Math.PI / 180;
  return { x1: origin.x, y1: origin.y, x2: origin.x + length * Math.cos(r), y2: origin.y - length * Math.sin(r) };
}
export const CURVES = [
  ['linear','curveLinear'], ['monotoneX','curveMonotoneX'], ['natural','curveNatural'], ['basis','curveBasis'], ['cardinal','curveCardinal'],
  ['catmullRom','curveCatmullRom'], ['step','curveStep'], ['stepBefore','curveStepBefore'], ['stepAfter','curveStepAfter'], ['curveBundle','curveBundle']
];
